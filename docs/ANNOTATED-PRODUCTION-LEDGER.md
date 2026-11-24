# The Annotated World 制作台帳
各話の正本は `productions/<clip-id>/brief.json`。台本の閲覧用はscript.md、理解レビュー・素材権利は別文書。進捗の正本は同ディレクトリのstatus.json。一覧は `npm run short:productions` で生成し、別の手書き一覧を増やさない。

## ステータス
`planned → script_ready → pilot_rendered → rendered → reviewed → private_uploaded → published`。必要な修正があれば前工程へ戻す。blockersに具体的な障害とnextActionを記録。pilot_renderedは試作品の存在を示し、改訂briefから生成した完成品とは区別する。rendered以降は該当briefから生成した動画SHA256を記録。reviewedは固定されたサイト教材の参照審査・引用範囲・素材利用条件・編集・完成媒体の審査完了と特定動画の承認が必要。原録音を使う場合だけ録音照合が必須。private_uploaded/publishedは既存deliveryの実videoId・channelId・sourceSha・承認済み動画SHA256・receiptが必要。公開時刻は実際の公開を確認して記録する。公開前の見込みを投稿済みと呼ばない。

Gitに動画バイナリや権利未確認素材・秘密情報を入れない。成果物はActions artifact等の承認済み保管先にSHA256で紐付ける。旧ドパ英語のqueueと定期補充は停止済み。投稿は [既存OAuth保有repoのdelivery](https://github.com/nomuonji/error-english/actions/workflows/annotated-world-delivery.yml) で行い、非公開アップロードと公開は分離。投稿後は72h/7dの実測と場面タイムラインを対応させ、次回の理解設計・道場の仮説に返す。動画を再アップロードして重複させない。

## 公開利用可能な音声への切替
Edge Read Aloud素材は試作のみ。Kokoro-82M（https://huggingface.co/hexgrad/Kokoro-82M、Apache-2.0）を無料のローカル推論候補として追加。Python 3.11、CPU torch、espeak-ng、kokoro==0.9.4、misaki[ja]==0.9.4、soundfile、UniDic辞書が必要。新しい出力先に `python tools/annotated-short/synthesize-kokoro.py --brief productions/<clip-id>/brief.json --out /tmp/aw-render` を実行すると、英語男性・日本語女性の各意味句音声、差替えbrief、voice-reportを生成する。音声の自動生成が成功しても公開審査・発音・イントネーションは未確認。原典・権利と最終レビューを通してから、生成briefと音声素材の版・SHAを本番台帳へ移す。元briefは上書きしない。CIは独自の短い英日文の音声を実生成して技術的に確認し、著作権未確認の講演素材は公開artifactへ追加しない。

## 教材先行・派生動画（2026-11-24 本人指示）
サイトコンテンツ制作→既存教材の原文・対訳・内容/語学注釈を参照→クリップ制作→投稿が正規の順序。クリップ担当は既存教材の chapterId/utteranceId/time と原文・前後文脈を確認して使う。合成朗読では原動画/字幕の再取得・原録音の再照合を要求しない。教材の取得・出典照合は上流のサイト制作責務。教材の来歴（未確認を含む）を変更せず引き継ぐ。brief.source.articleReview に basis=site-content、documentBlob、使用章の chapterBlobs（Git blob SHA）、transcriptProvenance、rightsProvenance、note を保存する。引用照合・固定版の検査はStudioで行う。教材更新で版が変われば再読・ピン更新。originalAudioChecked は原録音を実際に使う場合だけ必須。動画自体の引用範囲・素材利用権、合成音声の利用条件、完成映像の審査、投稿承認は従来どおり別。教材に未確認の来歴があっても原典照合済みとは偽らない。既存記事を勝手に原典確認済みに更新しない。
