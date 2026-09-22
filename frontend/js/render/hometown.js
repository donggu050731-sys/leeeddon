/* ===== 고향(수원) 배너 그리기 =====
   내용은 backend/data/hometown.json 에서 온다.
*/

import { el, append, sectionHeader } from '../dom.js';

function image(src, alt, className) {
  const img = el('img', className);
  img.src = src;
  img.alt = alt;
  img.loading = 'lazy';
  return img;
}

export function renderHometown(section, hometown) {
  const banner = el('div', 'suwon-banner fade-in');

  // 위쪽 큰 사진
  const hero = el('div', 'suwon-banner-hero');
  const overlayText = el('div', 'suwon-title-overlay');
  append(overlayText, el('h2', null, hometown.hero.title), el('p', null, hometown.hero.desc));
  append(
    hero,
    image(hometown.hero.image, hometown.hero.alt),
    el('div', 'suwon-overlay'),
    overlayText
  );

  // 가운데 설명 카드
  const body = el('div', 'suwon-banner-body');
  hometown.cards.forEach(card => {
    const item = el('div', 'suwon-info-card');
    append(
      item,
      el('span', 'suwon-card-icon', card.icon),
      el('h3', null, card.title),
      el('p', null, card.text)
    );
    body.appendChild(item);
  });

  // 아래쪽 강조 (수원청개구리)
  const highlight = el('div', 'suwon-frog-section');
  const highlightText = el('div', 'suwon-frog-text');
  const highlightTitle = el('h3', null, hometown.highlight.title + ' ');
  highlightTitle.appendChild(el('span', 'suwon-frog-badge', hometown.highlight.badge));
  append(highlightText, highlightTitle, el('p', null, hometown.highlight.text));
  append(
    highlight,
    image(hometown.highlight.image, hometown.highlight.alt, 'suwon-frog-img'),
    highlightText
  );

  append(banner, hero, body, highlight);
  section.replaceChildren(sectionHeader(hometown.label, hometown.title), banner);
}
