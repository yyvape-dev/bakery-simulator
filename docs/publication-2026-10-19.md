# PR #4・#5のmain取り込みと公開

2026-10-19。ユーザーの「いや、取り込んで」に従い、両PRをmainへマージしてGitHub Pagesへの反映を確認した。

- PR #4：`60f443bf2c14f1893a1a861b4cbf772f39e55ef8`。
- PR #5：比較先をmainへ変更して `b88ea6b6d6b9b479ab9b5bcd0c0fba9ddf45c83b` でマージ。
- 公開確認したゲーム実装はmainの `b88ea6b`。この後の公開記録更新は、ゲームコード・人物素材・家具画像の変更を含まない。

## 公開URLと表示

- [通常ゲーム](https://yyvape-dev.github.io/bakery-simulator/)：新しい家具6種24方向と正面代替6枚を通常の店舗へ反映。保存形式は従来どおり。
- [動作デモ](https://yyvape-dev.github.io/bakery-simulator/?demo=motion)：新しい主人公・ノアの作業、設備接触、小物縮尺・描画順、帯の横線修正を確認できる。通常セーブを読み書きしない。
- [家具の前後比較](https://yyvape-dev.github.io/bakery-simulator/docs/art/furniture-finish/review/) と [2026-10-18のモーション動画](https://yyvape-dev.github.io/bakery-simulator/docs/art/work-motions/review-2026-10-18/after/) も公開。動画は収録日の家具の質感で、10月19日の共通素材仕上げ前の記録。

新しい人物・作業素材の表示条件はデモまたは各人物の `=study` 指定。通常URLの人物を一律に新素材へ切り替える変更は行っていない。`previews/work-motions.html` と従来MP4はさらに前の記録なので最新の実装確認とは分ける。

## 公開後の確認

1. 公開HTMLをTLS検証付きで取得し、mainの `index.html` とSHA-256が一致。`8ccd038c007a5b3ab6c1ed4506fac815080760e2d07463f72b9647faef55b960`。
2. `node tools/tests/workflow.cjs --published --owner-study --noah-study`：公開74ファイルをmainとバイト比較。取得した公開ファイルをモバイル相当Chromiumへ配信し、20項目・3営業日が成功。これは取得ファイルによる再現確認。
3. 別途、公開URLへ実ブラウザーでHTTPS接続。通常と動作デモの両方で家具30画像を確認し、デモでは8作業シートも取得。メニューからスタッフ画面を開閉でき、JavaScript・画像読み込みのエラーなし。各ケースは新しいブラウザーコンテキストで実行し、ユーザーの保存領域は使用していない。
4. 家具比較・モーション動画のHTMLページが公開URLから取得できることも確認。

[検証結果JSON](publication-2026-10-19.json)。制作・マージ前の画像と接触の検証は [家具仕上げ資料](art/furniture-finish/README.md) と [全作業レビュー](art/work-motions/review-2026-10-18/README.md) に保存。

現在の再開先はmain。人物の顔・輪郭差、ラベルの重なり、窯の側背面動線、家具の形状・輪郭、棚の固定パンと在庫の連動、床・壁の質感は残件として維持する。
