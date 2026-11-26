# Atelier — additive / subtractive review
Reopened at 0feb60b after owner rejected blanket reduction bcbccca. Skill revision 7. Preserve approved illustrated/geometric aesthetic and learning functionality. Current code 407e5c6. A checked implementation is not a claim of final artistic acceptance.
## Implemented
- [x] A1–2: existing ornate header retained; room apertures differ, current room has a moonlit arch and bookmark, mobile icon size improved.
- [x] A3: two inline-note edge grammars; canonical anchored highlights and real English flow preserved.
- [x] A4–5: illustrated reading plaque, book crest, bilingual type, cover ribbon; exact source title retained with the known suffix in secondary type.
- [x] A6: botanical specimen index tab integrated with engraved shield and clear source typography.
- [x] A7: person dossier frame, heraldic monogram with illustration; no fabricated portrait. Actual first-pass comparison showed excessive width, now capped for a single record.
- [x] A8: engraved search housing with circular joint that seats the lens; result count moved adjacent to field.
- [x] A9: private book cover with sewn edge, ribbon and illustration; original import/saved-reading behavior retained.
- [x] A10: mode pictograms, actual play/pause dial state, scope tickets with icons, discovery compass, focus/hover states.
- [x] S1–2: preserve ornate header and all routes; compact mobile top/bottom padding, enlarge readable icons. Do not remove existing artistic frame wholesale.
- [x] S4: title suffix demoted in visual hierarchy, not deleted; archive invariant preserved.
- [x] S5–6: only confirmed unavailable sync-specific controls hidden; normal video, pin, chapter seek and source link retained. Reader mode and annotation remain prominent.
- [x] S11: result count is adjacent to search; 320px single column remains.
## Deliberate preservation / remaining decisions
- [ ] S3/S8/S9: review exact repetitive room labels and intros in final real screens. Preserve meaningful room number, bilingual labels, return links and editorial character; no mass deletion.
- [ ] S7/S10/S12: review crowded rules and accents/ornaments case by case. Existing book frames and principal artwork kept; no blanket reduction. Do not force a change merely to check a box.
## Evidence
- f529866 baseline and 40fedc7 first additive pass: successful full CI runs 45753673392 and 45754193768; actual crops compared for words (light/dark), people, private edition and search (desktop/mobile). First pass improved illustrated identity; person crest had unnecessary backing and excessive card width, fixed in 407e5c6.
- Initial title removal failed archive canonical text assertion (run 45754250925). Corrected to render the original full string as two typographic levels; 72f163c passed check/build/archive/reader.
- New real component screenshot captures include below-fold cards, notes, TOC, search and private edition rather than first viewport alone.
## Final gates
- [ ] Latest complete CI: 45754607524 (407e5c6).
- [ ] Latest real component crops at 320/390/1440 both themes: review and fix residual issues.
- [ ] Artistic judgment, production merge and live verification. No claim of perfection or production release yet.
