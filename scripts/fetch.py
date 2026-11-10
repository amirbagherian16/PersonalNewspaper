#!/usr/bin/env python3
"""Daily TBI newspaper builder. Standard library only, no paid APIs, no LLM calls.

Sources: PubMed (E-utilities), Europe PMC (preprints), Google News RSS (news + LinkedIn
posts via site: search), Mastodon hashtag RSS, Hacker News, GitHub API (your lab repos).
Everything the site shows is AES-256-GCM encrypted (key from PBKDF2 of SITE_PASSWORD), so the public
repo and GitHub Pages only ever contain ciphertext.
Outputs: data/items.enc (encrypted history), docs/data/bundle.enc (encrypted site payload).
"""
import base64, csv, hashlib, html, io, json, os, re, sys, time
import urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))
NOW = datetime.now(timezone.utc)
TODAY = NOW.date()
LOOKBACK = int(os.environ.get("LOOKBACK_DAYS", CFG["lookback_days"]))
UA = "Mozilla/5.0 (PersonalNewspaper TBI digest; +https://github.com/amirbagherian16/PersonalNewspaper)"
LOG = []


def log(msg):
    print(msg, file=sys.stderr)
    LOG.append(msg)


def get(url, retries=2, timeout=30, headers=None):
    h = {"User-Agent": UA}
    h.update(headers or {})
    for i in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers=h)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except Exception as e:  # noqa
            if i == retries:
                log(f"FAIL {url[:110]} -> {e}")
                return None
            time.sleep(1.5 * (i + 1))


def clean(s):
    s = html.unescape(re.sub(r"<[^>]+>", " ", s or ""))
    return re.sub(r"\s+", " ", s).strip()


def iso(d):
    return d.strftime("%Y-%m-%d")


def mk_id(*parts):
    return hashlib.sha1("|".join(parts).encode("utf-8")).hexdigest()[:16]


def norm_title(t):
    return re.sub(r"[^a-z0-9]+", " ", t.lower()).strip()[:90]


items = []  # new candidate items


def add(**kw):
    kw.setdefault("groups", [])
    kw.setdefault("summary", "")
    kw["summary"] = kw["summary"][:600]
    kw["title"] = clean(kw["title"])
    items.append(kw)


# ---------------------------------------------------------------- PubMed
def pubmed(query, section, groups=None, days=LOOKBACK):
    q = urllib.parse.urlencode({"db": "pubmed", "term": query, "reldate": days, "datetype": "edat",
                                "retmax": 60, "retmode": "json", "sort": "date"})
    raw = get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?" + q)
    time.sleep(0.4)
    if not raw:
        return
    ids = json.loads(raw)["esearchresult"].get("idlist", [])
    if not ids:
        return
    raw = get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=" + ",".join(ids))
    time.sleep(0.4)
    if not raw:
        return
    root = ET.fromstring(raw)
    for art in root.iter("PubmedArticle"):
        pmid = art.findtext(".//PMID")
        title = "".join(art.find(".//ArticleTitle").itertext()) if art.find(".//ArticleTitle") is not None else ""
        abst = " ".join("".join(a.itertext()) for a in art.findall(".//AbstractText"))
        journal = art.findtext(".//Journal/Title") or "PubMed"
        auths = []
        for a in art.findall(".//Author")[:6]:
            ln, ini = a.findtext("LastName"), a.findtext("Initials")
            if ln:
                auths.append(f"{ln} {ini or ''}".strip())
        n_auth = len(art.findall(".//Author"))
        y = art.findtext(".//ArticleDate/Year") or art.findtext(".//PubDate/Year") or str(TODAY.year)
        m = art.findtext(".//ArticleDate/Month") or "1"
        d = art.findtext(".//ArticleDate/Day") or "1"
        mm = m if m.isdigit() else {"Jan": "1", "Feb": "2", "Mar": "3", "Apr": "4", "May": "5", "Jun": "6", "Jul": "7",
                                      "Aug": "8", "Sep": "9", "Oct": "10", "Nov": "11", "Dec": "12"}.get(m[:3], "1")
        try:
            pub = f"{int(y):04d}-{int(mm):02d}-{int(d):02d}"
        except ValueError:
            pub = iso(TODAY)
        author_str = ", ".join(auths) + (" et al." if n_auth > 6 else "")
        add(id="pmid:" + pmid, source_type="paper", section=section, date=pub, title=title,
            url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/", outlet=journal,
            summary=(author_str + " | " if author_str else "") + abst, groups=list(groups or []))


# ---------------------------------------------------------------- Europe PMC preprints
def preprints(query, section, days=max(LOOKBACK, 14)):
    frm = iso(TODAY - timedelta(days=days))
    q = f"({query}) AND SRC:PPR AND FIRST_PDATE:[{frm} TO {iso(TODAY)}]"
    url = "https://www.ebi.ac.uk/europepmc/webservices/rest/search?" + urllib.parse.urlencode(
        {"query": q, "format": "json", "resultType": "core", "pageSize": 50})
    raw = get(url)
    time.sleep(0.3)
    if not raw:
        return
    for r in json.loads(raw).get("resultList", {}).get("result", []):
        doi = r.get("doi")
        link = f"https://doi.org/{doi}" if doi else f"https://europepmc.org/article/PPR/{r.get('id')}"
        add(id="doi:" + (doi or r.get("id", "")), source_type="preprint", section=section,
            date=r.get("firstPublicationDate", iso(TODAY)), title=r.get("title", ""), url=link,
            outlet=(r.get("bookOrReportDetails") or {}).get("publisher") or "Preprint",
            summary=(r.get("authorString", "") + " | " if r.get("authorString") else "") + clean(r.get("abstractText", "")))


# ---------------------------------------------------------------- Google News
def gnews(query, section, source_type="news", groups=None, days=LOOKBACK, keep=None, limit=25):
    q = urllib.parse.quote_plus(f"{query} when:{max(days, 1)}d")
    raw = get(f"https://news.google.com/rss/search?q={q}&hl=en-US&gl=US&ceid=US:en")
    time.sleep(0.5)
    if not raw:
        return
    try:
        root = ET.fromstring(raw)
    except ET.ParseError:
        return
    n = 0
    for it in root.iter("item"):
        title = clean(it.findtext("title"))
        outlet = clean(it.findtext("source")) or ""
        if outlet and title.endswith(" - " + outlet):
            title = title[: -len(outlet) - 3]
        try:
            d = parsedate_to_datetime(it.findtext("pubDate")).astimezone(timezone.utc)
        except Exception:
            d = NOW
        if (NOW - d).days > days + 1:
            continue
        blob = title + " " + clean(it.findtext("description"))
        if keep and not keep.search(blob):
            continue
        if source_type == "linkedin" and LI_JUNK.search(title):
            continue
        if source_type == "linkedin" and "linkedin" not in (outlet + it.findtext("link", "")).lower():
            continue
        add(id="news:" + mk_id(norm_title(title)), source_type=source_type, section=section, date=iso(d), title=title,
            url=it.findtext("link"), outlet=outlet or "Google News", summary="", groups=list(groups or []))
        n += 1
        if n >= limit:
            break



def bing_news(query, section, days=LOOKBACK, keep=None, limit=20):
    """Bing News RSS: a second news index with real publisher URLs (extra recall)."""
    raw = get("https://www.bing.com/news/search?format=rss&q=" + urllib.parse.quote_plus(query))
    time.sleep(0.5)
    if not raw:
        return
    txt = raw.decode("utf-8", "ignore")
    n = 0
    for it in re.findall(r"<item>(.*?)</item>", txt, re.S):
        g = lambda tag: html.unescape((re.search(rf"<{tag}>(.*?)</{tag}>", it, re.S) or [None, ""])[1]).strip()  # noqa
        title, link, desc = clean(g("title")), g("link"), clean(g("description"))
        q = urllib.parse.parse_qs(urllib.parse.urlparse(link).query).get("url")
        url = q[0] if q else link
        try:
            d = parsedate_to_datetime(g("pubDate")).astimezone(timezone.utc)
        except Exception:
            continue
        if (NOW - d).days > days + 1 or not title:
            continue
        if keep and not keep.search(title + " " + desc):
            continue
        outlet = clean(g("News:Source")) or urllib.parse.urlparse(url).netloc
        add(id="news:" + mk_id(norm_title(title)), source_type="news", section=section, date=iso(d), title=title,
            url=url, outlet=outlet, summary=desc)
        n += 1
        if n >= limit:
            break

# ---------------------------------------------------------------- Mastodon / HN
REL = re.compile(r"concuss|\bTBI\b|brain injur|head (injur|impact|trauma)|\bCTE\b|encephalopath|mouthguard|neurotrauma|"
                 r"blast|subconcuss|helmet|brain trauma|neurotrauma", re.I)
REL_LI = re.compile(REL.pattern + r"|\bbrain\b.{0,40}(injur|impact|trauma|biomech|model|simulat|strain|safe|protect)|"
                    r"(injur|impact|trauma|biomech|simulat|strain).{0,40}\bbrain\b|finite element.{0,40}(brain|head)|hiper|brain-safe|"
                    r"head (kinematic|model|protect)|sports? (injur|safety)|player safety|neurodegener", re.I)
LI_JUNK = re.compile(r"hiring|we.re looking for|job opening|vacanc|recruit|business head|head of |market (growth|size|outlook|report|share)|"
                     r"market.{0,30}(compan|leading|global|intelligence|outlook|manufactur|supplier)|manufacturers|suppliers|cagr|forecast 20\d\d|webinar series|click here to apply|apply now", re.I)
REL_WIDE = re.compile(REL.pattern + r"|\bbrain\b|\bhead\b|neuro|biomechanic|hiper|mouth ?guard|finite element", re.I)


def mastodon(tag):
    raw = get(f"https://mastodon.social/tags/{tag}.rss")
    time.sleep(0.4)
    if not raw:
        return
    try:
        root = ET.fromstring(raw)
    except ET.ParseError:
        return
    for it in root.iter("item"):
        text = clean(it.findtext("description"))
        if not REL.search(text):
            continue
        try:
            d = parsedate_to_datetime(it.findtext("pubDate")).astimezone(timezone.utc)
        except Exception:
            continue
        if (NOW - d).days > LOOKBACK:
            continue
        add(id="masto:" + it.findtext("link"), source_type="social", section="general_tbi", date=iso(d),
            title=text[:140] + ("..." if len(text) > 140 else ""), url=it.findtext("link"), outlet="Mastodon",
            summary=text)


def hn(query):
    since = int((NOW - timedelta(days=LOOKBACK)).timestamp())
    raw = get("https://hn.algolia.com/api/v1/search_by_date?" + urllib.parse.urlencode(
        {"query": query, "tags": "story", "numericFilters": f"created_at_i>{since}"}))
    if not raw:
        return
    for h in json.loads(raw).get("hits", []):
        if not h.get("title") or not REL.search(h["title"]):
            continue
        add(id="hn:" + h["objectID"], source_type="social", section="general_tbi", date=h["created_at"][:10],
            title=h["title"], url=h.get("url") or f"https://news.ycombinator.com/item?id={h['objectID']}",
            outlet="Hacker News", summary=f"{h.get('points', 0)} points, {h.get('num_comments', 0)} comments")


# ---------------------------------------------------------------- GitHub (your lab)
def github_user(login, gid):
    hdr = {"Accept": "application/vnd.github+json"}
    if os.environ.get("GITHUB_TOKEN"):
        hdr["Authorization"] = "Bearer " + os.environ["GITHUB_TOKEN"]
    raw = get(f"https://api.github.com/users/{login}/repos?per_page=100&sort=pushed", headers=hdr)
    if not raw:
        return []
    out = []
    for r in json.loads(raw):
        pushed = datetime.fromisoformat(r["pushed_at"].replace("Z", "+00:00"))
        out.append({"name": r["name"], "desc": r.get("description") or "", "url": r["html_url"],
                    "stars": r["stargazers_count"], "pushed": iso(pushed), "lang": r.get("language")})
        if (NOW - pushed).days <= max(LOOKBACK, 7):
            c = get(f"https://api.github.com/repos/{login}/{r['name']}/commits?per_page=1", headers=hdr)
            msg = ""
            if c:
                try:
                    msg = json.loads(c)[0]["commit"]["message"].split("\n")[0]
                except Exception:
                    pass
            add(id="gh:" + mk_id(r["name"], iso(pushed)), source_type="github", section="group_update",
                date=iso(pushed), title=f"{r['name']} updated", url=r["html_url"], outlet="GitHub",
                summary=f"{r.get('description') or ''} Latest commit: {msg}", groups=[gid])
    return out


# ---------------------------------------------------------------- Classification (rule based)
SECTION_KW = {
    "contact_sport": r"football|soccer|rugby|hockey|boxing|\bMMA\b|lacrosse|basketball|athlete|sport|NFL|NCAA|helmet|mouthguard|"
                     r"concussion|subconcuss|head impact|\bCTE\b|heading|youth|player",
    "biomechanics_modeling": r"finite element|\bFE\b|\bFEM\b|biomechanic|computational|simulation|surrogate|machine learning|deep learning|"
                             r"neural network|strain|kinematic|digital twin|mesh|head model|in silico|\bAI\b",
    "blast_military": r"blast|overpressure|military|veteran|combat|service member|warfighter|explosi|shock ?tube|defense",
    "medical_clinical": r"clinical|patient|trial|biomarker|GFAP|UCH-L1|neurofilament|\btau\b|intracranial|ICU|surgery|craniectomy|"
                        r"rehabilitation|pediatric|outcome|mortality|guideline|FDA|diagnos|treatment|therapy|imaging|MRI|CT scan|blood test",
}
SPORTS = ["football", "soccer", "rugby", "hockey", "boxing", "MMA", "lacrosse", "basketball", "baseball", "cycling", "skiing",
          "wrestling", "cheer", "equestrian", "motorsport"]
TAGS = {
    "biomarkers": r"biomarker|GFAP|UCH-L1|neurofilament|blood test|\btau\b|S100B",
    "imaging": r"\bMRI\b|\bfMRI\b|\bDTI\b|diffusion|\bPET\b|CT scan|imaging|tractograph",
    "machine-learning": r"machine learning|deep learning|neural network|\bAI\b|artificial intelligence|surrogate|random forest|U-?Net",
    "finite-element": r"finite element|\bFEM?\b|head model|brain model|mesh",
    "wearables": r"mouthguard|sensor|wearable|accelerometer|instrumented|telemetry",
    "helmets-protective": r"helmet|headgear|guardian cap|padding|protective equipment",
    "CTE-neurodegeneration": r"\bCTE\b|encephalopathy|neurodegenerat|dementia|alzheimer|amyloid",
    "policy-safety": r"rule|policy|protocol|regulation|ban|lawsuit|settlement|legislat|guideline|committee",
    "youth-pediatric": r"youth|child|pediatric|adolescen|high school|kids",
    "female-athletes": r"female|women|girls|sex difference|menstrual",
    "rehabilitation": r"rehabilit|return to play|return-to-play|recovery|exercise|therapy",
    "animal-model": r"\bpig\b|porcine|swine|rat |mouse|mice|rodent|primate|ovine|animal model|cross-species|translational",
    "astrocyte-cellular": r"astrocyte|microglia|neuron|axon|diffuse axonal|\bDAI\b|glia|in vitro|cell culture",
    "subconcussion-RHI": r"subconcuss|repetitive head impact|\bRHI\b|cumulative",
    "blast": r"blast|overpressure|shock ?tube",
    "mild-TBI": r"concussion|mild traumatic|\bmTBI\b",
    "severe-TBI": r"severe|ICU|intracranial pressure|craniectomy|neurocritical|coma",
}
STOP = set("""the and for with that this from are was were has have had not but its their they them than then there which while into over under
between about after before during using used use based study analysis effect effects among within without also more most such can may might one two
three new its our results result methods conclusion conclusions background objective objectives patients patient brain injury injuries traumatic tbi
head review model models data research https http www com news says said will year years first high low""".split())


def classify(it):
    blob = f"{it['title']} {it['summary']}"
    scores = {s: len(re.findall(p, blob, re.I)) for s, p in SECTION_KW.items()}
    hint = it.get("section")
    if hint in scores:
        scores[hint] += 2  # origin-query prior
    best = max(scores, key=scores.get)
    it["section"] = best if scores[best] > 0 else (hint if hint not in (None, "group_update") else "general_tbi")
    it["tags"] = [t for t, p in TAGS.items() if re.search(p, blob, re.I)]
    it["sports"] = [s for s in SPORTS if re.search(r"\b" + s + r"\b", blob, re.I)]
    return it


def keywords(text):
    return [w for w in re.findall(r"[a-z][a-z\-]{3,}", text.lower()) if w not in STOP]




# ---------------------------------------------------------------- Funding: NIH RePORTER, NSF, Grants.gov, news
FUND_RE = re.compile(r"grant|fund|award|prize|fellowship|\$\s?\d|million|SBIR|STTR|NIH|\bNSF\b|DoD|CDMRP|wins|receives|donat|endow", re.I)


def post_json(url, payload, timeout=40):
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json", "User-Agent": UA})
        return json.loads(urllib.request.urlopen(req, timeout=timeout).read())
    except Exception as e:  # noqa
        log(f"FAIL {url[:80]} -> {e}")
        return None


def nih_reporter(criteria, groups=None, days=75, section="general_tbi"):
    crit = dict(criteria)
    crit["award_notice_date"] = {"from_date": iso(TODAY - timedelta(days=days)), "to_date": iso(TODAY)}
    d = post_json("https://api.reporter.nih.gov/v2/projects/search",
                  {"criteria": crit, "limit": 100, "sort_field": "award_notice_date", "sort_order": "desc"})
    time.sleep(0.5)
    for r in (d or {}).get("results", []):
        pis = ", ".join(p.get("full_name", "").strip() for p in r.get("principal_investigators") or [])[:120]
        amt = r.get("award_amount")
        org = (r.get("organization") or {}).get("org_name", "")
        agency = (r.get("agency_ic_admin") or {}).get("abbreviation") or r.get("agency_code") or "NIH"
        add(id="nih:" + str(r.get("project_num")) + (r.get("award_notice_date") or "")[:10], source_type="grant", section=section,
            date=(r.get("award_notice_date") or iso(TODAY))[:10], title=r.get("project_title", ""),
            url=r.get("project_detail_url") or "https://reporter.nih.gov/", outlet=f"NIH RePORTER · {agency}",
            summary=f"{org} | PI: {pis} | {('$' + format(int(amt), ',')) if amt else 'amount n/a'} | FY{r.get('fiscal_year')} | " + clean(r.get("abstract_text") or ""),
            groups=list(groups or []))


def nsf_awards(keyword, days=75):
    frm = (TODAY - timedelta(days=days)).strftime("%m/%d/%Y")
    raw = get("https://api.nsf.gov/services/v1/awards.json?" + urllib.parse.urlencode(
        {"keyword": f'"{keyword}"', "dateStart": frm, "printFields": "id,title,awardeeName,fundsObligatedAmt,date,piFirstName,piLastName,abstractText"}))
    time.sleep(0.4)
    if not raw:
        return
    for a in json.loads(raw).get("response", {}).get("award", []) or []:
        try:
            dt = datetime.strptime(a["date"], "%m/%d/%Y").strftime("%Y-%m-%d")
        except Exception:
            dt = iso(TODAY)
        add(id="nsf:" + a["id"], source_type="grant", section="general_tbi", date=dt, title=a["title"],
            url=f"https://www.nsf.gov/awardsearch/showAward?AWD_ID={a['id']}", outlet="NSF Award Search",
            summary=f"{a.get('awardeeName', '')} | PI: {a.get('piFirstName', '')} {a.get('piLastName', '')} | ${a.get('fundsObligatedAmt', 'n/a')} | " + clean(a.get("abstractText", "")))


def to_iso(mdy):
    try:
        return datetime.strptime(mdy, "%m/%d/%Y").strftime("%Y-%m-%d")
    except Exception:
        return ""


def grants_gov(keyword):
    d = post_json("https://api.grants.gov/v1/api/search2", {"keyword": keyword, "oppStatuses": "forecasted|posted", "rows": 30})
    time.sleep(0.5)
    for h in ((d or {}).get("data") or {}).get("oppHits", []):
        close = to_iso(h.get("closeDate", ""))
        add(id="opp:" + str(h["id"]), source_type="opportunity", section="general_tbi", date=to_iso(h.get("openDate", "")) or iso(TODAY),
            title=h.get("title", ""), url=f"https://www.grants.gov/search-results-detail/{h['id']}",
            outlet=h.get("agency") or "Grants.gov", deadline=close,
            summary=f"{h.get('oppStatus', '')} | opens {h.get('openDate', 'n/a')} | closes {h.get('closeDate') or 'rolling / n/a'} | #{h.get('number', '')}")

# ---------------------------------------------------------------- Images + real links
BROWSER_UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"}


def resolve_gnews(url):
    """Turn a news.google.com article link into the publisher URL (best effort)."""
    gid = url.rstrip("/").split("/")[-1].split("?")[0]
    sg = ts = None
    for base in ("https://news.google.com/articles/%s", "https://news.google.com/rss/articles/%s"):
        raw = get(base % gid, retries=0, timeout=15, headers=BROWSER_UA)
        if not raw:
            continue
        b = raw.decode("utf-8", "ignore")
        sg, ts = re.search(r'data-n-a-sg="([^"]+)"', b), re.search(r'data-n-a-ts="([^"]+)"', b)
        if sg and ts:
            break
    if not (sg and ts):
        return None
    arr = json.dumps(["garturlreq", [["X", "X", ["X", "X"], None, None, 1, 1, "US:en", None, 1, None, None, None, None, None, 0, 1],
                                     "X", "X", 1, [1, 1, 1], 1, 1, None, 0, 0, None, 0], gid, int(ts.group(1)), sg.group(1)])
    body = "f.req=" + urllib.parse.quote(json.dumps([[["Fbv4je", arr, None, "generic"]]]))
    try:
        req = urllib.request.Request("https://news.google.com/_/DotsSplashUi/data/batchexecute", data=body.encode(),
                                     headers={**BROWSER_UA, "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"})
        t = urllib.request.urlopen(req, timeout=15).read().decode("utf-8", "ignore")
    except Exception:
        return None
    m = re.search(r'garturlres\\",\\"(.*?)\\"', t)
    return m.group(1).encode().decode("unicode_escape") if m else None


def og_image(url):
    raw = get(url, retries=0, timeout=12, headers=BROWSER_UA)
    if not raw:
        return None
    b = raw[:300000].decode("utf-8", "ignore")
    pat1 = r"""<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)"""
    pat2 = r"""content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)"""
    m = re.search(pat1, b) or re.search(pat2, b)
    img = html.unescape(m.group(1)) if m else None
    if img and img.startswith("//"):
        img = "https:" + img
    return img if img and img.startswith("http") else None


def enrich(history, cap=int(os.environ.get("ENRICH_CAP", 70)), budget_s=int(os.environ.get("ENRICH_BUDGET", 420))):
    t0, done = time.time(), 0
    for it in history:  # history is sorted newest first
        if done >= cap or time.time() - t0 > budget_s:
            break
        if it.get("enriched") or it["source_type"] not in ("news", "linkedin", "funding_news") and not it["id"].startswith("hn:"):
            continue
        done += 1
        it["enrich_tries"] = it.get("enrich_tries", 0) + 1
        try:
            url = it["url"]
            if "news.google.com" in url:
                real = resolve_gnews(url)
                if not real:
                    it["enriched"] = it["enrich_tries"] >= 3  # retry on later runs (rate limits)
                    time.sleep(1.0)
                    continue
                it["url"] = url = real
            it["enriched"] = True
            it["img"] = None if it["source_type"] == "linkedin" else og_image(url)  # LinkedIn's og:image is a generic logo
            m = re.search(r"activity[-:](\d{16,})", url)
            if m:  # LinkedIn activity ids embed a millisecond timestamp
                it["date"] = iso(datetime.fromtimestamp((int(m.group(1)) >> 22) / 1000, timezone.utc))
        except Exception as e:  # noqa
            log(f"enrich fail: {e}")
        time.sleep(0.6)
    log(f"enriched {done} items in {time.time() - t0:.0f}s")


# ---------------------------------------------------------------- Encryption (WebCrypto compatible)
ITER = 600_000


def _key(pw, salt, iters):
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    return PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=iters).derive(pw.encode("utf-8"))


def encrypt_blob(data, pw):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    salt, iv = os.urandom(16), os.urandom(12)
    ct = AESGCM(_key(pw, salt, ITER)).encrypt(iv, data, None)
    b = lambda x: base64.b64encode(x).decode()  # noqa
    return json.dumps({"v": 1, "iter": ITER, "salt": b(salt), "iv": b(iv), "ct": b(ct)})


def decrypt_blob(text, pw):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    o = json.loads(text)
    d = lambda k: base64.b64decode(o[k])  # noqa
    return AESGCM(_key(pw, d("salt"), o["iter"])).decrypt(d("iv"), d("ct"), None)


# ---------------------------------------------------------------- main
def main():
    PW = os.environ.get("SITE_PASSWORD")
    if not PW or len(PW) < 8:
        sys.exit("Set SITE_PASSWORD (8+ chars). It encrypts all site data; nothing is written in plaintext.")
    hist_path = ROOT / "data" / "items.enc"
    legacy = ROOT / "data" / "items.json"  # one-time migration from the old plaintext history
    if hist_path.exists():
        history = json.loads(decrypt_blob(hist_path.read_text(encoding="utf-8"), PW).decode("utf-8"))
    elif legacy.exists():
        history = json.loads(legacy.read_text(encoding="utf-8"))
    else:
        history = []
    seen = {h["id"] for h in history} | {"t:" + norm_title(h["title"]) for h in history}

    backfill = not history  # first run: seed group tabs with a longer window
    bf_groups = set(filter(None, os.environ.get("BACKFILL_GROUPS", "").split(",")))
    purge = os.environ.get("PURGE_GROUP")
    if purge:  # drop mis-attributed papers for a group (e.g. after tightening its author queries)
        for h in history:
            if purge in h.get("groups", []) and h["source_type"] in ("paper", "preprint"):
                h["groups"] = [x for x in h["groups"] if x != purge]
                if not h["groups"]:
                    h["_drop"] = True
        history[:] = [h for h in history if not h.get("_drop")]
        seen.clear()
        seen.update({h["id"] for h in history} | {"t:" + norm_title(h["title"]) for h in history})
    if os.environ.get("PURGE_LINKEDIN"):
        history[:] = [h for h in history if h["source_type"] != "linkedin"]
        seen.clear()
        seen.update({h["id"] for h in history} | {"t:" + norm_title(h["title"]) for h in history})
    gdays = 365 if backfill else max(LOOKBACK, 14)
    ndays = 30 if backfill else max(LOOKBACK, 7)
    # 1. topics
    for section, cfg in CFG["topics"].items():
        for q in cfg.get("pubmed", []):
            pubmed(q, section)
        for q in cfg.get("preprint", []):
            preprints(q, section)
        for q in cfg.get("news", []):
            gnews(q, section, keep=REL_WIDE)
            bing_news(q, section, keep=REL_WIDE)
    # 2. groups
    github_repos = {}
    for g in CFG["groups"]:
        for q in g.get("pubmed_authors", []):
            pubmed(q, "group_update", groups=[g["id"]], days=365 if (backfill or g["id"] in bf_groups) else gdays)
        toks = [t for t in re.findall(r"[A-Za-z]{4,}", " ".join(g["news"]).lower()) if t not in
                {"brain", "injury", "head", "lab", "mouthguard", "concussion", "biomechanics", "helmet", "simulation",
                 "traumatic", "research", "stanford", "penn", "state", "college", "imperial", "testing", "laboratory",
                 "player", "health", "web", "services", "digital", "amazon", "committee", "spine", "neck"}]
        keep = re.compile("|".join(sorted(set(toks))) if toks else ".", re.I)
        for q in g.get("linkedin", []):  # people / org targeted LinkedIn searches: no topic filter
            named = q.startswith('"') and q.endswith('"')  # exact person/org name: no topical filter needed
            gnews(f"site:linkedin.com {q}", "group_update", source_type="linkedin", groups=[g["id"]], keep=None if named else REL_LI,
                  days=60 if (backfill or g["id"] in bf_groups or os.environ.get("BACKFILL_LINKEDIN")) else 14, limit=40)
        for q in g["news"]:
            gnews(q, "group_update", groups=[g["id"]], days=ndays, keep=keep, limit=15)
        for pi in g.get("nih_pi", []):
            nih_reporter({"pi_names": [pi]}, groups=[g["id"]], days=365 if (backfill or g["id"] in bf_groups) else CFG["funding"]["nih_days"])
        if g.get("github"):
            github_repos[g["id"]] = github_user(g["github"], g["id"])
    # 2b. funding
    F = CFG["funding"]
    for t in F["nih_text"]:
        nih_reporter({"advanced_text_search": {"operator": t["op"], "search_field": "projecttitle,terms,abstracttext", "search_text": t["text"]}},
                     days=F["nih_backfill_days"] if (backfill or os.environ.get("BACKFILL_FUNDING")) else F["nih_days"])
    for k in F["nsf_keywords"]:
        nsf_awards(k, F["nih_backfill_days"] if (backfill or os.environ.get("BACKFILL_FUNDING")) else F["nih_days"])
    for k in F["grants_gov_keywords"]:
        grants_gov(k)
    for q in F["news"]:
        gnews(q, "general_tbi", source_type="funding_news", days=30 if backfill else 7,
              keep=re.compile(REL.pattern + "|brain|head injur", re.I), limit=12)
    items[:] = [i for i in items if i["source_type"] != "funding_news" or FUND_RE.search(i["title"])]
    # 3. social
    li_days = 45 if (backfill or os.environ.get("BACKFILL_LINKEDIN")) else 14
    for q in CFG["social"]["linkedin_queries"]:
        gnews(f"site:linkedin.com {q}", "general_tbi", source_type="linkedin", days=li_days, keep=REL_LI, limit=40)
    for t in CFG["social"]["mastodon_tags"]:
        mastodon(t)
    for q in CFG["social"]["hackernews_queries"]:
        hn(q)

    # dedupe + classify
    new, local = [], set()
    for it in items:
        key_t = "t:" + norm_title(it["title"])
        if not it["title"] or it["id"] in seen or key_t in seen or it["id"] in local or key_t in local:
            # merge group membership for already-known items
            for h in history:
                if h["id"] == it["id"] and it["groups"]:
                    h["groups"] = sorted(set(h.get("groups", [])) | set(it["groups"]))
            continue
        local.update([it["id"], key_t])
        orig_section = it["section"]
        classify(it)
        it["origin"] = orig_section
        it["first_seen"] = iso(TODAY)
        # tag mentions of groups (explicit aliases only; ambiguous names are not matched)
        blob = f"{it['title']} {it['summary']}".lower()
        for g in CFG["groups"]:
            if g["id"] not in it["groups"] and any(al in blob for al in g.get("aliases", [])):
                it["groups"].append(g["id"])
        new.append(it)
    log(f"candidates={len(items)} new={len(new)} history_before={len(history)}")
    history.extend(new)
    history.sort(key=lambda x: (x["first_seen"], x["date"]), reverse=True)
    history[:] = [h for h in history if not (h["source_type"] == "linkedin" and LI_JUNK.search(h["title"]))]
    for h in history:
        if h["source_type"] == "linkedin":
            h["img"] = None
    enrich(history)
    (ROOT / "data").mkdir(exist_ok=True)
    hist_path.write_text(encrypt_blob(json.dumps(history, ensure_ascii=False).encode("utf-8"), PW), encoding="utf-8")
    if legacy.exists():
        legacy.unlink()

    # ------------------------------------------------ outputs
    out = ROOT / "docs" / "data"
    out.mkdir(parents=True, exist_ok=True)
    fields = ["id", "date", "first_seen", "source_type", "section", "origin", "tags", "sports", "groups", "title", "outlet", "url", "img", "deadline", "summary"]
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(fields)
    for h in history:
        w.writerow([";".join(h[k]) if isinstance(h.get(k), list) else h.get(k, "") for k in fields])
    csv_text = buf.getvalue()
    jsonl_text = "".join(json.dumps({k: h.get(k) for k in fields}, ensure_ascii=False) + "\n" for h in history)

    cutoff = iso(TODAY - timedelta(days=CFG["history_days_on_site"]))
    recent = [h for h in history if h["first_seen"] >= cutoff or h.get("groups") or h["source_type"] == "opportunity"]
    recent = [h for h in recent if not (h["source_type"] == "opportunity" and h.get("deadline") and h["deadline"] < iso(TODAY))]
    last7 = iso(TODAY - timedelta(days=7))
    # trend signals (rule-based, free)
    week, prior = Counter(), Counter()
    for h in history:
        ws = set(keywords(h["title"] + " " + h["summary"][:300]))
        (week if h["first_seen"] >= last7 else prior).update(ws)
    nweek = max(sum(1 for h in history if h["first_seen"] >= last7), 1)
    nprior = max(len(history) - nweek, 1)
    emerging = sorted(((w, c, round((c / nweek) / ((prior[w] + 1) / nprior), 1)) for w, c in week.items() if c >= 3),
                      key=lambda x: -x[2])[:20]
    pair = Counter()
    tagcount = Counter()
    for h in history:
        t = h.get("tags", [])
        tagcount.update(t)
        for i in range(len(t)):
            for j in range(i + 1, len(t)):
                pair[tuple(sorted((t[i], t[j])))] += 1
    gaps = []
    tl = [t for t, c in tagcount.most_common(14)]
    for i, a in enumerate(tl):
        for b in tl[i + 1:]:
            exp = tagcount[a] * tagcount[b] / max(len(history), 1)
            obs = pair.get(tuple(sorted((a, b))), 0)
            if exp >= 3 and obs < exp * 0.5:
                gaps.append({"a": a, "b": b, "observed": obs, "expected": round(exp, 1)})
    gaps = sorted(gaps, key=lambda g: g["observed"] - g["expected"])[:8]

    payload = {
        "generated": NOW.strftime("%Y-%m-%d %H:%M UTC"),
        "today": iso(TODAY),
        "new_today": len(new),
        "total_items": len(history),
        "items": [{k: h.get(k) for k in fields if k != "origin"} for h in recent],
        "groups": [{"id": g["id"], "name": g["name"], "site": g["site"], "mine": g.get("mine", False)} for g in CFG["groups"]],
        "github": github_repos,
        "signals": {
            "emerging_terms": [{"term": w, "count": c, "lift": l} for w, c, l in emerging],
            "tag_counts": tagcount.most_common(20),
            "underexplored_pairs": gaps,
            "by_section_7d": Counter(h["section"] for h in history if h["first_seen"] >= last7).most_common(),
            "by_day": sorted(Counter(h["first_seen"] for h in history).items())[-30:],
        },
        "fetch_log": [m for m in LOG if m.startswith("FAIL")][:20],
    }
    content = ROOT / "content"
    bundle = {"latest": payload, "ideas": json.loads((content / "ideas.json").read_text(encoding="utf-8")),
              "background": json.loads((content / "background.json").read_text(encoding="utf-8")),
              "csv": csv_text, "jsonl": jsonl_text}
    (out / "bundle.enc").write_text(encrypt_blob(json.dumps(bundle, ensure_ascii=False).encode("utf-8"), PW), encoding="utf-8")
    for old in ("latest.json", "dataset.csv", "dataset.jsonl"):  # never leave plaintext behind
        (out / old).unlink(missing_ok=True)
    log(f"wrote encrypted bundle: {len(recent)} items on site; total {len(history)}")


if __name__ == "__main__":
    main()
