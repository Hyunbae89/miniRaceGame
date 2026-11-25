// 게임 엔진 진입점: createGame(canvas, { onChange })가 게임을 만들고 조작 API를 돌려준다.
// 상태 초기화, 메인 루프, 입력 처리, UI로 상태 전달(push)을 맡는다.
import { seek, updateCam } from "./camera.js";
import { COLORS, HINT, MAXN, NAMES } from "./constants.js";
import { podiumStep } from "./render/podium.js";
import { draw } from "./render/race.js";
import { setup, update } from "./sim/race.js";
import { G } from "./state.js";
import { shuffle } from "./util.js";
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
export function record() {
  if (G.frames.length && G.rt - G.frames[G.frames.length - 1].t < 1 / 40) return;
  G.frames.push({
    t: G.rt,
    camX: G.camX,
    clock: G.clock,
    bn: G.banner && G.banner.t > 0 ? {
      s: G.banner.s,
      t: G.banner.t
    } : null,
    r: G.racers.map(r => ({
      i: r.i,
      name: r.name,
      color: r.color,
      gender: r.gender,
      age: r.age,
      x: r.x,
      d: r.d,
      h: r.h,
      speed: r.speed,
      mult: r.mult,
      stun: r.stun,
      veh: r.veh ? {
        k: r.veh.k
      } : null,
      item: r.item ? {
        k: r.item.k
      } : null,
      fin: r.fin,
      rank: r.rank,
      cur: r.cur,
      act: r.act,
      ak: r.ak,
      spr: r.spr,
      spr0: r.spr0,
      trip: r.trip,
      trip0: r.trip0,
      bat: r.bat,
      heat: r.heat,
      boost: r.boost,
      ovh: r.ovh,
      chg: r.chg,
      pt: r.pull ? G.racers.indexOf(r.pull.v) : -1
    })),
    hd: G.traps.map(t => t.u ? t.u.map(u => u.down ? '1' : '0').join('') : '').join('|'),
    bx: G.boxes.map(b => b.t > 0 ? '0' : '1').join(''),
    ba: G.bananas.map(b => ({
      x: b.x,
      d: b.d
    })),
    po: G.portals.map(o => ({
      x: o.x,
      d: o.d,
      t: o.t,
      c: o.c
    })),
    bo: G.bolts.map(o => ({
      a: {
        x: o.a.x,
        d: o.a.d
      },
      b: {
        x: o.b.x,
        d: o.b.d
      },
      t: o.t
    })),
    fx: G.fx.map(f => ({
      x: f.x,
      d: f.d,
      t: f.t,
      s: f.s
    }))
  });
}
export function applyFrame(f) {
  G.racers = f.r.map(o => Object.assign({}, o));
  G.racers.forEach((r, k) => {
    r.pull = f.r[k].pt >= 0 ? {
      v: G.racers[f.r[k].pt]
    } : null;
  });
  G.fin = G.racers.filter(r => r.fin).sort((a, b) => a.rank - b.rank);
  G.boxes = G.bk.boxes.map((b, k) => ({
    x: b.x,
    d: b.d,
    t: f.bx[k] === '1' ? 0 : 1
  }));
  if (f.hd) {
    const p = f.hd.split('|');
    G.traps.forEach((t, k) => {
      if (t.u) t.u.forEach((u, j) => {
        u.down = p[k][j] === '1';
        u.ft = u.down ? 1 : 0;
      });
    });
  }
  G.bananas = f.ba;
  G.portals = f.po;
  G.bolts = f.bo;
  G.fx = f.fx;
  G.camX = f.camX;
  G.clock = f.clock;
  G.banner = f.bn;
}
export function startReplay() {
  G.bk = {
    racers: G.racers,
    fin: G.fin,
    boxes: G.boxes,
    bananas: G.bananas,
    portals: G.portals,
    bolts: G.bolts,
    fx: G.fx,
    camX: G.camX,
    clock: G.clock,
    banner: G.banner
  };
  G.state = 'replay';
  G.rp = 0;
  G.rk = 0;
  G.manual = false;
  push();
}
export function endReplay() {
  ({
    racers: G.racers,
    fin: G.fin,
    boxes: G.boxes,
    bananas: G.bananas,
    portals: G.portals,
    bolts: G.bolts,
    fx: G.fx,
    camX: G.camX,
    clock: G.clock,
    banner: G.banner
  } = G.bk);
  G.state = 'podium';
  G.pt = 0;
  G.conf = [];
  if (G.rec && G.rec.state === 'recording') G.rec.stop();
  push();
}
export function lzw(px) {
  const clear = 256,
    eoi = 257;
  let size = 9,
    next = 258;
  const dict = new Map(),
    buf = [];
  let cur = 0,
    bits = 0;
  const emit = c => {
    cur |= c << bits;
    bits += size;
    while (bits >= 8) {
      buf.push(cur & 255);
      cur >>= 8;
      bits -= 8;
    }
  };
  const bump = () => {
    if (next > (1 << size) - 1 && size < 12) size++;
  };
  emit(clear);
  let p = px[0];
  for (let i = 1; i < px.length; i++) {
    const c = px[i],
      key = p << 8 | c,
      e = dict.get(key);
    if (e !== undefined) {
      p = e;
      continue;
    }
    emit(p);
    if (next < 4096) {
      bump();
      dict.set(key, next++);
    } else {
      emit(clear);
      dict.clear();
      size = 9;
      next = 258;
    }
    p = c;
  }
  emit(p);
  bump();
  emit(eoi);
  if (bits > 0) buf.push(cur & 255);
  const out = [8];
  for (let i = 0; i < buf.length; i += 255) {
    const m = Math.min(255, buf.length - i);
    out.push(m);
    for (let k = 0; k < m; k++) out.push(buf[i + k]);
  }
  out.push(0);
  return out;
}
export function gifHeader(w, h) {
  const a = [71, 73, 70, 56, 57, 97, w & 255, w >> 8, h & 255, h >> 8, 0xF7, 0, 0];
  for (let i = 0; i < 256; i++) a.push(Math.round((i >> 5 & 7) * 255 / 7), Math.round((i >> 2 & 7) * 255 / 7), Math.round((i & 3) * 255 / 3));
  a.push(0x21, 0xFF, 11, 78, 69, 84, 83, 67, 65, 80, 69, 50, 46, 48, 3, 1, 0, 0, 0);
  return new Uint8Array(a);
}
export function gifFrame(px, w, h, cs) {
  const a = [0x21, 0xF9, 4, 0x04, cs & 255, cs >> 8, 0, 0, 0x2C, 0, 0, 0, 0, w & 255, w >> 8, h & 255, h >> 8, 0];
  return new Uint8Array(a.concat(lzw(px)));
}
export function offer(blob, name) {
  G.ready = {
    blob: blob,
    name: name
  };
  G.msg = '파일이 준비됐어요. 저장 버튼을 눌러 주세요.';
  push();
}
export function saveReady() {
  if (!G.ready) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(G.ready.blob);
  a.download = G.ready.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  G.msg = '저장했어요!';
  push();
}
export async function exportGif() {
  if (G.state !== 'podium' || G.frames.length < 2) return;
  G.ready = null;
  startReplay();
  G.exporting = true;
  push();
  const GW = 400,
    GH = Math.round(G.cv.height * GW / G.W);
  const oc = document.createElement('canvas');
  oc.width = GW;
  oc.height = GH;
  const o = oc.getContext('2d', {
    willReadFrequently: true
  });
  const dur = G.frames[G.frames.length - 1].t + .3,
    parts = [gifHeader(GW, GH)];
  let k = 0,
    cnt = 0;
  for (let t = 0; t <= dur; t += .1) {
    if (G.state !== 'replay') {
      G.exporting = false;
      return;
    }
    while (k < G.frames.length - 1 && G.frames[k + 1].t <= t) k++;
    applyFrame(G.frames[k]);
    G.rp = t;
    draw();
    o.drawImage(G.cv, 0, 0, GW, GH);
    const d = o.getImageData(0, 0, GW, GH).data,
      ix = new Uint8Array(GW * GH);
    for (let i = 0, j = 0; j < ix.length; i += 4, j++) ix[j] = d[i] >> 5 << 5 | d[i + 1] >> 5 << 2 | d[i + 2] >> 6;
    parts.push(gifFrame(ix, GW, GH, 10));
    if (++cnt % 4 === 0) {
      G.msg = 'GIF 만드는 중… ' + Math.round(t / dur * 100) + '%';
      push();
      await new Promise(r => setTimeout(r));
    }
  }
  parts.push(new Uint8Array([0x3B]));
  G.exporting = false;
  endReplay();
  offer(new Blob(parts, {
    type: 'image/gif'
  }), 'race-replay.gif');
}
export function exportVideo() {
  if (G.state !== 'podium' || G.frames.length < 2) return;
  if (!window.MediaRecorder || !G.cv.captureStream) {
    G.msg = '이 브라우저는 영상 녹화를 지원하지 않아요. GIF로 만들어 보세요.';
    push();
    return;
  }
  const mt = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
  if (!mt) {
    G.msg = '이 브라우저는 영상 녹화를 지원하지 않아요. GIF로 만들어 보세요.';
    push();
    return;
  }
  const ext = mt.indexOf('mp4') >= 0 ? 'mp4' : 'webm',
    chunks = [];
  const mr = new MediaRecorder(G.cv.captureStream(30), {
    mimeType: mt,
    videoBitsPerSecond: 4000000
  });
  mr.ondataavailable = e => {
    if (e.data && e.data.size) chunks.push(e.data);
  };
  mr.onstop = () => {
    G.rec = null;
    offer(new Blob(chunks, {
      type: mt.split(';')[0]
    }), 'race-replay.' + ext);
    if (ext !== 'mp4') G.msg = 'MP4 녹화를 지원하지 않는 브라우저라 WebM으로 만들었어요. 저장 버튼을 눌러 주세요.';
    push();
  };
  G.ready = null;
  G.rec = mr;
  mr.start();
  startReplay();
  G.msg = '영상 녹화 중… 리플레이가 끝날 때까지 기다려 주세요.';
  push();
}

export function loop(ts) {
  if (G.dead) return;
  const dt = Math.min(.05, (ts - G.last) / 1000 || 0);
  G.last = ts;
  let sc = 1;
  if (G.slowT > 0) {
    G.slowT -= dt;
    sc = .28;
  }
  if (G.banner) G.banner.t -= dt;
  if (G.state === 'count') {
    G.cd -= dt;
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
    G.pt += dt;
    podiumStep(dt);
  } else if (G.state === 'replay') {
    if (!G.exporting) {
      G.rp += dt;
      while (G.rk < G.frames.length - 1 && G.frames[G.rk + 1].t <= G.rp) G.rk++;
      applyFrame(G.frames[G.rk]);
      if (G.rp > G.frames[G.frames.length - 1].t + .5) endReplay();
    }
  }
  G.fdt = dt * (G.state === 'run' ? sc : 1);
  if (G.state !== 'replay' && (G.state !== 'idle' && G.state !== 'podium' || G.manual)) updateCam(dt);
  draw();
  G.raf = requestAnimationFrame(loop);
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
  }
  push();
}
export function toggleReplay() {
  if (G.state === 'replay') endReplay();else if (G.state === 'podium' || G.state === 'done') startReplay();
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
  G.anim = [];
  G.quirks = [];
  G.dust = [];
  G.fdt = 0;
  G.shake = 0;
  // 동작 표현용(시뮬레이션과 무관)
  G.rt = 0;
  G.slowT = 0;
  G.banner = null;
  G.manual = false;
  G.mt = 0;
  G.pt = 0;
  G.conf = [];
  G.pool = {
    m: shuffle(NAMES.m.slice()),
    f: shuffle(NAMES.f.slice())
  };
  G.cfg = COLORS.map((c, i) => {
    const g = i % 2 ? 'f' : 'm';
    return {
      name: G.pool[g].pop(),
      color: c,
      gender: g,
      age: 'a'
    };
  });
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
  G.L('pointerdown', e => {
    const b = G.cv.getBoundingClientRect(),
      y = (e.clientY - b.top) * G.cv.height / b.height;
    if (y <= 46 && G.state !== 'podium' && G.state !== 'replay' && G.state !== 'idle') {
      G.drag = true;
      G.cv.setPointerCapture(e.pointerId);
      seek(e);
    }
  });
  G.L('pointermove', e => {
    if (G.drag) seek(e);
    if (G.state === 'idle') {
      const b = G.cv.getBoundingClientRect();
      G.heliMX = (e.clientX - b.left) * G.W / b.width;
    }
  });
  G.L('pointerup', () => {
    G.drag = false;
  });
  G.L('pointercancel', () => {
    G.drag = false;
  });
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
