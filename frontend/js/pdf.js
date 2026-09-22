/* ===== [PDF] 구조화 문서 만들기 =====
   화면을 그대로 복제하지 않고, 데이터에서 필요한 내용만 뽑아 A4 문서(#pdf-doc)로 다시 조립한다.
   인쇄(css/print.css)는 이 문서만 출력한다.

   문서 구성: 표지 → 프로필 → 프로젝트 1건당 1장
*/

import { el, append, tagList, table } from './dom.js';
import { createProjectDetail, metaValue } from './render/detail.js';

/** 표지·프로필에 들어갈 기본 정보 표. profile.contact 가 있으면 연락처도 함께 넣는다. */
function profileRows(profile) {
  const rows = [
    ['이름', profile.name + ' (' + profile.nameEn + ')'],
    ['소속', profile.school],
    ['학과', profile.department],
    ['학번', profile.studentYear]
  ];

  // 연락처를 넣고 싶다면 backend/data/profile.json 에 다음을 추가하면 된다.
  //   "contact": [{ "label": "이메일", "value": "주소" }]
  (profile.contact || []).forEach(item => rows.push([item.label, item.value]));

  return rows;
}

/** 항목 이름이 왼쪽 열에 오는 표 */
function rowTable(rows) {
  const element = el('table', 'pdf-table');
  const body = el('tbody');

  rows.forEach(pair => {
    const row = el('tr');
    const label = el('th', null, pair[0]);
    label.scope = 'row';
    append(row, label, el('td', null, pair[1]));
    body.appendChild(row);
  });

  element.appendChild(body);
  return element;
}

function formatToday() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return now.getFullYear() + '.' + pad(now.getMonth() + 1) + '.' + pad(now.getDate());
}

function pageHead(profile, label) {
  const head = el('div', 'pdf-head');
  append(
    head,
    el('p', 'pdf-head-label', label),
    el('p', 'pdf-head-owner', profile.name + ' · ' + profile.department + ' ' + profile.studentYear)
  );
  return head;
}

/** 1장: 표지 */
function coverPage(profile, projects) {
  const page = el('section', 'pdf-page pdf-cover');

  append(
    page,
    el('p', 'pdf-cover-label', 'PORTFOLIO'),
    el('h1', 'pdf-cover-name', profile.name),
    el('p', 'pdf-cover-name-en', profile.nameEn.toUpperCase()),
    el('p', 'pdf-cover-affil', profile.school + ' ' + profile.department + ' ' + profile.studentYear)
  );

  const index = el('div', 'pdf-cover-index');
  index.appendChild(el('h2', 'pdf-cover-index-title', '수록 프로젝트'));

  const list = el('ol', 'pdf-cover-list');
  projects.items.forEach(project => {
    const item = el('li');
    append(
      item,
      el('strong', null, project.title),
      el('span', null, [project.field, metaValue(project, ['형태'])].filter(Boolean).join(' · '))
    );
    list.appendChild(item);
  });
  index.appendChild(list);
  page.appendChild(index);

  const foot = el('div', 'pdf-cover-foot');
  foot.appendChild(el('p', null, '출력일 ' + formatToday()));
  if (location.protocol === 'http:' || location.protocol === 'https:') {
    foot.appendChild(el('p', null, '웹 포트폴리오 ' + location.origin + location.pathname));
  }
  page.appendChild(foot);

  return page;
}

/** 2장: 프로필 + 프로젝트 한눈에 보기 */
function profilePage(profile, projects) {
  const page = el('section', 'pdf-page');

  append(
    page,
    pageHead(profile, 'PROFILE'),
    el('h2', 'pdf-title', '프로필'),
    rowTable(profileRows(profile)),
    el('h3', 'pdf-section-title', '프로젝트 개요'),
    table(
      'pdf-table',
      ['프로젝트', '분야', '형태', '과목 · 구분'],
      projects.items.map(project => [
        project.title,
        project.field,
        metaValue(project, ['형태']),
        metaValue(project, ['과목', '구분'])
      ])
    )
  );

  const tools = projects.items
    .map(project => [project.number, metaValue(project, ['사용 도구'])])
    .filter(pair => pair[1]);

  if (tools.length) {
    const list = el('ul', 'pdf-list');
    tools.forEach(pair => list.appendChild(el('li', null, pair[0] + ' — ' + pair[1])));
    append(page, el('h3', 'pdf-section-title', '프로젝트에서 사용한 도구'), list);
  }

  const keywords = [];
  projects.items.forEach(project => {
    (project.blocks || []).forEach(block => {
      if (block.heading !== '키워드' || !block.tags) return;
      block.tags.forEach(keyword => {
        if (keywords.indexOf(keyword) === -1) keywords.push(keyword);
      });
    });
  });

  if (keywords.length) {
    append(page, el('h3', 'pdf-section-title', '프로젝트 키워드'), tagList(keywords));
  }

  return page;
}

/** 3장 이후: 프로젝트 1건 = 1장 (내용이 길면 다음 장으로 이어진다) */
function projectPage(profile, project) {
  const page = el('section', 'pdf-page');

  append(
    page,
    pageHead(profile, [project.number, project.field].filter(Boolean).join(' · ')),
    el('h2', 'pdf-title', project.title),
    el('p', 'pdf-lead', project.summary)
  );

  page.appendChild(createProjectDetail(project));
  return page;
}

/**
 * 인쇄용 문서를 만들어 #pdf-doc 안에 넣는다.
 * @param {{profile: object, projects: object}} data
 */
export function buildPdfDocument(data) {
  const doc = document.getElementById('pdf-doc');
  const pages = [
    coverPage(data.profile, data.projects),
    profilePage(data.profile, data.projects),
    ...data.projects.items.map(project => projectPage(data.profile, project))
  ];
  doc.replaceChildren(...pages);
}
