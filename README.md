# The Annotated World

Annotated source documents, not a generic English learning portal. The supplied initial HTML is the visual and structural reference: white paper, editorial typography, chapter table of contents, continuous text in English, Japanese translation, and language/context notes immediately below each utterance.

## Add a document

Place **one complete annotated HTML file** in `src/content/documents/<lowercase-slug>.html`. Astro's content collection reads the HTML, automatically derives the title, author, duration, date, description, chapter/utterance counts and builds its own URL `/read/<slug>/`; the index updates automatically. No JSON conversion, layout or route changes are needed. The first document is `slavoj-zizek-signs-from-the-future.html`, an exact copy of the user-provided file. The public library starts with this one document.

Use `main.page`, `.hero` (h1, .hero-meta, .deck and .meta-strip), `.toc`, `section.sec`, `.sec-header h2`, and `.utterance` with `.speaker-line`, `.en`, `.ja`, `.note`, and a source footer. Include source links, mark uncertainties in transcripts, and preserve chapter order and inline typography. Optional `<meta name="aw:category" content="...">`. The reader extracts only the document body and uses the shared stylesheet derived from the original file, rather than running arbitrary imported styles or scripts. The loader rejects unexpected markup, unsafe attributes/links and missing bilingual blocks. Do not commit personal data, untrusted files or material you lack permission to publish. The initial upload was explicitly requested by the owner; transcript accuracy and redistribution rights are unverified and disclosed on its page. Do not label the text as verified without evidence.

## Development

Node 22.12+, `npm install`, `npm run dev`. Run `npm run check`, `npm run build`, then `npm run verify:archive`. Deploy `dist/` to a static host (build command `npm run build`); no server, database or secrets required. Root deployment assumed. The legacy private importer remains separately accessible at `/workspace/` but is not part of the public archive navigation; its example is not a public archive entry.
