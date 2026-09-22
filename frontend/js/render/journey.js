/* ===== 여정(타임라인) 그리기 =====
   내용은 backend/data/journey.json 에서 온다.
*/

import { el, append, sectionHeader } from '../dom.js';

export function renderJourney(section, journey) {
  const timeline = el('div', 'timeline');

  journey.items.forEach(entry => {
    const item = el('div', 'timeline-item');
    const content = el('div', 'timeline-content');
    append(
      content,
      el('p', 'timeline-year', entry.year),
      el('h3', 'timeline-title', entry.title),
      el('p', 'timeline-desc', entry.desc)
    );
    append(item, el('div', 'timeline-dot'), content);
    timeline.appendChild(item);
  });

  section.replaceChildren(sectionHeader(journey.label, journey.title), timeline);
}
