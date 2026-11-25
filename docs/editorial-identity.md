# The Annotated World — editorial identity

## Core
Read the world. Question the reading.
世界には注釈を。自分には、まだ。

The fictional annotator is intellectually curious and self-contradictory: she reads philosophy, drinks cola, procrastinates, and questions her own desire. She is an editorial character, not a real scholar or a source of factual authority. Her lines are original fictional copy, not quotations from philosophers. Concept explanations should link back to the actual knowledge index.

## Design
- Ink/navy, warm paper, muted rose, lavender, brass accent.
- Editorial hero and margin-note cards; mobile stacks in reading order.
- Character use stays concentrated in the discovery experience; long-form reading remains content-first.
- No layout changes to video pinning, Japanese translation dock, inline annotations, transcript IDs, or reader scripts.
- Home has two purpose-built illustrated locations: midnight reading desk and catalog room. Desktop/mobile artwork is art-directed separately. Four isolated object sprites represent real navigation routes; chibi and cola sprites illustrate a fictional marginal note linked to surplus enjoyment. All controls and copy are HTML, not baked into images.


## Asset contract
- `/brand/midnight-mobile.webp` — mobile entrance crop.
- `/brand/midnight-desktop.webp` — desktop entrance scene.
- `/brand/catalog-mobile.webp` — mobile catalog crop.
- `/brand/catalog-desktop.webp` — desktop catalog scene.
- `/brand/icon-globe.webp` — topics route.
- `/brand/icon-book.webp` — words route.
- `/brand/icon-notes.webp` — concepts route.
- `/brand/icon-books.webp` — library route.
- `/brand/chibi-annotator.webp` — marginalia character.
- `/brand/cola.webp` — marginalia cola.

The self-contained browser prototype was checked at 320, 390, 768, 1024 and 1440px. Production build and reader checks are separate. Do not add illustration assets without a specific layout and functional role.

## Regenerated scene artwork
Both scenes were redrawn for the actual page composition: entrance subject on the right with a dark left-side copy area; catalog subject on the left and globe/mascot on the right, with central clear area for a 2×2 navigation grid. At widths ≤1150px the navigation moves below the image. Existing isolated sprite assets remain in use. New desktop WebP 1536×864 and mobile 768×432. Browser prototype checked at 320/390/768/1024/1151/1440px for image loading, horizontal overflow and link size. Aesthetic review remains subjective.

## Production asset decisions
Four purpose-built rooms have been replaced with independent illustrations (concepts, people, cinema, private study). Six genre emblems are authored SVGs, not generated artwork. The home video shelf uses the source-video thumbnail for recognition; the library uses original illustrated reading editions. Aesthetic acceptance is separate from release safety.
