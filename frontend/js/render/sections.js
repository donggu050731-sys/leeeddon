/* ===== 표지 · 기본 정보 · 푸터 그리기 =====
   내용은 backend/data/profile.json 에서 온다.
*/

import { el, append, sectionHeader } from '../dom.js';

/** 네비게이션 왼쪽 로고 */
export function renderLogo(target, profile) {
  target.textContent = profile.logo;
}

/** 첫 화면 (이름 · 소속 · 한 줄 소개) */
export function renderHero(section, profile) {
  const content = el('div', 'hero-content');

  const badge = el('div', 'hero-badge');
  badge.appendChild(el('span', 'dot'));
  badge.appendChild(document.createTextNode(profile.hero.badge));

  const cta = el('a', 'hero-cta', profile.hero.cta.text);
  cta.href = profile.hero.cta.href;
  cta.appendChild(el('span', 'arrow', '→'));

  append(
    content,
    badge,
    el('h1', 'hero-name', profile.name),
    el('p', 'hero-subtitle', profile.nameEn),
    el('p', 'hero-tagline', profile.hero.tagline),
    cta
  );

  const indicator = el('div', 'scroll-indicator');
  append(indicator, el('div', 'mouse'), el('span', null, '스크롤'));

  section.replaceChildren(content, indicator);
}

/** 기본 정보 카드 */
export function renderAbout(section, profile) {
  const grid = el('div', 'profile-grid');

  profile.about.cards.forEach(card => {
    const item = el('div', 'card fade-in');
    append(
      item,
      el('div', 'card-icon ' + card.tone, card.icon),
      el('p', 'card-title', card.title),
      el('p', 'card-value', card.value),
      el('p', 'card-desc', card.desc)
    );
    grid.appendChild(item);
  });

  section.replaceChildren(sectionHeader(profile.about.label, profile.about.title), grid);
}

/** 맨 아래 저작 표시 */
export function renderFooter(footer, profile) {
  const text = el('p', 'footer-text');
  text.appendChild(document.createTextNode(profile.footer.prefix + ' '));
  text.appendChild(el('span', 'footer-name', profile.footer.name));
  text.appendChild(document.createTextNode(' · ' + profile.footer.suffix));
  footer.replaceChildren(text);
}
