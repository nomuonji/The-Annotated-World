# 「How to become free」YouTube既存字幕の取得調査（2026-11-21）

## 本人の最新要求

**新規ASRによる文字起こしを行わない。YouTubeが動画に配信する字幕トラック（投稿者字幕またはYouTube自動字幕）そのものだけを教材原稿候補として取得する。** 以前に禁止された第三者の転写原稿・転載アーカイブへのフォールバックは引き続き禁止。取得できるまで記事は復活させない。

対象: `https://www.youtube.com/watch?v=4YSXNotY8QU`

## 実地検証

2026-11-21 GitHub Actions: [字幕調査実行](https://github.com/nomuonji/The-Annotated-World/actions/runs/44800920909)

1. **SaveTube /v2/info**: 対象動画のタイトル・ID・長さ（5715秒）を確認。復号したmetadataのトップレベルには `id`, `key`, `url`, `title`, `titleSlug`, `thumbnail`, `duration`, `durationLabel`, `audio_formats`, `video_formats`, `thumbnail_formats`, `default_selected`, `fromCache` のみ。ネストした4階層まで `caption`, `subtitle`, `timedtext`, `transcript`, `track` に関連するフィールドが **0件**。現在のSaveTube MP4取得APIは字幕を配布していない。
2. **YouTube本体の字幕トラック**: `www.youtube.com/watch`, `www.youtube.com/embed`, `www.youtube-nocookie.com/embed`, `m.youtube.com/watch` の4経路へNode fetchを行ったが、GitHub Actions runnerからはすべて `TypeError: fetch failed`。元の `yt-dlp` / `youtube-transcript-api` もBot/IPブロック。**YouTube字幕の有無を判定した結果ではなく、クラウド側の接続制限**。
3. `YouTube Data API captions.download` は他人の動画の字幕を誰でもダウンロードできるAPIではなく、権限不足なら403を返す。無権限の全文字幕取得の代替経路として採用しない。
4. **結果**: `YOUTUBE_ORIGINAL_CAPTION_TRACKS_FOUND=0`、`YOUTUBE_ORIGINAL_CAPTION_BYTES_ACQUIRED=0`。前者は取得環境の接続失敗による **検出ゼロ** であり、対象動画に字幕が存在しないという判定ではない。

## 切り抜きジェネレーターの既存字幕経路：当該動画での成功記録

ユーザーの「切り抜きジェネレーターでは字幕も取れていたはず」という指摘に基づき、正本リポジトリ `nomuonji/kirinuki-generator` の `run_all.py` と `transcribe_rapidapi.py` を確認。YouTube処理は **SaveTubeで動画を取得した後、独立した字幕取得段階で `youtube-transcript-api` を最初に試し、失敗するとRapidAPI 2経路へ順次フォールバックする**。このパスは元音声を自前ASRに渡さない。Bilibili側は別途BBDown `--sub-only` で既存SRT字幕を取得する。

ジジェクの正確な動画ID `4YSXNotY8QU` を、元リポジトリで追加の読み取り専用診断ワークフローから検証した。

- 診断PR: https://github.com/nomuonji/kirinuki-generator/pull/88 （mainマージ済み）
- 実行: https://github.com/nomuonji/kirinuki-generator/actions/runs/44802685690
- YouTubeへの直接アクセス（`youtube-transcript-api`）: クラウド側IPブロックにより失敗。
- `RAPIDAPI_KEY` は既存リポジトリで設定済み。第一フォールバック `youtube-captions-transcript-subtitles-video-combiner.p.rapidapi.com/download-json/4YSXNotY8QU` に対する既存API呼び出しが**成功**。
- 取得した候補字幕: **1,533件**、最終字幕終了 **5713.28秒**（動画全体5715秒）、0〜90分台の全10個の10分間隔にセグメントあり、正規化JSON **151,871バイト**。
- 正規化候補データのSHA-256: `ec6e42b0152dc3d0d1bf9b913b08359828fd6467366a5899738c7da194fb6db9`。
- 診断ジョブは字幕本文をログに出さず公開リポジトリに保存もしなかった。動画の切り抜き生成・音声文字起こし・記事作成も実施していない。

**出所の限界**：第一RapidAPIは「動画に存在する字幕のダウンロード」を提供すると説明しているが、第三者事業者による中継APIであり、レスポンスがYouTubeプレイヤーの実際の字幕トラックに完全一致するかは未確認。自動生成されたサービス独自の逐語原稿ではないことも、コードと出力件数だけでは独立に立証できない。よって教材用の原文として無条件採用しない。**本人が禁止した第三者制作の文字起こし原稿は引き続き禁止**。ブラウザ経由で取得できるYouTube正本トラックとの照合、または由来を直接示す応答を検証し、元字幕であることを確かめるまでは記事を再公開しない。

## ブラウザ上の本人セッションで原本を直接保存（未実測の代替経路）

`scripts/youtube-original-captions.user.js` は **YouTube本体のWebプレイヤー**で `ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks` を読み、`youtube.com` 配信元の `baseUrl` から字幕 `json3` または `vtt` を要求する。外部サーバーに文章を渡したり、音声を文字起こししたりしない。

- Violentmonkeyなどのユーザースクリプトマネージャーへ同ファイルを登録。
- ブラウザの動画ページ `https://www.youtube.com/watch?v=4YSXNotY8QU` を開く。
- 右下の「YouTubeの英語字幕を保存」を押す。成功時はローカルPCへ `4YSXNotY8QU_en_youtube-auto.json3` または `4YSXNotY8QU_en_uploader.json3` 等を保存。
- YouTube上に英語トラックが無い／`timedtext` が空になる／ブラウザ側でも制限されると失敗のまま明示される。**このスクリプトが対象動画で成功したとは現時点では確認していない。**
- 成功時は動画ID、言語、投稿者字幕か自動字幕か、取得原本のSHA-256をコンソールに記録する。長文字幕を公開リポジトリへそのままコミットしない。

## 判定

字幕取得の実データと原動画IDが一致し、原文・時刻・言語が存在すること、転載権限や引用範囲を別途確認するまでは**教材公開を行わない**。YouTube自動字幕であっても誤認識は含まれるため、少なくとも掲載引用部は音声と確認する。第三者文字起こしの利用禁止は解除しない。
