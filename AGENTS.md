# The Annotated World — agent entrypoint

**コンテンツ制作エージェントは最初に [docs/CONTENT-AGENT.md](docs/CONTENT-AGENT.md) を読む。** 実際のHTML仕様・メタデータ・構文注釈・品質ゲート・追加手順はそこが正本。着手前に `npm run content:inspect` で既存資料・タグ・人物・概念・重複動画を確認する。

# Editorial contract

The original supplied HTML is the design and organizing source. This project is an independent annotated document archive, not English Notes, a gamified English-learning app, or a generic landing page. Keep the reader's continuous chapter order and adjacent en/ja/note blocks, inline emphasis, metadata and links visible in normal HTML without JavaScript. Default to a white editorial page and restrained site header. Add a new source HTML file to src/content/documents; the loader and route derive the rest. Use unique stable lower-case slugs and actual source materials. Verify transcript and translation quality and publication rights; document unresolved status explicitly; do not claim verified completeness or rights merely based on source text. The owner specifically requested inclusion of the first supplied HTML; it is stored byte-for-byte with unverified rights and transcript accuracy disclosed. Do not infer a blanket authorization to publish other unverified works. Never use generated/demo articles as public substitutes. Run npm run content:check, npm run check, npm run build and npm run verify:archive. No deployment or periodic jobs unless requested.

Maintain the discovery structure: source HTML is canonical, optional sidecar <slug>.meta.json contains curated genre, topic, person and chapter-level metadata. Reuse IDs and labels; never invent sources, people or topic associations. No empty recommendations or fake popularity metrics. Genre, topic, person and chapter routes must link to actual entries and original anchors. Preserve source video links, embed recognized YouTube IDs only, and provide explicit user-triggered time jumps. Keep original reading typography separate from platform browsing UI. Run existing verification including navigation and embedded-source checks.

Study reader: keep the original content and default parallel reading intact. Playback synchronization is approximate at source utterance timestamp granularity, never infer word-level alignment. Use YouTube IFrame API only for recognized source IDs; retain native controls and links. Mobile video fixation is optional, not forced. Do not implement new bookmarks, vocabulary storage, persistent reading history, account or database until the owner asks. Verify desktop and mobile reader behavior with a mocked player where live YouTube playback is unavailable; distinguish those checks from actual playback.
Vocabulary indexes must derive from source marked expressions and verbatim note labels; keep contextual annotations distinct from dictionary definitions. Curate concept registry aliases and require actual occurrence in source English before listing. Optional annotations must quote exact source text, distinguish general pronunciation tips from verified audio, and validate inline segment and translation matching. Do not add storage or offline caching without approval. Keep text, original emphasis and source links intact; mobile reading controls should not cover content.


New source files belong in `src/content/documents/`; new supplemental annotations live in the corresponding `<slug>.annotations.json`, not a central annotation file. Machine-readable catalog: `/catalog.json` (generated, not hand-edited). Do not change layouts, registry labels, stable IDs, application behavior, other documents or deployment configuration merely to add a document. The first supplied document's unverified rights are an explicit existing exception, not authorization for new publication.

## 派生発信コンテンツ
思想・知識の解説動画やSNS企画を作る前に [docs/EDITORIAL-POLICY.md](docs/EDITORIAL-POLICY.md) を参照する。制作方針の検討版と試作は公開承認ではない。教材制作と派生発信を分離し、元動画の引用可否と取得・配信規約を個別確認する。

**日本語ショートを制作するときは [docs/research/2026-11-20-japanese-short-form.md](docs/research/2026-11-20-japanese-short-form.md) を先に読む。** Pilot 001（スライド）・Pilot 002（2Dアニメ）は両方ユーザー不採用。日本語圏で再生された実動画の画・音・字幕を観察し、原典話者・具体物・意外な言説から企画する。視聴不能な場合は未観測と明記し、完成MP4を先に作って成功扱いしない。

## 教材からの日本語ショート — 内容密度の絶対条件
ユーザーの直接指示（2026-11-20）: 「教材の情報密度をアニメーションとかで薄めたりしないで。勉強にならない」。題材の思想を架空の日常寸劇、汎用の2Dキャラクター、抽象的な比喩アニメ、時間稼ぎの導入へ置き換えない。原典の具体的な議論・人物・作品・歴史的事実・原文引用と背景説明を優先する。視聴者が原典に新しく学ぶ事項を、論点と証拠を伴って毎回提示する。情報密度の低下は映像品質と別に不採用。
このシリーズの最新の本人指示は「英語音声を主体にバイリンガル字幕」「ジジェク本人の画像を使う」「バズるリズム感が弱い」。原典と議論に直接関係する写真を優先して、テンポを発話ごとの字幕とカットで検証する。英語の発話と英日字幕で短い動画の文法を検証し、一次資料や本人映像を優先する。ただし映像の権利・来歴、本人が発言した時点と資料映像の撮影時点を厳格に区別。2026年の本編未取得の場合は原典映像であるかのように偽装しない。音声・字幕の逐語確認、出典、推測/編集者解釈の区別を記録する。
日本語ナレーション版の [Pilot 003](docs/prototypes/marx-thesis-pilot-003.md) は日本語ナレーション・2013年別講演のCC BY 3.0映像を使用した素材引用/ドキュメンタリー解説型で、再生実績・本人の採用評価は未確認。英語音声＋英日字幕で作り直した [Pilot 005](docs/prototypes/zizek-marx-bilingual-v5.md) は現時点で本人評価未了。現在の制作基盤は [GitHubプロトタイプ用ブランチ](https://github.com/nomuonji/The-Annotated-World/tree/prototype/japanese-marx-zizek-2026)。
