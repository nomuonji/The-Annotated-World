# 配置仕様 — 画像をサイトの機能と結び付ける

## アートディレクション
- 暗いインク #191624、紙 #f2e8db、ローズ #d886a9、ライラック #b4a4c8、金属 #b58a55。夜の背景画と明るい本文のコントラストを生かす。
- キャラクターはピンク〜ラベンダーの髪、眼鏡、黒のクロスピン・ヘッドホン、黒紫と淡色の衣装。うさぎのマスコットを維持する。生成ボードに紛れた猫や架空の人物は設定に採用しない。
- 背景画＝場所の気配、独立透過素材＝操作する対象、HTML＝ラベル・文・リンク・機能。生成されたUI画像や文字をそのまま実装しない。
- 見出し背景は各ページの入口のみ。本文の下にフル画面背景を置かず、画像がなくても使える。装飾画像は aria-hidden/alt=""、情報を伝える画像は実際の内容に即した alt。

## ページ別スロット

| 対象 | 画像・配置 | 機能・制約 |
|---|---|---|
| `/` | `midnight-desktop/mobile.webp`、`catalog-desktop/mobile.webp` | 既存主役と安全領域を維持。入口左にHTML、探索中央に操作。スマホは画像外にCTA。再訪者はヘッダーから直接検索・読解へ。入口直後の動画棚は元動画の16:9サムネイルを使う（本人指定）。書庫・関連資料では専用表紙を使い、元動画の視認性を損なわない。 |
| `/library/` | `rooms/library-desktop.webp`、`rooms/library-mobile.webp`、`sprites/book-stack.webp` | 短い部屋ヘッダー＋直後に検索・資料/章切替。教材カードの表紙は `covers/{documentId}.webp`。既存サムネイルは元動画情報として別扱い。 |
| `/genres/:id/` | 書庫背景を共用、`genres/{id}-thumbnail.webp` | 仮サムネイルは48×39 CSS px以下。各ジャンルの情報を優先し、空ジャンルは架空教材を生成しない。 |
| `/topics/`, `/topics/:id/` | `rooms/observatory-desktop/mobile.webp`、`sprites/armillary.webp` | 意味のある関係はHTML/SVGで描画。根拠のない線を作らない。詳細は短い見出しに縮小。 |
| `/words/`, `/words/:id/` | `rooms/lexicon-banner.webp`、`rooms/lexicon-mobile.webp`、`sprites/open-notebook.webp`/`fountain-pen.webp` | 文字・検索と語義を読みやすく。細長いバナーに限定し、詳細ページでは装飾を最小化。 |
| `/concepts/`, `/concepts/:id/` | `rooms/concepts-vignette.webp`、`sprites/marginalia-cards.webp` | 仮挿絵は右側180–320px以内。概念の説明と出現箇所の区別を維持。索引は事典と同一視しない。 |
| `/people/`, `/people/:id/` | `rooms/people-vignette.webp` | 仮挿絵は180–320px以内。古典彫像は部屋の象徴であり、実在人物の肖像として使用しない。 |
| `/read/:id/`, 章表示 | `covers/{documentId}.webp`（任意）、`rooms/cinema-vignette.webp`（動画セクション見出し横のみ） | イラストは本文・注釈・動画上に重ねない。章単位では大きな扉を省略。既存動画固定・和訳ドック・注釈の機能と幾何を保護。 |
| `/workspace/` | `rooms/private-room-vignette.webp`、`sprites/annotator-standing.webp` | 仮挿絵は小さく。インポート・検索・保存済み発話がすぐ使えること。個人データを外部送信しない。 |
| 共通 | `sprites/bookmark.webp`、`desk-lamp.webp`、`pocket-watch.webp`、`violet-flowers.webp` など | しおり＝保存/現在地の視覚メタファー（実機能を偽らない）、時計＝所要時間、灯り＝読書室。装飾は任意。 |
| 余白コラム | `sprites/annotator-cola.webp` / `annotator-delighted.webp` / `annotator-question.webp` / `annotator-reading.webp`、`rabbit-reading.webp` | 表情は内容に合わせて選ぶ。キャラの台詞はHTMLで、原文引用や客観解説と区別。 |

## レスポンシブ実装指針
- PC (1024px以上)：部屋の見出しは180–260px高を出発点にし、画面幅が広くても際限なく拡大しない。library/observatoryの文字は左6〜40%、主題は右側。暗い画像の上でも必要な場合だけグラデーションを足す。lexiconは約5.4:1の帯。
- スマホ (640px以下)：背景画とテキストを別のDOM領域にする。画像は右の主題を切り出したmobile版を使い、高さ100–144px程度。長い見出し・検索欄は画像外に置く。本文ページは部屋画像を省略可能。
- 641–1023px：重なる場合は通常フローへ落とす。透過素材は原寸を超えて表示しない。仮挿絵は最大320px、仮ジャンルアイコンは48×39px。
- 背景用pictureには幅・高さを明示し、ファーストビュー以外は `loading="lazy"`、`decoding="async"`。入口のメイン画像のみ優先読込。実際の文字とボタンは44px目安の操作領域を確保する。
- ダーク/ライトで画像そのものを加工せず、周囲のトークン・境界・文字色を切り替える。アニメーションは任意で reduced-motion 対応。

## 実装担当の着手順
1. `RoomHeader`（picture＋タイトル＋補足＋optional小挿絵）、`AssetIcon`、`DocumentCover`、`Marginalia` の共通部品を設計。
2. 一覧・詳細の全ページ種別に上記スロットを割り当て、既存の検索・読解機能を維持。
3. 画像を配置して同じ画面幅で実画面を撮影。内容・操作・視線が競合した場合は画像の配置を見直す。
4. 仮素材は置き換え可能なスロットとして扱い、最終アートの生成後に同じパスまたはmanifestを更新する。
5. 既存 `WORLD-REDESIGN-CHECKLIST.md` のC項目と各ページ実装項目は、証拠を得た項目のみ完了にする。
