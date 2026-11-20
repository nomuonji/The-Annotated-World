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

## ブラウザ上の本人セッションで原本を直接保存（未実測の代替経路）

`scripts/youtube-original-captions.user.js` は **YouTube本体のWebプレイヤー**で `ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks` を読み、`youtube.com` 配信元の `baseUrl` から字幕 `json3` または `vtt` を要求する。外部サーバーに文章を渡したり、音声を文字起こししたりしない。

- Violentmonkeyなどのユーザースクリプトマネージャーへ同ファイルを登録。
- ブラウザの動画ページ `https://www.youtube.com/watch?v=4YSXNotY8QU` を開く。
- 右下の「YouTubeの英語字幕を保存」を押す。成功時はローカルPCへ `4YSXNotY8QU_en_youtube-auto.json3` または `4YSXNotY8QU_en_uploader.json3` 等を保存。
- YouTube上に英語トラックが無い／`timedtext` が空になる／ブラウザ側でも制限されると失敗のまま明示される。**このスクリプトが対象動画で成功したとは現時点では確認していない。**
- 成功時は動画ID、言語、投稿者字幕か自動字幕か、取得原本のSHA-256をコンソールに記録する。長文字幕を公開リポジトリへそのままコミットしない。

## 判定

字幕取得の実データと原動画IDが一致し、原文・時刻・言語が存在すること、転載権限や引用範囲を別途確認するまでは**教材公開を行わない**。YouTube自動字幕であっても誤認識は含まれるため、少なくとも掲載引用部は音声と確認する。第三者文字起こしの利用禁止は解除しない。
