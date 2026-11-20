# Pilot 007 — Cross-platform caption positioning and meaning-led sound design

**State:** render + mux + FFmpeg decode verified, not published, no audience measurements. This version builds on [Pilot 006](zizek-marx-v6-linked-bilingual.md); preserves the 20 English narration beats, full bilingual subtitles and 17 paired meaning-highlights. Duration 80.75 seconds, 720 × 1280, 20fps, H.264 + stereo AAC (48kHz/192kbps).

## User feedback
- 「字幕の位置もっと上の方が各プラットフォームで表示が被らないくて見やすい」
- 「もうちょっとなんか視聴者を惹くような何かが欲しい。離脱しないように」
- 「音関連も」 — music, effects, narration balance and meaning-based sound cues.

## Caption-safe layout (this project, not a universal platform standard)
For 720 × 1280: editorial safe area x=74..542, y=192..834. Dynamic captions render at x<=542 with measured **y=506..827** across all 20 beats; reserve >446 pixels at the bottom and ~178 pixels at right for possible platform UI. The border is a conservative working hypothesis only; TikTok, Shorts and Reels UI can vary by device, app version, account and ad placement. Test at platform-native preview before publishing. Avoid putting key subtitles, linked EN/JA highlight pairs or claim labels at the bottom of the canvas.

Keep semantic English↔Japanese phrase linking, color consistency and clarity of the historical image. Do not overlay dialogue text with platform controls. Do not reduce the thesis's information density for decoration.

## Retention-oriented structure — hypotheses rather than proven effects
- 0s: show Marx and Žižek together as a contradiction — *change it* vs *we acted too much*. First visual hook is a concrete source-based intellectual disagreement.
- ~19.3s: sharper twist with the actual 'intellectual orgasm' joke; retain Žižek's temperature and comic exaggeration.
- ~34.1s: October Revolution→Stalin contrast, with a short accent, not an invented story.
- ~43.15s: freedom→terror reversal; visual caption marker and short turn.
- ~51.65s: rhetorical refrain “How could things go wrong?”; music briefly drops away before the emphasis.
- ~55.65s: AI question becomes a fresh development, with changed image and sound.
- ~73.45s: return to Marx with Žižek's interpretive reversal and a restrained final musical turn.

Narration pace remains the natural-ish English version from Pilot 006, not sped up. Visual cuts and music turns carry energy; no rapid-cut animation filler and no separate logo intro. “Retention improvements” are **unmeasured hypotheses**; only views after publishing and platform retention data can validate them.

## Original audio
- English synthesized narration, not Žižek's voice, retained at 20 speech beats.
- FFmpeg narration chain: 85Hz HPF / 8.5kHz LPF, 1.6:1 light compressor, measured loudness normalization target about -17 LUFS.
- No third-party copyrighted music or SFX. Original instrument-free synthesized texture/pulse (~98 BPM, not a compulsory global music tempo), modest editorial stings at 0, 19.3, 34.1, 43.15, 51.65, 55.65, 70.35, 73.45s, dynamic voice-triggered ducking.
- Final output measured **-17.21 LUFS integrated** and **-4.42 dBTP** (FFmpeg analysis). These are measurements, *not* subjective sound-quality approval.
- BGM should remain distinctly beneath voice. Avoid adding hits to every cut or overemphasizing emotional statements. Meaning changes control the sound, not an arbitrary timer.

## Audit and provenance
Full 80.75s MP4 decodes with both video and audio streams, AAC 48kHz stereo. All 20 overlay caption cards are within layout constraints; narration and bilingual text are aligned per speech timing derived from MP3 source duration. The source archive includes the actual video, source script, SRT, paired-highlight JSON, conservative safe-zone preview, opening cut, photograph attribution, render.py and sound-design.py. Original 2026 lecture recording is not incorporated, and the 2011 photo is not to be represented as the 2026 event. Background images and licensed photograph sources are documented in existing [Pilot 005](zizek-marx-bilingual-v5.md); license confirmation is needed before final publication.

**Remaining reviews:** actual human listening for English voice timbre and the background's musical quality, app-specific Shorts/TikTok/Reels UI preview, audience retention, copyright and credit review. Nothing automatically posted or scheduled.

## Reproducibility and delivery
- Production inputs + render sources: downloadable in this chat as `the-annotated-world-zizek-v7-production.zip` (not committed to Git due to large audio/video assets).
- All third-party photography license links: in `out/sources.json` and `out/description.txt` from the production ZIP.
- Video and English audio are editorial synthesis, not the claimed original speech recording.
