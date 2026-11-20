# The Annotated World

知的に面白い原典を、英日対訳と文中注釈で読むアーカイブ。資料・章・人物・テーマ・語彙から関連する原典を探せます。

**エージェント向けの正本は [AGENTS.md](AGENTS.md) と [docs/CONTENT-AGENT.md](docs/CONTENT-AGENT.md)。** このREADMEは開発・運用の概要です。教材データの形式と検証要件は `docs/CONTENT-AGENT.md` を優先してください。

## コンテンツの管理（章ごとのJSON）

公開教材は **記事情報1ファイル＋章ごとのJSON** で管理します。巨大なHTML原稿や旧形式の `<slug>.meta.json`・`<slug>.annotations.json` は使用しません。

```text
src/content/documents/
  slavoj-zizek-signs-from-the-future/
    document.json
    chapters/
      ch1.json
      ch2.json
      ...
      ch11.json
src/data/concepts.json
```

- `document.json`: タイトル・紹介・話者・原典・出典確認情報・分野・人物・テーマ・`chapterOrder`（章の表示順）。
- `chapters/<id>.json`: 章タイトル・時間範囲・要約・分野・テーマ・発話の配列。各発話には固定ID、話者、再生時刻、英文、和訳、個別の注釈 `{id, phrase, explanation}` を持たせます。
- 章を追加・入れ替えるときは章JSONと `document.json` の `chapterOrder` を編集します。**公開済みのslug、章ID、発話ID、注釈IDを順序変更で採番し直さないでください。** 既存の `#chN`、`#chN-line-X` を維持します。
- **編集ステータスは持ちません。** 公開に使うデータは現在のリポジトリの教材ディレクトリから生成します。確認途中の原典は調査メモに保存し、許諾・実原文が不明な全文を新規公開しないでください。
- [記事テンプレート](docs/templates/document.json) と [章テンプレート](docs/templates/chapter.json) を使い、プレースホルダーはすべて実在情報に置き換えてください。初回教材の古いHTMLはGit履歴から参照できますが、現行の編集対象ではありません。

`src/lib/document-source.mjs` がJSONを検証して表示用HTMLを生成し、`src/content.config.ts` がAstroコレクションへ接続します。資料一覧・章索引・ジャンル・人物・テーマ・語彙ページ・[機械用カタログ](/catalog.json)は公開データから自動生成します。URLルーターや生成済みの `dist/` を直接編集する必要はありません。

## 原典の直接取得と公開条件

YouTube動画を新規教材化するときは **YouTubeの字幕トラックを直接取得するか、YouTubeから取得した音声を自前の音声認識で書き起こす**。第三者の文字起こしサイト、他者のAIスクリプト、検索結果に載る断片などを教材本文や章構成の根拠にしてはいけません。取得できなければ新規公開を止め、原文を推測で補わないでください。

新規YouTube教材の `document.json` には、動画ID・取得方法・UTC取得日時・言語・使用ツール・実際のソースファイルのSHA-256を含む `youtubeCapture` を必須とし、ビルドで不備を拒否します。ユーザーが直接提供した第一弾の記事のみ既存互換の例外です。ダウンロードの技術的成功と、原文の照合・全文転載の許可は別の条件です。

2026-11-21に再制作した「How to become free」の12章版は、禁止された第三者スクリプトを使っていたため**削除**しました。YouTubeから直接の取得を成功させるまでは再公開しません。

## 文中注釈と読書モード

日本語注釈は、対応する英文の表現の直後に `〔説明〕` として表示します。新規資料では `phrase` に実際の英文に含まれる**完全一致の語句**を使ってください。文末の別建てポイント欄、注釈番号、ポップアップ、一般的な音の変化に関する独立パネルは作りません。

読者は記事ツールバーで注釈をON/OFFでき、サイト全体のライト／ダークモードは共通ヘッダーから切り替えられます。どちらも表示設定をページ間で保持します。通常の全文読書には章末ナビゲーションを表示せず、`?chapter=chN` の章単位モードだけで前後・関連する別記事の章へ移動できます。

YouTube資料では動画と発話開始時刻を発話単位で連動します。デスクトップは本文と動画を併置し、モバイルの動画固定は任意です。元動画への外部リンクと時刻リンクも残します。音声未照合の時刻や発音を、検証済みと表示しません。

## 開発・検証

Node.js 22.12以上を使用します。

```sh
npm install
npm run content:inspect                 # 全資料・共通ID・警告を確認
npm run content:inspect -- <slug>       # 指定資料の発話単位まで調査
npm run content:check                   # 構造・固定ID・出典・時刻の検証
npm run check                           # Astro/TypeScript
npm run build                           # 静的ページ生成
npm run verify:archive                  # 内容・アンカー・リンクの検証
npm run verify:reader                   # Playwright（Chromiumの導入が必要）
```

ローカル表示は `npm run dev`。Cloudflare Pagesなどの静的配信先に `dist/` を公開する設計で、公開サイトにサーバー・データベース・秘密鍵を要求しません。ブラウザ操作の検証はGitHub Actionsでも実行しますが、CI成功は本番デプロイ成功を保証しません。

初回公開資料は元の提供原稿に基づき、原典の照合・再掲載権利が未確認である旨をメタデータに明記しています。この扱いを他の原典に拡張しないでください。過去に作成した「How to become free」の記事はユーザー指示で削除済みで、再公開を自動的に進めないでください。

## 別系統の機能

`/workspace/` は個人教材をブラウザに取り込む旧機能であり、**公開コンテンツを編集するCMSではありません**。動画・ショートの制作仕様は [AGENTS.md](AGENTS.md) の派生発信コンテンツ節と `templates/annotated-short/` を参照してください。
