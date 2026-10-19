# 設置物6種の共通素材仕上げ

2026-10-19。`art/furniture-finish` は `art/work-motions` の `bc02309` を基にした作業ブランチ。[PR #5](https://github.com/yyvape-dev/bakery-simulator/pull/5)、実装 `ad72d58`。2026-10-19にmainへ取り込み・公開済み。[公開比較ページ](https://yyvape-dev.github.io/bakery-simulator/docs/art/furniture-finish/review/)。

## 更新したもの

調査時点で6種すべてにBlender製の4方向画像があり、共通の厚塗り調仕上げが残っていた。今回、画像生成で共通素材アトラスを1枚制作し、8素材へ分割。同じ素材を既存のモデルへ貼り、6種24方向を再描画した。

| 設置物 | 占有 | 今回の素材更新 |
| --- | --- | --- |
| オーブン | 2×2 | 筆跡のあるテラコッタ、クリーム色の石、暗い木の薪・煙突飾り |
| パン棚 | 2×1 | 蜂蜜色の木目、濃い木の奥板、焼き色のあるパン、クリームとセージの布 |
| レジ | 2×1 | セージの塗装、木製天板、クリーム色の筐体・花器 |
| 仕込み台 | 2×2 | 温かい木目、布・粉・陶器の表面。天板0.85マスと道具配置を維持 |
| テーブル | 2×2 | 木目の天板と脚、セージのマット、花器 |
| 植木 | 1×1 | テラコッタの鉢、筆跡のある緑、クリーム色の花 |

[ゲーム内の前後比較・全24方向](review/index.html)。HTMLは公開URLでも確認できる。GitHub上では [変更後一覧](review/after-sheet.png)、[変更前一覧](review/before-sheet.png)、[390px変更後](review/shop-390-after.png)、[390px変更前](review/shop-390-before.png) を開ける。

方向別画像24枚に加え、読み込み中の代替画像6枚も同じ素材の正面画像へそろえた。512pxの共通フレームを持つ代替画像にも固定アンカーを適用し、余白から縮尺を推定する旧表示へ戻らないようにした。従来サイズの代替画像に対する処理も保持する。

## 画像と接触の検証

- [画像検証レポート](validation.json)：24枚とも512×512・透過・4方向が別画像。基点 `bc02309` とカメラ・接地・占有のメタデータが一致し、輪郭の重なり（不透明領域のIoU）は最小0.9990248659（約99.90%）。画素の色は全24枚で更新されていることを確認。
- 方向別画像をすべて読み込み失敗にしたケースを含む48ケースで、正しい画像・固定アンカー・反転なし・透明余白と本体の選択・描画による保存状態の非変更を確認。
- 実行時の方向別24枚は476,784 bytes。正面の代替6枚を含め599,400 bytes。制作時の素材PNGはゲームへ追加取得しない。
- [仕込み接触31,104条件](prep-contact-validation.json) と [設備接触139,968条件](equipment-contact-validation.json) が成功。最大の縦の差は約0.862／1.024 CSS pxで従来どおり。固定した窯口や各指先への直接接触の保証値ではない。
- [窯入れ](review/work-load.png)・[回収](review/work-collect.png)・[陳列](review/work-deliver.png)・[会計](review/work-checkout.png)・[店主の仕込み](review/work-prep-owner.png)・[ノアの仕込み](review/work-prep-noah.png) は更新後の実ゲーム描画。既存のモーション資料ディレクトリは履歴の画像へ戻し、今回の確認は本ディレクトリへ分けて保存した。

- [回帰確認の記録](test-summary.json)：家具操作18項目、営業20項目・3営業日、72素材セル・全作業13件販売、描画438ケースも成功。

## 固定した条件

- 既存のメッシュ・形状・道具配置・正投影カメラ・光源・1マスの投影サイズ・接地原点を維持。
- モデルをZ軸周りに90度ずつ回転して描画。反転や1方向画像の使い回しで4方向を作らない。
- 占有・選択の透過55%・ドラッグ・回転・撤去・経路・仕事時間・資産・保存形式は従来どおり。
- `furniture_finish.py` が画像テクスチャ、粗さ、控えめな暖色の縁の明暗を共通適用する。テクスチャ座標はモデルと一緒に回転する。
- Cycles CPU・768×768・48サンプル・seed 19、ノイズ除去なし。512×512の透過WebPへ書き出す。制作環境のBlenderは4.3.2。

元の3D形状に素材を適用した方式。ノアや店主の形状・顔・輪郭の修正は含まない。設置物の輪郭の描き直し、棚の固定パンと実在庫の連動、窯の側背面の作業動線、床・壁の質感更新は残る。

## 制作元

- `sources/material-atlas.png`：画像生成した1774×887の4列×2行アトラス。元画像を保持。
- `prompt.txt`：画像生成に使用した指示全文。参照写真や外部画像は使用していない。
- `materials.json`：切り出し位置。境界を避けて各セルの内側を取り、512×512 PNGへまとめる。
- `materials/`：oak／terracotta／limestone／sage／linen／walnut／leaf／crust。ゲーム中にダウンロードせず、Blenderの制作時に使用する。
- 生成した `.blend` には素材画像をパックする。`tools/art/build/painted/` はGit管理外。制作スクリプトと素材から再構築できる。

## 再構築

```sh
node tools/art/pack_furniture_materials.cjs
blender -b -t 2 --python tools/art/build_shelf.py -- --painted
for furniture_type in oven register prep table plant; do
  blender -b -t 2 --python tools/art/build_furniture.py -- "$furniture_type" --painted
done
python tools/art/export_sprites.py --build-root tools/art/build/painted --fallback
node tools/tests/furniture-art.cjs
node tools/art/review_furniture_finish.cjs
node tools/tests/furniture.cjs --once
node tools/tests/workflow.cjs --owner-study --noah-study
node tools/tests/work-motions.cjs
node tools/tests/work-display.cjs
```

試し描画は `--painted --preview` で正面1枚だけ出力できる。`--painted` を付けなければ従来の制作設定。exportの `--build-root` は読み出す制作物、`--fallback` は正面の代替画像も更新する指定。

接触テストは画像資料を過去のディレクトリへ再出力するため、過去記録を上書きして保存しないよう差分を確認する。
