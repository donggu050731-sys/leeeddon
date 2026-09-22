/* ===== 관리자 서비스 =====
   관리자 화면에서 들어온 값을 검사하고 저장한다.
   화면(브라우저)에서도 같은 검사를 하지만, 화면 검사는 얼마든지 건너뛸 수 있으므로
   '진짜 검사'는 반드시 여기(서버)에서 한다.

   규칙
     - 공개(published) : 참고사항을 뺀 모든 칸이 채워져 있어야 한다
     - 초안(draft)     : 비어 있어도 저장된다
     - 기존 프로젝트(상세 자료가 있는 4건)는 공개/초안 전환만 가능하다
*/

import { HttpError } from '../errors.js';

// [저장되는 키, 화면에 보여줄 이름]
const REQUIRED_FIELDS = [
  ['title', '제목'],
  ['role', '내가 한 역할'],
  ['description', '설명'],
  ['date', '날짜'],
  ['teamSize', '참여인원 수']
];

const STATUSES = ['draft', 'published'];

/** 상세 자료(표·분석 등)가 들어 있는 기존 프로젝트인가 */
function isLegacyProject(project) {
  return Array.isArray(project.blocks) && project.blocks.length > 0;
}

/* --- 중복 확인 ---------------------------------------------------------
   기준은 '제목' 하나뿐이다. 띄어쓰기와 대소문자만 무시하고 똑같으면 중복으로 본다.
   (기준을 하나로 두면 왜 중복이라고 했는지 사람이 바로 이해할 수 있다) */

function titleKey(title) {
  return String(title || '').toLowerCase().replace(/\s+/g, '');
}

function findDuplicate(items, title, exceptId) {
  const key = titleKey(title);
  if (!key) return null;
  return items.find(item => item.id !== exceptId && titleKey(item.title) === key) || null;
}

/** 중복 안내에 필요한 정보만 추려서 알려준다 */
function duplicateError(found) {
  return new HttpError(409, '같은 제목의 프로젝트가 이미 있습니다: ' + found.title, {
    reason: 'duplicate',
    project: {
      id: found.id,
      title: found.title,
      status: found.status || 'published',
      editable: !isLegacyProject(found)
    }
  });
}

/* 칸마다 최대 글자 수. 화면(admin.html)의 maxlength 와 같은 값이며,
   화면 검사는 얼마든지 건너뛸 수 있으므로 서버에서도 똑같이 막는다. */
const LIMITS = { title: 120, role: 200, description: 2000, date: 60, notes: 1000 };
const MAX_TEAM_SIZE = 99;

function text(value, field) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  const max = LIMITS[field];

  if (max && trimmed.length > max) {
    throw new HttpError(400, field + ' 은(는) ' + max + '자까지 넣을 수 있습니다.');
  }

  return trimmed;
}

/** 참여인원 수: 1~99 사이의 정수만 (비어 있으면 null) */
function teamSizeOf(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > MAX_TEAM_SIZE) {
    throw new HttpError(400, '참여인원 수는 1부터 ' + MAX_TEAM_SIZE + ' 사이의 숫자로 적어 주세요.');
  }
  return number;
}

function normalize(input) {
  const status = STATUSES.includes(input.status) ? input.status : 'draft';

  return {
    status,
    title: text(input.title, 'title'),
    role: text(input.role, 'role'),
    description: text(input.description, 'description'),
    date: text(input.date, 'date'),
    teamSize: teamSizeOf(input.teamSize),
    notes: text(input.notes, 'notes')
  };
}

/** 공개하려면 참고사항 외 모든 칸이 채워져 있어야 한다 */
function checkPublishable(project) {
  if (project.status !== 'published') return;

  const missing = REQUIRED_FIELDS
    .filter(([key]) => {
      const value = project[key];
      return value === null || value === undefined || value === '';
    })
    .map(([, label]) => label);

  if (missing.length) {
    throw new HttpError(400, '공개하려면 다음 칸을 채워야 합니다: ' + missing.join(', '));
  }
}

function newId() {
  return 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
}

export function createAdminService(repository) {
  async function load() {
    const projects = await repository.getProjects();
    return { projects, items: projects.items };
  }

  function findIndex(items, id) {
    const index = items.findIndex(item => item.id === id);
    if (index === -1) throw new HttpError(404, '그런 프로젝트가 없습니다: ' + id);
    return index;
  }

  return {
    /** 관리자 목록 — 초안까지 전부, 수정 가능 여부를 함께 알려준다 */
    async listProjects() {
      const { projects, items } = await load();
      return {
        label: projects.label,
        title: projects.title,
        items: items.map(item => ({
          id: item.id,
          status: item.status || 'published',
          title: item.title,
          role: item.role || '',
          description: item.description || item.summary || '',
          date: item.date || '',
          teamSize: item.teamSize ?? null,
          notes: item.notes || '',
          editable: !isLegacyProject(item),
          updatedAt: item.updatedAt || null
        }))
      };
    },

    /**
     * 새 프로젝트 저장.
     * 같은 제목이 이미 있으면 409 로 알려준다 (화면에서 합치기·바꾸기를 고를 수 있게).
     * force 가 true 면 중복이어도 그냥 따로 저장한다.
     */
    async createProject(input, { force = false } = {}) {
      const project = normalize(input);
      checkPublishable(project);

      const { projects, items } = await load();

      if (!force) {
        const found = findDuplicate(items, project.title, null);
        if (found) throw duplicateError(found);
      }

      const now = new Date().toISOString();

      const created = { id: newId(), ...project, createdAt: now, updatedAt: now };
      items.push(created);

      await repository.saveProjects(projects);
      return created;
    },

    async updateProject(id, input) {
      const { projects, items } = await load();
      const index = findIndex(items, id);

      if (isLegacyProject(items[index])) {
        throw new HttpError(
          400,
          '이 프로젝트는 표·분석 같은 상세 자료가 있어 이 화면에서는 내용을 고칠 수 없습니다. (공개/초안 전환만 가능)'
        );
      }

      const project = normalize(input);
      checkPublishable(project);

      // 고친 제목이 다른 프로젝트와 겹치면 막는다 (수정에서는 합치기를 제안하지 않는다)
      const found = findDuplicate(items, project.title, id);
      if (found) throw duplicateError(found);

      items[index] = {
        ...items[index],
        ...project,
        updatedAt: new Date().toISOString()
      };

      await repository.saveProjects(projects);
      return items[index];
    },

    /**
     * 합치기 — 지금 입력한 내용을 기존 프로젝트에 채워 넣는다.
     * 규칙은 하나: 입력한 칸만 덮어쓰고, 비워둔 칸은 기존 내용을 그대로 둔다.
     */
    async mergeIntoProject(id, input) {
      const { projects, items } = await load();
      const index = findIndex(items, id);
      const target = items[index];

      if (isLegacyProject(target)) {
        throw new HttpError(400, '상세 자료가 있는 기존 프로젝트에는 합칠 수 없습니다.');
      }

      const incoming = normalize(input);
      const merged = { ...target };

      ['title', 'role', 'description', 'date', 'notes'].forEach(key => {
        if (incoming[key]) merged[key] = incoming[key];
      });
      if (incoming.teamSize) merged.teamSize = incoming.teamSize;
      merged.status = incoming.status;

      checkPublishable(merged);

      items[index] = { ...merged, updatedAt: new Date().toISOString() };

      await repository.saveProjects(projects);
      return items[index];
    },

    /** 공개 ↔ 초안 전환 (기존 프로젝트도 가능) */
    async setStatus(id, status) {
      if (!STATUSES.includes(status)) {
        throw new HttpError(400, "상태는 'draft' 또는 'published' 만 됩니다.");
      }

      const { projects, items } = await load();
      const index = findIndex(items, id);

      if (status === 'published' && !isLegacyProject(items[index])) {
        checkPublishable({ ...items[index], status });
      }

      items[index] = { ...items[index], status, updatedAt: new Date().toISOString() };

      await repository.saveProjects(projects);
      return items[index];
    },

    async deleteProject(id) {
      const { projects, items } = await load();
      const index = findIndex(items, id);

      if (isLegacyProject(items[index])) {
        throw new HttpError(400, '상세 자료가 있는 기존 프로젝트는 이 화면에서 지울 수 없습니다.');
      }

      const [removed] = items.splice(index, 1);
      await repository.saveProjects(projects);
      return removed;
    }
  };
}
