# The Annotated World

Annotated source documents, not a generic English learning portal. The supplied initial HTML is the visual and structural reference: white paper, editorial typography, chapter table of contents, continuous text in English, Japanese translation, and language/context notes immediately below each utterance.

## Add a document

Place **one complete annotated HTML file** in `src/content/documents/<lowercase-slug>.html`. Astro's content collection reads the HTML, automatically derives the title, author, duration, date, description, chapter/utterance counts and builds its own URL `/read/<slug>/`; the index updates automatically. No JSON conversion, layout or route changes are needed. The first document is `slavoj-zizek-signs-from-the-future.html`, an exact copy of the user-provided file. The public library starts with this one document.

Use `main.page`, `.hero` (h1, .hero-meta, .deck and .meta-strip), `.toc`, `section.sec`, `.sec-header h2`, and `.utterance` with `.speaker-line`, `.en`, `.ja`, `.note`, and a source footer. Include source links, mark uncertainties in transcripts, and preserve chapter order and inline typography. Optional `<meta name="aw:category" content="...">`. The reader extracts only the document body and uses the shared stylesheet derived from the original file, rather than running arbitrary imported styles or scripts. The loader rejects unexpected markup, unsafe attributes/links and missing bilingual blocks. Do not commit personal data, untrusted files or material you lack permission to publish. The initial upload was explicitly requested by the owner; transcript accuracy and redistribution rights are unverified and disclosed on its page. Do not label the text as verified without evidence.

## Development

Node 22.12+, `npm install`, `npm run dev`. Run `npm run check`, `npm run build`, then `npm run verify:archive`. Deploy `dist/` to a static host (build command `npm run build`); no server, database or secrets required. Root deployment assumed. The legacy private importer remains separately accessible at `/workspace/` but is not part of the public archive navigation; its example is not a public archive entry.

## Discovery metadata

The public archive has six fixed genre routes, a full-text metadata search in /library/, topic and person indexes, and context-aware links from every document and annotated chapter. Add the optional `<slug>.meta.json` alongside the original HTML: `genre` is one of philosophy, literature, film-culture, society, technology, internet; `people` contains stable {id,name,ja}; `topics` contains {id,name}; `chapterMetadata` maps existing chapter anchors to {genres,topics}. Reuse topic/person IDs across documents and keep labels consistent. An HTML file without metadata still appears in the archive without invented classifications. Topic counts are actual document and chapter counts. A single document can be discovered via several chapter-level genres, but the genre listing distinguishes its primary genre. The original source HTML stays unchanged. YouTube video ID is parsed from the original source link; the reader embeds the privacy-enhanced player with timestamp controls and an external fallback. Other sources use the original links without a player. Related documents rank shared themes, people and genre; no fake recommendations are added.

## Study reader

The learning toolbar adds parallel text, English-only, and listening modes with per-utterance reveal, font scaling and chapter navigation. Video documents support the official YouTube IFrame API: live playback-position highlighting, explicit follow mode, timestamp seek, available playback speeds and utterance repeat using the next source timestamp as the end. Desktop video stays alongside the transcript; mobile video can be pinned or unpinned. Original text, notes and links still render without JavaScript. On API failure the normal player and external timestamp links remain usable. Utterance-level alignment is approximate; the last repeat requires a known duration. No new persistence or bookmark feature has been added. The legacy private importer is unchanged.
