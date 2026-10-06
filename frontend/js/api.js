/* ===== 데이터 가져오기 (프론트엔드 ↔ 백엔드 연결 지점) =====
   화면 코드는 데이터가 어디서 왔는지 몰라도 되도록, 통신은 전부 이 파일에서만 한다.

   순서: ① 백엔드 API 에 물어본다  →  ② 실패하면 정적 JSON 파일을 읽는다
   나중에 DB·외부 API 로 바뀌어도 백엔드만 고치면 되고, 이 파일은 그대로 둔다.
*/

const config = window.PORTFOLIO_CONFIG || {};
const API_BASE = String(config.apiBase || '').replace(/\/$/, '');
const STATIC_PATH = String(config.staticDataPath || 'data').replace(/\/$/, '');
const USE_API = config.useApi !== false;
const WEATHER_API = String(config.weatherApi || '');
const BOOKING_ENDPOINT = String(config.bookingEndpoint || '');

// 화면이 필요로 하는 데이터 묶음 (JSON 파일 이름과 같다)
const SECTIONS = ['profile', 'projects', 'hometown', 'journey'];

async function readJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(url + ' 응답 오류 (' + response.status + ')');
  return response.json();
}

// 백엔드는 { data: ... } 형태로 답한다. 껍데기를 벗겨서 알맹이만 돌려준다.
function unwrap(body) {
  return body && typeof body === 'object' && 'data' in body ? body.data : body;
}

// 초안(draft)은 공개 화면에 절대 나오면 안 된다.
// 서버도 걸러서 보내지만, JSON 파일을 직접 읽는 경우까지 대비해 여기서 한 번 더 거른다.
function onlyPublished(portfolio) {
  const projects = portfolio.projects;
  if (!projects || !Array.isArray(projects.items)) return portfolio;

  return {
    ...portfolio,
    projects: {
      ...projects,
      items: projects.items.filter(project => (project.status || 'published') === 'published')
    }
  };
}

async function loadFromApi() {
  return onlyPublished(unwrap(await readJson(API_BASE + '/api/portfolio')));
}

async function loadFromStaticFiles() {
  const parts = await Promise.all(
    SECTIONS.map(name => readJson(STATIC_PATH + '/' + name + '.json'))
  );
  const result = {};
  SECTIONS.forEach((name, index) => { result[name] = parts[index]; });
  return onlyPublished(result);
}

/**
 * 포트폴리오 전체 데이터를 가져온다.
 * @returns {Promise<{profile: object, projects: object, hometown: object, journey: object}>}
 */
export async function loadPortfolio() {
  if (USE_API) {
    try {
      return await loadFromApi();
    } catch (error) {
      console.warn('[api] 백엔드에 연결하지 못해 JSON 파일로 대체합니다.', error);
    }
  }
  return loadFromStaticFiles();
}

/**
 * '찾아오는 길' 페이지 데이터를 가져온다 (visit.json).
 * @returns {Promise<object>}
 */
export async function loadVisit() {
  if (USE_API) {
    try {
      return unwrap(await readJson(API_BASE + '/api/visit'));
    } catch (error) {
      console.warn('[api] 백엔드에 연결하지 못해 JSON 파일로 대체합니다.', error);
    }
  }
  return readJson(STATIC_PATH + '/visit.json');
}

/**
 * 좌표의 현재 날씨를 외부 서비스(Open-Meteo)에서 가져온다.
 * 화면 코드가 외부 서비스의 응답 모양을 몰라도 되도록 여기서 단순한 모양으로 바꿔 돌려준다.
 * @param {{lat: number, lon: number}} place
 * @returns {Promise<{temperature: number, temperatureUnit: string, humidity: number, humidityUnit: string, time: string}>}
 */
export async function loadWeather(place) {
  const params = new URLSearchParams({
    latitude: place.lat,
    longitude: place.lon,
    current: 'temperature_2m,relative_humidity_2m',
    timezone: 'Asia/Seoul'
  });
  const body = await readJson(WEATHER_API + '?' + params);
  const current = body.current;
  const units = body.current_units;

  return {
    temperature: current.temperature_2m,
    temperatureUnit: units.temperature_2m,
    humidity: current.relative_humidity_2m,
    humidityUnit: units.relative_humidity_2m,
    time: current.time.replace('T', ' ')
  };
}

/**
 * 공휴일 목록을 가져온다 (holidays.json). 예약 캘린더에서 막을 날짜다.
 * @returns {Promise<{source: object, items: {date: string, name: string}[]}>}
 */
export async function loadHolidays() {
  if (USE_API) {
    try {
      return unwrap(await readJson(API_BASE + '/api/holidays'));
    } catch (error) {
      console.warn('[api] 백엔드에 연결하지 못해 JSON 파일로 대체합니다.', error);
    }
  }
  return readJson(STATIC_PATH + '/holidays.json');
}

// 예약을 Formspree 로 보낸다. Formspree 가 그 내용을 내 이메일로 전달해 준다.
// 메일에서 읽기 쉽도록 항목 이름을 화면의 라벨(선택한 날짜 · 희망 시간 …)로 붙인다.
// 'email' 과 '_subject' 는 Formspree 가 정해둔 이름이다 (답장 주소 · 메일 제목으로 쓰인다).
async function sendToFormspree(booking, labels) {
  const fields = labels.fields;
  const response = await fetch(BOOKING_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      _subject: labels.mail.subject + ' ' + booking.date + ' ' + booking.time + ' · ' + booking.name,
      [fields.date.label]: booking.date,
      [fields.time.label]: booking.time,
      [fields.name.label]: booking.name,
      email: booking.email,
      [fields.purpose.label]: booking.purpose,
      [labels.mail.consentLabel]: labels.consent
    })
  });

  if (!response.ok) throw new Error('예약 전송 실패 (' + response.status + ')');
}

/**
 * 이미 예약된 날짜·시간 목록을 가져온다. 예약 페이지에서 그 시간을 고르지 못하게 막는 데 쓴다.
 * 서버가 없는 곳(GitHub Pages 등)에서는 알 방법이 없으므로 빈 목록을 돌려준다 (막지 않는다).
 * @returns {Promise<{date: string, time: string}[]>}
 */
export async function loadTakenSlots() {
  if (!USE_API) return [];
  try {
    const slots = unwrap(await readJson(API_BASE + '/api/bookings/taken'));
    return Array.isArray(slots) ? slots : [];
  } catch (error) {
    console.warn('[api] 예약된 시간을 불러오지 못했습니다. 시간을 막지 않고 진행합니다.', error);
    return [];
  }
}

/**
 * 방문 예약 1건을 보낸다. 두 곳으로 간다.
 *   ① 백엔드 (/api/bookings) → 관리자 화면의 '예약하기 관리' 목록에 쌓인다. 겹치는 시간은 여기서 거절된다
 *   ② Formspree (config.js 의 bookingEndpoint) → 내 이메일로 전달된다
 * ①을 먼저 한다. 서버가 "이미 예약된 시간" 같은 이유로 거절하면 메일도 보내지 않고 그 이유를 알린다.
 * 서버가 없는 곳(GitHub Pages 등)에서는 ①을 건너뛰고 ②만 한다.
 * bookingEndpoint 를 비워두면 ①만 하고, 그때는 ①이 실패하면 예약도 실패다.
 * 서버가 이유를 알려준 경우에는 error.userMessage 에 그 문장을, error.status 에 상태 코드를 담아 던진다.
 * @param {{date: string, time: string, name: string, email: string, purpose: string, consent: boolean}} booking
 * @param {object} labels visit.json 의 booking (메일에 붙일 항목 이름)
 */
export async function submitBooking(booking, labels) {
  if (!BOOKING_ENDPOINT) {
    await saveToBackend(booking);
    return;
  }

  if (USE_API) {
    try {
      await saveToBackend(booking);
    } catch (error) {
      if (error.userMessage) throw error;   // 서버가 거절한 것 (겹치는 시간 · 입력 오류 등)
      console.warn('[api] 서버에 연결하지 못해 관리자 목록에는 남기지 못했습니다. 메일로만 보냅니다.', error);
    }
  }

  await sendToFormspree(booking, labels);
}

async function saveToBackend(booking) {
  const response = await fetch(API_BASE + '/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(booking)
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body || !body.data) {
    const error = new Error('예약 저장 실패 (' + response.status + ')');
    error.status = response.status;
    // 서버가 JSON 으로 이유를 알려준 경우만 '거절'로 본다.
    // (서버가 없는 곳의 404·405 는 JSON 이 아니므로 여기에 걸리지 않는다)
    if (body && body.error && response.status < 500) error.userMessage = body.error.message;
    throw error;
  }
  return body.data;
}
