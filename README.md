# 桜運輸株式会社 コーポレートサイト 納品データ

2026-07-17 時点の最新版です。静的な HTML / CSS / JavaScript のみで構成されており、
ビルド工程・サーバーサイド処理は一切ありません。フォルダごとWebサーバーに配置すれば動作します。

## フォルダ構成

```
sakura-unyu-site/
├ index.html          … トップページ（オープニング演出付き）
├ our_business.html   … 事業紹介
├ vehicle.html        … 保有車両
├ company.html        … 会社概要
├ recruit.html        … 採用情報（道路アニメ・カウントアップ・写真マーキー）
├ safety.html         … 安全への取り組み
├ news.html           … お知らせ
├ contact.html        … お問い合わせ（フォームはデモ・未接続 ※後述）
├ reason.html         … 選ばれる理由
└ assets/
   ├ site.css         … 下層ページ共通スタイル（index.html のみスタイルはインライン）
   ├ site.js          … 下層ページ共通スクリプト（index.html のみスクリプトはインライン）
   └ img/             … 画像一式（Web用に軽量化済み・すべてローカル参照）
```

## 動作確認方法

file:// 直開きでも概ね動作しますが、挙動確認は簡易サーバー推奨です。

```
cd sakura-unyu-site
python3 -m http.server 8000
# → http://localhost:8000/
```

## 実装メモ

- **トップのオープニング演出**: 写真7枚のモンタージュ→ロゴアニメ（約6秒）。クリックでスキップ可。
  `sessionStorage`（キー: `sakuraOpSeen`）で同一セッション2回目以降は短縮版（約2.4秒）になります。
- **ページ遷移**: `a[data-transition]` クリックで緑カーテンを再生し、620ms後に `location.href` で実遷移。
  下層ページ側は `.veil` が遷移の受けになっています。
- **ハンバーガーメニュー**: 全ページ右上。`body.menu-open` のトグルのみの単純実装です。
  幅1080px以下でヘッダーの横並びナビが非表示になり、メニューボタンが実質の導線になります。
- **スクロール連動表示**: `.rev` 要素を IntersectionObserver で `.on` 付与。
- **キャッシュバスター**: 下層ページの `site.css?v=2` / `site.js?v=2`。更新時は数字を上げてください。
- **フォント**: Google Fonts（Noto Sans JP / Oswald）を CDN 読み込み。オフライン要件がある場合はセルフホストへ。
- **favicon**: `assets/img/logo_sakura.png` を簡易指定。必要に応じて .ico /各サイズを整備してください。

## 公開前に対応が必要な項目

1. **お問い合わせフォーム（contact.html）**: 送信機能は未接続のデモです（送信ボタンで案内表示のみ）。
   フォームサービス（Formspree等）または任意のバックエンドへの接続をお願いします。
   ページ内にもデモである旨の注記があります。接続後にその注記の削除もお願いします。
2. **お知らせの更新（news.html）**: 記事は `.newslist` 内の `<div class="item">` を直接編集する方式です。
   運用方針（更新代行 / CMS化など）に応じて調整してください。
3. **安全ページのPDF**: 元サイトにあった「安全目標PDF」は元データが取得できなかったため未設置です。
4. **OGP / アナリティクス**: meta description は設定済みですが、OGPタグ・計測タグは未設定です。

## 元サイト

Studio プレビュー: https://preview.studio.site/live/4yqBzyMbqj
（本データは上記の構成・文言を踏襲し、写真の実データ差し替えとアニメーション強化を行ったものです）
