# 手元の横位置と道具の重なり調整

2026-10-15。高さ調整（`255432a`）の続き。`art/work-motions`／PR #4に保存し、mainには未公開。

手元の基準点を、作業する側の天板縁から0.18マス内側へ寄せた。小さな粉打ち台をその位置に描き、手と生地が台の上にあることを示す。各方向で接近する2セルの両方に対応。人物の足元・頭部の上側・経路は維持し、腕と胴の帯だけを縦伸縮＋横せん断する。人物画像や手を左右反転して向きを作ってはいない。選択判定も縦横の逆写像を使う。

既存Blenderモデルのボウルを小さくして中央へ、めん棒を中央へ、粉袋を下段へ移動。布は辺の中央へ寄せ、周囲8か所の作業スペースを空けた。常設の生地は取り除き、実際の仕込みモーションの生地を使う。台の高さ0.85マス・占有・接地・カメラは前回と共通。家具素材は通常URLでも共通なので、将来main採用時には通常表示にもこの道具配置が適用される。

## 調整前後

ゲームをChromiumで実描画。390×844、ズーム155%、同じ作業セル・同じフレーム。手元が見やすいよう同じ220×230領域を撮影した。beforeは高さ調整時点の `255432a79fc31f3374b757e0aa47f65e7aad2294`、afterは今回。各画像はリンクから開ける。

| 人物・向き | Aコマ 前 → 後 | Bコマ 前 → 後 |
| --- | --- | --- |
| 主人公・正面左 | [前](owner-0-0-before.png) → [後](owner-0-0-after.png) | [前](owner-0-1-before.png) → [後](owner-0-1-after.png) |
| 主人公・正面右 | [前](owner-1-0-before.png) → [後](owner-1-0-after.png) | [前](owner-1-1-before.png) → [後](owner-1-1-after.png) |
| 主人公・背面右 | [前](owner-2-0-before.png) → [後](owner-2-0-after.png) | [前](owner-2-1-before.png) → [後](owner-2-1-after.png) |
| 主人公・背面左 | [前](owner-3-0-before.png) → [後](owner-3-0-after.png) | [前](owner-3-1-before.png) → [後](owner-3-1-after.png) |
| ノア・正面左 | [前](noah-0-0-before.png) → [後](noah-0-0-after.png) | [前](noah-0-1-before.png) → [後](noah-0-1-after.png) |
| ノア・正面右 | [前](noah-1-0-before.png) → [後](noah-1-0-after.png) | [前](noah-1-1-before.png) → [後](noah-1-1-after.png) |
| ノア・背面右 | [前](noah-2-0-before.png) → [後](noah-2-0-after.png) | [前](noah-2-1-before.png) → [後](noah-2-1-after.png) |
| ノア・背面左 | [前](noah-3-0-before.png) → [後](noah-3-0-after.png) | [前](noah-3-1-before.png) → [後](noah-3-1-after.png) |

## 検証と制限

`node tools/tests/work-contact.cjs`：5,760条件。両人物×家具4回転×8作業セル×5体型（小・標準・大・低身長幅広・高身長細身）×2コマ×3画面（390×844／320×568／844×390）×3ズーム（65／100／155%）。

- 標準体型の手元基準点は粉打ち台の横位置へ一致し、縦の差は最大約0.862 CSS px。画像上の左右それぞれの指先を独立して合わせた値ではない。
- 粉打ち台の4隅が天板内にあり、中央の道具配置と交差しないことを床座標で検証。画像上のすべての輪郭接触を数値保証したものではなく、比較画像でも見え方を確認した。
- 頭部の上側・足元の固定、変形の単調性、縦横の逆写像、見えている手元からの人物選択、表示計算の状態非変更、待機・移動・対象撤去・対象から離れた場合の非適用を確認。[集計結果](report.json)。
- 極端な体型では無理な変形を避けて縦は帯の45%、横は元セル18pxで補正を制限する。今回の検証範囲では縦約20.67px、横約6.49pxの差が残る。次は小さい体型での作業台への到達方法を検討する。
- 左右の手や指先の独立接触・IK、他設備の接触、Godot側の手元補正は未実装。輪郭・顔のコマ間の微差も残る。

公開動画ページと既存MP4は今回の調整前の記録。今回の確認資料は上の32枚の比較画像。

回帰検証：`work-motions.cjs`（72セル・全作業・13件販売）、`workflow.cjs --owner-study --noah-study`（20項目・3営業日）、`furniture.cjs --once`（18項目）が成功。

## 再出力

```
blender -b --threads 4 --python tools/art/build_furniture.py -- prep
python tools/art/export_sprites.py prep
node tools/tests/work-contact.cjs
```

Blender 4.3.2とPillow。人物72セルは再生成していない。テストのbefore描画には上記の過去コミットがローカルgitに必要。
