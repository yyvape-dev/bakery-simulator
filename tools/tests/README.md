# MVPの簡潔な回帰確認

Node.js、Playwright、Chromiumを使用します。検証環境ではPlaywright 1.62.1と `/usr/bin/chromium` を使用しています。別の環境ではPlaywrightを開発用にインストールし、`BAKERY_CHROMIUM` でChromiumのパスを指定できます。

```
node tools/tests/workflow.cjs
node tools/tests/starter-shop.cjs
node tools/tests/interior-art.cjs
node tools/tests/exterior.cjs
node tools/tests/storybook-ui.cjs
node tools/tests/startup.cjs
node tools/tests/work-display.cjs
node tools/tests/work-motions.cjs
node tools/tests/work-contact.cjs
node tools/tests/equipment-contact.cjs
node tools/tests/interior.cjs
node tools/tests/furniture-art.cjs
node tools/tests/furniture.cjs --once
node tools/tests/workflow.cjs --published
node tools/tests/interior.cjs --published
node tools/tests/noah-art.cjs
node tools/tests/workflow.cjs --noah-study
node tools/tests/workflow.cjs --published --noah-study
node tools/tests/noah-art.cjs --owner-study
node tools/tests/workflow.cjs --owner-study --noah-study
node tools/tests/startup.cjs
```

前者はローカルのゲームファイルをスマホ相当Chromiumで操作します。後者は公開URLからHTML・スクリプト・素材をTLS検証付きで取得し、ローカル版とのバイト一致を確認してから、その公開ファイルをブラウザーへ配信して同じ操作を確認します。公開URLへの直接ブラウザーHTTPS接続やスマホ実機での検証とは区別します。

テストは各仕事への個別指示、一連の仕入れ〜会計、途中の再読み込み、材料・パン・現金の整合、担当変更と次の指示、設備移動・撤去と復旧、資金不足、旧セーブ、サイズ変更と接地点、3営業日と再投資、320×568／390×844表示、初期化を検証します。ゲーム本体にテスト用のエクスポートは含めず、テスト中だけ内部状態を参照します。時間を短縮するためブラウザーのタイマーを止め、作業分と歩行更新を進めます。

内装の23ケースでは、素材変更・資金不足・キャンセル・独立保存、境界壁と出入口の経路、壁材変更と撤去返金、作業面・入口・通過中の境界の保護、作業途中と外周壁を含む増築、最大16×16、小画面表示、拡張後3営業日、1か所の出入口を通る継続営業を確認します。

`starter-shop.cjs` は12×12の新規店舗、144マスの床・24枚の壁・必須4設備・装飾、全通路とサービス、初日営業、旧セーブ維持、初期化の確定／取消を確認します。画面と結果は `docs/starter-shop/` へ保存します。

`interior-art.cjs` は壁床6素材、3画面、48壁条件、出入口の透明性、画像失敗時の代替、保存非変更を確認し、前後画面を `docs/art/interior-finish/review/` へ保存します。比較元の取得には通常のGit履歴が必要です。

`exterior.cjs` は外観素材6枚、3扉の設定・保存、画角、店主の光学的なサイズ補正と足元、配置・所持金の維持、初回180分の販売を確認します。

`storybook-ui.cjs` は景色のボタン／ホイール／実ピンチ、UI寸法固定、焦点と足元、パンと全体表示、資産維持、全ウインドウと小画面を確認します。
