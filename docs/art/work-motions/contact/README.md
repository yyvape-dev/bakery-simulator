# 仕込み台と手元の高さ調整

2026-10-15。PR #4 の続き。変更は `art/work-motions` のみ。main のゲームへは未公開。

仕込み台の天板上面を床から1.525マス→0.85マスへ下げ、既存Blenderモデルを4方向へ再描画。XYの占有・床原点・カメラは維持し、Zだけを縮めた。道具・布も同じ比率で下がる。方向別の家具素材は通常URLでも共通なので、今後mainへ採用すると通常表示の仕込み台も低くなる。旧単方向フォールバックの `assets/prep.webp` は従来の高さ。

仕込み中だけ、各コマの生地／手元の基準点を作業している側の天板縁の高さへ合わせる。`character-motion.js` の `kneadHands` と `prepHeight` が基準。画面サイズ・ズーム・体型を反映した投影で計算し、頭部より下から足首より上の帯を縦方向に伸縮する。頭部の上側、足元アンカー、影、人物座標・経路・仕事時間・資産・保存データは固定。選択判定は変形の逆写像を使う。台の奥の人物は奥に描いたまま、手元の小さな領域だけ台の上に重ねる。

比較画像は同一の390×844画面、ズーム155%、各方向の同じ作業セル。beforeはPR #4の `0f17d244` の描画と仕込み台、afterは今回の描画。実際のゲームをChromiumで描画したもので、画像生成による比較ではない。

| 人物・向き | 調整前 | 調整後 |
| --- | --- | --- |
| 主人公・正面左 | [before](owner-0-before.png) | [after](owner-0-after.png) |
| 主人公・正面右 | [before](owner-1-before.png) | [after](owner-1-after.png) |
| 主人公・背面右 | [before](owner-2-before.png) | [after](owner-2-after.png) |
| 主人公・背面左 | [before](owner-3-before.png) | [after](owner-3-after.png) |
| ノア・正面左 | [before](noah-0-before.png) | [after](noah-0-after.png) |
| ノア・正面右 | [before](noah-1-before.png) | [after](noah-1-after.png) |
| ノア・背面右 | [before](noah-2-before.png) | [after](noah-2-after.png) |
| ノア・背面左 | [before](noah-3-before.png) | [after](noah-3-after.png) |

## 検証と残る範囲

`node tools/tests/work-contact.cjs`：両人物×家具4回転×人物4方向×体型3段階×2コマ＝192条件。各体型では高さ・幅・全体を同時に70/100/130%へ変更。標準体型の手元基準点と天板縁の縦の差は最大約0.252 CSS px（ズーム155%）。頭・足元の固定、変形の単調性、選択の逆写像・手元での人物選択、状態非変更、対象撤去・移動中・待機時の非適用も確認。[数値結果](report.json)。

極小体型は手元を無理に伸ばさないよう帯の45%で補正を制限。今回の条件で最大約17.87pxの高さ差が残る。全体型の厳密な接触、左右の各手の独立接触・腕のIK、オーブン／棚／レジの作業面は未調整。台の道具との部分的な重なりも今後の調整範囲。Godot比較は低くした台を使えるが、Webの手元補正・重ね描きは未移植。

過去の `game-actions.mp4`、`godot-actions.mp4` と公開動画ページは今回の調整前の記録。今回の確認資料はこのディレクトリの比較画像。

回帰検証：`work-motions.cjs`（72セル・全作業・13件販売）、`workflow.cjs --owner-study --noah-study`（20項目・3営業日）、`startup.cjs`（5ケース）、`furniture.cjs --once`（18項目）が成功。

## 再出力

```
blender -b --threads 4 --python tools/art/build_furniture.py -- prep
python tools/art/export_sprites.py prep
node tools/tests/work-contact.cjs
```

Blender 4.3.2／Pillowを使用。単一家具のexportは既存manifestと共通の投影を確認し、他の家具素材を書き換えない。人物の72セルは再生成していない。
