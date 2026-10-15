# 小さい体型でも届く補助作業板

2026-10-15。横位置・道具配置調整（`afad7a2`）の続き。PR #4／`art/work-motions` のみ。main未公開。

小さい体型で手が届かない高さまで腕を引き伸ばす代わりに、仕込み中だけ低い引き出し式の補助板を表示する。補助板は台の側面の木のブラケットで支え、必要なときに作業者側へ出す。大きい体型で作業面が低すぎる場合には、天板上の脚付き作業板を使う。通常の体型は従来の天板上の粉打ち台を使う。

人物の頭部の上側・足元・影・座標は固定。高さ／幅／全体サイズの指定を保持し、作業板の位置と高さを手の届く範囲へ合わせる。腕と胴の補正は従来どおり縦は帯の45%、横は元セル18pxを上限とし、無理な伸縮を避ける。補助板の張り出しはその作業者が立つ1セル内。通路判定・占有・経路・仕事時間・材料・会計・セーブを増減させない、仕事から導出する描画である。

低い補助板は床上の位置で奥行きを並べる。台の奥で天板に隠れる低い板や手は、手前へ重ね描きしない。**小さい人物が台の奥にいる場合、手元が隠れて頭だけ見えることがある**。見通しのための天板の透過表示などは導入していない。高い板や従来の粉打ち台だけ、天板上へ手元を重ねる。

## 確認画像

390×844、ズーム155%、同じセル・同じフレームの実ゲーム描画。手元周辺220×230を撮影（大きい体型では頭部が画像外になる）。beforeは `afad7a2660c473cb00bf1f59b53bee22dfa7fe89`、afterは今回。体型は高さ・幅・全体の3値を同時に70／100／130%にした例。各人物4方向×2コマ、3体型、前後で計96枚。

### 小さい体型：各70%

| 人物・向き | Aコマ 前 → 後 | Bコマ 前 → 後 |
| --- | --- | --- |
| 主人公・正面左 | [前](owner-0.7-0-0-before.png) → [後](owner-0.7-0-0-after.png) | [前](owner-0.7-0-1-before.png) → [後](owner-0.7-0-1-after.png) |
| 主人公・正面右 | [前](owner-0.7-1-0-before.png) → [後](owner-0.7-1-0-after.png) | [前](owner-0.7-1-1-before.png) → [後](owner-0.7-1-1-after.png) |
| 主人公・背面右 | [前](owner-0.7-2-0-before.png) → [後](owner-0.7-2-0-after.png) | [前](owner-0.7-2-1-before.png) → [後](owner-0.7-2-1-after.png) |
| 主人公・背面左 | [前](owner-0.7-3-0-before.png) → [後](owner-0.7-3-0-after.png) | [前](owner-0.7-3-1-before.png) → [後](owner-0.7-3-1-after.png) |
| ノア・正面左 | [前](noah-0.7-0-0-before.png) → [後](noah-0.7-0-0-after.png) | [前](noah-0.7-0-1-before.png) → [後](noah-0.7-0-1-after.png) |
| ノア・正面右 | [前](noah-0.7-1-0-before.png) → [後](noah-0.7-1-0-after.png) | [前](noah-0.7-1-1-before.png) → [後](noah-0.7-1-1-after.png) |
| ノア・背面右 | [前](noah-0.7-2-0-before.png) → [後](noah-0.7-2-0-after.png) | [前](noah-0.7-2-1-before.png) → [後](noah-0.7-2-1-after.png) |
| ノア・背面左 | [前](noah-0.7-3-0-before.png) → [後](noah-0.7-3-0-after.png) | [前](noah-0.7-3-1-before.png) → [後](noah-0.7-3-1-after.png) |

### 標準体型：各100%

| 人物・向き | Aコマ 前 → 後 | Bコマ 前 → 後 |
| --- | --- | --- |
| 主人公・正面左 | [前](owner-1-0-0-before.png) → [後](owner-1-0-0-after.png) | [前](owner-1-0-1-before.png) → [後](owner-1-0-1-after.png) |
| 主人公・正面右 | [前](owner-1-1-0-before.png) → [後](owner-1-1-0-after.png) | [前](owner-1-1-1-before.png) → [後](owner-1-1-1-after.png) |
| 主人公・背面右 | [前](owner-1-2-0-before.png) → [後](owner-1-2-0-after.png) | [前](owner-1-2-1-before.png) → [後](owner-1-2-1-after.png) |
| 主人公・背面左 | [前](owner-1-3-0-before.png) → [後](owner-1-3-0-after.png) | [前](owner-1-3-1-before.png) → [後](owner-1-3-1-after.png) |
| ノア・正面左 | [前](noah-1-0-0-before.png) → [後](noah-1-0-0-after.png) | [前](noah-1-0-1-before.png) → [後](noah-1-0-1-after.png) |
| ノア・正面右 | [前](noah-1-1-0-before.png) → [後](noah-1-1-0-after.png) | [前](noah-1-1-1-before.png) → [後](noah-1-1-1-after.png) |
| ノア・背面右 | [前](noah-1-2-0-before.png) → [後](noah-1-2-0-after.png) | [前](noah-1-2-1-before.png) → [後](noah-1-2-1-after.png) |
| ノア・背面左 | [前](noah-1-3-0-before.png) → [後](noah-1-3-0-after.png) | [前](noah-1-3-1-before.png) → [後](noah-1-3-1-after.png) |

### 大きい体型：各130%

| 人物・向き | Aコマ 前 → 後 | Bコマ 前 → 後 |
| --- | --- | --- |
| 主人公・正面左 | [前](owner-1.3-0-0-before.png) → [後](owner-1.3-0-0-after.png) | [前](owner-1.3-0-1-before.png) → [後](owner-1.3-0-1-after.png) |
| 主人公・正面右 | [前](owner-1.3-1-0-before.png) → [後](owner-1.3-1-0-after.png) | [前](owner-1.3-1-1-before.png) → [後](owner-1.3-1-1-after.png) |
| 主人公・背面右 | [前](owner-1.3-2-0-before.png) → [後](owner-1.3-2-0-after.png) | [前](owner-1.3-2-1-before.png) → [後](owner-1.3-2-1-after.png) |
| 主人公・背面左 | [前](owner-1.3-3-0-before.png) → [後](owner-1.3-3-0-after.png) | [前](owner-1.3-3-1-before.png) → [後](owner-1.3-3-1-after.png) |
| ノア・正面左 | [前](noah-1.3-0-0-before.png) → [後](noah-1.3-0-0-after.png) | [前](noah-1.3-0-1-before.png) → [後](noah-1.3-0-1-after.png) |
| ノア・正面右 | [前](noah-1.3-1-0-before.png) → [後](noah-1.3-1-0-after.png) | [前](noah-1.3-1-1-before.png) → [後](noah-1.3-1-1-after.png) |
| ノア・背面右 | [前](noah-1.3-2-0-before.png) → [後](noah-1.3-2-0-after.png) | [前](noah-1.3-2-1-before.png) → [後](noah-1.3-2-1-after.png) |
| ノア・背面左 | [前](noah-1.3-3-0-before.png) → [後](noah-1.3-3-0-after.png) | [前](noah-1.3-3-1-before.png) → [後](noah-1.3-3-1-after.png) |

## 検証

`node tools/tests/work-contact.cjs`：31,104条件。両人物×家具4回転×8作業セル×27体型（高さ・幅・全体70／100／130%の全組み合わせ）×2コマ×3画面（390×844／320×568／844×390）×3ズーム（65／100／155%）。

- 手元基準点の縦の差は全検証条件で最大約0.862 CSS px、横の差は浮動小数点の丸め程度（約4.14e-14px）。前回残っていた縦約20.67px・横約6.49pxの差を解消した。
- 検証条件で作業板の高さは約0.356〜1.187マス。標準の天板0.85マスは変更していない。
- 頭部の上側・足元の固定、単調な縦変形、縦横の選択の逆写像、見えている手元での人物選択、表示計算の状態非変更、板が中央の道具と交差しないこと、張り出しが作業者セル内に収まることを確認。奥側に隠れる低い手元は選択成功の対象から除外する。
- 待機・移動・対象撤去・対象から離れた場合に補助板を含む接触描画を適用しない。[集計結果](report.json)。

回帰検証：`work-motions.cjs` の72セル・全作業・13件販売、`workflow.cjs --owner-study --noah-study` の20項目・3営業日、`furniture.cjs --once` の18項目も成功。

左右それぞれの指先の独立接触、生成コマの輪郭差、他設備での接触、Godot側の補正は未対応。31,104条件は離散的な27体型の検証であり、すべての中間値・輪郭ピクセルの接触を保証するものではない。今後はオーブン出し入れ・陳列・会計へ進む。

公開動画ページと既存MP4は今回の調整前の記録。画像やモデルの再生成は不要で、`node tools/tests/work-contact.cjs` が今回の描画・比較の再現手順。beforeの取得には上記の過去コミットがローカルgitに必要。
