# 素材・権利確認
- 肖像: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Slavoj_%C5%BDi%C5%BEk_2011.jpg), Michael Bruns / Gisbert H. Drignat の記載、CC BY 2.0、2011年資料写真をトリミング。クレジットとライセンスURLを説明欄へ。講演当日の映像ではない。
- 原典: https://www.youtube.com/watch?v=j7pEsBbGg5A。教材はユーザー提供対訳HTMLで原動画との照合・権利未確認。講演の原音声・実映像は使用しない現計画。原文の合成朗読も引用審査が必要。引用の必然性・明瞭な区別・主従・正当な範囲・出所を個別に確認する（[文化庁FAQ](https://www.bunka.go.jp/seisaku/bunka_gyosei/kibankyoka/faq/index.html?s=09)）。
- 音声: AndrewNeural / NanamiNeural 合成。商用投稿に必要な提供元の利用条件・生成経路の証拠は未確認。
- 音楽・図解: 独自のコード生成。第三者音源・映像は追加しない。
- 原録音照合・引用根拠が確定するまでは公開用ゲートを開けない。

## 追加確認 2026-11-24
- 主催者公式 https://chancentre.com/events/slavoj-zizek-signs-from-the-future/ にて2026年11月4日、Chan Shun Concert Hall、司会Clint Burnhamを確認。
- 比較用（原典の代用は禁止） https://zizek.org/talk/slavoj-zizek-signs-from-the-future-chan-centre-with-clint-burnham ：マルクスの第11テーゼ、革命の逆転、AIの帰結、人間の再定義という論旨は一致するが、革命の反転の言い回し、繰返し語、文法整理に差がある。原動画取得に失敗。逐語確認済みにしない。
- Edge Read Aloud由来の音声は商用・再配布の明確な許諾を確認できない。Microsoft Q&A https://learn.microsoft.com/en-us/answers/questions/6073502/commercial-licensing-clarification-edge-read-aloud 、Azureの正式条件 https://www.microsoft.com/licensing/terms/productoffering/MicrosoftAzure/EAEAS を確認。後者は有料TTSサービスの音声出力利用権を規定するが、今回のEdge素材には適用できない。公開版は別の許諾済み音声に差し替える。無断の有料サービス契約はしない。
- Pilot 016 のSHA256・尺はローカル再確認済み。技術的存在の確認であり、公開審査完了ではない。

## 2026-11-24 本人訂正：教材先行の制作契約
サイト教材の原文・対訳・内容注釈・語学注釈を派生動画の原文正本とする。サイト制作時の来歴をそのまま継承し、合成朗読で原動画を毎回取得・照合し直す必要はない。原録音未確認という履歴は消さない。第1話はch10の引用・話者・時刻を照合し、document.jsonとch10.jsonのGit blobをbrief.source.articleReviewに固定した。原典の録音を使う場合のみ実録照合を必須とする。引用の必要性・範囲、利用権・素材許諾と完成品の審査は別。

## 2026-11-24 完成版 rev2 の権利・技術監査（公開権利の確定ではない）
- 動画: SHA256 `194c6a7ba04ecf056fe070b8fdebc3faee4d9db107f4ce68c3590951d6aee9ac`、96.2秒、720×1280。CI run 45344028772 artifact 14897427515を実ファイルで開いて確認。
- 音声: 旧Edgeは使用せず、26本の独立音声 WAV は `hexgrad/Kokoro-82M` / `am_michael`（英文引用）と `jf_alpha`（日本語編者）に差替え済み。モデル公開条件は Apache-2.0（https://huggingface.co/hexgrad/Kokoro-82M）。音声ライセンスの確認は**引用原文の著作権を許諾した意味ではない**。音声信号25区間で全区間の実音声存在を確認、mixピーク-1.20 dBFS。肉声でないことを公開説明欄に必ず明示。
- 引用の検討: 講演（2026-11-04、約86分、9,313語）中の思想的主張を、当該約96秒の論評・註釈付き短編で102語、計45.8秒の独立英語合成朗読として使う。編者ナレーションは約44.0秒。発言者の論点を検討する目的があり、役割別の字幕／声と註釈画面で引用・編者を分離、素材の出典URLを説明欄に明示する設計。講演の実録音・動画の使用なし。
- 比較資料: https://zizek.org/talk/slavoj-zizek-signs-from-the-future-chan-centre-with-clint-burnham は思想内容と一部表現を補強するが、既存サイト教材の逐語一致性を証明しない。教材の原録音未照合・来歴「unverified」は維持。掲載英文は教材版の編集済みスクリプトであり、原録音との厳密一致や本人肉声とは説明しない。
- 日本法上の引用審査観点: https://www.bunka.go.jp/seisaku/bunka_gyosei/kibankyoka/faq/index.html?s=09 は公表済み・区別・引用の必要性/正当範囲・主従関係・出所を指摘。引用が102語で全演説の約1.1%という比率だけでは適法性は確定しない。動画中の引用発話と編者の発話が約同尺であり、量的主従・直接話法の文言整合・利用地域の法制度に残余リスク。**権利レビュー合格または著作権者許諾済みとは記録しない**。
- 最終映像音声: 25字幕のSRT時刻、26枚相当の接触シート、冒頭スマホ画面、波形・音量を確認。ただし人間または音声知覚モデルによる全編の実聴取（発音・読み間違い・自然さ・内容理解）は未実施。signal QAを「聴取済み」と記録しない。
- 公開許可: 2026-11-24本人から第1話の公開許可を明示取得。再確認は不要。ただし公開許可は未実施の引用・完成品質レビューを完了にするものではない。

## 2026-11-24 公開用引用レビュー（編集者による判断、法的保証ではない）
- 対象は既存サイト教材における公開講演の一部英語引用102語（元講演の資料上約9,313語の約1.1%）、合成朗読45.8秒。講演そのものを再配信せず、96.2秒作品中に編者独自の解説音声44.0秒と概念図・出典表示を設けている。引用は哲学的主張の検討に必要な部分に限定されている。
- 公表著作物: 原講演は https://www.youtube.com/watch?v=j7pEsBbGg5A で公表されている。日時・イベントは主催者および https://zizek.org/talk/slavoj-zizek-signs-from-the-future-chan-centre-with-clint-burnham で照合。元録音そのものは再取得しておらず、逐語同一性は未確認と記録を維持する。
- 区別: QUOTEは英語男性合成音声と肖像写真、編者のCONTEXT/ANNOTATIONは日本語女性音声と独立した図解画面。本人の肉声でないこと、2011年資料写真が当日の映像でないことを明示する。逐語口述記録と完全同一とは表明せず、教材編集版であることをYouTube説明欄に明示する。
- 主従と範囲: 作品の価値は引用の提示そのものだけではなく、ヘーゲル・革命の反転とAIの意味を解説する独自の問い・日本語解説・図解にある。量的に引用45.8秒と解説44.0秒がほぼ同尺であることは残余リスクであり、作品全体の解説・批評目的を含めて評価する。引用長の少なさだけを根拠に適法と決めつけない。
- 出所明示: YouTube説明欄に講演URL・教材URL・話者名、写真クレジット・CC BY 2.0リンク、Kokoro Apache 2.0リンクを掲載することを必須とする。
- 参照する基準: 著作権法32条、48条および文化庁の引用FAQ https://www.bunka.go.jp/seisaku/bunka_gyosei/kibankyoka/faq/index.html?s=09。公開作の批評に必要な範囲の短い引用として合理的な根拠があると編集審査では判断するが、権利者から許諾取得済み・法的リスク皆無・逐語照合済みとは主張しない。訴え等が出れば公開状態を再評価する。
- 本セクションは**引用利用についての文書審査**であり、最終動画の発音・音声知覚・字幕同期の検査終了を意味しない。メディア審査は別の証拠で完了とする。
