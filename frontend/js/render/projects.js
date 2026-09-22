/* ===== 프로젝트 카드 그리기 =====
   내용은 backend/data/projects.json 에서 온다.
   카드 안에는 상세 내용(.project-detail)이 숨겨진 채로 들어 있고,
   상세 모달과 인쇄용 PDF 문서가 그 내용을 함께 쓴다.
*/

import { el, append, sectionHeader, tagList } from '../dom.js';
import { createProjectDetail } from './detail.js';

function projectCard(project) {
  const card = el('article', 'card project-card fade-in');
  card.dataset.projectId = project.id;

  const heading = [project.number, project.field].filter(Boolean).join(' · ');
  const openButton = el('button', 'project-open', '자세히 보기 →');
  openButton.type = 'button';
  openButton.setAttribute('aria-haspopup', 'dialog');

  const detail = el('div', 'project-detail');
  detail.hidden = true;
  detail.appendChild(createProjectDetail(project));

  append(
    card,
    el('p', 'project-number', heading),
    el('h3', 'project-title', project.title),
    el('p', 'project-summary', project.summary),
    project.tags && project.tags.length ? tagList(project.tags) : null,
    openButton,
    detail
  );

  return card;
}

/**
 * 프로젝트 섹션을 그린다.
 * @param {HTMLElement} section #projects
 * @param {{label: string, title: string, desc: string, items: object[]}} projects
 */
export function renderProjects(section, projects) {
  const grid = el('div', 'project-grid');
  projects.items.forEach(project => grid.appendChild(projectCard(project)));

  section.replaceChildren(
    sectionHeader(projects.label, projects.title, projects.desc),
    grid
  );
}
