// ============================================================
// 桜運輸株式会社 共通スクリプト
// ・ヘッダーの縮小
// ・スクロール連動のふわっと表示
// ・緑カーテンのページ遷移（実際に遷移する）
// ============================================================

// ヘッダー：スクロールで少し縮む
const header = document.getElementById('header');
if (header) {
  addEventListener('scroll', () => header.classList.toggle('shrink', scrollY > 80), {passive:true});
}

// ハンバーガーメニューの開閉
const menuBtn = document.getElementById('menuBtn');
if (menuBtn) {
  menuBtn.addEventListener('click', () => document.body.classList.toggle('menu-open'));
}

// スクロール連動のふわっと表示
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
}), {threshold:.16});
document.querySelectorAll('.rev').forEach(el => io.observe(el));

// ページ遷移カーテン：カーテンが閉じきったタイミングで実際に遷移する
const curtain = document.getElementById('curtain');
document.querySelectorAll('a[data-transition]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:')) return;
    e.preventDefault();
    if (curtain.classList.contains('play')) return;
    curtain.classList.add('play');
    setTimeout(() => { location.href = href; }, 620);
  });
});

// ブラウザの「戻る」でキャッシュ復元されたときにカーテン・ベールを初期化
window.addEventListener('pageshow', e => {
  if (e.persisted) {
    curtain?.classList.remove('play');
    document.querySelector('.veil')?.remove();
  }
});

// メニューの背景タップでも閉じる（リンク以外の場所）
document.getElementById('mnav')?.addEventListener('click', e => {
  if (e.target.tagName !== 'A') document.body.classList.remove('menu-open');
});
