/* ===== 관리자 비밀번호 정하기 =====
   실행: npm run set-password

   입력한 비밀번호는 화면에 보이지 않고, 파일에도 그대로 저장되지 않는다.
   scrypt 로 흩뜨린 값(해시)만 backend/.env 에 적힌다. .env 는 git 에 올라가지 않는다.
   비밀번호를 잊어버리면 되돌릴 방법이 없으니, 이 명령을 다시 실행해 새로 정하면 된다.
*/

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { hashPassword } from '../src/auth/password.js';

const ENV_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
const MIN_LENGTH = 4;
const SAFE_LENGTH = 8;   // 이보다 짧으면 경고만 하고 저장은 해준다

/** 입력한 글자가 화면에 보이지 않게 물어본다 */
function askHidden(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (text) => {
      // 질문은 그대로, 입력 글자는 *로 가린다
      if (text.includes(question)) rl.output.write(text);
      else rl.output.write('*');
    };
    rl.question(question, (answer) => {
      rl.output.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

/** 화면이 아닌 곳(파이프)으로 들어오는 입력 읽기 — 자동 설정용 */
function readPiped() {
  return new Promise(resolve => {
    let buffer = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { buffer += chunk; });
    process.stdin.on('end', () => resolve(buffer.split('\n')[0].trim()));
  });
}

async function updateEnvFile(hash) {
  let lines = [];

  if (existsSync(ENV_FILE)) {
    const current = await readFile(ENV_FILE, 'utf8');
    lines = current.split('\n').filter(line => !line.startsWith('ADMIN_PASSWORD_HASH='));
  }

  lines = lines.filter(line => line.trim() !== '');
  lines.push('ADMIN_PASSWORD_HASH=' + hash);

  await writeFile(ENV_FILE, lines.join('\n') + '\n', 'utf8');
}

const interactive = process.stdin.isTTY;

const password = interactive
  ? await askHidden('새 관리자 비밀번호 (' + MIN_LENGTH + '자 이상): ')
  : await readPiped();

if (password.length < MIN_LENGTH) {
  console.error('비밀번호가 너무 짧습니다. ' + MIN_LENGTH + '자 이상으로 정해 주세요.');
  process.exit(1);
}

if (interactive) {
  const again = await askHidden('한 번 더 입력: ');
  if (again !== password) {
    console.error('두 번 입력한 비밀번호가 다릅니다. 처음부터 다시 실행해 주세요.');
    process.exit(1);
  }
}

await updateEnvFile(hashPassword(password));

if (password.length < SAFE_LENGTH) {
  console.log('');
  console.log('  ⚠ 짧은 비밀번호입니다. 내 컴퓨터에서만 서버를 켤 때는 괜찮지만,');
  console.log('    백엔드를 인터넷에 올린다면 더 긴 것으로 바꾸는 편이 안전합니다.');
  console.log('');
}

console.log('비밀번호를 저장했습니다 → backend/.env (해시만 저장, 원문은 저장하지 않음)');
console.log('서버가 켜져 있다면 한 번 껐다 켜 주세요. (npm start)');
