// 게임 엔진 진입점: createGame(canvas, { onChange })가 게임을 만들고 조작 API를 돌려준다.
// 상태 초기화, 메인 루프, 입력 처리, UI로 상태 전달(push)을 맡는다.
import { camDown, camMove, camUp, seek, updateCam } from "./camera.js";
import { COLORS, HINT, MAXN, NAMES } from "./constants.js";
import { exportGif, exportVideo, saveReady } from "./export.js";
import { podiumStep, podiumEnd } from "./render/podium.js";
import { draw } from "./render/race.js";
import { applyFrame, endReplay, record, toggleReplay } from "./replay.js";
import { setup, update } from "./sim/race.js";
import { G } from "./state.js";
import { hsh, shuffle } from "./util.js";
export function push() {
  G.ui.onChange({
    state: G.state,
    msg: G.msg,
    n: G.n,
    mode: G.mode,
    manual: G.manual,
    canReplay: G.frames.length >= 2 && (G.state === 'podium' || G.state === 'done' || G.state === 'replay'),
    replaying: G.state === 'replay',
    busy: !!(G.rec || G.exporting),
    file: G.ready ? G.ready.name : null,
    result: G.result,
    want: G.want,
    locked: G.state === 'count' || G.state === 'run',
    map: G.mapId,
    lanes: G.lanes.slice(),
    cfg: G.cfg.map(c => Object.assign({}, c))
  });
}
export function loop(ts) {
  if (G.dead) return;
  const dt = Math.min(.05, (ts - G.last) / 1000 || 0);
  G.last = ts;
  // 일시정지(경기 중단 확인 창이 떠 있는 동안): 시뮬레이션은 멈추고 화면만 그림
  if (G.paused) {
    G.fdt = 0;
    draw();
    G.raf = requestAnimationFrame(loop);
    return;
  }
  let sc = 1;
  if (G.slowT > 0) {
    G.slowT -= dt;
    sc = .28;
  }
  if (G.banner) G.banner.t -= dt;
  if (G.state === 'count') {
    G.cd -= dt;
    // 카운트다운도 리플레이·녹화에 들어가도록 음수 시간(-3초 → 0초)으로 기록
    G.rt = -Math.max(0, G.cd);
    record();
    if (G.cd <= 0) {
      G.state = 'run';
      G.clock = 0;
      G.rt = 0;
      G.msg = '경주 중…';
      push();
    }
  } else if (G.state === 'run') {
    G.rt += dt;
    update(dt * sc);
    if (G.state === 'run') record();
  } else if (G.state === 'podium') {
    // GIF를 만드는 동안에는 export.js가 시상식 시간을 직접 진행
    if (!G.exporting) {
      G.pt += dt;
      podiumStep(dt);
    }
    // MP4 녹화: 시상식 조명이 끝나고 2초 뒤에 멈춤
    if (G.recPod && G.pt >= podiumEnd()) {
      G.recPod = false;
      G.fullRec = false;
      if (G.rec && G.rec.state === 'recording') G.rec.stop();
    }
  } else if (G.state === 'replay') {
    if (!G.exporting) {
      G.rp += dt;
      while (G.rk < G.frames.length - 1 && G.frames[G.rk + 1].t <= G.rp) G.rk++;
      applyFrame(G.frames[G.rk]);
      if (G.rp > G.frames[G.frames.length - 1].t + .5) {
        // 저장 중이면 녹화를 멈추지 않고 시상식으로 이어 감
        if (G.fullRec) {
          endReplay(true);
          G.recPod = true;
        } else endReplay();
      }
    }
  }
  G.fdt = dt * (G.state === 'run' ? sc : 1);
  if (G.state !== 'replay' && (G.state !== 'idle' && G.state !== 'podium' || G.manual)) updateCam(dt);
  draw();
  G.raf = requestAnimationFrame(loop);
}
// 기본 참가자 20명: 성별에 맞는 이름을 겹치지 않게 무작위로, 옷 색은 기본 순서, 종류는 성인
export function makeRoster() {
  const pool = {
    m: shuffle(NAMES.m.slice()),
    f: shuffle(NAMES.f.slice())
  };
  return COLORS.map((c, i) => {
    const g = i % 2 ? 'f' : 'm';
    return {
      name: pool[g].pop(),
      color: c,
      gender: g,
      age: 'a',
      // 장신구 색(''이면 없음). 처음 값은 캐릭터 번호로 고정(약 40%씩)
      bag: hsh(i * 7 + 2) < .4 ? COLORS[(i * 7 + 5) % COLORS.length] : '',
      scarf: hsh(i * 7 + 1) < .4 ? COLORS[(i * 7 + 3) % COLORS.length] : ''
    };
  });
}
// 완전 초기화: 참가자(이름 새로 뽑기·기본 색·성별·종류), 인원 4명, 모드·결과산출·맵·자리를 모두 처음 상태로
export function resetAll() {
  G.paused = false;
  G.cfg = makeRoster();
  G.mode = 'normal';
  G.want = 'first';
  G.mapId = 'city-day';
  G.lanes = [];
  setN(4);
}
export function setN(v) {
  if (G.rec && G.rec.state === 'recording') {
    G.rec.onstop = null;
    G.rec.stop();
  }
  G.rec = null;
  G.exporting = false;
  const nn = Math.max(2, Math.min(MAXN, v));
  if (nn !== G.n || G.lanes.length !== nn) G.lanes = Array.from({
    length: nn
  }, (_, k) => k);
  G.n = nn;
  G.state = 'idle';
  G.result = null;
  G.msg = G.mode === 'item' ? '아이템전: ?박스를 먹으면 탈것·무기·함정이 랜덤으로! 시작을 눌러주세요.' : HINT;
  setup();
  push();
}
export function start() {
  if (G.state === 'run' || G.state === 'count') return;
  if (G.state === 'replay') endReplay();
  if (G.state === 'done' || G.state === 'podium') setup();
  G.result = null;
  G.state = 'count';
  G.cd = 3;
  G.msg = '곧 출발합니다…';
  push();
}
export function setCfg(i, p) {
  if (p.age !== undefined && p.age !== G.cfg[i].age) {
    const base = G.cfg[i].name.replace(/^메카 /, '');
    p = Object.assign({}, p, {
      name: p.age === 'r' ? '메카 ' + base : base
    });
  }
  Object.assign(G.cfg[i], p);
  const r = G.racers[i];
  if (r) {
    r.name = G.cfg[i].name;
    r.color = G.cfg[i].color;
    r.gender = G.cfg[i].gender;
    r.age = G.cfg[i].age;
    r.bag = G.cfg[i].bag;
    r.scarf = G.cfg[i].scarf;
  }
  push();
}
export function createGame(cv, ui) {
  for (const k of Object.keys(G)) delete G[k];
  G.cv = cv;
  G.ui = ui;
  G.ctx = G.cv.getContext('2d');
  G.W = window.innerWidth < 700 ? 560 : 960;
  // 트랙 깊이(GD)와 캔버스 높이(H)는 인원에 따라 setup()에서 정해짐: 8명까지는 기존 크기, 그 이상은 1명당 12px씩 넓어짐
  G.GD = 152;
  G.H = 420;
  G.raf = 0;
  G.dead = false;
  G.msg = '';
  G.result = null;
  G.ac = new AbortController();
  G.L = (t, f) => G.cv.addEventListener(t, f, {
    signal: G.ac.signal
  });
  G.muds = [];
  G.springs = [];
  G.hover = -1;
  G.mapId = 'city-day';
  G.n = 4;
  G.racers = [];
  G.fin = [];
  G.traps = [];
  G.fx = [];
  G.state = 'idle';
  G.clock = 0;
  G.camX = 0;
  G.cd = 0;
  G.endWait = 0;
  G.last = 0;
  G.boxes = [];
  G.bananas = [];
  G.portals = [];
  G.bolts = [];
  G.mode = 'normal';
  G.winLine = '';
  G.frames = [];
  G.bk = null;
  G.rp = 0;
  G.rk = 0;
  G.rec = null;
  G.exporting = false;
  G.ready = null;
  G.want = 'first';
  G.betMsg = '';
  // 동작 표현용(시뮬레이션과 무관): 캐릭터별 애니메이션 상태, 개성, 흙먼지, 프레임 시간, 화면 흔들림
  G.anim = [];
  G.quirks = [];
  G.dust = [];
  G.fdt = 0;
  G.shake = 0;
  G.rt = 0;
  G.slowT = 0;
  G.banner = null;
  G.manual = false;
  G.mt = 0;
  G.pt = 0;
  G.conf = [];
  G.cfg = makeRoster();
  G.paused = false;
  G.lanes = [];
  G.pv = null;
  G.heli = {
    x: 0,
    y: 92
  };
  G.heliMX = null;
  G.noHeli = false;
  G.sp = null;
  G.podBub = null;
  G.lastBub = null;
  G.fb = null;
  G.drag = false;
  // 레이스 중(카운트다운·달리기) 캔버스 조작: 위쪽 지도는 비율 위치로, 나머지는 누른 지점으로. 떼면 자동 카메라
  const camOK = () => G.state === 'count' || G.state === 'run';
  G.L('pointerdown', e => {
    if (!camOK()) return;
    const b = G.cv.getBoundingClientRect(),
      y = (e.clientY - b.top) * G.cv.height / b.height;
    G.drag = y <= 46 ? 'map' : 'view';
    G.cv.setPointerCapture?.(e.pointerId);
    if (G.drag === 'map') seek(e);else camDown(e);
  });
  G.L('pointermove', e => {
    if (G.drag === 'map') seek(e);else if (G.drag === 'view') camMove(e);
    if (G.state === 'idle') {
      const b = G.cv.getBoundingClientRect();
      G.heliMX = (e.clientX - b.left) * G.W / b.width;
    }
  });
  const release = () => {
    if (!G.drag) return;
    G.drag = false;
    camUp();
  };
  G.L('pointerup', release);
  G.L('pointercancel', release);
  setN(4);
  G.raf = requestAnimationFrame(loop);
  return {
    setN: setN,
    start: start,
    reset: () => setN(G.n),
    setCfg: setCfg,
    toggleReplay: toggleReplay,
    setMode: m => {
      G.mode = m;
      setN(G.n);
    },
    shuffleLanes: () => {
      if (G.state === 'count' || G.state === 'run') return;
      shuffle(G.lanes);
      if (G.state === 'idle') setup();
      G.msg = '출발 자리를 섞었습니다: ' + G.lanes.map((s, i) => [s, G.cfg[i].name]).sort((a, b) => a[0] - b[0]).map(x => x[1]).join(' · ');
      push();
    },
    resetLanes: () => {
      if (G.state === 'count' || G.state === 'run') return;
      G.lanes = G.lanes.map((_, k) => k);
      if (G.state === 'idle') setup();
      G.msg = '출발 자리를 원래대로 되돌렸습니다.';
      push();
    },
    setWant: w => {
      G.want = w;
      push();
    },
    setMap: m => {
      if (G.state === 'count' || G.state === 'run') return;
      G.mapId = m;
      G.pv = null;
      push();
    },
    setPaused: b => {
      G.paused = !!b;
    },
    // 경기를 멈추고 준비 화면으로(참가자 정보는 그대로)
    stop: () => {
      G.paused = false;
      setN(G.n);
    },
    resetAll: resetAll,
    setHover: i => {
      G.hover = i;
    },
    follow: () => {
      G.manual = false;
      push();
    },
    exportGif: exportGif,
    exportVideo: exportVideo,
    saveReady: saveReady,
    destroy: () => {
      G.dead = true;
      cancelAnimationFrame(G.raf);
      G.ac.abort();
      if (G.rec && G.rec.state === 'recording') {
        G.rec.onstop = null;
        G.rec.stop();
      }
    }
  };
}
