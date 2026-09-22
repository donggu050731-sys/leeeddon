/* ===== 프로젝트 내용 정리 · 상세 내용 만들기 =====
   화면 카드 · 상세 모달 · 인쇄용 PDF 문서가 모두 이 파일을 쓴다.

   프로젝트에는 두 가지 형태가 있다.
     ① 기존 자료형 : blocks(소제목별 내용) · meta(개요 표) 가 들어 있는 프로젝트
     ② 관리자 입력형 : 관리자 화면에서 제목·역할·설명·날짜·인원수·참고사항만 입력한 프로젝트
   normalizeProject() 가 둘을 같은 모양으로 바꿔주므로, 그리는 쪽에서는 구분할 필요가 없다.
*/

import { el, append, labeledLine, tagList, table } from '../dom.js';

function pad(number) {
  return String(number).padStart(2, '0');
}

/** 관리자 입력형 → 기존 자료형과 같은 모양으로 */
function fromAdminFields(project) {
  const meta = [];
  if (project.role) meta.push(['내가 한 역할', project.role]);
  if (project.date) meta.push(['날짜', project.date]);
  if (project.teamSize) meta.push(['참여인원', project.teamSize + '명']);

  const blocks = [];
  if (project.description) {
    blocks.push({ heading: '설명', paragraphs: [{ text: project.description }] });
  }
  if (project.notes) {
    blocks.push({ heading: '참고사항', paragraphs: [{ text: project.notes }] });
  }

  const tags = [];
  if (project.teamSize) tags.push(project.teamSize + '인 팀');
  if (project.date) tags.push(project.date);

  return { meta, blocks, tags };
}

/**
 * 어떤 형태로 들어오든 화면이 쓰기 좋은 모양으로 정리한다.
 * @param {object} project 프로젝트 1건
 * @param {number} index 목록에서의 순서 (번호를 매기는 데 쓴다)
 */
export function normalizeProject(project, index) {
  const hasBlocks = Array.isArray(project.blocks) && project.blocks.length > 0;
  const converted = hasBlocks ? null : fromAdminFields(project);

  return {
    id: project.id,
    number: 'PROJECT ' + pad(index + 1),
    field: project.field || '',
    title: project.title || '(제목 없음)',
    summary: project.summary || project.description || '',
    tags: project.tags && project.tags.length ? project.tags : (converted ? converted.tags : []),
    meta: hasBlocks ? (project.meta || []) : converted.meta,
    blocks: hasBlocks ? project.blocks : converted.blocks,
    source: project.source || ''
  };
}

/** 개요 표 (분야 · 형태 · 과목 …) */
function metaList(meta) {
  const list = el('dl', 'detail-meta');
  meta.forEach(pair => {
    list.appendChild(el('dt', null, pair[0]));
    list.appendChild(el('dd', null, pair[1]));
  });
  return list;
}

/** 소제목 하나와 그 아래 내용 (순서: 목록 → 표 → 설명 → 참고 → 키워드) */
function detailBlock(block) {
  const wrap = el('div', 'detail-block');
  wrap.appendChild(el('h4', null, block.heading));

  if (block.items && block.items.length) {
    const list = el('ul');
    block.items.forEach(item => list.appendChild(labeledLine('li', item)));
    wrap.appendChild(list);
  }

  if (block.table) {
    const scroll = el('div', 'table-wrap');
    scroll.appendChild(table('detail-table', block.table.headers, block.table.rows));
    wrap.appendChild(scroll);
  }

  if (block.paragraphs && block.paragraphs.length) {
    block.paragraphs.forEach(paragraph => wrap.appendChild(labeledLine('p', paragraph)));
  }

  if (block.note) {
    wrap.appendChild(el('p', 'detail-note', block.note));
  }

  if (block.tags && block.tags.length) {
    wrap.appendChild(tagList(block.tags));
  }

  return wrap;
}

/**
 * 프로젝트 1건의 상세 내용을 통째로 만든다.
 * @param {object} view normalizeProject() 가 정리한 값
 * @returns {DocumentFragment}
 */
export function createProjectDetail(view) {
  const fragment = document.createDocumentFragment();

  if (view.meta && view.meta.length) {
    fragment.appendChild(metaList(view.meta));
  }

  (view.blocks || []).forEach(block => fragment.appendChild(detailBlock(block)));

  if (view.source) {
    fragment.appendChild(el('p', 'detail-source', view.source));
  }

  return fragment;
}

/** 개요 표에서 값 하나를 찾아온다. 예: metaValue(view, ['과목', '구분']) */
export function metaValue(view, keys) {
  const found = (view.meta || []).find(pair => keys.indexOf(pair[0]) !== -1);
  return found ? found[1] : '';
}
