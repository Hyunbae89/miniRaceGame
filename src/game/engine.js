// 게임 엔진 진입점: createGame(canvas, { onChange })가 게임을 만들고 조작 API를 돌려준다.
// 상태 초기화, 메인 루프, 입력 처리, UI로 상태 전달(push)을 맡는다.
import { BACK, COLORS, GT, HINT, ITEMS, JT, MAXN, NAMES, OFF, TRACK, WIN_LINES } from "./constants.js";
import { podiumStep } from "./render/podium.js";
import { draw } from "./render/race.js";
import { G } from "./state.js";
import { R, shuffle } from "./util.js";
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
export function say(r, t) {
  G.fx.push({
    x: r.x,
    d: r.d,
    t: 0,
    s: t
  });
}

// 레인 s의 발 위치(d): 트랙(GT ~ GT+GD+20)을 n등분한 칸의 가운데
export function laneD(s) {
  return (s + .5) * (G.GD + 20) / G.n - 16;
}
// 장애물의 깊이 d 위치 x(허들은 사선), 깊이 d의 허들 칸
export function hx(t, d) {
  return t.x - (d - ((G.GD + 20) / 2 - 16)) * (t.s || 0);
}
export function unitAt(t, d) {
  return t.u[Math.max(0, Math.min(G.n - 1, Math.floor((d + 16) / ((G.GD + 20) / G.n))))];
}
export function setup() {
  G.GD = 152 + Math.max(0, G.n - 8) * 12;
  G.H = GT + G.GD + 50;
  G.cv.width = G.W;
  G.cv.height = G.H;
  G.pv = null;
  G.racers = [];
  G.fin = [];
  G.fx = [];
  G.traps = [];
  G.muds = [];
  G.springs = [];
  G.heli.x = 0;
  G.camX = 0;
  G.clock = 0;
  G.endWait = 0;
  G.rt = 0;
  G.slowT = 0;
  G.banner = null;
  G.manual = false;
  G.boxes = [];
  G.bananas = [];
  G.portals = [];
  G.bolts = [];
  G.frames = [];
  G.ready = null;
  G.betMsg = '';
  G.winLine = '';
  G.anim = [];
  G.dust = [];
  G.quirks = Array.from({
    length: G.n
  }, () => ({
    stride: R(.88, 1.12),
    arm: R(.8, 1.25),
    lean: R(.75, 1.3),
    cad: R(.92, 1.08)
  }));
  if (G.mode === 'item') {
    let bx = R(900, 1100);
    while (bx < TRACK - 500) {
      for (let d = 20; d <= G.GD - 20; d += 37) G.boxes.push({
        x: bx,
        d: d,
        t: 0
      });
      bx += R(650, 950);
    }
  }
  let x = R(700, 850);
  // 장애물: 허들(점프로 넘음), 물웅덩이(점프로 넘음, 빠지면 오래 멈춤)
  // 허들은 레인마다 한 칸씩 사선으로 늘어섬. 걸려 넘어진 칸은 쓰러져서 그 레인은 다음 사람부터 그냥 통과
  while (x < TRACK - 400) {
    const w = G.traps.length >= 2 && Math.random() < .17;
    G.traps.push(w ? {
      x: x,
      type: 'water',
      s: 0
    } : {
      x: x,
      type: 'hurdle',
      s: .45,
      u: Array.from({
        length: G.n
      }, (_, k) => ({
        d: laneD(k),
        down: false,
        ft: 0
      }))
    });
    x += R(450, 800);
  }
  // 진흙: 장애물 사이 넓은 틈에 최대 3곳. 점프로 못 피하고 지나는 동안 느려짐
  for (let k = 0; k + 1 < G.traps.length && G.muds.length < 3; k++) {
    const a = G.traps[k].x,
      b = G.traps[k + 1].x;
    if (b - a >= 620 && Math.random() < .4) {
      const len = R(150, 220),
        c = (a + b) / 2;
      G.muds.push({
        x0: c - len / 2,
        x1: c + len / 2
      });
    }
  }
  // 스프링 발판 4개: 트랙 중반(40%)부터 결승 250 앞 사이 무작위 위치. 무작위 레인(맨 아래 포함)을 중심으로
  // 트랙 폭의 42%를 사선(s: 깊이 1당 x 이동량)으로 덮음. 밟으면 뒤로 튕겨 나감(발판마다 캐릭터당 한 번만 작동)
  for (let tries = 0; G.springs.length < 4 && tries < 300; tries++) {
    const sx = R(TRACK * .4, TRACK - 250);
    if (G.traps.some(t => Math.abs(sx - t.x) < 140) || G.muds.some(z => sx > z.x0 - 70 && sx < z.x1 + 70) || G.springs.some(p => Math.abs(sx - p.x) < 300)) continue;
    const w = (G.GD + 20) * .42,
      c = laneD(Math.floor(R(0, G.n))),
      d0 = Math.max(-12, Math.min(G.GD - w, c - w / 2));
    G.springs.push({
      x: sx,
      d0: d0,
      d1: d0 + w,
      t: 0,
      s: .45
    });
  }
  G.springs.sort((a, b) => a.x - b.x);
  for (let i = 0; i < G.n; i++) {
    const s = G.lanes[i] ?? i,
      d = laneD(s);
    G.racers.push({
      i: i,
      name: G.cfg[i].name,
      color: G.cfg[i].color,
      gender: G.cfg[i].gender,
      age: G.cfg[i].age,
      veh: null,
      item: null,
      x: -BACK,
      d: d,
      td: d,
      vd: 0,
      kx: 0,
      speed: 0,
      base: R(215, 232),
      mult: 1,
      change: 0,
      skill: R(.6, .9),
      dd: {},
      jt: -1,
      h: 0,
      stun: 0,
      inv: 0,
      slow: 0,
      cool: R(.5, 1.5),
      pull: null,
      act: 0,
      ak: '',
      spr: 0,
      spr0: .75,
      sh: 0,
      trip: 0,
      trip0: 1.5,
      inMud: false,
      bat: 100,
      heat: 0,
      boost: 0,
      ovh: 0,
      chg: 0,
      fin: false,
      rank: 0,
      time: 0,
      cur: i + 1
    });
  }
}
export function update(dt) {
  G.clock += dt;
  const act = G.racers.filter(r => !r.fin);
  let lead = 0;
  for (const r of act) lead = Math.max(lead, r.x);
  for (const r of G.racers) {
    if (r.fin) {
      r.speed *= Math.pow(.03, dt);
      r.x += r.speed * dt;
      continue;
    }
    r.cool -= dt;
    r.inv -= dt;
    r.slow -= dt;
    if (r.act > 0) r.act -= dt;
    if (r.stun > 0) {
      r.stun -= dt;
      r.speed = 0;
      r.h = 0;
      r.jt = -1;
    }
    if (r.trip > 0) r.trip -= dt;else {
      r.change -= dt;
      if (r.change <= 0) {
        const late = r.x > TRACK - 1000,
          q = Math.random();
        r.mult = q < (late ? .45 : .35) ? R(1.3, 1.7) : q < .7 ? R(.5, .75) : R(.95, 1.15);
        r.change = R(.6, 1.8);
      }
      const gap = lead - r.x;
      let m = r.mult + Math.min(gap / 450, 1) * .28 - (gap < 1 ? .08 : 0);
      if (r.age === 'r') m = robotStep(r, dt, gap);
      if (r.slow > 0) m *= .55;
      if (r.veh) m *= r.veh.m;
      const mud = r.h < 14 && !(r.veh && r.veh.k === 'jet') && G.muds.some(z => r.x >= z.x0 && r.x <= z.x1);
      if (mud) {
        m *= r.age === 'r' ? .42 : .55;
        if (!r.inMud) say(r, r.age === 'r' ? '오작동!' : '진흙!');
      }
      r.inMud = mud;
      r.speed += (r.base * m - r.speed) * Math.min(1, dt * 4);
    }
    r.x += (r.speed + r.kx) * dt;
    r.kx *= Math.pow(.02, dt);
    if (r.x < -BACK) r.x = -BACK;
    if (r.pull) {
      r.pull.t -= dt;
      const v = r.pull.v;
      if (r.pull.t <= 0 || v.fin) r.pull = null;else {
        r.x += 150 * dt;
        v.x -= 150 * dt;
        if (v.x < -BACK) v.x = -BACK;
      }
    }
    // depth steering
    if (Math.random() < dt * .7) r.td = R(-8, G.GD - 4);
    const st = Math.max(-60 * dt, Math.min(60 * dt, r.td - r.d));
    r.d += st + r.vd * dt;
    r.vd *= Math.pow(.01, dt);
    for (const o of G.racers) {
      if (o !== r && Math.abs(o.x - r.x) < 22 && Math.abs(o.d - r.d) < 12) r.d += (r.d >= o.d ? 1 : -1) * 45 * dt;
    }
    r.d = Math.max(-12, Math.min(G.GD, r.d));
    if (r.stun <= 0) {
      // jump AI
      if (r.jt < 0 && !(r.veh && r.veh.k === 'jet')) {
        for (let k = 0; k < G.traps.length; k++) {
          if (G.traps[k].u && unitAt(G.traps[k], r.d).down) continue;
          const d = hx(G.traps[k], r.d) - r.x;
          if (d > 0) {
            if (d < 260) {
              if (r.dd[k] === undefined) r.dd[k] = Math.random() < r.skill;
              if (r.dd[k] && d <= Math.max(40, r.speed) * .3) r.jt = 0;
            }
            break;
          }
        }
      }
      if (r.jt >= 0) {
        r.jt += dt;
        if (r.jt >= JT) {
          r.jt = -1;
          r.h = 0;
        } else r.h = Math.sin(Math.PI * r.jt / JT) * (r.age === 'r' ? 28 : 42);
      }
      if (r.veh && r.veh.k === 'jet') r.h = 26 + Math.sin(G.clock * 8) * 3;else if (r.jt < 0) r.h = 0;
      // trap hit
      if (r.inv <= 0 && r.h < 14) {
        for (const t of G.traps) {
          const u = t.u ? unitAt(t, r.d) : null;
          if (u && u.down) continue;
          if (Math.abs(r.x - hx(t, r.d)) < (u ? 14 : 22)) {
            if (u) {
              u.down = true;
              u.ft = 0;
            }
            if (r.age === 'r' && Math.random() < .25) {
              r.inv = 1.5;
              say(r, '끄떡없음!');
              break;
            }
            if (t.type === 'water') {
              r.stun = 2.2;
              r.speed = 0;
              r.kx = 0;
              r.inv = 3;
              r.jt = -1;
              r.h = 0;
              r.pull = null;
              say(r, r.age === 'r' ? '합선!' : '첨벙!');
            } else {
              r.stun = 1.5;
              r.speed = 0;
              r.kx = 0;
              r.inv = 2.4;
              r.jt = -1;
              r.h = 0;
              r.pull = null;
              say(r, '꽈당!');
            }
            if (r.age === 'r') {
              r.stun *= 1.5;
              r.inv = r.stun + .6;
              say(r, '재부팅…');
            }
            if (u) r.trip = r.trip0 = r.stun;
            break;
          }
        }
      }
    }
    if (!r.fin) {
      if (r.spr > 0) {
        r.spr -= dt;
        const p = 1 - Math.max(0, r.spr) / r.spr0;
        r.h = Math.sin(Math.PI * p) * 55;
        r.x -= 560 * dt;
        r.speed = 0;
        r.kx = 0;
        if (r.x < -BACK) r.x = -BACK;
        if (r.spr <= 0) {
          r.h = 0;
          r.spr = 0;
        }
      } else if (r.inv <= 0 && r.h < 14 && !(r.veh && r.veh.k === 'jet')) for (let si = 0; si < G.springs.length; si++) {
        const sp = G.springs[si];
        if (!(r.sh & 1 << si) && r.d >= sp.d0 && r.d <= sp.d1 && Math.abs(r.x - (sp.x - (r.d - (sp.d0 + sp.d1) / 2) * sp.s)) < 18) {
          r.sh |= 1 << si;
          r.spr0 = r.spr = r.age === 'r' ? .45 : .75;
          r.jt = -1;
          r.pull = null;
          r.inv = r.spr + .6;
          sp.t = .4;
          say(r, '뿅! 뒤로~');
          break;
        }
      }
    }
    if (r.x >= TRACK) {
      r.fin = true;
      G.fin.push(r);
      r.rank = G.fin.length;
      r.time = G.rt;
      r.pull = null;
      if (r.rank === 1) {
        const L = WIN_LINES[r.age] || WIN_LINES.a;
        G.winLine = L[Math.floor(Math.random() * L.length)];
      }
      if (r.rank <= 3) {
        G.slowT = 1.4;
        G.banner = {
          t: 1.4,
          s: r.rank + '위 ' + r.name
        };
      }
    }
  }
  if (G.mode === 'item') {
    for (const b of G.boxes) if (b.t > 0) b.t -= dt;
    for (const b of G.bananas) b.g -= dt;
    for (const r of G.racers) {
      if (r.fin) continue;
      if (r.veh) {
        r.veh.t -= dt;
        if (r.veh.t <= 0) r.veh = null;
      }
      if (!r.item && !r.veh && r.stun <= 0) for (const b of G.boxes) if (b.t <= 0 && Math.abs(b.x - r.x) < 20 && Math.abs(b.d - r.d) < 20) {
        b.t = 6;
        if (r.age === 'r' && Math.random() < .3) {
          r.bat = Math.min(100, r.bat + 40);
          say(r, '🔋 충전!');
          break;
        }
        const it = ITEMS[Math.floor(R(0, ITEMS.length))];
        r.item = {
          k: it.k,
          d: R(.5, 1.2),
          life: 5
        };
        say(r, it.e + it.n);
        break;
      }
      if (r.item && r.stun <= 0) {
        r.item.d -= dt;
        if (r.item.d <= 0) useItem(r);
      }
      if (r.inv <= 0 && r.h < 14 && r.stun <= 0) for (let k = 0; k < G.bananas.length; k++) {
        const b = G.bananas[k];
        if (b.g <= 0 && Math.abs(b.x - r.x) < 16 && Math.abs(b.d - r.d) < 18) {
          G.bananas.splice(k, 1);
          r.stun = 1.2;
          r.speed = 0;
          r.inv = 1.5;
          r.jt = -1;
          r.h = 0;
          say(r, '미끄덩!');
          break;
        }
      }
    }
  }
  // shoving and grabbing
  for (const a of G.racers) {
    if (a.fin || a.stun > 0 || a.cool > 0) continue;
    let v = null,
      bd = 1e9;
    for (const o of G.racers) {
      if (o === a || o.fin) continue;
      const dx = o.x - a.x,
        dd = o.d - a.d;
      if (Math.abs(dx) < 44 && Math.abs(dd) < 26) {
        const s = Math.abs(dx) + Math.abs(dd);
        if (s < bd) {
          bd = s;
          v = o;
        }
      }
    }
    if (v && Math.random() < dt * 2.2) {
      a.cool = R(1.3, 2.3);
      if (v.x - a.x > 8 && Math.random() < .4 && !a.pull) {
        a.pull = {
          v: v,
          t: .8
        };
        v.slow = .5;
        a.ak = 'pull';
        a.act = .8;
        say(a, '잡아당기기!');
      } else if (v.veh && v.veh.k === 'wheel') {
        a.kx -= 120;
        say(v, '끄떡없음!');
      } else {
        const pw = (v.age === 'r' ? .3 : 1) * (a.age === 'r' ? 1.5 : 1);
        v.kx -= 240 * pw;
        v.vd += (v.d === a.d ? Math.random() < .5 ? -1 : 1 : v.d < a.d ? -1 : 1) * 90 * pw;
        a.kx += 100;
        v.slow = .4;
        a.ak = 'push';
        a.act = .4;
        say(a, '밀치기!');
      }
    }
  }
  for (const sp of G.springs) if (sp.t > 0) sp.t -= dt;
  for (const t of G.traps) if (t.u) for (const u of t.u) if (u.down && u.ft < 1) u.ft = Math.min(1, u.ft + dt * 4);
  for (const f of G.fx) f.t += dt;
  for (const o of G.portals) o.t -= dt;
  for (const o of G.bolts) o.t -= dt;
  G.portals = G.portals.filter(o => o.t > 0);
  G.bolts = G.bolts.filter(o => o.t > 0);
  G.fx = G.fx.filter(f => f.t < 1);
  if (G.racers.every(r => r.fin)) {
    G.endWait += dt;
    if (G.endWait > 1.3) finish();
  }
}
export function useItem(r) {
  const k = r.item.k,
    it = ITEMS.find(i => i.k === k);
  if (it.m) {
    r.veh = {
      k: k,
      t: it.t,
      m: it.m
    };
    r.item = null;
    r.jt = -1;
    say(r, it.n + ' 탑승!');
  } else if (k === 'banana') {
    G.bananas.push({
      x: r.x - 30,
      d: r.d,
      g: .6
    });
    r.item = null;
    say(r, '바나나 투척!');
  } else if (k === 'portal') {
    const nx = Math.min(TRACK - 30, r.x + 520);
    G.portals.push({
      x: r.x,
      d: r.d,
      t: .7,
      c: '#2e86de'
    }, {
      x: nx,
      d: r.d,
      t: .7,
      c: '#f39c12'
    });
    r.x = nx;
    r.inv = 1.2;
    r.item = null;
    say(r, '포탈!');
  } else {
    let v = null,
      bd = 700;
    for (const o of G.racers) if (o !== r && !o.fin && o.x > r.x && o.x - r.x < bd) {
      bd = o.x - r.x;
      v = o;
    }
    if (v) {
      v.stun = 1.8;
      v.speed = 0;
      v.jt = -1;
      v.h = 0;
      v.pull = null;
      G.bolts.push({
        a: r,
        b: v,
        t: .5
      });
      say(v, '감전!');
      r.item = null;
    } else {
      r.item.d = .3;
      r.item.life -= .3;
      if (r.item.life <= 0) r.item = null;
    }
  }
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
export function liveRank() {
  const a = G.racers.slice().sort((p, q) => {
    if (p.fin && q.fin) return p.rank - q.rank;
    if (p.fin !== q.fin) return p.fin ? -1 : 1;
    return q.x - p.x;
  });
  a.forEach((r, k) => r.cur = k + 1);
  return a;
}
export function updateCam(dt) {
  if (G.manual) {
    G.camX += (G.mt - G.camX) * Math.min(1, dt * 10);
    return;
  }
  const f = focusR(),
    lead = f ? Math.min(f.x, TRACK) : 0;
  const t = Math.max(0, Math.min(lead - G.W * .58, TRACK - G.W * .75));
  G.camX += (t - G.camX) * Math.min(1, dt * 6);
}

// ---- 배경(맵): 서울 도심 / 전통 마을 × 낮 / 밤 ----

// 카메라·헬기가 따라가는 캐릭터: 아직 도착하지 않은 선두. 모두 도착했으면 마지막 도착자
export function focusR() {
  let f = null;
  for (const r of G.racers) if (!r.fin && (!f || r.x > f.x)) f = r;
  return f || G.fin[G.fin.length - 1] || null;
}
// 헬기: 시작 전에는 캔버스 위 마우스 x를 따라감(캔버스 밖으로 나가면 마지막 위치에서 제자리 비행)

// 배터리는 달리는 동안 닳고, 가득 차면 부스터가 자동 발동(배터리 35 소모). 부스터는 열을 올리고 열이 100이면 과열(2초 반속).
// 배터리 0이면 급정지 후 2.2초 수동 충전. 배터리가 있는 동안은 랜덤 배율 대신 일정 속도(크루즈)를 유지.
// 크루즈 배율은 모드별로 시뮬레이션 평균 순위가 사람과 비슷해지도록 맞춘 값(아이템전은 충전 아이템이 있어 낮춤).
export function robotStep(r, dt, gap) {
  if (r.chg > 0) {
    r.chg -= dt;
    r.bat = Math.min(100, r.bat + 28 * dt);
    r.mult = .5;
    if (r.chg <= 0) say(r, '충전 완료');
    return 0;
  }
  if (r.bat <= 0) {
    r.bat = 0;
    r.chg = 2.2;
    r.speed *= .3;
    r.boost = 0;
    say(r, '배터리 방전!');
    return 0;
  }
  let m = (G.mode === 'item' ? 1.06 : 1.16) + Math.min(gap / 450, 1) * .28 - (gap < 1 ? .08 : 0);
  if (r.boost > 0) {
    r.boost -= dt;
    m = 1.75;
    r.heat += dt * 35;
  } else if (r.bat >= 100 && r.ovh <= 0) {
    r.boost = 1.3;
    r.bat -= 35;
    say(r, '부스터!');
  }
  if (r.ovh > 0) {
    r.ovh -= dt;
    m *= .5;
  } else {
    if (r.boost <= 0) r.heat = Math.max(0, r.heat - dt * 14);
    if (r.heat >= 100) {
      r.ovh = 2;
      r.heat = 40;
      r.boost = 0;
      say(r, '과열!');
    }
  }
  if (r.boost <= 0) r.bat -= dt * 3.2;
  r.mult = r.boost > 0 ? 1.6 : r.ovh > 0 ? .6 : 1;
  return m;
}
// ---- 로봇 그리기: 금속 몸체, LED 얼굴, 부스터 불꽃, 환호 시 머리 회전·가슴 폭죽 ----

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
export function finish() {
  G.state = 'podium';
  G.pt = 0;
  G.conf = [];
  G.betMsg = '';
  // 결과 산출: 원하는 순위(1등/꼴등)에 해당하는 캐릭터 발표
  {
    const r = G.want === 'first' ? G.fin[0] : G.fin[G.fin.length - 1];
    if (r) G.betMsg = '결과 산출 · ' + (G.want === 'first' ? '1등' : '꼴등') + ': ' + r.name;
  }
  G.result = {
    bet: G.betMsg,
    want: G.want,
    rank: G.fin.map(r => ({
      pos: r.rank + '위',
      color: r.color,
      name: r.name,
      right: r.time.toFixed(2) + '초'
    }))
  };
  G.msg = G.fin[0].name + '이(가) 우승했습니다!';
  push();
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
export function seek(e) {
  const b = G.cv.getBoundingClientRect(),
    x = (e.clientX - b.left) * G.W / b.width;
  const f = Math.max(0, Math.min(1, (x - 70) / (G.W - 130)));
  G.mt = Math.max(0, Math.min(TRACK - G.W * .75, f * TRACK - G.W / 2 + OFF));
  G.manual = true;
  push();
}
// 레이스 게임 엔진: 캔버스 렌더링과 게임 로직. UI 상태는 ui.onChange 콜백으로만 내보냅니다.
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
