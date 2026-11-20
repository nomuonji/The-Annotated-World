# 教材制作エージェント実行仕様 v2 — 章別JSON

**新規記事の追加に取りかかる前に必ず [新規コンテンツ追加手順書](NEW-CONTENT-WORKFLOW.md) を読む。** この文書はJSON、編集ルール、品質ゲートの詳細仕様。字幕取得経路の順序・ASR禁止・原本確認と公開停止条件は新規手順書を正本とする。

## 目的と責務
The Annotated World は、知的に面白い原典を英語と日本語の対訳・注釈で読み、動画・人物・テーマ・語彙から別の原典へ回遊する独立したアーカイブ。English Notes や試験対策アプリの教材量産ではない。原典の面白さを第一に、学習上の価値と発見性を後から接続する。制作エージェントは原典・教材・メタデータを担当し、ルーター・CSS・JS・保存機能・公開設定は担当外。

## YouTube原典の入手契約 — 既存字幕のみ（2026-11-21 更新）

1. **新規の音声文字起こしを行わない。** 動画の元音声からASR（Whisper等）を起こす案は、今回の教材追加ルートでは採用しない。発言を推測して独自の英文原稿を補うことも禁止する。
2. **第三者が書いた転写・字幕転載ページ・AI生成原稿を原典本文として使わない。** 既存のYouTube投稿者字幕・YouTube自動字幕を探す。候補の取得手順は[新規コンテンツ追加手順書](NEW-CONTENT-WORKFLOW.md)に従う。
3. `nomuonji/kirinuki-generator` の `transcribe_rapidapi.py` は既存の字幕収集経路。まず `youtube-transcript-api`、続いてRapidAPI字幕ダウンロード2経路。外部APIで字幕データが返ったことと、YouTube本体の元字幕トラックとの完全一致は別。**RapidAPIのレスポンスだけで原本確認済み扱いにしない。**
4. 元のYouTube字幕トラックとの照合が通り、動画ID・字幕言語・字幕種別・時刻・本文・取得日時・SHA-256が記録できることを必須とする。元字幕トラックの直接保存には `scripts/youtube-original-captions.user.js` を利用可能（ジジェク対象動画ではまだ未実証）。**元データを確認できなければ教材本文の公開データに追加しない。**
5. 新しいYouTube記事の `document.json.youtubeCapture` は、本当に取得した元字幕ファイルを根拠に記録。現行のJSONスキーマは `provider`, `videoId`, `method`（`youtube-captions` / `youtube-auto-captions`）, `language`, `tool`, `capturedAt`（UTC）, `sha256`, `transport='youtube-direct'`。**中継APIの未確認候補を直接取得と偽装しない。**
6. SaveTubeのMP4ダウンロードは**字幕の取得・証跡とは別**。取得した原文が有効でも全文転載の許諾や著作権の審査は別。権利未確認なら公開用JSONに長い原文を投入しない。
7. 削除済みの「How to become free」（`4YSXNotY8QU`）は、既存の字幕取得経路で候補**1,533件・5713.28秒まで**を取得したが、原本トラックとの照合は未完了。成功したと誇張せず、[検証記録](research/2026-11-21-youtube-existing-captions.md)を参照して再公開停止を維持する。

**最優先の出力は「何件の記事を追加したか」ではなく、採用する原典が確認済みで公開できること。** 字幕なし、Bot判定、権限不足、出典未確認、権利不明で公開できない場合は、原因と検証した経路を記録し、第三者の原稿で穴埋めせず停止する。

## 0. 着手前（必ず実行）
- `AGENTS.md` と本書、`src/lib/document-source.mjs` と `src/content.config.ts` を読む。Node 22.12+、`npm install`。
- `npm run content:inspect` で全資料・既存テーマID・人物ID・概念IDを取得する。公開済みサイトの機械用索引は `/catalog.json`。生成物を直接編集しない。
- 初回教材 `src/content/documents/slavoj-zizek-signs-from-the-future/` の記事情報・章JSONを参考にする。本文の引用・許諾状況は別の原典へ踏襲しない。
- 既存YouTube ID、原典URL、同じ作品の別表記・別言語を点検する。同一原典は原則として既存資料の改善を優先。
- 原典を実際に確認し、掲載可能な権利・ライセンスの範囲を確認する。原典URL・話者・公開日・実収録時間・原文の入手根拠・収録範囲を記録する。視聴・取得可能であることだけでは再掲載の許諾ではない。未確認の場合は公開リポジトリに全文を入れない（初回提供資料のみ既存例外）。エージェントは許諾の有無を捏造しない。

## 1. 題材選定

### ジジェク起点の連続読書ルート（2026-11-20 本人指示）
- 当面の新規資料は第一弾「Slavoj Žižek: Signs from the Future」の**実際の発言・章**から題材を導出する。無関係な独立題材の横並びを優先しない。
- 延長の仕方は **同じ話者の別の原典を確かめる → その人が参照する思想家・文学・映画・社会現象の一次資料へ進む → 解釈の一致と相違を示す**。単なる人物名・テーマタグの共起では採用しない。
- 次の教材へ移る前に、前の教材の**どの章のどの論点**から進んだか、原典側にその関係がどう現れるか、出典付きの編集メモにする。元資料にない影響関係や賛同を作らない。
- 発言/講演の**実スクリプト**、動画との時刻照合、話者、録画年/アップロード年、著作物の再掲載権限を別々に確認する。YouTubeから直接取得した自動字幕であっても、音声との逐語確認が未了なら「未照合」。第三者サイト由来の字幕は採用しない。
- 公開不能な原典は調査メモと原動画へのリンクで保留し、著作権未確認の全文・大量抜粋を公開資料へ投入しない。独自解説・出典リンクを先行させるときは原発言を編集者文章に置き換えたと誤認させない。
- この系統の調査履歴は [ジジェクから広がる読書ルート](research/2026-11-20-zizek-first-reading-path.md) で管理する。過去に検討したMolly Whiteの題材は、原典上の接続が確認できない限り次の中心教材として扱わない。**『How to become free』の記事はユーザーの指示で取り下げ済み。自動再作成・再公開の対象にしない。**

長い英語を読む動機になる、実在の視点・問題・作品・議論を選ぶ。既存資料と1つ以上の妥当な接続があると望ましいが、無関係なタグを水増ししない。
| ID | 分野 |
|---|---|
| philosophy | 哲学・思想・精神分析 |
| literature | 文学・作家・言葉 |
| film-culture | 映画・芸術・文化批評 |
| society | 社会・政治・経済 |
| technology | AI・科学・未来社会 |
| internet | 海外ネット文化・ミーム |

## 2. ファイル契約 — 章ごとの構造化JSON（2026-11-21確定）

公開記事の正本は単一の巨大HTMLではなく、**記事情報1ファイル＋章ごとに1ファイル**。HTMLはサイトの読み込み時に自動生成する。

```text
src/content/documents/
  <slug>/
    document.json           記事の基本情報、出典、章の順序
    chapters/
      ch1.json              章の内容・発話・英文・和訳・注釈
      ch2.json
      ...
src/data/concepts.json      サイト共通の概念・人物・作品索引
```

- 新規記事は [新規コンテンツ追加手順書](NEW-CONTENT-WORKFLOW.md) で既存字幕と権利の確認を完了した後、`docs/templates/document.json` と `docs/templates/chapter.json` をコピーして作る。全ての REPLACE プレースホルダーを実際に確認した情報へ置換する。**旧HTML原稿や旧meta/annotationsサイドカーを作成しない。**
- `document.json` の `chapterOrder` は、公開表示する章IDを記載順に並べる配列。同名の章JSONが一つずつ存在することを自動検証。章を挿入するには章JSON追加＋chapterOrder編集だけでよい。
- **編集ステータス（draft/review/published/retired等）は作らない。** 公開物はGitHubリポジトリ内の現在の記事ディレクトリから生成する。確認途中の原典は公開データとは別の調査メモで管理し、権利不明の新しい全文を先に公開しない。
- 既存記事・章の slug / id は既存URLに使われているため固定。発話の `id` は表示順とは独立した**固定ID**。最初に一度だけ採番し、後の文章修正や挿入・並び替えで変更しない。原典にまだ無い新規発話には未使用のIDを付与し、既存行を詰め直さない。現在の発話IDは `ch1-line-1` のような形式。
- 概念索引は `src/data/concepts.json` で維持。別の教材でもID・名前を再利用し、根拠のないテーマ分類や登場していない人物を登録しない。サイトの `/catalog.json` はビルド成果物で、直接編集しない。

### document.json — 記事単位

必須: `title`、`heroMeta`（確認した日付と原典の状況）、`description`、`facts`（話者・収録時間・元動画リンク）、`toc`（title / description）、`sources`（出典リスト）、`chapterOrder`、`genre`、`format`、`people`、`topics`、`provenance`。

- 原典URL・話者・作品・年次・収録範囲は事実を確認する。原典は `provenance.sourceUrl` と `sources.items[].url` へ記録し、元動画リンクは `facts` にも含める。YouTube IDの不一致はエラー。
- `provenance`: coverage (full/excerpt/unverified)、transcript (verified/unverified/not-applicable)、translation (verified/unverified)、rights (original/licensed/public-domain/unverified)、basis（根拠）、sourceUrl（HTTPS）。この値は**出典確認状況の説明**であり、編集ステータスではない。根拠なしでverifiedとしない。
- genreは philosophy / literature / film-culture / society / technology / internet から選ぶ。difficulty (B1/B2/C1/C2)、englishFeatures、series は分かる場合のみ設定する。実在しない関連タグやシリーズは作らない。
- 英語原文と日本語訳は記事基本情報に混ぜない。本文は必ず各章JSONへ。

### chapters/chN.json — 章・発話単位

章の必須項目は `id`、`title`、`timeRange`、`summary`、`genres`、`topics`、`utterances`。
各発話は次の独立項目で管理する。

```json
{
  "id": "ch1-line-1",
  "speaker": {"name": "Žižek", "className": "speaker-zizek"},
  "time": "00:00:21",
  "english": "I want to <strong class=\"key\">challenge the assumption</strong> behind this argument.",
  "japanese": "私はこの議論の背後にある前提に異議を唱えたい。",
  "annotations": [
    {
      "id": "ch1-line-1-note-1",
      "phrase": "challenge the assumption",
      "explanation": "前提そのものを疑い、異議を唱える表現。"
    }
  ]
}
```

- `english`・`japanese` には必要な最小限の安全なインラインHTML（strong/em/br等）を使える。ページ全体のHTML・CSS・JavaScript・iframe・インラインイベント・任意の属性は入れない。元の英語、強調、訳、発話順を維持する。
- `speaker.name` は実際の発言者を、`time` は原動画で確認した時刻を記録する。YouTube教材では HH:MM:SS が必須で、発話時刻は単調非減少。話者変更や収録範囲を捏造しない。新規の非動画資料でも根拠のない時刻を創作しない（必要に応じてスキーマを拡張する）。
- `annotations` は専用の配列で1件ずつ管理し、`phrase` は英文に**完全一致する実際の語句**、`explanation` は文法・用語・背景を具体的に説明する日本語。文中の該当表現の直後に `〔説明〕` として表示。注釈番号・ポップアップ・別建ての「ポイント」「構文」「聞き取りのヒント」を作らない。
- `annotations[].id` も固定。注釈の位置が変わってもIDを書き換えない。初回移行資料だけは過去の原典注釈に文章全体のパターン説明や無見出し注釈が混在したため、既存ラベルを維持する互換例外。**新規記事には適用しない。**
- 注釈・英文・日本語訳をまとめた無構造なHTMLに戻さない。表示側で互換の `.note` を組み立て、原文近くに挿入した注釈以外の追加欄は隠す。
- 章だけを読む `?chapter=chN` と全文中のアンカー `#chN`、語彙索引からの `#chN-line-X` は維持する。

### 入力チェック・移行上の注意

- `src/lib/document-source.mjs` が読み込み・基本バリデーション・HTML生成を共通担当し、`src/content.config.ts` がAstro用メタデータを生成する。新しい正本を追加するとサイト全体の資料・章・人物・テーマ・語彙索引が自動更新される。
- 以前の `<slug>.html`、`<slug>.meta.json`、`<slug>.annotations.json` は**公開コンテンツから廃止**。並存・二重編集をしない。最初の記事の元HTMLはGit履歴に残り、移行時に61発話・146注釈と11章の内容を照合している。移行後の品質ゲートは専用の内容指紋でも確認する。
- 通常の全文表示には章末ボタンを置かない。章単位モードでのみ次・前・関連章に進む。注釈ON/OFFは読書ツールバーで、ダークモードはサイト全体の共通ヘッダーで管理し、どちらもユーザー設定を保持する。

## 3. 自動で生える機能（エージェントは手動作成不要）
資料URL、ジャンル・人物・テーマページ、章検索・時間帯・形式・難易度フィルタ、YouTube埋め込み・時刻連動、語彙用例ページ、知識索引、関連章/資料リンク、カタログ、スマホ対応・読書モード。手動生成したページを大量追加しない。ユーザーの読書履歴・保存・アカウント・外部APIは追加しない。

## 4. 品質ゲート
制作時に原典と照合し、範囲・時刻・翻訳・表現の説明・分類・権利・根拠をレビューする。途中で原典にアクセスできなくなった場合は未取得部分を推測で埋めない。追加対象だけでなく既存資料への影響を確認する。
```sh
npm run content:inspect -- <slug>
npm run content:check
npm run check
npm run build
npm run verify:archive
```
UIを変更した場合はさらに `npx playwright install chromium` と `npm run verify:reader`。CIはこれも実行する。新コンテンツのみの作業で不要なテストを追加しない。エラーを解消せず公開しない。警告を確認し、意味上のレビュー不足は別途報告。既存の原本・サイト動作を変えずにPRまたは指示されたブランチへ差分を提出する。無断デプロイ・スケジュール追加は禁止。

## 5. 報告形式
原典URL・資料slug・収録範囲・章数・発話数・タグ/概念の再利用と追加・確認状況（権利の根拠を含む）・実行した検証・残課題・コミット/PR。実際に確認していない動画再生や公開結果は成功と報告しない。
