# 『How to become free』再制作：字幕出所・内容・公開条件の実証記録（2026-11-21）

## 依頼と守るべき条件

本人から2026-11-21に `/read/slavoj-zizek-how-to-become-free/` の**実際の再制作**依頼。過去の第三者転載記事・第三者生成の文字起こし（žžek archiveなど）を再利用しない。新規ASRもしない。原動画は `https://www.youtube.com/watch?v=4YSXNotY8QU`。動画の録画年は未確認、YouTube公開日は2024-05-24、長さ5715秒。権利不明の講演全文・字幕本文を公開GitHubに残さない。

**本記録は完成記事ではない**。公開側の `src/content/documents/slavoj-zizek-how-to-become-free/` は今のmainでは存在しない。旧記事を原本確認前に復元・表示しない。

## 実行済みの検証（机上調査ではない）

| 経路 | 結果 | 証拠 |
| --- | --- | --- |
| SaveTube 720p動画メディア | 373,095,240 bytesを取得し離れた4地点で非無音の音声を確認。字幕は取得せず | [前回実行](https://github.com/nomuonji/The-Annotated-World/actions/runs/44798740309) |
| YouTube watch/embed・yt-dlp字幕直接 | GitHub Actionsからは接続/Bot判定で失敗 | [直接字幕実験](https://github.com/nomuonji/The-Annotated-World/actions/runs/44800920909) |
| Invidious/PipedのYouTube字幕中継 | 8個の公開インスタンスで403/タイムアウト/接続失敗。実際の字幕原本0 | [PR #20 の実行](https://github.com/nomuonji/The-Annotated-World/pull/20) |
| KirinukiのYouTube既存字幕→RapidAPI第一経路 | 字幕候補1,533件、末尾5713.28秒、正規化データ151,871 bytes | [初回実証](https://github.com/nomuonji/kirinuki-generator/actions/runs/44802685690) |
| 第一経路を再取得 | 1,533件、末尾5713.28秒、正規化SHA256 `ec6e42b0152dc3d0d1bf9b913b08359828fd6467366a5899738c7da194fb6db9` が前回と完全一致 | [1回目の講演分析](https://github.com/nomuonji/kirinuki-generator/actions/runs/44810045742) |
| YouTube Cookie + yt-dlp直接字幕 + PO token | 既存 `YT_COOKIES_TXT` のSecretは設定済み。Bot判定のまま字幕原本ファイル0件 | [認証付き実証](https://github.com/nomuonji/kirinuki-generator/actions/runs/44810779324) |
| RapidAPI独立した第2経路との比較 | 第1、第2とも1,533件・5713.28秒。12区間の正規化英文単語多重集合一致率が**すべて1.0**。第2経路の正規化SHA256 `45149e105024d8088b22e2ac92647215ed2748b454e359cac765c71a8022817c`。両者はフォーマット差があるが単語内容は完全一致 | [二系統比較](https://github.com/nomuonji/kirinuki-generator/actions/runs/44811199981) |

### この結果から言えること／言えないこと

- **言える**: 同じ動画IDに対し、別々の字幕取得サービスからほぼ全編分の同じ英語単語列が取得できた。新規の音声文字起こしは行っていない。これらのサービスはYouTube既存字幕の取得を提供するものと説明している。
- **言えない**: 2サービスが別々の原理・上流基盤から直接YouTube字幕を取得したとは限らない。2サービス間の一致は**YouTube本体の原本字幕トラックとの一致の証明ではない**。自動字幕／投稿者字幕の種類、本人の肉声との逐語一致、長文転載権限も未確認。
- **重要**: 「初回APIだけでは取得できていなかった」という過去の不正確な状態は訂正済み。ただし有効なYouTube取得証跡がなく、`document.json.youtubeCapture.transport='youtube-direct'` を書くことは虚偽になるので禁止。形式だけ合格する偽の取得証跡、第三者の記事の使い回し、原文とは異なる英文を本人の発言として公開しない。
- GitHub Actionsログは字幕本文全文を出力せず、短い候補断片・時間区間・単語頻度・SHAだけを保存。**実字幕ファイルは現時点でリポジトリや非公開永続領域に保管していない**。

## 講演の12分割・編集仮説（RapidAPI字幕候補のみから算出）

この一覧は12等分した時間区間の**機械的な語頻度**。話者が実際にその範囲でどの論証を完成したか、章境界はまだ確定していない。以前の第三者転写記事の章見出しは参照・転用しない。英語原文の代用にも使わない。

| 仮章 | 元動画区間 | 検出された語と傾向 | 編集時の論点候補（未確定） |
| --- | --- | --- | --- |
| ch1 | 00:00:00–00:07:56 | freedom 43、choice 3 | 自由という語が担う複数の意味 |
| ch2 | 00:07:56–00:15:52 | freedom 18、love 9、language 5、necessity 3 | 愛・必然性と自由の関係 |
| ch3 | 00:15:52–00:23:48 | freedom 15、past 2 | 自由と過去・回顧の枠組み |
| ch4 | 00:23:48–00:31:44 | coffee 14、past 4、film 2 | コーヒーの比喩と映画／過去の例 |
| ch5 | 00:31:44–00:39:40 | freedom 18、free 15、rules 6、liberty 5 | 自由の形式とルールの関係 |
| ch6 | 00:39:40–00:47:36 | liberty 9、freedom 9、rules 4 | 自由と既存制度・言語の規則 |
| ch7 | 00:47:36–00:55:32 | change 5、freedom 4、capitalism 1 | 仕事・資本主義の自由の危うさ |
| ch8 | 00:55:32–01:03:28 | knowledge 9、truth 6、charity 3 | 知識と真理のずれ、慈善 |
| ch9 | 01:03:28–01:11:24 | war 5、poetry 5、religion 3 | 戦争・詩・信条の言葉 |
| ch10 | 01:11:24–01:19:21 | war 13、truth 7、ukraine 4、russia 3 | 戦争と言説、ロシア／ウクライナ |
| ch11 | 01:19:21–01:27:17 | war 12、ukraine 6、rules 4 | ウクライナ戦争と国際的規則 |
| ch12 | 01:27:17–01:35:13 | war 7、ukraine 5、russia 4、freedom 4 | 自由・戦争・責任の結論候補 |

**転載原稿ではないが、候補字幕内の単語出現から推測した編集仮説**であり、話者がこれらの文章通りに論じたことを証明しない。最終の章タイトル・開始時刻は元音声と字幕トラックを照合してから決める。コーパスを取得できないまま独自英文を「Žižekの逐語原文」として挿入しない。

## 公開までの未完ゲート（誤魔化して通さない）

1. ユーザーの通常のYouTubeブラウザセッションから `scripts/youtube-original-captions.user.js` により**元の字幕トラックを一度保存**できれば、それを正本として、今ある2中継APIの候補字幕と動画ID・時刻・本文を比較する。保存不可なら動画プレイヤーの字幕メニューの実在と対応を確認し、依然として原本未取得と報告する。
2. **原字幕の短い引用箇所だけ**を元音声と照合。字幕の認識誤りを訂正する場合、訂正根拠を残す。第三者が作った原稿による穴埋め・音声の新規ASRは禁止。
3. 原動画のライセンス・利用権限を確認し、許諾のない講演全文の転載はしない。解説に必要な限定的な原文引用と、The Annotated World自身の分析・英語学習註を主にする方針は[CONTENT-AGENT.md](../CONTENT-AGENT.md)に従う。
4. 現行テンプレートに従って同じURLの `src/content/documents/slavoj-zizek-how-to-become-free/document.json` と `chapters/*.json` を実データから作る。 `youtubeCapture` は実際に取得した原本SHAだけ記録する。編集ステータスの追加や旧HTML形式への逆戻りはしない。
5. `npm run content:check && npm run check && npm run build && npm run verify:archive` を通し、PR・マージ・公開表示を別々に検証する。

**現時点ではまだ公開記事の再制作は完了していない。** 旧ページがブラウザで閲覧できても、古い原稿・キャッシュ／デプロイ残存の可能性がある。GitHub mainの正本と一致することを確認するまでは「修正済み」と報告しない。
