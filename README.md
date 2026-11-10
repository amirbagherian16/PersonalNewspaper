# The TBI Daily

A personal, automatically updated newspaper on traumatic brain injury (TBI), focused on contact-sport head impact, biomechanics and simulation, with sections for blast and clinical TBI.

**Cost: $0.** A scheduled GitHub Action runs once a day. It uses only the Python standard library and free public feeds. No LLM or paid API is called.

## Tabs
- **Today**: new papers, preprints, news, LinkedIn posts and social items; filter by section, source and day.
- **Groups**: Memar Lab, HEAD Lab (Imperial), Kraft/Penn State, Ji Lab (WPI), Camarillo (Stanford), AWS x NFL, Prevent Biometrics and Biocore. Papers via PubMed author search, news via Google News, repo activity via GitHub.
- **Brainstorm**: data-driven signals (topic volume, emerging terms, under-explored topic pairs) plus curated research and market ideas.
- **Background**: primer on mechanisms, metrics, methods, clinical landscape and venues.
- **Dataset**: categorized dataset (`docs/data/dataset.csv` and `.jsonl`), grown daily and de-duplicated.

## Sources and limits
PubMed, Europe PMC (preprints), Google News RSS (news; LinkedIn posts through `site:linkedin.com`), Mastodon hashtags, Hacker News, GitHub API.
Google Scholar, X/Twitter, Reddit, Bluesky and LinkedIn do not allow free anonymous access, so they are not scraped. LinkedIn coverage is only what Google News indexes. Classification is keyword-rule based, so expect some mislabels.

## Customize
Edit `config.json` (queries, groups, author searches, lookback window). Add `ideas.json` and `background.json` entries in `docs/`.

## Run locally
```bash
python scripts/fetch.py
python -m http.server -d docs 8000   # open http://localhost:8000
```

## Setup on GitHub
1. Settings > Pages > Deploy from branch `main`, folder `/docs`.
2. Settings > Actions > General > Workflow permissions: read and write.
3. Actions tab > "Daily TBI newspaper" > Run workflow (optional first run).
