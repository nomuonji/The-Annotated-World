# Pilot 006 — 原典ニュアンス × 自然な英語 × 日英連動ハイライト

編集日: 2026-11-20 / 状態: **動画・音声・画面上の字幕を生成済み、未投稿、本人の新バージョン評価は未取得**。

## 直接の本人フィードバックと仕様
- 第5版に「だいぶ良くなった」。
- 「英語音声だからそこまでスピード早くしなくていいかも」→ English AndrewNeural `rate=+24%` から `rate=+6%` へ（間の長さも原典の論点の転換に合わせて調整）。
- 「なるべく出典元の温度感やニュアンスを残して」→ 原典への距離・留保・評価の複雑さ・ジジェクの皮肉を復活。
- 「字幕でポイント部分を日英でリンクさせてハイライト」→ 日英の対応句を同時・同色で強調し、中間に細い接続線を置いた。17対の `hi_en`/`hi_ja` に意味ロール（claim/nuance/question）を設定。

## 忠実度の確認
コンテンツ正本: `src/content/documents/slavoj-zizek-signs-from-the-future.html` 第10章 01:07:25および01:08:51。調査で当該HTMLを実際に再取得して照合。2026年の元音声の逐語照合は **未了**。以下を明示的に残した：
1. ジジェク自身の「非常に問題含みな読み方」という断り。
2. 「20世紀には行動が足りなかったのではなく、行動しすぎた」という逆説と「結果は衝撃的」。
3. ヘーゲルなら20世紀を分析しながら `permanent intellectual orgasm` と冗談を言う、ジジェク特有の過激な比喩。
4. 第一次大戦の謎、出発点は真正な出来事だったと評価する十月革命とスターリン体制の落差。
5. ヘーゲルの革命解釈にはそのまま同意していない旨、革命が自由から恐怖へ反転したという問題。
6. `How could things go wrong?`、AIをめぐる予想外の帰結、`the time has come to interpret it again` という第11テーゼの逆転。

## 字幕の編集可能な対応ペアの例
| 英語 | 日本語 | 目的 |
|---|---|---|
| We acted too much | 行動しすぎた | 逆説 |
| problematic | 問題含み | 断りのニュアンス |
| intellectual orgasm | 知的な絶頂 | 皮肉・話者の温度 |
| authentic | 真正な | 評価の複雑さ |
| How could things go wrong | どう裏目に出るのか | 問い |
| actual consequences | 実際の帰結 | 議論の中心 |
| interpret it again | もう一度解釈し直す | 結論 |

17組すべては制作ZIPの `linked-highlight-pairs.json` に実表示開始/終了時刻とともに含めた。英日字幕の時刻は `bilingual.srt`、動画への色焼き込みは `render.py`（Pillow/FFmpeg）。英語と日本語のハイライト箇所が一致することを文字列検証し、サンプルフレームで表示を確認。

## 技術・権利・公開状態
- H.264 + AAC、720×1280、20fps、**80.75秒**。20音声ビート、17色対応句。音量測定は平均約-17.4dB・最大約-1.4dB。FFmpeg全編デコード成功。
- 英語は合成ナレーションでありŽižek本人の声ではない。語句の一部はユーザー提供HTML上の短い引用で、その他は編集者の英語要約・解釈。元講演そのものの映像・音声は使用していない。
- ジジェク肖像は2011年の写真（出典・CC BY 2.0）、そのほかはCommonsの史料写真。どの写真も2026年講演を撮影したものではない。撮影・権利元は `sources.json` と `description.txt` に記録。必要な出典と許諾の確認なしにSNSへ公開しない。
- 収益化、維持率、視聴者効果の測定は未実施。原典の音声校正・トーンの当事者確認も未実施。自然に聞こえるかどうかの人間による試聴判断も残る。
- 日本語の思想解説を減らして英語の語学講座にするのではなく、思想を英語で追いながら日本語で理解する方式とした。

## 制作系統
- 原文を確認したリポジトリのコンテンツ: [main版](https://github.com/nomuonji/The-Annotated-World/blob/main/src/content/documents/slavoj-zizek-signs-from-the-future.html)。
- 音声の台本と再生成用ワークフローは隔離ブランチ `prototype/japanese-marx-zizek-2026` にコミット。音声合成の [GitHub Actions run](https://github.com/nomuonji/The-Annotated-World/actions/runs/44649020732) は成功。
- Render sourceはチャットで配布した `the-annotated-world-zizek-v6-source.zip` に保存。GitHub mainにはMP4や重い音声素材はコミットしていない。
