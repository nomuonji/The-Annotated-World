# Archive interface design system
2026-11-26. Owner feedback: illustrations and surrounding decoration are insufficient; existing interface primitives still resemble an information site. This change targets the controls themselves, not a new background.
- Navigation: room-sign glyphs, real room numbers, selected marker. Custom original line glyphs in ArchiveGlyph. Astro native links; visual mark plus aria-current. Reader/genre maps to library.
- Search: shared ArchiveSearch primitive, separate query instrument and live result counter, actual filter count; no fake button. Native input/select/details. 
- Selection: connected register tabs instead of isolated pills; state indicated by rail, weight and aria-pressed, not color alone. 
- Reading: book-ticket CTA, film marker on original thumbnail, compact mode dial and brass controls. Keep source thumbnail, exact control IDs, script, mobile pin geometry and translation.
- Information hierarchy: tags as underlined annotations, chapters as index numbers, genre emblems and selected spine. Private study uses same square/engraved controls.
- Tokens: --aw-metal, --aw-metal-strong, --aw-panel, --aw-instrument, --aw-control-ink. Use existing paper/ink/accent theme tokens. New layer archive-interface.css owns control paint and shared shapes, existing discovery/study CSS owns structure/behavior. Do not redesign with generic rounded pills, big cards, gratuitous UI copy or unrelated fiction.
- Accessibility: text remains visible; icons ornamental and aria-hidden; preserve native focus and reduced motion. Do not clip the hit target. Buttons reflect real state and remain keyboard accessible.
- Acceptance: test actual nav and filter scope/active count, source thumbnails, native keyboard access, 136 responsive combinations, 32 axe cases, reader with pinned video and Japanese dock. Compare actual screenshots before approval.
