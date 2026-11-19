# 教材制作エージェント実行仕様 v1

## 目的と責務
The Annotated World は、知的に面白い原典を英語と日本語の対訳・注釈で読み、動画・人物・テーマ・語彙から別の原典へ回遊する独立したアーカイブ。English Notes や試験対策アプリの教材量産ではない。原典の面白さを第一に、学習上の価値と発見性を後から接続する。制作エージェントは原典・教材・メタデータを担当し、ルーター・CSS・JS・保存機能・公開設定は担当外。

## 0. 着手前（必ず実行）
- `AGENTS.md` と本書、`src/content.config.ts` を読む。Node 22.12+、`npm install`。
- `npm run content:inspect` で全資料・既存テーマID・人物ID・概念IDを取得する。公開済みサイトの機械用索引は `/catalog.json`。生成物を直接編集しない。
- 初回教材 `src/content/documents/slavoj-zizek-signs-from-the-future.html` を構造と紙面の参考にする。本文の引用・許諾状況は別の原典へ踏襲しない。
- 既存YouTube ID、原典URL、同じ作品の別表記・別言語を点検する。同一原典は原則として既存資料の改善を優先。
- 原典を実際に確認し、掲載可能な権利・ライセンスの範囲を確認する。原典URL・話者・公開日・実収録時間・原文の入手根拠・収録範囲を記録する。視聴・取得可能であることだけでは再掲載の許諾ではない。未確認の場合は公開リポジトリに全文を入れない（初回提供資料のみ既存例外）。エージェントは許諾の有無を捏造しない。

## 1. 題材選定
長い英語を読む動機になる、実在の視点・問題・作品・議論を選ぶ。既存資料と1つ以上の妥当な接続があると望ましいが、無関係なタグを水増ししない。
| ID | 分野 |
|---|---|
| philosophy | 哲学・思想・精神分析 |
| literature | 文学・作家・言葉 |
| film-culture | 映画・芸術・文化批評 |
| society | 社会・政治・経済 |
| technology | AI・科学・未来社会 |
| internet | 海外ネット文化・ミーム |

## 2. ファイル契約
```text
src/content/documents/
  <slug>.html             必須。原文・和訳・注釈・出典
  <slug>.meta.json        新規資料は必須。分類・来歴
  <slug>.annotations.json 任意。難所の構文・聞き取り・文対応
src/data/concepts.json    必要な場合だけ既存IDを再利用・新規追加
```
slug は ASCII 小文字・数字・ハイフン。変更すると既存リンクが壊れるので固定する。同じ教材内では章アンカーも固定。発話アンカーは `<章id>-line-<章内の1始まりの番号>` をサイトが生成する。公開済み教材の発話挿入・並び替えは、アンカーの意味が変わるため別途移行判断を要する。テンプレートは `docs/templates/` の3点。プレースホルダーを削除し、実在の内容に置換するまで content 配下へコピーしない。

### HTML
- 完全なHTML文書に `main.page` を1つ。共通デザインを適用するので本文に独自CSS、JS、iframe、インラインイベント、埋め込み外部コードを入れない。許可される要素・属性は loader に従う。
- `.hero` 内：`h1`（原題、必要なら " — " の後に教材説明）、`.hero-meta`（確認済み公開日・収録時間等）、`.deck`（どんな議論に出会えるか）、`.meta-strip` / `.meta-item` に dt/dd（話者、収録時間、元動画等）。
- YouTubeの場合、dt を正確に「元動画」とし、dd に公式YouTube URL の a を置く。プレイヤーはサイト側が生成する。他の原典は来歴 sourceUrl と .sources で示す。
- `.toc-list` のリンクを実在する章 id へ向ける。各 `section.sec` に固有id、`.sec-header h2`、`.sec-sub`（内容の要約）、動画なら `.sec-time`（開始時刻）を入れる。
- 各 `.utterance` に `.speaker-line`、`.en`、`.ja`、`.note` を各1個。動画には発話開始時刻 HH:MM:SS を必須とし、実際の音声に合わせる。時刻は全体で非減少。話者変更を捏造しない。非動画なら時刻を作らない。
- まとまった意味単位で発話を切る。長い段落は自然な区切りを使う。逐語と整形・補足・省略を明確に区別し、聞き取れない箇所も明示する。AIで続きを創作しない。自然な日本語訳を英文の直下に置く。否定・条件・比較・引用・皮肉・固有名詞を落とさない。
- `strong.key` は英文内に実在する重要表現だけに使う。注釈の `strong` は対応する英語表現を正確に記載し、意味・用法・必要な背景を具体的に説明。原文にない見出し語や活用形を無理に索引へ追加しない。長い引用全体を何でも強調しない。
- `footer.sources` に出典・必要な権利表記・範囲を明示。外部リンクはHTTPS、target=_blank の場合 rel=noopener noreferrer。原典と一致する記録のみ。

### メタデータ
`<slug>.meta.json` は `src/content.config.ts` のスキーマが正本。
- genre：上表から主分野を1つ。format：実際の形式。difficulty：任意の推定B1/B2/C1/C2、根拠がなければ省く。englishFeatures：実際の特徴。series：実在する番組等、未確認なら省く。
- people：話者・著者（言及人物とは区別）。{id,name,ja}。topics：資料全体のテーマ。chapterMetadata：HTMLの章idをキーに {genres,topics:[{id,name}]}。章ごとの実内容を分類し、原典が扱う具体的なテーマだけを使う。既存の同義IDがあれば再利用、既存ラベルを勝手に変更しない。
- provenance：coverage (full/excerpt/unverified)、transcript (verified/unverified/not-applicable)、translation (verified/unverified)、rights (original/licensed/public-domain/unverified)、basis (根拠・確認資料のURLや該当範囲など)、sourceUrl (HTTPS)。verified は実際にレビューした項目だけ。full は範囲確認済みのみ。権利不明の新規全文は提出しない。内容の品質は機械検証だけで保証されない。
- `src/data/concepts.json`：{id,name,ja,kind,aliases,topics}。kind は 概念/人物/書籍/映画/ドラマ。aliases は実際の原文表記。短すぎる曖昧な別名・無根拠な同定は避ける。索引は原文とのマッチのみで生成される。詳細事典や人物の肩書を捏造しない。

### 任意の補助注釈
`npm run content:inspect -- <slug>` で正確な発話アンカー・英文・和訳を確認してから `<slug>.annotations.json` を編集。キーは発話アンカー、値は注釈の配列。
- syntax：quote は英文の完全一致部分、parts は連結すると quote に完全一致する {text,role}、explanation は構造・解釈。
- sound：quote と explanation。一般的な弱形・連結のヒントと実音声で確認した発音を区別（現行UIは一般的ヒントとして表示）。未確認の発音を実測と書かない。
- alignment：quote、translation は元の和訳の完全一致部分、explanation。全発話の無理な分割は不要。

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
