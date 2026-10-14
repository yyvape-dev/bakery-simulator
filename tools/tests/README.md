# MVPの簡潔な回帰確認

Node.js、Playwright、Chromiumを使用します。検証環境ではPlaywright 1.62.1と `/usr/bin/chromium` を使用しています。別の環境ではPlaywrightを開発用にインストールし、`BAKERY_CHROMIUM` でChromiumのパスを指定できます。

```
node tools/tests/workflow.cjs
node tools/tests/interior.cjs
node tools/tests/furniture.cjs --once
node tools/tests/workflow.cjs --published
node tools/tests/interior.cjs --published
node tools/tests/noah-art.cjs
node tools/tests/workflow.cjs --noah-study
node tools/tests/workflow.cjs --published --noah-study
```

前者はローカルのゲームファイルをスマホ相当Chromiumで操作します。後者は公開URLからHTML・スクリプト・素材をTLS検証付きで取得し、ローカル版とのバイト一致を確認してから、その公開ファイルをブラウザーへ配信して同じ操作を確認します。公開URLへの直接ブラウザーHTTPS接続やスマホ実機での検証とは区別します。

テストは各仕事への個別指示、一連の仕入れ〜会計、途中の再読み込み、材料・パン・現金の整合、担当変更と次の指示、設備移動・撤去と復旧、資金不足、旧セーブ、サイズ変更と接地点、3営業日と再投資、320×568／390×844表示、初期化を検証します。ゲーム本体にテスト用のエクスポートは含めず、テスト中だけ内部状態を参照します。時間を短縮するためブラウザーのタイマーを止め、作業分と歩行更新を進めます。

内装の23ケースでは、素材変更・資金不足・キャンセル・独立保存、境界壁と出入口の経路、壁材変更と撤去返金、作業面・入口・通過中の境界の保護、作業途中と外周壁を含む増築、最大16×16、小画面表示、拡張後3営業日、1か所の出入口を通る継続営業を確認します。
