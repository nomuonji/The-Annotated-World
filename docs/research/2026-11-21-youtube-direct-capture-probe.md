# YouTube直接取得の実験記録（2026-11-21）

## 結論

YouTube原動画 `https://www.youtube.com/watch?v=4YSXNotY8QU` を、第三者サイトの文字起こしに一切依存せず取得できるか実地検証。**この実行環境（GitHub Actions hosted runner）では取得失敗。YouTube配信の字幕ファイル、音声、本人の原文は一切入手できていない。記事を公開してはいけない。**

この実験は新しい教材の完成でもなく、スクリプト取得済みの証拠でもない。

## 実際に実行したこと

- 原動画ID：`4YSXNotY8QU`（YouTube本体）。
- プローブコード：`scripts/probe-youtube-direct.py`
- CI：`.github/workflows/probe-youtube-direct.yml`。実行: https://github.com/nomuonji/The-Annotated-World/actions/runs/44795412454
- 実行場所：GitHub Actions Ubuntu 26.04 hosted runner、southcentralus / Azure、認証情報なし。
- 方法A：`youtube-transcript-api` からYouTubeの字幕トラックに直接アクセス → **失敗**。取得ライブラリのIP制限に関する例外メッセージ。
- 方法B：`yt-dlp` から、投稿者字幕・YouTube自動字幕を直接保存 → **失敗**。`Sign in to confirm you're not a bot`。
- 方法C：`yt-dlp` による元動画の20秒間の音声サンプル取得 → **失敗**。同じBot確認エラー。
- 結果：`DIRECT_YOUTUBE_ACQUISITION=FAILED`。**CAPTURE_EVIDENCEなし、保存字幕0件、音声0件**。
- CIのProbe jobは検証失敗を明示するwarningを記録するため、ジョブ全体は診断用に成功終了としている。**緑のチェックを字幕取得成功と解釈しない。** 対象ファイル・音声取得の成功可否は専用ログの `DIRECT_CAPTIONS` / `DIRECT_AUDIO_SAMPLE` が正本。

## 次に検証できる経路（未実証）

1. **ブロックされていない、本人が許可したPC環境で直接YouTube字幕を取得する**。GitHub ActionsのAzure IPと本人のブラウザの接続元は異なる。Python環境のあるWindows/ローカル環境で、下記コマンドを実行する。Cookie・認証情報を第三者サービスやCIに送らない。ログイン前提でもない。
2. YouTube本体に字幕が存在しない場合のみ、許可される方法で元動画の音声を直接取得し、ローカルASRで英語字幕を作る。20秒サンプルの取得成功は、95分の全文ASRが成功した証明にはならない。
3. SaveTubeがブラウザ上で元動画の音声ファイルを直接保存できる場合、取得元が実際にYouTube動画 `4YSXNotY8QU` であることを確認して自前のASRへ渡す。**SaveTubeの当該動画の実取得成功は未確認。** SaveTubeが作る「文字起こし」や外部の文章は原典として採用しない。
4. YouTube Data API v3の `captions.download` は通常、動画の所有者・管理権限が必要であり、他人の公開講演からの無権限字幕取得経路としては期待できない。

## ローカルでの直接実行（資料化する場合の取得先を指定）

```powershell
py -m pip install --upgrade "yt-dlp[default]" youtube-transcript-api
py scripts/probe-youtube-direct.py 4YSXNotY8QU --output-dir .\private-youtube-source
```

`--output-dir` を指定した場合、**YouTubeから字幕取得が成功したときだけ**ローカルにファイルを残し、ログに `CAPTURE_EVIDENCE`（動画ID、方式、言語、UTC時刻、SHA256）を出す。ディレクトリは公開リポジトリにコミットしない。字幕取得に失敗した場合に外部文字起こしサイトへフォールバックしない。20秒音声サンプル取得の成功は `youtubeCapture` の証跡ではない。

実際に取得できた字幕・音声の権利と正確性が確認できるまで記事の新規公開は行わない。失敗を成功へ読み替えない。
