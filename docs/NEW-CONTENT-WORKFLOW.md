## 絶対条件：字幕の全件対訳と省略ゼロの検証

- 字幕を原文にする教材では**抜粋・要約・代表引用・恣意的な章のスキップ禁止**。保存済み字幕の全セグメントを時系列に整形し、英文と日本語訳を1対1で保持する。講演95分なら95分を全部扱う。
- 取得原稿の segment index（0始まり）を各段落のsourceCuesに保持し、最初0・最後N-1・全N件・重複ゼロ・飛び番号ゼロをCIで検証。文字列が原字幕の全文に一致すること、全段落の訳が欠落しないことも検査し、未完成なら公開禁止。
- AIは明らかな句読点・整形を行えるが、原字幕の誤認識を推測で削除／補足しない。注釈は必要な語彙だけでよい。［音楽］等の非発話キューも位置を保存する。
- 取得元がRapidAPI字幕候補なら同一性未検証と明記する。取得と出典真正性・公開権限は別の問題であり、いずれも偽装しない。全文完成まで24箇所の抜粋版を「完成」と呼ばない。

# 新規コンテンツ追加手順 — エージェント用（YouTube既存字幕・ASRなし）

最終更新: 2026-11-21。**新規のYouTube教材を作るエージェントは、この手順と [CONTENT-AGENT.md](CONTENT-AGENT.md) に従う。** 特定の動画だけでなく、今後の教材追加全般に適用する。

## 実動済みのRapidAPI素材を先に使う（2026-11-21追記）

ユーザー指定 `4YSXNotY8QU` については、**既存RapidAPIキーを使った取得が成功し、1,533セグメントの字幕候補を非公開Driveへ保存済み**。取得実行・保存場所・実測ハッシュは [RapidAPI実取得記録](research/2026-11-21-zizek-rapidapi-private-source.md) に記載。従って、制作着手時は**Driveにある実物を読む**。本人にブラウザ字幕エクスポートを頼む必要はなく、既に取得できているのに取得失敗と報告しない。API取得と原YouTube字幕への逐語同一性・第三者ASRではないことの証明は別。出所の確認が未了なら verified と偽装しない。

## 一枚で分かる実行順序

`題材選定・重複確認 → 元YouTube動画ID確定 → 既存字幕取得 → YouTube原本との照合 → 権利の確認 → 章設計・対訳・注釈 → JSON追加 → 品質ゲート → PR/公開確認`

**重要: 字幕のない動画を新たに音声認識（Whisper等のASR）することは、この新規追加経路では行わない。** 既存の字幕を取得できなければその題材は保留にする。第三者が独自に書いた文字起こし・字幕転載ページ・AI要約・検索スニペットから原文や章構成を作ることも禁止。例外をエージェント判断で作らない。

### 関係する正本とツール

| 用途 | 正本 / 実装 |
| --- | --- |
| YouTube動画・字幕の既存パイプライン | `nomuonji/kirinuki-generator` の `run_all.py` / `transcribe_rapidapi.py` |
| 既存字幕の元データ照合（ブラウザ） | 本リポジトリ `scripts/youtube-original-captions.user.js` |
| 新規記事の公開データ | `src/content/documents/<slug>/document.json` + `chapters/<id>.json` |
| 記事・章テンプレート | `docs/templates/document.json`、`docs/templates/chapter.json` |
| 全体の編集・UIルール | `AGENTS.md`、`docs/CONTENT-AGENT.md` |
| 現行スキーマ・公開チェック | `src/lib/document-source.mjs`、`scripts/content-inspect.mjs` |

**SaveTubeは動画/音声のCDN経由取得専用。字幕取得は別処理。** SaveTube MP4が取得できても「字幕取得完了」ではない。

### RapidAPIキーの保管・権限・料金

- **キーの正本は `nomuonji/kirinuki-generator` のGitHub Actions Repository Secret `RAPIDAPI_KEY`。** このプロジェクトのGitHubリポジトリ、記事JSON、フロントエンド、エージェントの会話にキーを複製しない。
- 字幕診断は**切り抜きジェネレーター側の手動Actions**「Probe existing YouTube captions for an exact video ID (no ASR)」で `video_id` を指定。キー入力は不要。PR起動を禁止してあり、ソース取得候補の件数・時間範囲・SHAだけを診断する。診断は**字幕本文ファイルの保存はしない**。
- 既存の字幕本文が制作に必要なときは、同じリポジトリの実行環境で、認証情報を外へ出さず権限ある非公開領域へ保存する設計を別途用意する。**別リポジトリのGitHub Actionsは他リポジトリのRepository Secretを自動参照できない**。キーをGitHub Actionsから標準出力やartifact経由で転送しない。
- **契約プラン・残枠・超過課金は今回の字幕成功だけでは確認できない。** RapidAPI Developer DashboardのSubscriptions/UsageとAPI個別の料金を人が確認する。予算未確認の無制限自動実行は禁止。既存切り抜きジョブと利用枠を共用する点に注意。
- 運用・キー交換・費用確認の正本：[kirinuki-generator / RapidAPIキー管理ガイド](https://github.com/nomuonji/kirinuki-generator/blob/main/docs/rapidapi-key-management.md)。

## 1. 元動画の選定と重複確認

1. 本リポジトリのルートで `npm install`（Node >=22.12）および `npm run content:inspect` を実行。既存記事・YouTube ID・topics / people / conceptsを確認する。
2. 候補の**YouTubeの元動画URLと11文字の動画ID**、題名、投稿者、実際の話者、公開年/収録年、長さ、収録対象範囲を照合する。検索に出てきた転載動画や他人の再編集を元動画と取り違えない。
3. 特にジジェク起点の読書ルートでは、既存記事の**どの章のどの論点から新しい原典に接続するか**を編集メモに残す。人気や関連語の一致だけで無関係な教材を量産しない。
4. 既存の同一動画IDの記事があれば改稿を優先する。**以前削除された『How to become free』（ID `4YSXNotY8QU`）を未確認の古い原稿から自動復元しない。**

## 2. 字幕の候補取得（新規文字起こしはしない）

YouTube投稿者字幕またはYouTube自動字幕の**既存トラック**を取りに行く。切り抜きジェネレーターの字幕処理は、まず `youtube-transcript-api` でYouTube本体を読み、失敗時に既存の `RAPIDAPI_KEY` を使ってRapidAPIの字幕ダウンロードAPI2経路にフォールバックする。**RapidAPIは「候補字幕の取得手段」であり、YouTube原本との同一性を証明するものではない。**

```bash
# 作業ディレクトリ: nomuonji/kirinuki-generator
python -m pip install requests python-dotenv youtube-transcript-api
# RAPIDAPI_KEY が必要な場合は既存のSecret/環境変数から安全に供給。
# キーの値をCLI引数・ログ・Gitに書かない。
mkdir -p /tmp/annotated-world-source
python transcribe_rapidapi.py VIDEO_ID --lang en \
  --output /tmp/annotated-world-source/VIDEO_ID.candidate.json
```

- `VIDEO_ID` は対象の11文字IDに置換する。既存の正式な `transcribe_rapidapi.py` を流用し、別の文章アーカイブを取得する処理に置き換えない。
- **注意:** 現行コードは、`--lang en` を指定しても直接取得時の言語候補に `ja` / `ja-JP` を含む。**出力されたファイルが本当に英語か、指定言語・YouTubeの字幕言語が一致するか必ず検査する。** `transcript.json` というファイル名や成功終了だけで英語原文とみなさない。
- 空ファイル、発話件数が少なすぎる、時刻が逆行する、動画長に比べて終端が著しく早い、別動画の内容が混在する場合は不採用。短い抜粋動画なら原動画長と収録範囲から妥当な期待値を決め、固定件数のノルマでは判断しない。
- GitHub Actionsの場合は **`kirinuki-generator` 内の手動診断Workflowから実行する（キーの値は不要）**。**同リポジトリの [字幕診断PR #88](https://github.com/nomuonji/kirinuki-generator/pull/88) のワークフローは本文を保存せず、件数・時間範囲・ハッシュを報告する診断専用**。診断が通っただけで本文ファイルが永続保存されたとみなさない。実制作では許可された非公開作業領域へ取得ファイルを保管する。
- `/tmp` や `private-youtube-source/` の原本は公開コンテンツではない。権利不明の長文、APIキー、認証CookieをGit・Actionsログ・公開artifactへ出さない。

### ブラウザ直結エクスポートの実行・ローカル検査（実物がある場合）

公式YouTubeページ `https://www.youtube.com/watch?v=4YSXNotY8QU` を、一般利用者の接続回線で開き、`scripts/youtube-original-captions.user.js`（v0.2.0）をViolentmonkeyに登録して「YouTubeの英語字幕を保存」を押す。成功時には元字幕ファイル `4YSXNotY8QU_en_youtube-auto.json3`（または `_uploader.json3` / `.vtt`）と、証跡 `4YSXNotY8QU.evidence.json` の**2つ**がローカルへ保存される。複数ファイルのダウンロード許可をChromeが確認する場合がある。ファイル名・方式は実際の取得トラックに従い、例と違ってもよい。

上記の**現物2ファイルを持っている場合だけ**、次の読み取り専用チェックを行う。本文は標準出力へ表示しない。

```bash
node scripts/verify-youtube-caption-capture.mjs \
  /path/to/4YSXNotY8QU_en_youtube-auto.json3 \
  /path/to/4YSXNotY8QU.evidence.json
```

- 取得元動画ID、言語、字幕の種別、取得UTC日時、字幕ファイルのサイズ・SHA-256、時刻の単調増加、末尾の収録範囲、イベント件数を検証する。目的の動画では字幕終端が90分未満の不完全ファイルを拒否する。
- ここで検査するのは**ブラウザから保存された字幕データと証跡の内部整合性**。YouTube音声との逐語照合、実際の発言者、字幕の精度、全文掲載の許諾は別のゲートであり、このコマンドの成功を公開許可とみなさない。
- `*.json3`、`*.vtt`、`*.evidence.json` は**非公開制作素材**。Git、PR、CIログ、公開artifactや公開サイトへ転載しない。著作権未確認の全文を読み取り用Issueやチャットに貼り付けない。
- 原字幕の現物を取得できないときは、この手順を仮データで通さず**制作を停止する**。前回削除した原稿・第三者転写アーカイブを戻さない。

## 3. 出所の照合 — ここが公開可否の分岐

**RapidAPIが151,871バイト返しただけでは、YouTube公式の既存字幕と同一だとは判定できない。** 外部の転写原稿を採用しないというユーザー指示は、この経路でも維持する。

1. 動画のYouTubeプレイヤーから直接、`captionTracks` が存在するか確認する。原本の投稿者字幕なら `youtube-captions`、YouTube自動字幕なら `youtube-auto-captions` を区別する。YouTubeブラウザで使う `scripts/youtube-original-captions.user.js` は `json3` または `vtt` のダウンロードを試すが、**対象動画での成功実績はまだない**。
2. **動画ID・実際の字幕言語・字幕種別・タイムスタンプ・テキスト**が一致するか照合する。形式による改行/セグメント差異は正規化して比較し、少なくとも冒頭・中盤・終盤の引用箇所を確認する。既存APIによる字幕をYouTubeの元トラックそのものと断言せず、できる限り全セグメントの対応を確認する。取得元HTTPホスト・取得日時・根拠を非公開の監査メモに記録する。
3. 真正なYouTube字幕トラックの**実ファイル**を取得できた場合のみ、SHA-256を計算する（例: `sha256sum videoId.en.json3`、Windowsなら `Get-FileHash -Algorithm SHA256`）。メディアMP4・RapidAPI候補JSON・原本字幕ファイルのSHAを取り違えない。
4. **原本の字幕トラックを取得・照合できない場合は停止。** 字幕があるかどうかの判定に失敗した場合も「字幕なし」と断定しない。ASRによる穴埋め、別サイトの文字起こしを用いた再構成、虚偽の `youtubeCapture` 証跡は禁止。
5. 字幕の取得・照合に成功しても、そのまま**全文を公開できるわけではない**。原典のライセンス、著作権者の許諾、引用の範囲を別に審査する。必要な権利・利用根拠を確認できないなら公開ディレクトリに本文を置かない。

取得証跡は現在の実装に合わせ、正式な原本トラックを直接得た場合にのみ `document.json` に記録する。テンプレートの `REPLACE` を実測値で置換する。

```json
{
  "youtubeCapture": {
    "provider": "youtube",
    "videoId": "ACTUAL11ID",
    "method": "youtube-auto-captions",
    "language": "en",
    "tool": "youtube-original-captions.user.js",
    "capturedAt": "REAL_UTC_ISO8601",
    "sha256": "REAL_64_CHARACTER_SHA256_OF_YOUTUBE_CAPTION_FILE",
    "transport": "youtube-direct"
  }
}
```

- 上例は**スキーマ例であり、成功の証拠ではない**。必ず実在する取得結果を記入する。
- 現行のビルド検証が認める `transport` は `youtube-direct` または `savetube-media-proxy`。後者は**動画＋自前ASR**用の互換ルートであり、この「文字起こしをしない」制作方針では使用しない。RapidAPI経由の候補だけで `transport: youtube-direct` と偽装しない。
- 現行バリデータが確認するのはフィールドの形式と動画IDの対応まで。**実ファイルの真正性、音声との一致、権利は人間または制作エージェントの別審査**であって、`content:check` 成功で証明されたとみなさない。

## 4. 原文から章・発話・対訳・注釈を作る

1. 字幕**実物の本文と正しい時刻**から論点の転換に沿って章を切り、`ch1`, `ch2` … の章JSONを作成。字幕にない英語・架空の会話・転写ミラーからの補完・原文を名乗る独自の英文説明は禁止。
2. 本人の発言と司会者などの話者を区別する。字幕だけで話者が不明なら「判別できた」と主張せず、必要なら動画の該当箇所を確認。収録年と公開年を混同しない。
3. 字幕の自動認識誤り、固有名詞、文のつなぎ、句読点を確認。**原文の改変・意味の削除・説明の創作をしない。** 発話に対応する時刻は `HH:MM:SS`。掲載する引用部分を音声と照合できない場合、その部分は公開候補から除外する。
4. `english` に真正な原文、`japanese` に自然で正確な対訳。注釈は `annotations: [{id, phrase, explanation}]` で発話に紐づけ、**phraseは英文の実際の文字列と一致**。原文、対訳、注釈を一つの巨大HTMLにまとめない。
5. 文法・哲学概念・人名・史実の説明は、本文と区別して短い日本語の文中注釈にする。説明の長さのために元の主張の留保や皮肉を削らない。確認できない背景情報を創作しない。
6. 人物・テーマ・概念は既存IDを優先再利用。新規の概念登録は原典で言及があり、記事の回遊に意味がある場合のみ。発話ID（例 `ch1-line-3`）と注釈IDは一度付けたら修正・挿入の際も変更しない。

## 5. ファイルの追加

```text
src/content/documents/<new-slug>/
  document.json                 # title, facts, toc, sources, provenance, youtubeCapture,
                                # people, topics, genre, format, chapterOrder
  chapters/
    ch1.json                    # id, title, timeRange, summary, genres, topics,
    ch2.json                    # utterances[{id,speaker,time,english,japanese,annotations}]
    ...
```

- `docs/templates/document.json` と `docs/templates/chapter.json` をコピーし、必要な章数だけ作成する。 `document.json.chapterOrder` と章ファイル名/IDを厳密に一致させる。
- `provenance.sourceUrl` に検証した元YouTube URLを記録し、`sources.items` および `facts` からも原動画へ辿れるようにする。 `provenance` の `coverage` / `transcript` / `translation` / `rights` / `basis` は実測根拠に基づき、未確認を `verified` や `licensed` にしない。
- **編集ステータス列（`draft`/`review`/`published` 等）は追加しない。** Git内の記事ディレクトリの存在が公開対象を決める。進行中の原稿・権利未確認の全文を先にこのディレクトリへ追加しない。
- 古い `.html`, `.meta.json`, `.annotations.json` は追加しない。Astroの表示、人物・テーマページ、語彙索引、`/catalog.json` はJSONから自動生成される。新しいページや索引を手で量産しない。

## 6. 必須チェック・PR・公開

```bash
# 作業ディレクトリ: nomuonji/The-Annotated-World
npm run content:inspect
npm run content:inspect -- <new-slug>    # 新しいJSONを作った後
npm run content:check
npm run check
npm run build
npm run verify:archive
# UIや読書導線を変えた場合だけ:
npx playwright install chromium
npm run verify:reader
```

- 原文の出所・照合と権利の審査を完了してからPRを出す。**CIが通っただけで原文真正性や転載許諾が得られたわけではない。**
- PRに `videoId` / 元URL / 使用字幕トラック言語・種別 / 取得方法（YouTube直結か中継サービスか） / 実ファイルSHA-256 / 収録範囲 / 章数・発話数・注釈数 / 権利根拠 / 検査結果 / 未解決事項 を明記する。秘密の字幕ファイルや認証情報をPR本文に貼り付けない。
- mainマージと実サイトの本番公開・表示チェックは別。対象 `/read/<new-slug>/`、章モード `?chapter=ch1`、注釈ON/OFF、サイト共通のダークモード、原動画へのリンクと時刻を確認。既存教材・索引の回遊も破壊しない。
- 字幕原本の取得に失敗した場合は**取得状況と原因を記録して停止**。ゼロ件の完成記事、別人の原稿へのすり替え、仮の英語を「本人の発言」として掲載することは禁止。

## 実際の確認済みケースと限界

- `4YSXNotY8QU` は、`kirinuki-generator` の既存 `youtube-transcript-api` がクラウドのIPブロックで失敗した一方、第一RapidAPI字幕APIから **1,533件・最後の字幕時刻5713.28秒** の候補字幕を受信した。**音声を新たに文字起こししたわけではない**。[実測ログと制約](research/2026-11-21-youtube-existing-captions.md)、[切り抜き側PR #88](https://github.com/nomuonji/kirinuki-generator/pull/88)。
- ただし**RapidAPIが返した内容をYouTube本体の元字幕トラックと逐語一致させる検証は未完了**。先行する診断ランナーでは字幕本文を保存していなかったが、その後 [RapidAPI2の実取得と非公開Drive保存](research/2026-11-21-zizek-rapidapi-private-source.md) が成功した。旧原稿の再公開・未確認の字幕を本人の逐語録として掲載することは禁止。この数値を他の動画の実績に転用しない。
- SaveTubeは対象動画の720pメディア取得に成功したが、**字幕の配信元ではない**。[検証ログ](research/2026-11-21-savetube-media-probe.md)。
