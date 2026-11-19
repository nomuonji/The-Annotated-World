# The Annotated World

Read the world, not just English.

知的コンテンツを、英文・和訳・語彙・構文・背景の注釈とともに読む独立した学習サイト。

## Local development

No dependencies, build step, API keys or backend required.

```sh
python -m http.server 8000
```

Open http://localhost:8000. Static hosting (Cloudflare Pages, Netlify, GitHub Pages) can serve the repository root with no build command.

## Import your own materials

Use **教材を追加** to select a local annotated HTML file (including the supplied Žižek format) or a JSON archive. HTML must contain chapter sections `.sec` with `.sec-header`, and `.utterance` blocks containing `.speaker-line`, `.en`, `.ja`, `.note`. The importer reads text and marked vocabulary, not executable markup. The original file and reader state remain in the browser; they are not uploaded to a server. Export an individual lesson as JSON for backup or editorial exchange.

The repository is public. The original full lecture transcript is intentionally not committed: its redistribution license and transcript accuracy have not been verified. The included demonstration is original editorial sample text, not an actual lecture. Import only materials you may use, and verify permissions before publishing.

## Data contract

A lesson is `{id,title,author,category,description,source,duration,chapters:[{title,time,description,blocks:[{speaker,time,en,ja,note,keys:[]}]}]}`. Source must be an HTTPS URL or blank. Times are optional HH:MM:SS strings. IDs are stable for progress and bookmarks. JSON exports use this same format. Content updates should preserve block ordering or deliberately migrate reading state.

## Architecture

- `index.html`: application shell and navigation
- `styles.css`: responsive editorial design
- `demo.js`: bundled original demo in the lesson schema
- `app.js`: library, reader, local import/export and browser-local persistence

Public editorial content and personal imports are separate. Do not commit unlicensed source materials or private learner data. No deployment, domain, scheduled jobs or existing English Notes / Learning OS changes are implied by this repository.
