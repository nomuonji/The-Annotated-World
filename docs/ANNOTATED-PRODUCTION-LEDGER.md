# The Annotated World 制作台帳
各話の正本は `productions/<clip-id>/brief.json`。台本の閲覧用はscript.md、理解レビュー・素材権利は別文書。進捗の正本は同ディレクトリのstatus.json。一覧は `npm run short:productions` で生成し、別の手書き一覧を増やさない。

## ステータス
`planned → script_ready → pilot_rendered → rendered → reviewed → private_uploaded → published`。必要な修正があれば前工程へ戻す。blockersに具体的な障害とnextActionを記録。pilot_renderedは試作品の存在を示し、改訂briefから生成した完成品とは区別する。rendered以降は該当briefから生成した動画SHA256を記録。reviewedは原録音・素材利用条件・編集・完成媒体の審査完了と特定動画の承認が必要。private_uploaded/publishedは既存deliveryの実videoId・channelId・sourceSha・承認済み動画SHA256・receiptが必要。公開時刻は実際の公開を確認して記録する。公開前の見込みを投稿済みと呼ばない。

Gitに動画バイナリや権利未確認素材・秘密情報を入れない。成果物はActions artifact等の承認済み保管先にSHA256で紐付ける。旧ドパ英語のqueueと定期補充は停止済み。投稿は [既存OAuth保有repoのdelivery](https://github.com/nomuonji/error-english/actions/workflows/annotated-world-delivery.yml) で行い、非公開アップロードと公開は分離。投稿後は72h/7dの実測と場面タイムラインを対応させ、次回の理解設計・道場の仮説に返す。動画を再アップロードして重複させない。
