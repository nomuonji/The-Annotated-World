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

## 英語音声と英日連動字幕（Pilot 006から）
- 本人の評価（2026-11-20）：Pilot 005 は「だいぶ良くなった」。ただし英語音声は速すぎないほうがよい。出典元の温度感・ニュアンス（躊躇、限定、皮肉、ユーモア）をできる限り残す。対応する英語句と日本語訳を同時に色連動でハイライトする。バズのリズム感は単なる倍速で作らない。
- 速さは表現内容と英語聞き取りに基づき調整する。比較用として今回の音声は AndrewNeural +6%（前版+24%）だが、倍率を全企画の固定ルールにしない。意味が切り替わるところに自然な短い間を置く。
- 原典の逐語引用と制作者による言い換え・解釈を分ける。本人が断りを入れている主張を断定へ変えない。賛否が複雑な対象への態度を簡略化しない。原典の笑い・皮肉・話者らしい言い回しが理解に重要なら、省かず文脈と訳語を整える。
- 日英字幕は両方全文の意味を伝え、各発話中の重要表現について `hi_en`・`hi_ja` の正確な部分文字列ペアを持たせる。同一発話の表示中に英語句・日本語句を同色で強調し、位置を結ぶ小さな視覚線を表示する。単語のバラバラな強調、英語と日本語で別の意味を示す着色、単純なハイライト語数ノルマは禁止。学習の主役は思想内容であり、対応語の発見は自然な副産物。
- 写真と議論の対応を優先。ジジェク本人の写真は利用権・年次を表示したうえで使用可能。別の時期の写真・音声を2026年講演の記録と誤認させない。
- [Pilot 006 の実装・評価用記録](docs/prototypes/zizek-marx-v6-linked-bilingual.md)、[既存研究](docs/research/2026-11-20-japanese-short-form.md)。MP4と再編集スクリプトはチャットのソースZIPとして配布し、コードを使用する場合はそのローカルパッケージを参照。

## ショート Pilot 007: クロスプラットフォームUIと音
第7版のフィードバック「字幕をもっと上へ」「視聴者をもっと引きつける」「音関連も」に対応した制作契約は [docs/prototypes/zizek-marx-v7-audio-safezone.md](docs/prototypes/zizek-marx-v7-audio-safezone.md) を参照。英語発話のペースを不必要に上げず、論証の逆転と音響の変化で視聴を支える。字幕は下端や右側のSNS操作UIと重ねず、英語句と日本語句の同時ハイライトを守る。適法に利用可能な写真・史料とナレーションを分けて出所を残す。

## Pilot 008: BGMと余白の修正
2026-11-20 の本人FB「BGM聞こえない／字幕が読みづらい／スペースがやたら開いててもったいない」に対応する [編集仕様](docs/prototypes/zizek-marx-v8-bgm-captions.md) を優先参照する。字幕の『安全』のために400px以上空けて、文字を小さくする設計は採用しない。BGMの平均音量や帯域を最終音声と分けて検査し、声を邪魔しないが音楽として存在感が分かる水準にする。日英の対応ハイライト・思想の情報密度・原典のニュアンスを維持する。

## Pilot 008の見づらさ：最新の見た目・構成研究
本人の追加フィードバック「何か見づらい。構成も見た目ももっと研究して」を受け、再レンダー前に**[docs/research/2026-11-20-v8-composition-visual-audit.md](docs/research/2026-11-20-v8-composition-visual-audit.md)** を読む。直近版の写真＋英日8行＋固定ブランド＋大見出し＋85%不透明黒カードの同時表示はやめ、主情報・本文字幕・補足ラベルの優先順位を決める。英日字幕は原稿を削らず意味句へ分割する。英語先導と日本語理解先導の2案を比較する。実際の学習効果・視聴維持が検証済みだと書かない。新しい動画を作る前にスマホサイズで最長字幕と初回3秒を評価する。

## 最新の短編編集ルール：Pilot 009
ユーザー「見づらい。構成も見た目ももっと研究して」「改善して」を受けた最新版は [docs/prototypes/zizek-marx-v9-semantic-visual-hierarchy.md](docs/prototypes/zizek-marx-v9-semantic-visual-hierarchy.md)。最初に[第8版の監査](docs/research/2026-11-20-v8-composition-visual-audit.md)と併読する。前版の常設タイトル・全画面の巨大字幕枠・英5行＋日3行の一括表示へ戻さない。字幕は短い意味句へ分割し、**全文を維持したまま同時表示を最大4行程度**とする。人物・史料・比較でレイアウトを使い分け、日英連動強調を維持する。本人の評価・実機UI検証がない状態を完成版の採用と取り違えない。

## 最新の主従修正 — Pilot 010／原典の声を主役に
ユーザー2026-11-20の直接指示「ジジェクの言葉がメイン、われわれの説明は細い註」「主従が逆」を最優先。実装・禁則の正本は [docs/prototypes/zizek-v10-quote-first-annotations.md](docs/prototypes/zizek-v10-quote-first-annotations.md)。**本人の原文引用を映像の中心に、英語音声と英文字幕を主役、日本語字幕とごく短い註を脇役に置く。** 合成音声は別ナレーターと明示し、ジジェク本人の実録や同時代映像に偽装しない。本人の温度・留保・冗談・革命や哲学への複雑な立場を保ち、解説者が主人公にならないようにする。引用部分の公表権利は別検討、公開は未承認。
