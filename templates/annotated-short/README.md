# The Annotated World — 交互引用・註釈型 / Source-first annotated short v1

**基準版:** 2026-11-20 Pilot 012。ユーザー評価は「まあ合格ラインかな」。制作の基準として採用するが、視聴維持率の改善や投稿許可を意味しない。

## 不変の編集構造
1. QUOTE / hook：本人の出典付き原文で開始する。声・氏名・肖像・日英字幕で誰の言葉か明示。
2. CONTEXT：フックの直後に日本語の編者ナレーターが、いつ／どこで／何への回答なのかを説明。字幕は日本語のみ。
3. QUOTE：同じ本人役の原文音声に戻す。本人の原文英語と日本語訳を短い意味単位で見せる。
4. ANNOTATION：引用をいったん止めて、別の固定ナレーターが歴史・哲学・言語の註を説明。英語原文を同時表示しない。
5. QUOTE → ANNOTATION → QUOTE… と交代して、最後は原典の言葉に戻る。引用が連続することは可。註は言い換えでなく、解釈に新たな文脈を加える。

Pilot 012の役割声は英語引用 en-US-AndrewNeural（男性）／日本語編者註 ja-JP-NanamiNeural（女性）。別の本人の企画に移すときに性別自体は必須ではないが、**各役割内で声を統一**し、発話の途中のTTS fallbackで声を変えない。本人肉声ではない場合は、合成朗読であることを見せる。合成声を本人と取り違えさせない。

## 編集の品質基準
- 英日字幕を全文同時表示＋註釈重ね表示することは禁止。引用中は英語＋日本語、註中は日本語のみ。音声の発話に沿って意味句単位で切る。
- 英日ハイライトは引用区間で対応する箇所のみを同色にする。原典の言い直し、留保、ジョーク、意見の複雑さを削らない。
- 人物・時代史料・施設写真には出典と撮影時点を残し、講演当日の写真に見せかけない。出所のない映像や装飾アニメで間を薄めない。
- BGMは実際に聞こえる音楽にする。音声とBGMを別トラックで測定し、BGM単体と最終ミックスの試聴を確認。Sample/SoundFontを含め公開利用権を確認する。Pilot 012の音楽は第三者SoundFontの条件が未確認なので無断再配布・自動流用しない。
- スマホ画面で冒頭・長文字幕・註への切替・締めを目視し、Shorts/TikTok/ReelsのUI被りは媒体別に確認。
- 原文引用の正確さと元音声への照合、肖像・音源・引用の権利、公開承認は別ゲート。機械検証に通っても投稿しない。

## 次の企画への使い方
1. npm run short:init -- new-subject-slug
   → productions/new-subject-slug/brief.json と空の assets/audio ディレクトリを作成。架空の原典を自動生成しない。
2. 原典を調査し、brief.json の author/source/quote/context/annotations/cues/asset/music/audio を埋める。
3. npm run short:check -- productions/new-subject-slug/brief.json
4. npm run short:plan -- productions/new-subject-slug/brief.json
5. 元音声を使う場合はその利用権を確認。合成朗読なら source/editor の声を各1種類に固定して音声ファイルを用意する。
6. npm run short:check -- productions/new-subject-slug/brief.json --media
7. npm run short:render -- productions/new-subject-slug/brief.json
8. MP4・字幕・BGM単独・声込みミックスを視聴して評価。公開申請は別。

実際の出典に基づく例は brief.example.json。これは**映像・音声・音楽を含まない構造例**で、source.originalAudioChecked=false、publication.approved=false。例の欠けた音源ファイルをでっち上げず、次の題材では正しく調達する。

基準の直接記録：docs/prototypes/zizek-v12-voice-and-commentary-alternation.md
