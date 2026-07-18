# 桜運輸株式会社 公式サイト

愛知県弥富市の運送会社・桜運輸株式会社のコーポレートサイトです。
静的な HTML / CSS / JavaScript のみで構成されており、ビルド工程・サーバーサイド処理はありません。

## 構成

```
├ index.html            … トップページ
├ our_business.html     … 事業紹介
├ vehicle.html          … 保有車両
├ company.html          … 会社概要
├ recruit.html          … 採用情報
├ safety.html           … 安全への取り組み
├ reason.html           … 選ばれる理由
├ news.html             … お知らせ一覧
├ news/                 … お知らせ個別記事（1記事=1ファイル）
├ contact.html          … お問い合わせ
├ privacy.html          … プライバシーポリシー
├ 404.html              … Not Foundページ
├ sitemap.xml / robots.txt
└ assets/               … CSS / JS / 画像
```

## ローカルでの動作確認

```bash
python3 -m http.server 8000
# → http://localhost:8000/
```

## お知らせの追加

`news/_template.html` をコピーして記事を作成し、`news.html` の一覧・`index.html` の新着欄・`sitemap.xml` に追記します。
詳細手順はテンプレートファイル内のコメントを参照してください。

## ライセンス

© 桜運輸株式会社（サイト内の文章・画像の無断転載を禁じます）
