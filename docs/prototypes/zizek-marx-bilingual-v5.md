# Pilot 005 — Marx vs Žižek / English voice + Japanese-English subtitles

**Status:** 2026-11-20編集試作。YouTube・TikTok等への投稿なし。本人による採用評価はまだない。

## 直近の本人フィードバック
- Pilot 003: 素材が講演内容と関係が薄い、テンポが悪い。関連する写真でもよい。
- Pilot 004: なお微妙。日本語音声より英語音声とバイリンガル字幕を希望。ジジェクの写真を使いたい。バズるリズムが足りない。
- 直前の絶対条件: アニメーション等で教材の情報密度を薄めない。思想や歴史の具体性を保つ。

## 変更点
- 52.6秒（前版75秒）。20英語ナレーション発話ビート、平均画面更新間隔2.63秒。小さく独自スコアとカット音を加え、導入の挨拶を削除。英語の音声に合わせて英日字幕を毎発話で更新。字幕2行の意味を省略しない。
- 0秒にKarl MarxとSlavoj Žižekの分割構図、日本語で「世界を変えすぎた」の矛盾を提示。冒頭約2秒でŽižekの顔写真へ。人物の写真は2011年撮影。2026年講演映像ではない。
- マルクスの第11テーゼ→ジジェクの「We acted too much」→第一次大戦→十月革命→スターリン体制→ヘーゲル・フランス革命→AI→「再び世界を解釈する」へ。原典に現れる具体的な歴史・政治哲学の連鎖を維持。架空の人物や思想説明アニメを使わない。
- 視覚素材は著作権・来歴が追えるCommons画像：Žižek本人、Marx、第一次大戦塹壕、レーニン、スターリン、ヘーゲル、フランス革命の版画、産業用ロボット。動画全体の写真は説明用であり録画素材ではない。

## 音声・字幕の重要な区別
英語音声は**合成英語ナレーション**（Microsoft Edge Text-to-SpeechのAndrewNeural）、**ジジェク本人の声ではない**。原典の短い英語フレーズを含む編集者の英語解説を読んでいる。元YouTube動画の音声をダウンロード・転載していない。字幕は英語音声に準じたEN+JAで焼き込んだ上、編集可能なSRTを付属。原文にない英語フレーズは原典の逐語引用と誤認させない。

## 出典・権利・実装
- 内容の出典: [Slavoj Žižek, Signs from the Future](https://www.youtube.com/watch?v=j7pEsBbGg5A&t=4022s)、ユーザー提供元HTMLの第10章。音声逐語照合は未実施。公開済み全訳原文の権利も引き続き未確認。
- [Slavoj Žižek 2011.jpg](https://commons.wikimedia.org/wiki/File:Slavoj_%C5%BDi%C5%BEek_2011.jpg) · Author metadata: Michael Bruns; description credit Gisbert H. Drignat; [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) · クロップ・明度補正・編集を実施。
- [産業用ロボット写真](https://commons.wikimedia.org/wiki/File:Robot_arm_works_on_a_small_component_in_a_lab_setting.jpg) · Shixart1985 / Nenad Stojković · CC BY 2.0。ほかの歴史写真の出典は v5 の sources.json に保存。使用する直前に各Commonsページの現行ライセンスを再確認する。
- 制作前素材取得: [GitHub Actions成功run](https://github.com/nomuonji/The-Annotated-World/actions/runs/44645754481)（アーティファクト保持14日）、[隔離ブランチ](https://github.com/nomuonji/The-Annotated-World/tree/prototype/japanese-marx-zizek-2026)。ローカルで生成した動画・コード・入力画像・音声・SRT・出典メモをチャットのZIPに同梱。完成MP4はGitHub本流には保存していない。
- 技術検証: H.264 720×1280 20fps / AAC、52.6秒、全編FFmpegデコード成功、20個すべてEN/JA発話、音声約52.6秒で同期、静止画を複数時刻で確認。実際の声を人間が試聴した品質評価、視聴者離脱・維持率、真正な2026年映像との一致は未検証。再生数が伸びることを保証・主張しない。

## 今後の編集ルール
本人の肖像を「人が話している証拠」として使うが、元動画でない写真を口パク動画として偽装しない。英語原文と字幕を発話単位で編集し、思想上の情報を削ってテンポを上げない。フック・顔写真・具体的史料・逆転・論点回収の組み立てを、実際の再生数と本人評価で改善する。
