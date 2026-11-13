# The TBI Daily

**Live site: https://amirbagherian16.github.io/PersonalNewspaper/** (password protected)

A personal, automatically updated newspaper on traumatic brain injury (TBI), focused on contact-sport head impact, biomechanics and simulation, with sections for blast and clinical TBI.

**Cost: $0.** A scheduled GitHub Action runs once a day. It uses only the Python standard library and free public feeds. No LLM or paid API is called.

## Tabs
- **Today**: new papers, preprints, news, LinkedIn posts and social items; filter by section, source and day.
- **Groups**: Memar Lab, HEAD Lab (Imperial), Kraft/Penn State, Ji Lab (WPI), Camarillo (Stanford), AWS x NFL, Prevent Biometrics and Biocore. Papers via PubMed author search, news via Google News, repo activity via GitHub.
- **Funding**: open calls (Grants.gov), recent awards (NIH RePORTER, NSF, including your lab and tracked PIs), and grant/award news.
- **Brainstorm**: data-driven signals (topic volume, emerging terms, under-explored topic pairs) plus curated research and market ideas.
- **Background**: primer on mechanisms, metrics, methods, clinical landscape and venues.
- **Dataset**: categorized dataset (`docs/data/dataset.csv` and `.jsonl`), grown daily and de-duplicated.

## Privacy (password protected)
GitHub Pages cannot do real logins, so all site data (`docs/data/bundle.enc`) and the stored history (`data/items.enc`) are AES-256-GCM encrypted with a key derived from your password (PBKDF2, 600k rounds). The page asks for the password and decrypts in your browser. Without it, the public repo only shows ciphertext.
- Set the password as a repository secret named `SITE_PASSWORD` (8+ characters, longer is better). Changing it re-encrypts everything on the next run.
- Locally: `SITE_PASSWORD=... python scripts/fetch.py`. Needs `pip install cryptography`.
- The code, `config.json` and `content/` are still public. Git history from before encryption still contains old plaintext news data.

## Sources and limits
PubMed, Europe PMC (preprints), Google News RSS (news; LinkedIn posts through `site:linkedin.com`), Mastodon hashtags, Hacker News, GitHub API.
Google Scholar, X/Twitter, Reddit, Bluesky and LinkedIn do not allow free anonymous access, so they are not scraped. LinkedIn coverage is only what Google News indexes. Classification is keyword-rule based, so expect some mislabels.

## Customize
Edit `config.json` (queries, groups, author searches, lookback window). Edit the ideas and background text in `content/`.

## Run locally
```bash
SITE_PASSWORD=yourpassword python scripts/fetch.py
python -m http.server -d docs 8000   # open http://localhost:8000
```

## Setup on GitHub
1. Settings > Pages > Source: GitHub Actions (the workflow deploys `docs/`).
2. Settings > Actions > General > Workflow permissions: read and write.
3. Actions tab > "Daily TBI newspaper" > Run workflow (optional first run).
