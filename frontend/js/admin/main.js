/* ===== 관리자 화면 동작 =====
   ① 로그인 → ② 목록 보기 → ③ 새로 저장 / 수정 / 삭제 / 공개·초안 전환

   빈칸 검사는 여기(화면)와 서버 양쪽에서 한다.
   화면 검사는 바로 알려주기 위한 것이고, 진짜 검사는 서버(admin.service.js)가 한다.
*/

import * as api from './api.js';

// 공개하려면 채워야 하는 칸 (참고사항은 빠진다)
const REQUIRED = [
  ['title', '제목'],
  ['role', '내가 한 역할'],
  ['description', '설명'],
  ['date', '날짜'],
  ['teamSize', '참여인원 수']
];

const view = {
  login: document.getElementById('login-view'),
  admin: document.getElementById('admin-view')
};

const form = document.getElementById('project-form');
const fields = {
  title: document.getElementById('title'),
  role: document.getElementById('role'),
  description: document.getElementById('description'),
  date: document.getElementById('date'),
  teamSize: document.getElementById('teamSize'),
  notes: document.getElementById('notes')
};

const listElement = document.getElementById('project-list');
const formTitle = document.getElementById('form-title');
const formState = document.getElementById('form-state');
const formMessage = document.getElementById('form-message');
const loginMessage = document.getElementById('login-message');
const readonlyNotice = document.getElementById('readonly-notice');
const saveButton = document.getElementById('save-button');
const deleteButton = document.getElementById('delete-button');

const duplicatePanel = document.getElementById('duplicate-panel');
const duplicateText = document.getElementById('duplicate-text');
const duplicateHint = document.getElementById('duplicate-hint');

let projects = [];
let selectedId = null;   // null 이면 '새 프로젝트'
let editable = true;
let duplicate = null;    // 중복 안내가 떠 있을 때 { 기존 프로젝트, 입력한 내용 }

/* ---------------- 화면 전환 ---------------- */

function showAdmin() {
  view.login.hidden = true;
  view.admin.hidden = false;
}

function showLogin(message) {
  view.admin.hidden = true;
  view.login.hidden = false;
  loginMessage.textContent = message || '';
  loginMessage.classList.remove('ok');
}

function setMessage(element, text, ok) {
  element.textContent = text;
  element.classList.toggle('ok', Boolean(ok));
}

/* ---------------- 목록 ---------------- */

function statusLabel(status) {
  return status === 'published' ? '공개' : '초안';
}

function renderList() {
  listElement.replaceChildren();

  if (!projects.length) {
    const empty = document.createElement('li');
    empty.className = 'hint';
    empty.textContent = '아직 프로젝트가 없습니다. [+ 새 프로젝트]를 눌러 시작하세요.';
    listElement.appendChild(empty);
    return;
  }

  projects.forEach(project => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'project-item' + (project.id === selectedId ? ' selected' : '');

    const title = document.createElement('span');
    title.className = 'project-item-title';
    title.textContent = project.title || '(제목 없음)';

    const meta = document.createElement('span');
    meta.className = 'project-item-meta';

    const badge = document.createElement('span');
    badge.className = 'badge ' + project.status;
    badge.textContent = statusLabel(project.status);
    meta.appendChild(badge);

    const note = document.createElement('span');
    note.textContent = project.editable ? (project.date || '날짜 없음') : '상세 자료 포함';
    meta.appendChild(note);

    button.append(title, meta);
    button.addEventListener('click', () => select(project.id));

    item.appendChild(button);
    listElement.appendChild(item);
  });
}

/* ---------------- 양식 ---------------- */

function clearInvalid() {
  form.querySelectorAll('.field.invalid').forEach(field => field.classList.remove('invalid'));
}

function setStatusRadio(status) {
  const radio = form.querySelector('input[name="status"][value="' + status + '"]');
  if (radio) radio.checked = true;
}

function currentStatus() {
  const checked = form.querySelector('input[name="status"]:checked');
  return checked ? checked.value : 'draft';
}

/* --- 중복 안내 --------------------------------------------------------- */

function hideDuplicate() {
  duplicate = null;
  duplicatePanel.hidden = true;
}

/** 같은 제목이 있다고 서버가 알려줬을 때 무엇을 할지 물어본다 */
function showDuplicate(found, project) {
  duplicate = { found, project };

  duplicateText.textContent =
    '‘' + found.title + '’ (' + statusLabel(found.status) + ') 와 제목이 같습니다. 어떻게 할까요?';

  // 표·분석이 든 기존 프로젝트는 합치거나 지울 수 없다
  document.getElementById('dup-merge').hidden = !found.editable;
  document.getElementById('dup-replace').hidden = !found.editable;
  duplicateHint.textContent = found.editable
    ? '합치기 = 지금 입력한 칸만 기존 프로젝트에 덮어쓰고, 비워둔 칸은 그대로 둡니다.'
    : '이 프로젝트는 표·분석이 들어 있어 합치거나 지울 수 없습니다. 제목을 바꾸거나 따로 저장해 주세요.';

  duplicatePanel.hidden = false;
}

function fillForm(project) {
  fields.title.value = project?.title || '';
  fields.role.value = project?.role || '';
  fields.description.value = project?.description || '';
  fields.date.value = project?.date || '';
  fields.teamSize.value = project?.teamSize ?? '';
  fields.notes.value = project?.notes || '';
  setStatusRadio(project?.status || 'draft');
  clearInvalid();
  hideDuplicate();
  setMessage(formMessage, '');
}

function setEditable(canEdit) {
  editable = canEdit;
  readonlyNotice.hidden = canEdit;
  Object.values(fields).forEach(input => { input.disabled = !canEdit; });
}

function startNew() {
  selectedId = null;
  setEditable(true);
  fillForm(null);
  formTitle.textContent = '새 프로젝트';
  formState.textContent = '';
  saveButton.textContent = '새로 저장';
  deleteButton.hidden = true;
  renderList();
}

function select(id) {
  const project = projects.find(item => item.id === id);
  if (!project) return;

  selectedId = id;
  setEditable(project.editable);
  fillForm(project);

  formTitle.textContent = project.editable ? '프로젝트 수정' : '프로젝트 보기';
  formState.textContent = project.updatedAt
    ? '마지막 수정 ' + new Date(project.updatedAt).toLocaleString('ko-KR')
    : '';
  saveButton.textContent = project.editable ? '수정 저장' : '공개 상태만 저장';
  deleteButton.hidden = !project.editable;

  renderList();
}

function readForm() {
  return {
    title: fields.title.value.trim(),
    role: fields.role.value.trim(),
    description: fields.description.value.trim(),
    date: fields.date.value.trim(),
    teamSize: fields.teamSize.value.trim(),
    notes: fields.notes.value.trim(),
    status: currentStatus()
  };
}

/** 공개일 때만 빈칸을 검사한다. 비어 있는 칸은 빨갛게 표시한다. */
function findMissing(project) {
  if (project.status !== 'published') return [];

  clearInvalid();

  const missing = [];
  REQUIRED.forEach(([key, label]) => {
    if (project[key]) return;
    missing.push(label);
    fields[key].closest('.field').classList.add('invalid');
  });

  return missing;
}

/* ---------------- 서버와 주고받기 ---------------- */

async function reload(keepId) {
  const data = await api.listProjects();
  projects = data.items;

  const stillThere = projects.some(project => project.id === keepId);
  if (keepId && stillThere) select(keepId);
  else startNew();
}

async function handleFailure(error) {
  if (error.status === 401) {
    showLogin('로그인이 풀렸습니다. 다시 로그인해 주세요.');
    return true;
  }
  return false;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const project = readForm();

  // 내용을 고칠 수 없는 기존 프로젝트 → 공개 여부만 바꾼다
  if (selectedId && !editable) {
    try {
      await api.setStatus(selectedId, project.status);
      await reload(selectedId);
      // 목록을 다시 그릴 때 문구가 지워지므로, 알림은 그 뒤에 띄운다
      setMessage(formMessage, '공개 상태를 저장했습니다.', true);
    } catch (error) {
      if (!(await handleFailure(error))) setMessage(formMessage, error.message);
    }
    return;
  }

  const missing = findMissing(project);
  if (missing.length) {
    setMessage(formMessage, '공개하려면 다음 칸을 채워야 합니다: ' + missing.join(', '));
    return;
  }

  saveButton.disabled = true;
  try {
    const saved = selectedId
      ? await api.updateProject(selectedId, project)
      : await api.createProject(project);

    await reload(saved.id);
    hideDuplicate();

    // 목록을 다시 그릴 때 문구가 지워지므로, 알림은 그 뒤에 띄운다
    setMessage(
      formMessage,
      project.status === 'published'
        ? '저장했습니다. 웹사이트를 새로고침하면 바로 보입니다.'
        : '초안으로 저장했습니다. 웹사이트에는 보이지 않습니다.',
      true
    );
  } catch (error) {
    // 409 = 같은 제목이 이미 있다 → 어떻게 할지 물어본다
    if (error.status === 409 && error.details?.project) {
      setMessage(formMessage, error.message);
      showDuplicate(error.details.project, project);
    } else if (!(await handleFailure(error))) {
      setMessage(formMessage, error.message);
    }
  } finally {
    saveButton.disabled = false;
  }
});

/* --- 중복 안내의 네 가지 선택 ------------------------------------------- */

async function runDuplicateAction(action) {
  if (!duplicate) return;
  const { found, project } = duplicate;

  try {
    let keepId = found.id;

    if (action === 'merge') {
      await api.mergeProject(found.id, project);
    } else if (action === 'replace') {
      await api.deleteProject(found.id);
      keepId = (await api.createProject(project)).id;
    } else if (action === 'keep') {
      keepId = (await api.createProject(project, { force: true })).id;
    }

    hideDuplicate();
    await reload(keepId);

    setMessage(formMessage, {
      merge: '기존 프로젝트에 합쳤습니다.',
      replace: '기존 것을 지우고 새로 저장했습니다.',
      keep: '같은 제목으로 따로 저장했습니다.'
    }[action], true);
  } catch (error) {
    if (!(await handleFailure(error))) setMessage(formMessage, error.message);
  }
}

document.getElementById('dup-merge').addEventListener('click', () => runDuplicateAction('merge'));
document.getElementById('dup-keep').addEventListener('click', () => runDuplicateAction('keep'));
document.getElementById('dup-cancel').addEventListener('click', () => {
  hideDuplicate();
  setMessage(formMessage, '');
});

document.getElementById('dup-replace').addEventListener('click', () => {
  if (!duplicate) return;
  const name = duplicate.found.title;
  if (!confirm('‘' + name + '’ 을(를) 지우고 지금 입력한 내용으로 새로 저장합니다.\n되돌릴 수 없습니다. 계속할까요?')) return;
  runDuplicateAction('replace');
});

deleteButton.addEventListener('click', async () => {
  if (!selectedId) return;

  const project = projects.find(item => item.id === selectedId);
  const name = project?.title || '제목 없는 프로젝트';
  if (!confirm('‘' + name + '’ 프로젝트를 지웁니다.\n되돌릴 수 없습니다. 정말 지울까요?')) return;

  try {
    await api.deleteProject(selectedId);
    await reload(null);
    setMessage(formMessage, '삭제했습니다.', true);
  } catch (error) {
    if (!(await handleFailure(error))) setMessage(formMessage, error.message);
  }
});

document.getElementById('new-button').addEventListener('click', startNew);
document.getElementById('cancel-button').addEventListener('click', () => {
  if (selectedId) select(selectedId);
  else startNew();
});

document.getElementById('logout-button').addEventListener('click', async () => {
  await api.logout();
  showLogin('로그아웃했습니다.');
});

/* ---------------- 로그인 ---------------- */

const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = document.getElementById('login-button');
  button.disabled = true;

  try {
    await api.login(passwordInput.value);
    passwordInput.value = '';          // 비밀번호는 화면에도 남기지 않는다
    setMessage(loginMessage, '');
    showAdmin();
    await reload(null);
  } catch (error) {
    setMessage(loginMessage, error.message);
  } finally {
    button.disabled = false;
  }
});

/* ---------------- 시작 / 끝 ---------------- */

// 창을 닫거나 다른 페이지로 떠날 때, 서버에 남은 로그인도 즉시 끊는다.
// (pagehide 는 탭을 닫을 때·뒤로 갈 때 모두 불린다)
window.addEventListener('pagehide', () => api.revokeOnLeave());

function start() {
  // 예전 버전이 브라우저 저장소에 남겨둔 토큰이 있으면 지운다
  api.clearStoredTokens();

  // 로그인 정보는 메모리에만 있으므로, 새로 열거나 새로고침하면 항상 로그인부터 한다
  showLogin('');
  passwordInput.focus();
}

start();
