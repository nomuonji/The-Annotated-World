# The Annotated World

Read the world, not just English. Astro-based bilingual reading library.

## Development / deployment

Node 22.12+ (use current Node 22 LTS patch). `npm install`, `npm run dev`. Verify with `npm run check` and `npm run build`. Deploy `dist/` with build command `npm run build`; no server adapter, runtime API, database or secrets required. Root deployment assumed.

## Publishing more lessons

One JSON file per lesson in `src/content/lessons/`. Copy the original demo shape, choose stable unique ids for the lesson, chapters and utterances, and set title, author, category, description, tags, duration, publishedAt (YYYY-MM-DD), source, rights status/note and chapters. Each utterance has en, ja, note, keys, speaker, time. Schema: `src/content.config.ts`. All draft:false entries are indexed automatically on the home page and prerendered at `/read/<id>/`. Draft defaults to true. Build rejects invalid data, duplicate IDs within chapters and published duplicate lesson IDs or unverified rights. Check source and permission yourself; metadata is not a legal verification. Do not commit unlicensed full transcripts into a public repository, even as drafts. The original demo is a demonstration, not a lecture.

## Private imports

`/workspace/` retains the original HTML/JSON importer, personal library, chapter reader, saved utterances, local progress, export/delete. Imported files never upload to a server. Include `.sec`, `.sec-header`, `.utterance`, `.speaker-line`, `.en`, `.ja`, `.note` in a supported HTML file. JSON export can be adapted into the public schema after rights clearance; add the required stable chapter/block IDs and editorial metadata. Public reading progress/bookmarks live in a separate browser localStorage namespace; original personal data stays in `annotated-world-v1`. Clearing browser data removes local records. No hosting or scheduled jobs currently configured by this migration.

## Structure

- `src/content/lessons/`: source of truth for public content
- `src/content.config.ts`: validation
- `src/pages/read/[id].astro`: reusable static reader
- `src/pages/index.astro`: search/category library
- `src/pages/saved.astro`: public bookmarks
- `src/pages/workspace.astro`: personal imports
- `src/layouts/`, `src/components/`, `src/scripts/`: presentation and reading enhancements
- `public/`: styles and pre-existing private reader
- `AGENTS.md`: editorial / implementation contract
