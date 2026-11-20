# Žižek「How to become free」RapidAPI字幕候補の実取得・非公開保存（2026-11-21）

## 今回の実測（それ以前の単なる候補取得実績とは別）

ユーザー指定の動画 `https://www.youtube.com/watch?v=4YSXNotY8QU` について、`nomuonji/kirinuki-generator` に残る既存の **RapidAPI字幕取得API** と既存 `RAPIDAPI_KEY` Secretを利用して再取得し、実際の字幕ファイルを**非公開Google Drive**へ保存した。

- 実装: `nomuonji/kirinuki-generator/scripts/annotated_world_caption_export.py`
- 実行: https://github.com/nomuonji/kirinuki-generator/actions/runs/44813130347 （成功）
- 使用した経路: **`rapidapi2`**（今回のAPI1試行はデータ不採用、その後の既存API2フォールバックが成功）。第一APIで成功した過去の実験と混同しない。
- 元動画ID: `4YSXNotY8QU`
- 取得件数: **1,533セグメント**
- 最終字幕時刻: **5713.28秒**（動画長約5715秒）
- 取得UTC時刻: `2026-11-20T20:38:48.736796Z`
- 保存されたソースJSONのSHA-256: `2b58fa1f3745340166f26b8e67480ac6ad695121ec706b787127f7097fa58487`
- 候補JSONのサイズ: 138127 bytes（取得時のJSONエンコーディング）
- 格納先: 既存のDrive認証先の非公開フォルダ **`the-annotated-world-private-sources`** 内の `4YSXNotY8QU.rapidapi-candidate.json` と `4YSXNotY8QU.candidate-evidence.json`
- Drive側で2件とも `shared=false` を確認。公開GitHub・Actionsログ・artifactへ原文データやAPIキーは保存していない。

**エージェントが以後の作業で原文を必要とするとき、ブラウザの手動字幕書き出しをユーザーに依頼したり、RapidAPIを再実行して課金枠を消費したりする前に、この非公開Driveファイルを読み取る。** Google Driveの同じ認証先へアクセスできなければ、その障害だけ報告する。キーを別リポジトリへ複製しない。

## 原文の確認区分と残課題

これは対象動画IDを指定してRapidAPIの字幕候補を取得した**実物**であり、第三者サイトの記事やAIによる創作英文へのすり替えではない。一方、RapidAPIが返した字幕が**YouTube本体の公開字幕トラックと逐語一致すること**までは証明していない。API2のプロバイダーが独立のASRを実行したかどうかも検証できていない。従って、`youtubeCapture.transport='youtube-direct'` などの虚偽の証跡は記録しない。

次の工程:
1. 非公開の原文ファイルをローカルに読み込み、時刻・章構成・発話の連続性・英語判別を検査。実際の字幕は単発行が細かく分割され、一部の固有名詞・句読点・HTML entityに誤りがあるため、**逐語確定と自動修正を同義にしない**。
2. 思想的な内容はジジェク本人の引用を中心に置き、英語・和訳・文中註を構造化する。別人の声や編集部の文章を本人の引用に混ぜない。
3. 字幕原典の真正性を独立検証できない箇所は「未照合」と明記。公開にあたり権利・引用範囲を別途確認し、元動画の英文全文を無許諾で丸ごと転載しない。
4. 新しい教材JSONを発行する場合は `src/lib/document-source.mjs` のバリデータを安易に偽装回避せず、取得経路・証拠・公開範囲を正しく扱えるモデルの変更を検討する。

### 運用上の訂正

旧説明の「RapidAPIを使えないので本人のブラウザで書き出してもらう必要がある」は**誤り**。APIによる取得は実動済み。原字幕との直接照合が別の課題として残っているだけ。
