/**
 * お知らせ 静的生成ビルド（microCMS → 静的HTML）
 * ============================================================
 * microCMS の news を全件取得し、以下を再生成する：
 *   - news/<id>.html          … 各記事ページ
 *   - news.html               … 一覧（マーカー間 ＋ JSON-LD ItemList）
 *   - index.html              … トップの新着欄（マーカー間・最新1件）
 *   - sitemap.xml             … お知らせURL（マーカー間）
 *
 * 実行環境：Node 20+（グローバル fetch 使用・外部依存なし）
 * 環境変数：
 *   MICROCMS_SERVICE_ID  例) sakura-unyu
 *   MICROCMS_API_KEY     読み取り(GET)可能なAPIキー
 *   MICROCMS_MOCK=1      ← 指定時はAPIを叩かずサンプルデータで動作（ローカル検証用）
 *   NEWS_ROOT            ← 対象リポジトリのルート（既定: カレント）
 *
 * APIキーが無い場合は「まだ未接続」とみなし、何もせず正常終了(0)する。
 * （Secret設定前のpushでCIが赤くならないための安全設計）
 */
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.env.NEWS_ROOT || '.';
const SERVICE_ID = process.env.MICROCMS_SERVICE_ID;
const API_KEY = process.env.MICROCMS_API_KEY;
const SITE = 'https://www.sakuraunyu.com';
const DEFAULT_OG = `${SITE}/assets/img/slide2.jpg`;

// ---- サンプルデータ（MOCK時）：引き継ぎ書のAPIレスポンス例に準拠 ----
const MOCK_CONTENTS = [
  {
    id: 'escxq6a5762',
    publishedAt: '2026-07-19T02:30:52.238Z',
    title: 'ホームページをリニューアルしました',
    category: ['お知らせ'],
    body: '<p>桜運輸株式会社の公式ホームページを公開いたしました。今後、当社からのお知らせを随時掲載してまいります。</p><p>引き続き桜運輸株式会社をよろしくお願いいたします。</p>',
    thumbnail: { url: 'https://images.microcms-assets.io/assets/demo/sample.png', width: 1200, height: 630 },
  },
];

// ============================================================
// ユーティリティ
// ============================================================
const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const stripTags = (html) =>
  String(html ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

const fmtDate = (iso) => {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return { ymd: `${y}-${m}-${day}`, dot: `${y}.${m}.${day}` };
};

const catOf = (c) => {
  const v = Array.isArray(c) ? c[0] : c;
  return v || 'お知らせ';
};

// microCMS本文の<img>に loading="lazy" と max-width を付与
const enhanceBody = (html) =>
  String(html ?? '').replace(/<img (?![^>]*loading=)/gi, '<img loading="lazy" ');

// マーカー間を置換
const replaceBetween = (content, start, end, inner) => {
  const s = content.indexOf(start);
  const e = content.indexOf(end);
  if (s === -1 || e === -1) throw new Error(`マーカーが見つかりません: ${start}`);
  return content.slice(0, s + start.length) + '\n' + inner + '\n' + content.slice(e);
};

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

// ============================================================
// 記事ページHTML
// ============================================================
function articleHtml(item) {
  const { ymd, dot } = fmtDate(item.publishedAt);
  const cat = catOf(item.category);
  const title = item.title || '（無題）';
  const desc = (item.description && String(item.description).trim()) || stripTags(item.body).slice(0, 110);
  const og = item.thumbnail?.url || DEFAULT_OG;
  const file = `${item.id}.html`;
  const body = enhanceBody(item.body);
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${esc(desc)}">
<link rel="icon" type="image/png" href="../assets/img/logo_sakura.png">
<title>${esc(title)}｜お知らせ｜桜運輸株式会社</title>
<link rel="canonical" href="${SITE}/news/${file}">
<meta property="og:type" content="article">
<meta property="og:locale" content="ja_JP">
<meta property="og:site_name" content="桜運輸株式会社">
<meta property="og:title" content="${esc(title)}｜桜運輸株式会社">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}/news/${file}">
<meta property="og:image" content="${esc(og)}">
<meta property="article:published_time" content="${ymd}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Oswald:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/site.css?v=2">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": ${JSON.stringify(title)},
  "datePublished": "${ymd}",
  "dateModified": "${ymd}",
  "image": ["${og}"],
  "author": {"@type": "Organization", "name": "桜運輸株式会社", "url": "${SITE}/"},
  "publisher": {
    "@type": "Organization",
    "name": "桜運輸株式会社",
    "logo": {"@type": "ImageObject", "url": "${SITE}/assets/img/logo_sakura.png"}
  },
  "mainEntityOfPage": {"@type": "WebPage", "@id": "${SITE}/news/${file}"},
  "description": ${JSON.stringify(desc)}
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "ホーム", "item": "${SITE}/"},
    {"@type": "ListItem", "position": 2, "name": "お知らせ", "item": "${SITE}/news.html"},
    {"@type": "ListItem", "position": 3, "name": ${JSON.stringify(title)}, "item": "${SITE}/news/${file}"}
  ]
}
</script>
<style>
.article{max-width:800px;margin:0 auto}
.article .crumbs{font-size:12.5px;color:var(--gray);margin-bottom:26px;letter-spacing:.04em}
.article .crumbs a{color:var(--green)}
.article .meta{display:flex;align-items:center;gap:14px;margin-bottom:16px}
.article .meta time{font-family:var(--en);font-size:14px;letter-spacing:.08em;color:var(--gray)}
.article .meta .cat{font-size:12px;font-weight:700;color:var(--green);background:rgba(45,106,79,.1);border-radius:999px;padding:3px 16px}
.article h1{font-size:clamp(22px,3vw,30px);font-weight:700;line-height:1.7;color:var(--green-deep);margin-bottom:30px;padding-bottom:26px;border-bottom:2px solid #e3e2da}
.article .lead{display:block;width:100%;height:auto;border-radius:12px;margin:0 0 34px}
.article .body{font-size:15px;color:#3c443f;line-height:2.05}
.article .body p{margin:0 0 1.5em}
.article .body img{border-radius:12px;margin:12px 0 28px;max-width:100%;height:auto}
.article .back{margin-top:56px;text-align:center}
</style>
</head>
<body>
<div class="veil"></div>
<div class="curtain" id="curtain"><span class="mark"><img src="../assets/img/logo_sakura_white.png" alt="">桜運輸株式会社</span></div>

<header class="header" id="header">
  <a class="brand" href="../index.html" data-transition><img src="../assets/img/logo_sakura_green.png" alt="桜運輸のロゴ">桜運輸株式会社</a>
  <nav class="gnav">
    <a href="../index.html" data-transition>TOP</a>
    <a href="../our_business.html" data-transition>事業紹介</a>
    <a href="../vehicle.html" data-transition>保有車両</a>
    <a href="../company.html" data-transition>会社概要</a>
    <a href="../recruit.html" data-transition>採用情報</a>
    <a href="../safety.html" data-transition>安全の取り組み</a>
    <a href="../news.html" class="current" data-transition>お知らせ</a>
    <a class="cta" href="../contact.html" data-transition><span>お問い合わせ</span></a>
  </nav>
  <button class="menu-btn" id="menuBtn" aria-label="メニューを開く"><span class="bars"><span></span><span></span><span></span></span></button>
</header>

<div class="mnav" id="mnav">
  <nav>
    <a href="../index.html" data-transition>TOP</a><a href="../our_business.html" data-transition>事業紹介</a>
    <a href="../vehicle.html" data-transition>保有車両</a><a href="../company.html" data-transition>会社概要</a>
    <a href="../recruit.html" data-transition>採用情報</a><a href="../safety.html" data-transition>安全への取り組み</a>
    <a href="../news.html" data-transition>お知らせ</a><a href="../contact.html" data-transition>お問い合わせ</a>
  </nav>
</div>

<section class="pagehead">
  <div class="bg" style="background-image:url('../assets/img/slide2.jpg')"></div>
  <div class="in">
    <span class="en"><span>News</span></span>
    <span class="ja">お知らせ</span>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <article class="article rev">
      <p class="crumbs"><a href="../index.html" data-transition>ホーム</a> ＞ <a href="../news.html" data-transition>お知らせ</a> ＞ ${esc(title)}</p>
      <div class="meta">
        <time datetime="${ymd}">${dot}</time>
        <span class="cat">${esc(cat)}</span>
      </div>
      <h1>${esc(title)}</h1>
${item.thumbnail?.url ? `      <img class="lead" src="${esc(item.thumbnail.url)}" alt="${esc(title)}"${item.thumbnail.width ? ` width="${item.thumbnail.width}" height="${item.thumbnail.height}"` : ''} loading="eager">\n` : ''}      <div class="body">
${body}
      </div>
      <div class="back">
        <a class="btn btn--line" href="../news.html" data-transition>お知らせ一覧へ戻る</a>
      </div>
    </article>
  </div>
</section>

<footer class="footer">
  <div class="wrap">
    <div>
      <div class="name"><img src="../assets/img/logo_sakura_white.png" alt="">桜運輸株式会社</div>
      <address>〒498-0063<br>愛知県弥富市東末広九丁目51番地</address>
    </div>
    <nav>
      <a href="../index.html" data-transition>TOP</a><a href="../our_business.html" data-transition>事業紹介</a>
      <a href="../vehicle.html" data-transition>保有車両</a><a href="../company.html" data-transition>会社概要</a>
      <a href="../recruit.html" data-transition>採用情報</a><a href="../safety.html" data-transition>安全への取り組み</a>
      <a href="../news.html" data-transition>お知らせ</a><a href="../contact.html" data-transition>お問い合わせ</a>
      <a href="../privacy.html" data-transition>プライバシーポリシー</a>
    </nav>
  </div>
  <div class="copy">© 2026 桜運輸株式会社</div>
</footer>

<script src="../assets/site.js?v=2"></script>
</body>
</html>
`;
}

// ============================================================
// 一覧・トップ・sitemap の部品
// ============================================================
function listItemsHtml(items) {
  return items
    .map((it) => {
      const { dot } = fmtDate(it.publishedAt);
      return `      <a class="item" href="news/${it.id}.html" data-transition>
        <div class="meta">
          <span class="date">${dot}</span>
          <span class="cat">${esc(catOf(it.category))}</span>
        </div>
        <span class="ttl">${esc(it.title)}</span>
        <span class="arw">${ARROW}</span>
      </a>`;
    })
    .join('\n');
}

function listJsonLd(items) {
  const els = items
    .map(
      (it, i) =>
        `      {"@type": "ListItem", "position": ${i + 1}, "url": "${SITE}/news/${it.id}.html", "name": ${JSON.stringify(it.title)}}`
    )
    .join(',\n');
  return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "お知らせ一覧｜桜運輸株式会社",
  "url": "${SITE}/news.html",
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
${els}
    ]
  }
}
</script>`;
}

function topNewsHtml(items) {
  const latest = items.slice(0, 1);
  if (latest.length === 0) return '';
  return latest
    .map((it) => {
      const { dot } = fmtDate(it.publishedAt);
      return `    <a class="hnews rev d1" href="news/${it.id}.html" data-transition>
      <span class="hnews__date">${dot}</span>
      <span class="hnews__cat">${esc(catOf(it.category))}</span>
      <span class="hnews__ttl">${esc(it.title)}</span>
      <span class="hnews__arw">${ARROW}</span>
    </a>`;
    })
    .join('\n');
}

function sitemapUrls(items) {
  return items
    .map((it) => {
      const { ymd } = fmtDate(it.publishedAt);
      return `  <url>
    <loc>${SITE}/news/${it.id}.html</loc>
    <lastmod>${ymd}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>`;
    })
    .join('\n');
}

// ============================================================
// メイン
// ============================================================
async function fetchNews() {
  if (process.env.MICROCMS_MOCK) {
    console.log('▶ MOCKモード：サンプルデータで実行');
    return MOCK_CONTENTS;
  }
  const url = `https://${SERVICE_ID}.microcms.io/api/v1/news?limit=100&orders=-publishedAt`;
  const res = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': API_KEY } });
  if (!res.ok) throw new Error(`microCMS APIエラー ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.contents || [];
}

async function main() {
  if (!process.env.MICROCMS_MOCK && (!SERVICE_ID || !API_KEY)) {
    console.log('⏭ MICROCMS_SERVICE_ID / MICROCMS_API_KEY が未設定のためスキップ（正常終了）');
    return;
  }

  const items = await fetchNews();
  console.log(`▶ 取得: ${items.length}件`);

  // 1) news/ を再生成（*.html は本ビルドが管理。_template.html は残す）
  const newsDir = join(ROOT, 'news');
  for (const f of readdirSync(newsDir)) {
    if (f.endsWith('.html') && f !== '_template.html') unlinkSync(join(newsDir, f));
  }
  for (const it of items) {
    writeFileSync(join(newsDir, `${it.id}.html`), articleHtml(it));
  }
  console.log(`  ✓ 記事ページ ${items.length}件を生成`);

  // 2) news.html（一覧＋JSON-LD）
  const newsHtmlPath = join(ROOT, 'news.html');
  let newsHtml = readFileSync(newsHtmlPath, 'utf8');
  newsHtml = replaceBetween(newsHtml, '<!-- NEWS_ITEMS:START -->', '<!-- NEWS_ITEMS:END -->', listItemsHtml(items));
  newsHtml = replaceBetween(newsHtml, '<!-- NEWS_JSONLD:START -->', '<!-- NEWS_JSONLD:END -->', listJsonLd(items));
  writeFileSync(newsHtmlPath, newsHtml);
  console.log('  ✓ news.html 更新');

  // 3) index.html（トップ新着）
  const indexPath = join(ROOT, 'index.html');
  let indexHtml = readFileSync(indexPath, 'utf8');
  indexHtml = replaceBetween(indexHtml, '<!-- NEWS_TOP:START -->', '<!-- NEWS_TOP:END -->', topNewsHtml(items));
  writeFileSync(indexPath, indexHtml);
  console.log('  ✓ index.html 更新');

  // 4) sitemap.xml
  const sitemapPath = join(ROOT, 'sitemap.xml');
  let sitemap = readFileSync(sitemapPath, 'utf8');
  sitemap = replaceBetween(sitemap, '<!-- NEWS_URLS:START -->', '<!-- NEWS_URLS:END -->', sitemapUrls(items));
  writeFileSync(sitemapPath, sitemap);
  console.log('  ✓ sitemap.xml 更新');

  console.log('✅ ビルド完了');
}

main().catch((e) => {
  console.error('❌ ビルド失敗:', e.message);
  process.exit(1);
});
