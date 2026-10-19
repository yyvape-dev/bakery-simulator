# 家具の制作・再出力

家具6種類は、同じ単位・正投影カメラ・光源・縮尺から4方向へ出力します。
元の厚塗り画像は `assets/{type}.webp` に維持し、方向別表示の読み込み中にはフォールバックとして使用します。

## 幾何の規則

- 1マス = Blender内の1単位。
- 底面：パン棚・レジ2×1、オーブン・調理台・テーブル2×2、植木1×1。小さい装飾には張り出しがあります。
- モデルの正面は-Y。ゲームのX軸=モデル+X、ゲームのY軸=モデル-Y。
- モデルをZ軸周りに0/90/180/270度回転。カメラと光源は固定し、反転は使用しません。
- 正投影カメラの水平の向き45度、俯角asin(0.54)=32.683638846度、ortho_scale=4.2。
- 床の画面上の軸は±0.54（約28.369度）。消失点はありません。
- 原点(0,0,0)を共通の接地アンカーとして記録。画像の余白ではなく1マスの投影サイズでゲーム内の縮尺を決めます。

レンダリングは768×768のアルファ透過PNG。ゲーム向けには512×512のWebPに変換します。
`assets/furniture_geometry.json` に全家具の占有範囲・カメラ・接地座標・方向別ファイルを記録します。
ゲームの `furnitureGeometry` 定数はexport_sprites.pyでこの共通情報から更新します。ゲーム起動時にJSONを取得する必要はありません。

## 再出力

Blender 4.3系、Python 3とPillowを使用します。外部テクスチャは不要です。
リポジトリ直下から実行してください。

```sh
blender -b -t 4 --python tools/art/build_shelf.py
for furniture_type in oven register prep table plant; do
  blender -b -t 4 --python tools/art/build_furniture.py -- "$furniture_type"
done
python tools/art/export_sprites.py
```

`.blend`とフルサイズPNGは `tools/art/build/{type}/` に生成されます。これらはGit管理外です。
形状・配色を編集する場合は制作スクリプトを変更して再出力してください。生成された.blendの手動編集を採用する場合は、その.blendも別途保管してください。

## 共通素材仕上げ（2026-10-19）

[設置物6種の素材・前後比較・再構築](../../docs/art/furniture-finish/README.md)。共通アトラス1枚を8素材へ分割し、既存のメッシュ・カメラ・接地を維持して24方向へ出力する。`--painted` で共通仕上げ、`--preview` で正面1枚だけ試し描画。`build/painted/` に制作物を分け、元の制作設定を維持する。

```sh
node tools/art/pack_furniture_materials.cjs
blender -b -t 2 --python tools/art/build_shelf.py -- --painted
for furniture_type in oven register prep table plant; do
  blender -b -t 2 --python tools/art/build_furniture.py -- "$furniture_type" --painted
done
python tools/art/export_sprites.py --build-root tools/art/build/painted --fallback
```

代替画像も512pxの正面フレームへ更新し、読み込み中も固定した接地アンカーを使う。素材はBlenderの制作時だけ使い、ゲームで追加のテクスチャを取得しない。金具や土などは既存の質感を活用する。

## 質感と今後の仕上げ

試作パン棚と同じ丸い形状・温かい木目・グリーンの布や塗装を基準にしています。
従来設定はプロシージャルマテリアル、`--painted` は生成した手描き調テクスチャを使用します。既存3D形状への素材適用で、輪郭の描き直しは行っていません。
以後は幾何・カメラを固定したまま、UV上の手描きテクスチャや輪郭表現を仕上げられます。

家具の占有判定、設置・移動・回転・撤去、通路判定、セーブ形式は既存のタイル管理を使用します。
キャラクターは以下の制作元から出力し、ゲーム内の経路移動・仕事と連動します。

## 店主・ノアの基礎モデル

`models/characters/owner.blend` と `models/characters/noah.blend` が編集用のモデルです。足元はZ=0、占有は1×1マス、家具と同じカメラ・縮尺です。独自の基礎形状で、厚塗りの最終仕上げは今後の工程です。

```sh
blender -b -t 2 --python tools/art/build_characters.py
python tools/art/pack_characters.py
```

`build/characters/` にモデルと4方向×3フレームを出力し、`assets/characters/{owner,noah}.webp` に透過スプライトシートをまとめます。1フレーム256×256、横3フレーム（待機・歩行左・歩行右）、縦4方向（+gameY、+gameX、-gameY、-gameX）。`geometry.json` が接地アンカーと1マスの投影サイズを記録します。

形状の高さ・太さ・奥行きは `build_characters.py` の `CHARACTER_SIZES` で変更できます。ゲーム内では高さ・太さ・全体サイズを別に変更できます。接地点を固定するため、これらは占有マスや移動速度を変えません。ゲームの `characterGeometry` はこの固定カメラの256px投影値を使います。カメラを変える場合は素材と描画側を一緒に更新してください。
