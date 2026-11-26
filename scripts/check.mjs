// 게임 엔진 자동 점검(브라우저 없이 Node로 실행)
//
//   npm run check            시나리오를 돌려 오류·NaN을 검사하고, 저장된 기준(스냅숏)과 그리기 기록을 비교
//   npm run check -- --update   현재 결과를 새 기준으로 저장(그림이나 동작을 일부러 바꾼 뒤에 사용)
//   npm run check -- --balance  로봇·사람 평균 순위 측정(시간이 걸림)
//
// 원리: Math.random과 시간을 고정한 채 가짜 캔버스로 게임을 돌리면서, 캔버스에 내린 모든 명령과
// 설정값을 순서대로 해시로 기록한다. 리팩터링처럼 동작이 바뀌면 안 되는 작업 전후에 해시가 같으면
// 화면에 그려지는 내용이 한 획도 달라지지 않았다는 뜻이다.
// 레이스 시나리오는 그리기와 별도로 리플레이 기록(G.frames: 매 프레임 위치·순위·장애물 등)을 sim 해시로
// 남긴다. 그리는 방식을 바꾸는 작업(예: PixiJS)에서는 그리기 해시는 달라져도 sim 해시는 같아야 한다.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const BASE = join(here, 'check-baseline.json');
const args = process.argv.slice(2);

// ---- 고정된 난수와 시간 ----
let seed = 1;
const rand = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
Math.random = rand;
let T = 0;
// 저장 파일 이름에 들어가는 날짜·시각도 고정(2026-01-02 03:04:05)
const RealDate = Date;
globalThis.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [2026, 0, 2, 3, 4, 5])); } static now() { return new RealDate(2026, 0, 2, 3, 4, 5).getTime(); } };
Object.defineProperty(globalThis, 'performance', { value: { now: () => T }, configurable: true });

// ---- 그리기 명령을 해시로 기록하는 가짜 캔버스 ----
let h = 2166136261, calls = 0, bad = null;
const feed = (s) => { for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } };
const val = (x) => typeof x === 'number' ? (Number.isFinite(x) ? x.toFixed(4) : (bad ??= 'NaN/Infinity', 'NaN')) : typeof x === 'string' ? x : typeof x === 'object' && x && x.__id ? '#' + x.__id : typeof x;
let nextId = 0;
function makeCtx(id) {
  const state = {};
  const grad = () => ({ addColorStop: (o, c) => feed('stop' + val(o) + c) });
  return new Proxy(state, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'measureText') return (s) => ({ width: String(s).length * 7 });
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return (...a) => { feed(id + String(k) + a.map(val).join(',')); return grad(); };
      if (k === 'getImageData') return (x, y, w, hh) => ({ data: new Uint8ClampedArray(Math.max(4, w * hh * 4)) });
      if (typeof k === 'symbol') return undefined;
      return (...a) => { calls++; feed(id + String(k) + '(' + a.map(val).join(',') + ')'); };
    },
    set(t, k, v) { t[k] = v; feed(id + String(k) + '=' + val(v)); return true; },
    has(t, k) { return k in t; },
  });
}
const handlers = {};
function makeCanvas() {
  const id = ++nextId, c = { __id: id, width: 960, height: 420 };
  const ctx = makeCtx('c' + id);
  Object.assign(c, {
    getContext: () => ctx,
    addEventListener: (t, f) => { handlers[t] = f; },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: c.width, height: c.height }),
    setPointerCapture: () => {}, captureStream: () => null,
  });
  return c;
}
let raf = null;
// 가짜 MediaRecorder: 녹화 시작·끝 시각(가상 시간 T)을 기록해 녹화 범위를 검사
let recLog = null;
globalThis.MediaRecorder = class { static isTypeSupported(t) { return t === 'video/webm'; } constructor() { this.state = 'inactive'; } start() { this.state = 'recording'; recLog = { start: T }; } stop() { this.state = 'inactive'; recLog.end = T; this.ondataavailable?.({ data: new Blob(['x']) }); this.onstop?.(); } };
globalThis.window = { innerWidth: 1200, MediaRecorder: globalThis.MediaRecorder };
globalThis.document = { createElement: () => makeCanvas() };
globalThis.requestAnimationFrame = (cb) => { raf = cb; return 1; };
globalThis.cancelAnimationFrame = () => {};
const step = (k = 1) => { for (let i = 0; i < k; i++) { T += 1000 / 60; raf(T); } };

{
  const { createRequire } = await import('node:module');
  const req = createRequire(join(here, '../package.json'));
  const parser = req('@babel/parser'), traverse = req('@babel/traverse').default;
  const { readdirSync } = await import('node:fs');
  const KNOWN = new Set(['window', 'document', 'Math', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame', 'console', 'Blob', 'URL', 'MediaRecorder', 'Uint8Array', 'Uint8ClampedArray', 'setTimeout', 'Promise', 'Object', 'Array', 'String', 'Number', 'JSON', 'Date', 'Set', 'Map', 'Infinity', 'NaN', 'undefined', 'parseInt', 'isFinite', 'AbortController', 'navigator', 'File']);
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.js') ? [join(d, e.name)] : []);
  const missing = [];
  for (const f of walk(join(here, '../src/game'))) {
    traverse(parser.parse(readFileSync(f, 'utf8'), { sourceType: 'module' }), { Identifier(p) { if (p.isReferencedIdentifier() && !p.scope.hasBinding(p.node.name) && !KNOWN.has(p.node.name)) missing.push(f.split(/[\\/]src[\\/]/).pop() + ': ' + p.node.name); } });
  }
  if (missing.length) { console.log('✗ 정의되지 않은 이름(import 누락 등):\n  ' + [...new Set(missing)].join('\n  ')); process.exit(1); }
  console.log('✓ 모든 게임 모듈의 이름이 정의돼 있음');
}
const { createGame } = await import(pathToFileURL(join(here, '../src/game/engine.js')).href);
const { G } = await import(pathToFileURL(join(here, '../src/game/state.js')).href);
const fnv = (s) => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(16); };

// ---- 시나리오 ----
function run(name, setup) {
  seed = 12345; T = 0; h = 2166136261; calls = 0; bad = null; nextId = 0;
  let v;
  const g = createGame(makeCanvas(), { onChange: (x) => { v = x; feed('ui' + JSON.stringify(x)); } });
  const out = setup(g, () => v);
  g.destroy();
  if (bad) throw new Error(name + ': 그리기에 ' + bad + ' 값이 들어감');
  return { hash: (h >>> 0).toString(16), calls, ...out };
}
function race(g, v, limit = 60 * 240) {
  g.start(); let s = 0;
  while (v().state !== 'podium' && s < limit) { step(); s++; }
  if (v().state !== 'podium') throw new Error('레이스가 ' + limit / 60 + '초 안에 끝나지 않음');
  step(500); // 시상식(조명·말풍선 포함)
  const winner = v().result.rank[0].name;
  const sim = fnv(JSON.stringify(G.frames));
  g.toggleReplay(); step(300);
  return { sec: Math.round(s / 60), winner, sim };
}
const scenarios = {
  '미리보기(호버·헬기 마우스)': (g, v) => { g.setN(12); g.setCfg(2, { age: 'r' }); handlers.pointermove?.({ clientX: 700, clientY: 100 }); step(30); g.setHover(3); step(30); g.setHover(-1); g.shuffleLanes(); step(10); return { names: v().cfg.slice(0, 12).map((c) => c.name).join(',') }; },
  '일반·8명·서울 낮(로봇 2)': (g, v) => { g.setN(8); g.setCfg(1, { age: 'r' }); g.setCfg(5, { age: 'r' }); g.setCfg(3, { age: 'c' }); g.setCfg(6, { age: 'e' }); return race(g, v); },
  '아이템·20명·서울 밤(꼴등 원함)': (g, v) => { g.setN(20); g.setMode('item'); g.setMap('city-night'); g.setWant('last'); for (let i = 0; i < 20; i += 3) g.setCfg(i, { age: 'r' }); return race(g, v); },
  '일반·3명·전통 낮(꼴찌 로봇)': (g, v) => { g.setN(3); g.setMap('trad-day'); g.setCfg(2, { age: 'r' }); g.setWant('last'); return race(g, v); },
  '아이템·5명·전통 밤': (g, v) => { g.setN(5); g.setMode('item'); g.setMap('trad-night'); return race(g, v); },
  '경기 중단(일시정지·참가자 수정·완전 초기화)': (g, v) => {
    g.setN(9); g.setMode('item'); g.setMap('trad-night'); g.setWant('last'); g.setCfg(0, { age: 'r' }); g.shuffleLanes();
    g.start(); step(60 * 6);
    g.setPaused(true); step(120); const pausedState = v().state; g.setPaused(false); step(30);
    g.stop(); step(5);
    const back = v();
    if (back.state !== 'idle' || back.n !== 9 || back.cfg[0].age !== 'r' || back.mode !== 'item' || back.map !== 'trad-night') throw new Error('중단(참가자 수정): 설정이 유지돼야 함');
    g.start(); step(60 * 5);
    g.resetAll(); step(5);
    const r = v();
    if (r.state !== 'idle' || r.n !== 4 || r.mode !== 'normal' || r.map !== 'city-day' || r.want !== 'first' || r.lanes.some((x, i) => x !== i) || r.cfg.some((c) => c.age !== 'a' || c.name.startsWith('메카'))) throw new Error('완전 초기화: 처음 상태여야 함');
    return { pausedState, names: r.cfg.slice(0, 4).map((c) => c.name).join(',') };
  },
  'MP4 녹화 범위(카운트다운 ~ 시상식 조명 끝 +2초)': (g, v) => {
    g.setN(4); g.setWant('last');
    const r = race(g, v); g.toggleReplay(); step(5);
    recLog = null; g.exportVideo();
    let s = 0; while (v().busy && s < 60 * 120) { step(); s++; }
    if (!recLog || recLog.end === undefined) throw new Error('녹화가 끝나지 않음');
    // r.sec은 카운트다운 3초를 포함한 레이스 시간. 리플레이 끝 여유 0.5초 + 시상식(꼴등 원함: 조명 끝 8.1초 + 2초)
    const sec = (recLog.end - recLog.start) / 1000, need = r.sec + .5 + 10.1;
    if (Math.abs(sec - need) > 1.5) throw new Error('녹화 길이 ' + sec.toFixed(1) + '초, 기대 약 ' + need.toFixed(1) + '초');
    if (!v().file) throw new Error('저장 파일이 준비되지 않음');
    return { ...r, recSec: Math.round(sec) };
  },
  '카메라 직접 조작(누르기·끌기·놓기)': (g, v) => {
    g.setN(6); g.start(); step(60 * 8);
    const p = (x, y) => ({ clientX: x, clientY: y, pointerId: 1 });
    handlers.pointerdown(p(300, 260)); step(20); handlers.pointermove(p(520, 260)); step(20);
    const during = v().manual;
    handlers.pointerup(p(520, 260)); step(5);
    const after = v().manual;
    handlers.pointerdown(p(400, 20)); step(10); const mapDuring = v().manual; handlers.pointercancel(p(400, 20)); step(5);
    if (!during || after || !mapDuring || v().manual) throw new Error('카메라: 누르는 동안 수동, 놓으면 자동이어야 함');
    return { ...race(g, v), during, after };
  },
};

if (args.includes('--balance')) {
  // 로봇 4명 + 사람 4명, 모드별 40판 평균 순위(중간값 4.5)
  for (const mode of ['normal', 'item']) {
    let sr = 0, sh = 0, nr = 0, nh = 0;
    for (let k = 0; k < 40; k++) {
      seed = 1000 + k; T = 0; let v;
      const g = createGame(makeCanvas(), { onChange: (x) => { v = x; } });
      g.setN(8); for (let i = 0; i < 8; i += 2) g.setCfg(i, { age: 'r' }); g.setMode(mode); g.start();
      let s = 0; while (v.state !== 'podium' && s < 60 * 240) { step(); s++; }
      v.result.rank.forEach((x, i) => { const robot = v.cfg.findIndex((c) => c.name === x.name) % 2 === 0; if (robot) { sr += i + 1; nr++; } else { sh += i + 1; nh++; } });
      g.destroy();
    }
    console.log(`${mode === 'normal' ? '일반' : '아이템전'}: 로봇 평균 ${(sr / nr).toFixed(2)}위, 사람 평균 ${(sh / nh).toFixed(2)}위`);
  }
  process.exit(0);
}

const results = {};
for (const [name, fn] of Object.entries(scenarios)) {
  const t0 = RealDate.now();
  results[name] = run(name, fn);
  console.log(`✓ ${name}  ${results[name].sec ? results[name].sec + '초 레이스, ' : ''}그리기 ${results[name].calls}회  (${((RealDate.now() - t0) / 1000).toFixed(1)}s)`);
}
if (args.includes('--update') || !existsSync(BASE)) {
  writeFileSync(BASE, JSON.stringify(results, null, 2) + '\n');
  console.log('기준 스냅숏을 저장했습니다: scripts/check-baseline.json');
} else {
  const base = JSON.parse(readFileSync(BASE, 'utf8'));
  const diff = Object.keys(results).filter((k) => JSON.stringify(results[k]) !== JSON.stringify(base[k]));
  if (diff.length) {
    console.log('\n✗ 기준과 다른 시나리오: ' + diff.join(', '));
    // hash·calls(그리기)를 뺀 나머지가 같으면 레이스는 그대로이고 그림만 바뀐 것
    const core = (o) => JSON.stringify({ ...o, hash: 0, calls: 0 });
    for (const k of diff) console.log(`  ${k}  [${core(results[k]) === core(base[k]) ? '그림만 다름' : '레이스 결과·동작도 다름'}]\n    기준 ${JSON.stringify(base[k])}\n    현재 ${JSON.stringify(results[k])}`);
    console.log('의도한 변경이면 npm run check -- --update 로 기준을 갱신하세요.');
    process.exit(1);
  }
  console.log('\n✓ 모든 시나리오가 기준과 같습니다(그리기 명령까지 동일).');
}
