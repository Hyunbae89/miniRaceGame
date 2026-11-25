// 게임 엔진 진입점: createGame(canvas, { onChange })가 게임을 만들고 조작 API를 돌려준다.
// 상태 초기화, 메인 루프, 입력 처리, UI로 상태 전달(push)을 맡는다.
import { BACK, COLORS, GT, HAIR, HINT, ITEMS, JT, MAXN, NAMES, OFF, SHOPC, SHOPS, SIGNS, SKIN, TRACK, WIN_LINES } from "./constants.js";
import { drawPerson } from "./render/character.js";
import { drawBattery } from "./render/robot.js";
import { G } from "./state.js";
import { R, fitText, hsh, ink, rr, shuffle } from "./util.js";
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
export function TH() {
  return {
    night: G.mapId.endsWith('night'),
    trad: G.mapId.startsWith('trad')
  };
}
export function stars() {
  const now = performance.now() / 1000;
  G.ctx.fillStyle = '#fff';
  for (let k = 0; k < 70; k++) {
    G.ctx.globalAlpha = .35 + .45 * (.5 + .5 * Math.sin(now * 1.7 + k * 2.3));
    const s = .8 + hsh(k * 5.1) * 1.4;
    G.ctx.fillRect(hsh(k * 3.1) * G.W, hsh(k * 7.7) * (GT - 70), s, s);
  }
  G.ctx.globalAlpha = 1;
  const mx = G.W * .8,
    my = 62;
  G.ctx.fillStyle = 'rgba(255,246,216,.18)';
  G.ctx.beginPath();
  G.ctx.arc(mx, my, 30, 0, 7);
  G.ctx.fill();
  G.ctx.fillStyle = '#fff3cf';
  G.ctx.beginPath();
  G.ctx.arc(mx, my, 16, 0, 7);
  G.ctx.fill();
  G.ctx.fillStyle = '#14214a';
  G.ctx.beginPath();
  G.ctx.arc(mx + 7, my - 5, 14, 0, 7);
  G.ctx.fill();
}
// 부드러운 산 능선(시차 par)
export function ridge(par, seed, base, amp, col, rocky) {
  const off = G.camX * par;
  G.ctx.fillStyle = col;
  G.ctx.beginPath();
  G.ctx.moveTo(0, base);
  for (let x = 0; x <= G.W + 10; x += 8) {
    const w = (x + off) * .008 + seed;
    let y = .55 + .28 * Math.sin(w) + .12 * Math.sin(w * 2.7 + 1) + .05 * Math.sin(w * 6.1);
    if (rocky) y += .08 * Math.abs(Math.sin(w * 9.3));
    G.ctx.lineTo(x, base - amp * y);
  }
  G.ctx.lineTo(G.W, base);
  G.ctx.closePath();
  G.ctx.fill();
}
export function skyline(par, seed, base, minH, maxH, col, win, winP, signs, night) {
  const off = G.camX * par,
    step = 46,
    i0 = Math.floor((off - 70) / step),
    i1 = Math.ceil((off + G.W) / step);
  for (let i = i0; i <= i1; i++) {
    const w = 30 + hsh(i * 3 + seed) * 26,
      bh = minH + hsh(i * 7 + seed) * (maxH - minH),
      x = i * step - off;
    G.ctx.fillStyle = col;
    G.ctx.fillRect(x, base - bh, w, bh);
    if (hsh(i * 11 + seed) > .7) {
      G.ctx.fillRect(x + w / 2 - 1, base - bh - 10, 2, 10);
      if (night) {
        G.ctx.fillStyle = '#ff4d4d';
        G.ctx.fillRect(x + w / 2 - 1.5, base - bh - 12, 3, 3);
        G.ctx.fillStyle = col;
      }
    }
    G.ctx.fillStyle = win;
    for (let wy = 6; wy < bh - 10; wy += 9) for (let wx = 4; wx < w - 6; wx += 8) if (hsh(i * 31 + wy * 1.7 + wx * .37 + seed) > winP) G.ctx.fillRect(x + wx, base - bh + wy, 4, 5);
    // 한글 간판
    if (signs && hsh(i * 41 + seed) > .5 && bh > 40) {
      const t = SHOPS[Math.floor(hsh(i * 43 + seed) * SHOPS.length)],
        c = SHOPC[Math.floor(hsh(i * 47 + seed) * SHOPC.length)];
      const sy = base - bh + 10 + Math.floor(hsh(i * 53 + seed) * Math.max(1, bh - 40));
      if (night) {
        G.ctx.shadowColor = c;
        G.ctx.shadowBlur = 8;
      }
      G.ctx.fillStyle = night ? c : '#fff';
      G.ctx.fillRect(x + 3, sy, w - 6, 11);
      G.ctx.shadowBlur = 0;
      G.ctx.strokeStyle = c;
      G.ctx.lineWidth = 1.5;
      G.ctx.strokeRect(x + 3, sy, w - 6, 11);
      G.ctx.fillStyle = night ? '#fff' : c;
      G.ctx.font = 'bold 8px sans-serif';
      G.ctx.textAlign = 'center';
      G.ctx.fillText(t, x + w / 2, sy + 8.5);
    }
  }
}
// 서울 랜드마크: 남산(N서울타워), 롯데월드타워, 63빌딩 — 시차 공간에서 700 간격으로 번갈아 등장
export function landmarks(par, base, night, phase) {
  const off = G.camX * par,
    sp = 700,
    i0 = Math.floor((off - 250) / sp),
    i1 = Math.ceil((off + G.W + 250) / sp),
    now = performance.now() / 1000;
  for (let i = i0; i <= i1; i++) {
    const kind = (i % 3 + 3) % 3,
      x = i * sp + 260 - off;
    if (phase === 0 && kind === 0) {
      G.ctx.fillStyle = night ? '#1a2a3c' : '#7fa87a';
      G.ctx.beginPath();
      G.ctx.moveTo(x - 190, base);
      G.ctx.quadraticCurveTo(x, base - 150, x + 190, base);
      G.ctx.fill();
      const top = base - 74;
      G.ctx.fillStyle = night ? '#cfd8e3' : '#eef1f4';
      G.ctx.fillRect(x - 3, top - 70, 6, 70);
      G.ctx.fillStyle = night ? '#ffe38a' : '#fff';
      G.ctx.beginPath();
      G.ctx.ellipse(x, top - 60, 11, 6, 0, 0, 7);
      G.ctx.fill();
      G.ctx.fillStyle = night ? '#ffd25a' : '#d6dde3';
      G.ctx.fillRect(x - 7, top - 70, 14, 5);
      G.ctx.strokeStyle = night ? '#ff6b6b' : '#e4572e';
      G.ctx.lineWidth = 2;
      G.ctx.beginPath();
      G.ctx.moveTo(x, top - 70);
      G.ctx.lineTo(x, top - 100);
      G.ctx.stroke();
      G.ctx.strokeStyle = '#fff';
      G.ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        G.ctx.moveTo(x, top - 74 - k * 9);
        G.ctx.lineTo(x, top - 78 - k * 9);
      }
      G.ctx.stroke();
      if (night && now % 1.4 < .7) {
        G.ctx.fillStyle = '#ff4d4d';
        G.ctx.beginPath();
        G.ctx.arc(x, top - 101, 2.2, 0, 7);
        G.ctx.fill();
      }
      G.ctx.fillStyle = night ? 'rgba(255,255,255,.7)' : '#1e2b33';
      G.ctx.font = '9px sans-serif';
      G.ctx.textAlign = 'center';
      G.ctx.fillText('N서울타워', x, top - 108);
    }
    if (phase === 1 && kind === 1) {
      G.ctx.fillStyle = night ? '#33435f' : '#c9d6df';
      G.ctx.beginPath();
      G.ctx.moveTo(x - 18, base);
      G.ctx.lineTo(x - 6, base - 188);
      G.ctx.lineTo(x - 2, base - 204);
      G.ctx.lineTo(x + 2, base - 204);
      G.ctx.lineTo(x + 6, base - 188);
      G.ctx.lineTo(x + 18, base);
      G.ctx.fill();
      G.ctx.strokeStyle = night ? 'rgba(180,220,255,.8)' : 'rgba(255,255,255,.7)';
      G.ctx.lineWidth = 1.2;
      G.ctx.beginPath();
      G.ctx.moveTo(x, base);
      G.ctx.lineTo(x, base - 196);
      G.ctx.stroke();
      G.ctx.fillStyle = night ? '#9fd3ff' : '#9fb1bf';
      G.ctx.fillRect(x - 1, base - 200, 2, 10);
      if (night) {
        G.ctx.fillStyle = 'rgba(160,210,255,.5)';
        for (let y = base - 10; y > base - 180; y -= 12) G.ctx.fillRect(x - 14 + (base - y) * .065, y, 28 - (base - y) * .13, 1.5);
      }
      G.ctx.fillStyle = night ? 'rgba(255,255,255,.7)' : '#1e2b33';
      G.ctx.font = '9px sans-serif';
      G.ctx.textAlign = 'center';
      G.ctx.fillText('롯데월드타워', x, base - 210);
    }
    if (phase === 1 && kind === 2) {
      const g = G.ctx.createLinearGradient(x - 18, 0, x + 18, 0);
      g.addColorStop(0, night ? '#6b5320' : '#f0c766');
      g.addColorStop(1, night ? '#3d2f12' : '#b9832a');
      G.ctx.fillStyle = g;
      G.ctx.beginPath();
      G.ctx.moveTo(x - 19, base);
      G.ctx.lineTo(x - 15, base - 150);
      G.ctx.lineTo(x + 15, base - 138);
      G.ctx.lineTo(x + 19, base);
      G.ctx.fill();
      G.ctx.strokeStyle = night ? 'rgba(255,215,106,.55)' : 'rgba(255,255,255,.35)';
      G.ctx.lineWidth = 1;
      G.ctx.beginPath();
      for (let y = base - 8; y > base - 138; y -= 8) {
        G.ctx.moveTo(x - 18, y);
        G.ctx.lineTo(x + 18, y - (base - y) * .0);
      }
      G.ctx.stroke();
      G.ctx.fillStyle = night ? 'rgba(255,255,255,.7)' : '#1e2b33';
      G.ctx.font = '9px sans-serif';
      G.ctx.textAlign = 'center';
      G.ctx.fillText('63빌딩', x, base - 156);
    }
  }
}
// 한옥(기와지붕 곡선, 처마 끝이 들림) / 궁궐 대문
export function roof(x, top, w, col) {
  G.ctx.fillStyle = col;
  G.ctx.beginPath();
  G.ctx.moveTo(x - 14, top - 8);
  G.ctx.quadraticCurveTo(x + w * .25, top + 2, x + w / 2, top + 2);
  G.ctx.quadraticCurveTo(x + w * .75, top + 2, x + w + 14, top - 8);
  G.ctx.lineTo(x + w - 8, top - 16);
  G.ctx.lineTo(x + 8, top - 16);
  G.ctx.closePath();
  G.ctx.fill();
  G.ctx.lineWidth = 3;
  G.ctx.strokeStyle = col;
  G.ctx.beginPath();
  G.ctx.moveTo(x + 2, top - 19);
  G.ctx.quadraticCurveTo(x + w / 2, top - 14, x + w - 2, top - 19);
  G.ctx.stroke();
  G.ctx.strokeStyle = 'rgba(255,255,255,.12)';
  G.ctx.lineWidth = 1;
  G.ctx.beginPath();
  for (let k = x + 4; k < x + w - 4; k += 5) {
    G.ctx.moveTo(k, top - 14);
    G.ctx.lineTo(k - 1, top);
  }
  G.ctx.stroke();
}
export function hanok(x, base, w, night, i) {
  const h = 30,
    top = base - h;
  G.ctx.fillStyle = night ? '#3a3a44' : '#f3ecdc';
  G.ctx.fillRect(x, top, w, h);
  G.ctx.fillStyle = night ? '#2a221c' : '#7a5536';
  for (let k = 0; k <= 4; k++) G.ctx.fillRect(x + k * (w - 4) / 4, top, 4, h);
  for (let k = 0; k < 4; k++) {
    const wx = x + 6 + k * (w - 4) / 4,
      ww = (w - 4) / 4 - 8;
    G.ctx.fillStyle = night && hsh(i * 7 + k) > .35 ? '#ffcf6b' : night ? '#2e2a30' : '#e9dcc0';
    G.ctx.fillRect(wx, top + 7, ww, 14);
    G.ctx.strokeStyle = night ? 'rgba(80,50,20,.8)' : '#9a7a52';
    G.ctx.lineWidth = .8;
    G.ctx.beginPath();
    for (let gx = wx + 4; gx < wx + ww; gx += 4) {
      G.ctx.moveTo(gx, top + 7);
      G.ctx.lineTo(gx, top + 21);
    }
    G.ctx.moveTo(wx, top + 14);
    G.ctx.lineTo(wx + ww, top + 14);
    G.ctx.stroke();
  }
  G.ctx.fillStyle = night ? '#1f4a3c' : '#3e8e6e';
  G.ctx.fillRect(x - 4, top - 3, w + 8, 3);
  roof(x, top - 3, w, night ? '#1c1f26' : '#4a4f57');
}
export function palaceGate(x, base, night) {
  const w = 160;
  G.ctx.fillStyle = night ? '#4a4a52' : '#b9b2a5';
  G.ctx.fillRect(x, base - 34, w, 34);
  G.ctx.strokeStyle = 'rgba(0,0,0,.12)';
  G.ctx.lineWidth = 1;
  G.ctx.beginPath();
  for (let y = base - 34; y < base; y += 8) {
    G.ctx.moveTo(x, y);
    G.ctx.lineTo(x + w, y);
  }
  G.ctx.stroke();
  G.ctx.fillStyle = night ? '#15161c' : '#3a3026';
  G.ctx.beginPath();
  G.ctx.moveTo(x + w / 2 - 16, base);
  G.ctx.lineTo(x + w / 2 - 16, base - 18);
  G.ctx.arc(x + w / 2, base - 18, 16, Math.PI, 0);
  G.ctx.lineTo(x + w / 2 + 16, base);
  G.ctx.fill();
  G.ctx.fillStyle = night ? '#6b1f1f' : '#b23a2b';
  for (let k = 0; k < 7; k++) G.ctx.fillRect(x + 18 + k * 20, base - 56, 5, 22);
  G.ctx.fillStyle = night ? '#1f4a3c' : '#3e8e6e';
  G.ctx.fillRect(x + 10, base - 60, w - 20, 5);
  roof(x + 12, base - 60, w - 24, night ? '#1c1f26' : '#4a4f57');
  G.ctx.fillStyle = night ? '#6b1f1f' : '#b23a2b';
  for (let k = 0; k < 5; k++) G.ctx.fillRect(x + 40 + k * 20, base - 92, 4, 14);
  G.ctx.fillStyle = night ? '#1f4a3c' : '#3e8e6e';
  G.ctx.fillRect(x + 34, base - 95, w - 68, 4);
  roof(x + 42, base - 95, w - 84, night ? '#1c1f26' : '#4a4f57');
  G.ctx.fillStyle = night ? '#ffd76a' : '#1e2b33';
  G.ctx.font = 'bold 9px serif';
  G.ctx.textAlign = 'center';
  G.ctx.fillText('光化門', x + w / 2, base - 64);
  if (night) {
    const g = G.ctx.createRadialGradient(x + w / 2, base - 40, 10, x + w / 2, base - 40, 110);
    g.addColorStop(0, 'rgba(255,200,120,.25)');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    G.ctx.fillStyle = g;
    G.ctx.fillRect(x - 40, base - 150, w + 80, 150);
  }
}
export function tree(x, y) {
  G.ctx.fillStyle = '#7a5536';
  G.ctx.fillRect(x - 3, y - 24, 6, 24);
  G.ctx.fillStyle = '#5f9e5a';
  G.ctx.beginPath();
  G.ctx.arc(x, y - 36, 16, 0, 7);
  G.ctx.arc(x - 11, y - 27, 11, 0, 7);
  G.ctx.arc(x + 11, y - 28, 11, 0, 7);
  G.ctx.fill();
  G.ctx.fillStyle = 'rgba(255,255,255,.15)';
  G.ctx.beginPath();
  G.ctx.arc(x - 5, y - 42, 6, 0, 7);
  G.ctx.fill();
}
export function pine(x, y, i) {
  const lean = (hsh(i * 5) - .5) * 10;
  G.ctx.strokeStyle = '#8a4b2f';
  G.ctx.lineWidth = 5;
  G.ctx.lineCap = 'round';
  G.ctx.beginPath();
  G.ctx.moveTo(x, y);
  G.ctx.quadraticCurveTo(x + lean, y - 22, x + lean * .4, y - 44);
  G.ctx.stroke();
  G.ctx.fillStyle = '#2f5d3a';
  for (const [dx, dy, rx] of [[-8, -30, 16], [8, -38, 15], [0, -48, 13]]) {
    G.ctx.beginPath();
    G.ctx.ellipse(x + lean * .4 + dx, y + dy, rx, 5, 0, 0, 7);
    G.ctx.fill();
  }
  G.ctx.fillStyle = 'rgba(255,255,255,.08)';
  G.ctx.beginPath();
  G.ctx.ellipse(x + lean * .4, y - 50, 8, 2.5, 0, 0, 7);
  G.ctx.fill();
}
export function spectator(x, y, i, now, trad) {
  const s = .85 + hsh(i * 13) * .3,
    c = COLORS[Math.floor(hsh(i * 5) * COLORS.length)],
    sk = SKIN[Math.floor(hsh(i * 9) * SKIN.length)],
    hr = HAIR[Math.floor(hsh(i * 19) * HAIR.length)];
  const wave = hsh(i * 17) > .4,
    a = Math.sin(now * 7 + i * 1.3);
  G.ctx.strokeStyle = sk;
  G.ctx.lineWidth = 2.2 * s;
  G.ctx.lineCap = 'round';
  G.ctx.beginPath();
  if (wave) {
    G.ctx.moveTo(x - 3 * s, y - 12 * s);
    G.ctx.lineTo(x - 7 * s, y - (20 + a * 3) * s);
    G.ctx.moveTo(x + 3 * s, y - 12 * s);
    G.ctx.lineTo(x + 7 * s, y - (20 - a * 3) * s);
  } else {
    G.ctx.moveTo(x - 3 * s, y - 12 * s);
    G.ctx.lineTo(x - 5 * s, y - 5 * s);
    G.ctx.moveTo(x + 3 * s, y - 12 * s);
    G.ctx.lineTo(x + 5 * s, y - 5 * s);
  }
  G.ctx.stroke();
  G.ctx.fillStyle = c;
  rr(x - 4 * s, y - 14 * s, 8 * s, 14 * s, 3 * s);
  G.ctx.fill();
  G.ctx.fillStyle = sk;
  G.ctx.beginPath();
  G.ctx.arc(x, y - 18 * s, 4.2 * s, 0, 7);
  G.ctx.fill();
  G.ctx.fillStyle = hr;
  G.ctx.beginPath();
  G.ctx.arc(x, y - 18.6 * s, 4.4 * s, Math.PI, 0);
  G.ctx.fill();
  if (trad && hsh(i * 29) > .72) {
    G.ctx.fillStyle = '#15161c';
    G.ctx.beginPath();
    G.ctx.ellipse(x, y - 21.5 * s, 8 * s, 1.6 * s, 0, 0, 7);
    G.ctx.fill();
    G.ctx.fillRect(x - 2.6 * s, y - 27 * s, 5.2 * s, 5.5 * s);
  }
  if (hsh(i * 23) > .86) {
    const t = SIGNS[i % SIGNS.length];
    G.ctx.font = 'bold 9px Jua,sans-serif';
    const tw = G.ctx.measureText(t).width + 8,
      sy = y - (32 + a * 2) * s;
    G.ctx.strokeStyle = '#7a5536';
    G.ctx.lineWidth = 1.5;
    G.ctx.beginPath();
    G.ctx.moveTo(x, sy + 10);
    G.ctx.lineTo(x, y - 14 * s);
    G.ctx.stroke();
    G.ctx.fillStyle = '#fff';
    G.ctx.fillRect(x - tw / 2, sy, tw, 11);
    G.ctx.strokeStyle = '#1e2b33';
    G.ctx.lineWidth = 1;
    G.ctx.strokeRect(x - tw / 2, sy, tw, 11);
    G.ctx.fillStyle = '#e4572e';
    G.ctx.textAlign = 'center';
    G.ctx.fillText(t, x, sy + 9);
  }
}
export function walker(x, y, k, now) {
  const ph = now * 6 + k,
    sw = Math.sin(ph),
    c = COLORS[(k * 3 + 2) % COLORS.length],
    sk = SKIN[k % SKIN.length];
  G.ctx.strokeStyle = '#2c3e50';
  G.ctx.lineWidth = 2.4;
  G.ctx.lineCap = 'round';
  G.ctx.beginPath();
  G.ctx.moveTo(x - 1, y - 8);
  G.ctx.lineTo(x - 1 + sw * 3, y);
  G.ctx.moveTo(x + 1, y - 8);
  G.ctx.lineTo(x + 1 - sw * 3, y);
  G.ctx.stroke();
  G.ctx.fillStyle = c;
  rr(x - 4, y - 19, 8, 12, 3);
  G.ctx.fill();
  G.ctx.fillStyle = sk;
  G.ctx.beginPath();
  G.ctx.arc(x, y - 23, 4, 0, 7);
  G.ctx.fill();
  G.ctx.strokeStyle = sk;
  G.ctx.lineWidth = 2;
  G.ctx.beginPath();
  G.ctx.moveTo(x + 2, y - 16);
  G.ctx.lineTo(x + 7, y - 11);
  G.ctx.stroke();
  const dx = x + 24,
    dc = ['#c58b4e', '#f2e2c4', '#3b3b3b', '#e0b36a'][k % 4],
    b = Math.abs(Math.sin(ph * 1.6)) * 1.2;
  G.ctx.strokeStyle = '#e4572e';
  G.ctx.lineWidth = 1;
  G.ctx.beginPath();
  G.ctx.moveTo(x + 7, y - 11);
  G.ctx.quadraticCurveTo(x + 15, y - 6, dx + 5, y - 8 - b);
  G.ctx.stroke();
  G.ctx.strokeStyle = dc;
  G.ctx.lineWidth = 1.8;
  G.ctx.beginPath();
  for (const [lx, o] of [[-4, 0], [-1, Math.PI], [3, Math.PI], [6, 0]]) {
    const l = Math.sin(ph * 1.6 + o) * 2;
    G.ctx.moveTo(dx + lx, y - 4 - b);
    G.ctx.lineTo(dx + lx + l, y);
  }
  G.ctx.stroke();
  G.ctx.fillStyle = dc;
  G.ctx.beginPath();
  G.ctx.ellipse(dx + 1, y - 6 - b, 6, 3.4, 0, 0, 7);
  G.ctx.fill();
  G.ctx.beginPath();
  G.ctx.arc(dx + 7, y - 9 - b, 3.2, 0, 7);
  G.ctx.fill();
  G.ctx.fillStyle = '#1e2b33';
  G.ctx.beginPath();
  G.ctx.arc(dx + 8.5, y - 9.5 - b, .8, 0, 7);
  G.ctx.fill();
  G.ctx.strokeStyle = dc;
  G.ctx.lineWidth = 1.6;
  G.ctx.beginPath();
  G.ctx.moveTo(dx - 5, y - 7 - b);
  G.ctx.lineTo(dx - 9, y - 10 - b + Math.sin(now * 14) * 2);
  G.ctx.stroke();
}
// 밤 조명: 도심은 가로등, 전통 마을은 청사초롱. 같은 위치로 도로에 빛 웅덩이를 그림
export function lampXs(spacing, offset, cb) {
  const a = Math.floor((G.camX - OFF - offset - 100) / spacing),
    b = Math.ceil((G.camX - OFF - offset + G.W + 100) / spacing);
  for (let i = a; i <= b; i++) cb(i * spacing + offset - G.camX + OFF, i);
}
export function glow(x, y, r, c) {
  const g = G.ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, c);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  G.ctx.fillStyle = g;
  G.ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
export function nightLights(th) {
  if (th.trad) lampXs(150, 40, x => {
    G.ctx.strokeStyle = '#3a2a1c';
    G.ctx.lineWidth = 2.5;
    G.ctx.beginPath();
    G.ctx.moveTo(x, GT - 2);
    G.ctx.lineTo(x, GT - 34);
    G.ctx.lineTo(x + 8, GT - 34);
    G.ctx.stroke();
    glow(x + 8, GT - 26, 26, 'rgba(255,170,90,.55)');
    G.ctx.fillStyle = '#d63a3a';
    rr(x + 3, GT - 32, 10, 8, 3);
    G.ctx.fill();
    G.ctx.fillStyle = '#2f5fb2';
    rr(x + 3, GT - 25, 10, 7, 3);
    G.ctx.fill();
    G.ctx.fillStyle = '#ffe9b0';
    G.ctx.fillRect(x + 7, GT - 31, 2, 12);
  });else lampXs(200, 100, x => {
    G.ctx.strokeStyle = '#5d6e78';
    G.ctx.lineWidth = 3;
    G.ctx.beginPath();
    G.ctx.moveTo(x, GT - 2);
    G.ctx.lineTo(x, GT - 62);
    G.ctx.quadraticCurveTo(x, GT - 70, x + 10, GT - 70);
    G.ctx.stroke();
    glow(x + 12, GT - 66, 34, 'rgba(255,230,150,.6)');
    G.ctx.fillStyle = '#fff4c2';
    rr(x + 6, GT - 70, 14, 4, 2);
    G.ctx.fill();
  });
}
export function roadPools(th) {
  const sp = th.trad ? 150 : 200,
    of = th.trad ? 48 : 112;
  lampXs(sp, of, x => {
    G.ctx.save();
    G.ctx.translate(x, GT + 30);
    G.ctx.scale(1, .35);
    glow(0, 0, 110, 'rgba(255,215,140,.28)');
    G.ctx.restore();
  });
}
export function cityBg(th) {
  const now = performance.now() / 1000,
    top = GT - 30,
    n8 = th.night;
  if (th.trad) {
    ridge(.05, 1, top + 4, 120, n8 ? '#2a3650' : '#aebccb', true);
    ridge(.1, 5, top + 4, 80, n8 ? '#1f2a3d' : '#8fa79f', true);
    // 한옥 마을 + 일정 간격 궁궐 대문
    const off = G.camX * .3,
      step = 130,
      i0 = Math.floor((off - 200) / step),
      i1 = Math.ceil((off + G.W) / step);
    for (let i = i0; i <= i1; i++) {
      const x = i * step - off;
      if ((i % 7 + 7) % 7 === 3) palaceGate(x - 20, top, n8);else if ((i % 7 + 7) % 7 !== 4) hanok(x, top, 96 + hsh(i) * 10, n8, i);
    }
  } else {
    landmarks(.08, top, n8, 0);
    skyline(.14, 1, top, 50, 140, n8 ? '#26344f' : '#b9c9d6', n8 ? '#ffd76a' : 'rgba(255,255,255,.55)', n8 ? .55 : .45, false, n8);
    landmarks(.14, top, n8, 1);
    skyline(.3, 7, top, 30, 95, n8 ? '#1b2640' : '#91a5b6', n8 ? '#ffe08a' : '#dfe9f0', n8 ? .5 : .45, true, n8);
  }
  // 위쪽 인도: 나무 → 응원 시민 → 펜스(도심) / 돌담(전통)
  G.ctx.fillStyle = th.trad ? n8 ? '#5b5246' : '#d8cdb8' : '#d3d8dc';
  G.ctx.fillRect(0, top, G.W, 30);
  const sp = th.trad ? 220 : 260,
    tw0 = Math.floor((G.camX - OFF - 40) / sp),
    tw1 = Math.ceil((G.camX - OFF + G.W + 40) / sp);
  for (let i = tw0; i <= tw1; i++) {
    const x = i * sp + 70 - G.camX + OFF;
    th.trad ? pine(x, top + 12, i) : tree(x, top + 12);
  }
  const s0 = Math.floor((G.camX - OFF - 20) / 22),
    s1 = Math.ceil((G.camX - OFF + G.W + 20) / 22);
  for (let i = s0; i <= s1; i++) if (hsh(i * 3) > .22) spectator(i * 22 + hsh(i) * 8 - G.camX + OFF, GT - 6, i, now, th.trad);
  if (th.trad) {
    // 돌담 + 기와 얹은 담장
    G.ctx.fillStyle = n8 ? '#4a4a52' : '#a39e94';
    G.ctx.fillRect(0, GT - 14, G.W, 11);
    const b0 = Math.floor((G.camX - OFF) / 13);
    for (let i = b0; i <= b0 + G.W / 13 + 2; i++) {
      const x = i * 13 - G.camX + OFF;
      G.ctx.fillStyle = hsh(i) > .5 ? n8 ? '#5a5a62' : '#bdb7ab' : n8 ? '#3f3f47' : '#8f897e';
      G.ctx.beginPath();
      G.ctx.ellipse(x + 6, GT - 9 + i % 2 * 3, 6, 3.2, 0, 0, 7);
      G.ctx.fill();
    }
    G.ctx.fillStyle = n8 ? '#1c1f26' : '#4a4f57';
    G.ctx.fillRect(0, GT - 17, G.W, 4);
  } else {
    G.ctx.fillStyle = '#9aa3ab';
    G.ctx.fillRect(0, GT - 12, G.W, 2);
    G.ctx.fillRect(0, GT - 6, G.W, 2);
    const p0 = Math.floor((G.camX - OFF) / 40);
    for (let i = p0; i <= p0 + G.W / 40 + 1; i++) G.ctx.fillRect(i * 40 - G.camX + OFF, GT - 14, 2, 12);
  }
  G.ctx.fillStyle = th.trad ? n8 ? '#3d3529' : '#b9a98a' : '#a3abb2';
  G.ctx.fillRect(0, GT - 3, G.W, 3);
  // 아래쪽 인도: 강아지와 산책
  const by = GT + G.GD + 20;
  G.ctx.fillStyle = th.trad ? n8 ? '#5b5246' : '#d8cdb8' : '#d3d8dc';
  G.ctx.fillRect(0, by, G.W, G.H - by);
  G.ctx.fillStyle = th.trad ? '#b9a98a' : '#a3abb2';
  G.ctx.fillRect(0, by, G.W, 3);
  for (let k = 0; k < 4; k++) {
    const wx = 350 + k * 1700 + G.clock * 26 - G.camX + OFF;
    if (wx > -60 && wx < G.W + 60) walker(wx, G.H - 4, k, now);
  }
  // 밤: 인도와 사람들을 어둡게 덮고 조명만 밝게
  if (n8) {
    G.ctx.fillStyle = 'rgba(8,14,38,.5)';
    G.ctx.fillRect(0, top - 60, G.W, GT - top + 60);
    G.ctx.fillRect(0, by, G.W, G.H - by);
    nightLights(th);
  }
}
// 카메라·헬기가 따라가는 캐릭터: 아직 도착하지 않은 선두. 모두 도착했으면 마지막 도착자
export function focusR() {
  let f = null;
  for (const r of G.racers) if (!r.fin && (!f || r.x > f.x)) f = r;
  return f || G.fin[G.fin.length - 1] || null;
}
// 헬기: 시작 전에는 캔버스 위 마우스 x를 따라감(캔버스 밖으로 나가면 마지막 위치에서 제자리 비행)
export function drawHeli() {
  const f = G.state === 'idle' ? null : focusR(),
    now = performance.now() / 1000,
    panel = (G.n > 10 ? 332 : 172) + 30,
    night = TH().night;
  let tx;
  if (G.state === 'idle') tx = Math.max(50, Math.min(G.W - 50, G.heliMX ?? G.W * .45));else tx = f ? Math.max(110, Math.min(G.W - panel, f.x - G.camX + OFF + 70)) : G.W * .45;
  if (!G.heli.x) G.heli.x = tx;
  G.heli.x += (tx - G.heli.x) * Math.min(1, G.fdt * (G.state === 'idle' ? 3 : 1.5));
  const x = G.heli.x,
    y = 92 + Math.sin(now * 1.3) * 4,
    tilt = Math.max(-.25, Math.min(.25, (tx - x) * .004));
  G.heli.y = y;
  if (f && (G.state === 'run' || G.state === 'replay' || G.state === 'count')) {
    const px = f.x - G.camX + OFF,
      py = GT + 16 + f.d - (f.h || 0);
    G.ctx.fillStyle = night ? 'rgba(255,240,180,.3)' : 'rgba(255,236,160,.16)';
    G.ctx.beginPath();
    G.ctx.moveTo(x - 4, y + 9);
    G.ctx.lineTo(x + 4, y + 9);
    G.ctx.lineTo(px + 26, py + 6);
    G.ctx.lineTo(px - 26, py + 6);
    G.ctx.closePath();
    G.ctx.fill();
  }
  G.ctx.save();
  G.ctx.translate(x, y);
  G.ctx.rotate(.06 + tilt + Math.sin(now * 1.3) * .02);
  G.ctx.strokeStyle = '#4b5863';
  G.ctx.lineWidth = 2;
  G.ctx.beginPath();
  G.ctx.moveTo(-14, 12);
  G.ctx.lineTo(14, 12);
  G.ctx.moveTo(-8, 8);
  G.ctx.lineTo(-9, 12);
  G.ctx.moveTo(8, 8);
  G.ctx.lineTo(9, 12);
  G.ctx.stroke();
  G.ctx.fillStyle = '#f4f6f8';
  G.ctx.beginPath();
  G.ctx.moveTo(-14, -2);
  G.ctx.lineTo(-42, -4);
  G.ctx.lineTo(-42, 1);
  G.ctx.lineTo(-14, 4);
  G.ctx.fill();
  G.ctx.fillStyle = '#e4572e';
  G.ctx.beginPath();
  G.ctx.arc(-42, -2, 4 + Math.sin(now * 40) * .5, 0, 7);
  G.ctx.fill();
  G.ctx.fillStyle = '#f4f6f8';
  G.ctx.beginPath();
  G.ctx.ellipse(0, 0, 17, 10, 0, 0, 7);
  G.ctx.fill();
  G.ctx.fillStyle = '#1f6fb2';
  G.ctx.fillRect(-15, 1, 30, 3);
  G.ctx.fillStyle = '#8fd3f4';
  G.ctx.beginPath();
  G.ctx.ellipse(9, -2, 7, 6, 0, -Math.PI / 2, Math.PI / 2);
  G.ctx.fill();
  G.ctx.fillStyle = '#1e2b33';
  G.ctx.font = 'bold 6px sans-serif';
  G.ctx.textAlign = 'center';
  G.ctx.fillText('NEWS', -4, -2);
  G.ctx.fillStyle = '#4b5863';
  G.ctx.fillRect(-1.5, -14, 3, 5);
  if (night && now % 1 < .5) {
    G.ctx.fillStyle = '#ff4d4d';
    G.ctx.beginPath();
    G.ctx.arc(0, 10, 2, 0, 7);
    G.ctx.fill();
    G.ctx.beginPath();
    G.ctx.arc(-42, -6, 1.6, 0, 7);
    G.ctx.fill();
  }
  const rw = 26 * Math.abs(Math.cos(now * 30));
  G.ctx.strokeStyle = 'rgba(40,50,60,.75)';
  G.ctx.lineWidth = 2.4;
  G.ctx.beginPath();
  G.ctx.moveTo(-rw, -14);
  G.ctx.lineTo(rw, -14);
  G.ctx.stroke();
  G.ctx.restore();
}
// 허들 한 칸(레인 하나). down이면 앞으로 넘어간 모습(ft: 0→1 넘어가는 진행도)
export function hurdle(x, y, down, ft) {
  const p = down ? Math.min(1, ft) : 0;
  if (p < 1) {
    G.ctx.fillStyle = 'rgba(30,43,51,.18)';
    G.ctx.beginPath();
    G.ctx.ellipse(x, y + 2, 13, 3, 0, 0, 7);
    G.ctx.fill();
  }
  G.ctx.save();
  G.ctx.translate(x, y);
  G.ctx.transform(1, 0, .9 * p, 1 - .8 * p, 0, 0);
  G.ctx.strokeStyle = '#2c3e50';
  G.ctx.lineWidth = 2.4;
  G.ctx.lineCap = 'round';
  G.ctx.beginPath();
  G.ctx.moveTo(-13, 0);
  G.ctx.lineTo(-5, 0);
  G.ctx.moveTo(5, 0);
  G.ctx.lineTo(13, 0);
  G.ctx.stroke();
  G.ctx.strokeStyle = '#8a97a3';
  G.ctx.lineWidth = 2.6;
  G.ctx.beginPath();
  G.ctx.moveTo(-9, 0);
  G.ctx.lineTo(-9, -18);
  G.ctx.moveTo(9, 0);
  G.ctx.lineTo(9, -18);
  G.ctx.stroke();
  G.ctx.fillStyle = '#e4572e';
  G.ctx.fillRect(-12, -2, 5, 2);
  G.ctx.fillRect(7, -2, 5, 2);
  G.ctx.fillStyle = '#fff';
  G.ctx.fillRect(-12, -23, 24, 6);
  G.ctx.fillStyle = '#e4572e';
  G.ctx.fillRect(-12, -23, 5, 6);
  G.ctx.fillRect(-2.5, -23, 5, 6);
  G.ctx.fillRect(7, -23, 5, 6);
  G.ctx.strokeStyle = '#1e2b33';
  G.ctx.lineWidth = 1;
  G.ctx.strokeRect(-12, -23, 24, 6);
  G.ctx.restore();
}
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

export function bubble(x, y, t) {
  G.ctx.font = '16px Jua,sans-serif';
  const w = G.ctx.measureText(t).width + 20,
    h = 28,
    bx = Math.max(4, Math.min(G.W - w - 4, x - w / 2)),
    tx = Math.max(bx + 12, Math.min(bx + w - 12, x));
  G.ctx.fillStyle = '#fff';
  G.ctx.strokeStyle = '#1e2b33';
  G.ctx.lineWidth = 2;
  rr(bx, y - h, w, h, 12);
  G.ctx.fill();
  G.ctx.stroke();
  G.ctx.beginPath();
  G.ctx.moveTo(tx - 6, y - 1);
  G.ctx.lineTo(tx, y + 8);
  G.ctx.lineTo(tx + 6, y - 1);
  G.ctx.closePath();
  G.ctx.fill();
  G.ctx.stroke();
  G.ctx.fillRect(tx - 5, y - 3, 10, 3);
  G.ctx.fillStyle = '#1e2b33';
  G.ctx.textAlign = 'center';
  G.ctx.fillText(t, bx + w / 2, y - 9);
}
export function podiumStep(dt) {
  if (G.pt > 2.9) for (let k = 0; k < 3; k++) G.conf.push({
    x: R(0, G.W),
    y: -10,
    vx: R(-40, 40),
    vy: R(90, 170),
    c: COLORS[Math.floor(R(0, 8))],
    a: R(0, 6)
  });
  for (const c of G.conf) {
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.a += dt * 5;
  }
  G.conf = G.conf.filter(c => c.y < G.H + 10);
}
// 조명 세기: t0초부터 0.6초 페이드인 → 4.5초 유지 → 0.6초 페이드아웃 후 전체 컬러로 복귀
export function spotA(t0) {
  const FI = .6,
    HOLD = 4.5;
  return Math.min((G.pt - t0) / FI, (t0 + FI + HOLD + FI - G.pt) / FI);
}
export function spotlight(cx, cy, rad, a) {
  a = Math.max(0, Math.min(1, a));
  if (a <= 0) return;
  const e = 1 - (1 - a) * (1 - a);
  if (!G.sp) G.sp = document.createElement('canvas');
  if (G.sp.width !== G.W || G.sp.height !== G.H) {
    G.sp.width = G.W;
    G.sp.height = G.H;
  }
  const s = G.sp.getContext('2d');
  s.clearRect(0, 0, G.W, G.H);
  s.drawImage(G.cv, 0, 0);
  G.ctx.save();
  G.ctx.globalAlpha = e;
  if ('filter' in G.ctx) {
    G.ctx.filter = 'grayscale(1) brightness(.55)';
    G.ctx.drawImage(G.sp, 0, 0);
    G.ctx.filter = 'none';
  } else {
    G.ctx.fillStyle = 'rgba(0,0,0,.6)';
    G.ctx.fillRect(0, 0, G.W, G.H);
  }
  G.ctx.restore();
  const z = 1 + .25 * e,
    r = rad * (.85 + .15 * e) * z;
  G.ctx.save();
  G.ctx.beginPath();
  G.ctx.arc(cx, cy, r, 0, 7);
  G.ctx.clip();
  G.ctx.translate(cx, cy);
  G.ctx.scale(z, z);
  G.ctx.drawImage(G.sp, -cx, -cy);
  G.ctx.restore();
  G.ctx.save();
  G.ctx.globalAlpha = e;
  G.ctx.strokeStyle = '#fff6c8';
  G.ctx.lineWidth = 4;
  G.ctx.shadowColor = '#ffd166';
  G.ctx.shadowBlur = 18;
  G.ctx.beginPath();
  G.ctx.arc(cx, cy, r, 0, 7);
  G.ctx.stroke();
  G.ctx.restore();
}
// 꼴찌 자리: 왼쪽에 꽂힌 '꼴등' 화살표 표지판이 캐릭터를 가리킴. 2위 시상대와 겹치지 않게 모바일 폭에선 조금 왼쪽
export function lastX() {
  const dx = Math.min(150, G.W * .23);
  return Math.max(70, Math.min(90, G.W / 2 - dx - 84));
}
export function lastSign(lx) {
  const px = lx - 36,
    y0 = 304,
    y1 = 326,
    x0 = px - 22,
    x1 = px + 30;
  G.ctx.strokeStyle = '#6b4a2f';
  G.ctx.lineWidth = 5;
  G.ctx.lineCap = 'butt';
  G.ctx.beginPath();
  G.ctx.moveTo(px, y1);
  G.ctx.lineTo(px, 372);
  G.ctx.stroke();
  G.ctx.lineCap = 'round';
  G.ctx.fillStyle = '#d9b27a';
  G.ctx.strokeStyle = '#6b4a2f';
  G.ctx.lineWidth = 2;
  G.ctx.beginPath();
  G.ctx.moveTo(x0, y0);
  G.ctx.lineTo(x1 - 10, y0);
  G.ctx.lineTo(x1, (y0 + y1) / 2);
  G.ctx.lineTo(x1 - 10, y1);
  G.ctx.lineTo(x0, y1);
  G.ctx.closePath();
  G.ctx.fill();
  G.ctx.stroke();
  G.ctx.fillStyle = '#3b2a1a';
  G.ctx.textAlign = 'center';
  G.ctx.font = '15px Jua,sans-serif';
  G.ctx.fillText('꼴등', (x0 + x1 - 10) / 2, y1 - 6);
}
// 폭에 맞게 글자 크기를 줄여 가운데 정렬로 씀
export function drawPodium() {
  G.podBub = null;
  G.lastBub = null;
  const g = G.ctx.createLinearGradient(0, 0, 0, G.H);
  g.addColorStop(0, '#26325c');
  g.addColorStop(1, '#6f86c9');
  G.ctx.fillStyle = g;
  G.ctx.fillRect(0, 0, G.W, G.H);
  G.ctx.fillStyle = 'rgba(255,255,255,.07)';
  for (const lx of [G.W / 4, G.W / 2, G.W * .75]) {
    const c = G.W / 2,
      q = G.W / 4,
      mid = lx === c;
    G.ctx.beginPath();
    G.ctx.moveTo(lx - 14, 0);
    G.ctx.lineTo(lx + 14, 0);
    G.ctx.lineTo(lx + 120 * (lx - c) / q + (mid ? 70 : 0), 370);
    G.ctx.lineTo(lx - 120 * (c - lx) / q - (mid ? 70 : 0), 370);
    G.ctx.fill();
  }
  G.ctx.fillStyle = '#3b2f3f';
  G.ctx.fillRect(0, 360, G.W, G.H - 360);
  G.ctx.textAlign = 'center';
  G.ctx.fillStyle = '#fff';
  G.ctx.font = '36px Jua,sans-serif';
  G.ctx.fillText('시상식', G.W / 2, 48);
  const dx = Math.min(150, G.W * .23),
    slots = [{
      x: G.W / 2,
      h: 100,
      c: '#f4c430',
      d: 2.2
    }, {
      x: G.W / 2 - dx,
      h: 70,
      c: '#c0c6cc',
      d: 1.4
    }, {
      x: G.W / 2 + dx,
      h: 50,
      c: '#cd7f32',
      d: .6
    }];
  slots.forEach((sl, k) => {
    const r = G.fin[k];
    if (!r || G.n > 1 && r === G.fin[G.n - 1]) return;
    const top = 360 - sl.h;
    G.ctx.fillStyle = sl.c;
    rr(sl.x - 62, top, 124, sl.h + 4, 6);
    G.ctx.fill();
    G.ctx.fillStyle = '#1e2b33';
    G.ctx.font = '20px Jua,sans-serif';
    G.ctx.fillText(k + 1 + '위', sl.x, top + 22);
    fitText(r.name, sl.x, top + 43, 16, 112);
    const a = G.pt - sl.d;
    if (a < 0) return;
    const u = Math.min(1, a / .7);
    let off = -320 * (1 - u) * (1 - u);
    if (a > .7) off -= Math.abs(Math.sin((a - .7) * 9)) * Math.max(0, 1 - (a - .7) * 1.4) * 16;
    drawPerson(sl.x, top + off, r, {
      cheer: a > .7,
      run: false
    });
    if (a > .7) {
      G.ctx.font = '19px Jua,sans-serif';
      const tw = G.ctx.measureText(r.name).width + 16;
      G.ctx.fillStyle = r.color;
      rr(sl.x - tw / 2, top + off - 80, tw, 22, 10);
      G.ctx.fill();
      G.ctx.fillStyle = ink(r.color);
      G.ctx.fillText(r.name, sl.x, top + off - 63);
      if (k === 0) {
        G.ctx.font = '30px sans-serif';
        G.ctx.fillText('🏆', sl.x + 30, top + off - 20);
        G.podBub = {
          x: sl.x,
          y: top + off - 88
        };
      }
    }
  });
  if (G.n > 1 && G.fin[G.n - 1]) {
    const lx = lastX(),
      r = G.fin[G.n - 1],
      u = Math.min(1, Math.max(0, (G.pt - .2) / 1.6)),
      x = -40 + (lx + 40) * u,
      walk = u < 1;
    G.ctx.fillStyle = '#2a3350';
    G.ctx.beginPath();
    G.ctx.moveTo(0, 200);
    G.ctx.lineTo(150, 372);
    G.ctx.lineTo(0, 372);
    G.ctx.fill();
    lastSign(lx);
    const fy = 372;
    if (!walk && r.age !== 'r') {
      G.ctx.fillStyle = 'rgba(79,195,247,.5)';
      G.ctx.beginPath();
      G.ctx.ellipse(x + 6, 374, Math.max(0, Math.min(34, (G.pt - 1.8) * 14)), 6, 0, 0, 7);
      G.ctx.fill();
    }
    drawPerson(x, fy, r, {
      run: walk,
      ph: G.pt * 14,
      cry: true,
      sad: !walk
    });
    // 꼴찌: 이름표 '이름(꼴등)' + 말풍선(조명 효과 위에 그리도록 위치만 기억)
    if (!walk) {
      const lb = r.name;
      G.ctx.textAlign = 'center';
      G.ctx.font = '17px Jua,sans-serif';
      const tw = G.ctx.measureText(lb).width + 16;
      G.ctx.fillStyle = r.color;
      rr(x - tw / 2, fy - 98, tw, 22, 10);
      G.ctx.fill();
      G.ctx.fillStyle = ink(r.color);
      G.ctx.fillText(lb, x, fy - 81);
      G.lastBub = {
        x: x,
        y: fy - 106,
        t: r.age === 'r' ? '삐빅… 패배 감지' : '흑흑…'
      };
    }
  }
  for (const c of G.conf) {
    G.ctx.save();
    G.ctx.translate(c.x, c.y);
    G.ctx.rotate(c.a);
    G.ctx.fillStyle = c.c;
    G.ctx.fillRect(-4, -2, 8, 4);
    G.ctx.restore();
  }
  // 응원 포커스: 1등 원함이면 1위, 꼴등 원함이면 꼴찌에게 컬러 조명, 나머지는 흑백
  if (G.want === 'first' && G.fin[0]) spotlight(G.W / 2, 360 - 100 - 40, 72, spotA(3.4));else if (G.want === 'last' && G.n > 1 && G.fin[G.n - 1]) spotlight(lastX() - 8, 328, 90, spotA(2.4));
  if (G.podBub && G.winLine) bubble(G.podBub.x, G.podBub.y, G.winLine);
  if (G.lastBub) bubble(G.lastBub.x, G.lastBub.y, G.lastBub.t);
}
export function draw() {
  if (G.state === 'podium') {
    drawPodium();
    return;
  }
  if (G.state === 'idle') {
    drawPreview();
    return;
  }
  if (G.shake > 0) {
    G.shake -= G.fdt;
    G.ctx.save();
    G.ctx.translate(R(-3, 3) * G.shake * 5, R(-3, 3) * G.shake * 5);
    drawRace();
    G.ctx.restore();
  } else drawRace();
}
// 시작 전 미리보기: 배경 위에 트랙 라인·레인 번호·이름표와 서 있는 캐릭터
export function drawPreview() {
  if (!G.pv) {
    const rs = G.racers;
    G.racers = [];
    G.noHeli = true;
    try {
      drawRace();
    } finally {
      G.noHeli = false;
      G.racers = rs;
    }
    G.pv = document.createElement('canvas');
    G.pv.width = G.W;
    G.pv.height = G.H;
    const p = G.pv.getContext('2d');
    p.drawImage(G.cv, 0, 0);
  }
  G.ctx.drawImage(G.pv, 0, 0);
  drawHeli();
  const top = GT,
    bot = GT + G.GD + 20;
  G.ctx.strokeStyle = '#fff';
  G.ctx.lineWidth = 2;
  G.ctx.beginPath();
  G.ctx.moveTo(0, top);
  G.ctx.lineTo(G.W, top);
  G.ctx.moveTo(0, bot);
  G.ctx.lineTo(G.W, bot);
  G.ctx.stroke();
  G.ctx.fillStyle = '#fff';
  G.ctx.fillRect(OFF - 3, top, 6, bot - top);
  // 레인 구분선
  const gap = (G.GD + 20) / G.n;
  G.ctx.strokeStyle = 'rgba(255,255,255,.8)';
  G.ctx.lineWidth = 1;
  G.ctx.setLineDash([6, 6]);
  G.ctx.beginPath();
  for (let k = 1; k < G.n; k++) {
    const y = GT + k * gap;
    G.ctx.moveTo(0, y);
    G.ctx.lineTo(G.W, y);
  }
  G.ctx.stroke();
  G.ctx.setLineDash([]);
  const fs = Math.max(11, Math.min(15, gap - 2));
  // 커스터마이징 카드에 마우스를 올린 캐릭터는 마지막에 따로 그림(focusOne)
  const hr = G.hover >= 0 ? G.racers.find(r => r.i === G.hover) : null;
  for (const r of G.racers.slice().sort((a, b) => a.d - b.d)) {
    if (r === hr) continue;
    const base = GT + 16 + r.d;
    G.ctx.fillStyle = 'rgba(30,43,51,.25)';
    G.ctx.beginPath();
    G.ctx.ellipse(OFF - BACK, base + 4, 13, 4, 0, 0, 7);
    G.ctx.fill();
    drawPerson(OFF - BACK, base, r, {
      run: false
    });
  }
  // 레인 번호는 화면 왼쪽 끝
  G.ctx.font = fs + 'px Jua,sans-serif';
  for (const r of G.racers) {
    const y = GT + 16 + r.d + 4,
      ln = (G.lanes[r.i] ?? r.i) + 1;
    G.ctx.textAlign = 'center';
    G.ctx.fillStyle = '#1e2b33';
    G.ctx.fillText(String(ln), 11, y);
  }
  G.ctx.textAlign = 'center';
  G.ctx.font = '26px Jua,sans-serif';
  G.ctx.lineWidth = 5;
  G.ctx.strokeStyle = '#fff';
  G.ctx.fillStyle = '#1e2b33';
  G.ctx.strokeText('시작을 누르면 출발!', G.W / 2, GT - 60);
  G.ctx.fillText('시작을 누르면 출발!', G.W / 2, GT - 60);
  if (hr) focusOne(hr);
}
// 호버한 캐릭터 강조: 지금까지 그린 화면 전체를 흐리게 덮고, 그 캐릭터만 선명하게 + 흰 외곽선
export function focusOne(r) {
  if (!G.fb) G.fb = [0, 0, 0].map(() => document.createElement('canvas'));
  for (const c of G.fb) if (c.width !== G.W || c.height !== G.H) {
    c.width = G.W;
    c.height = G.H;
  }
  const snap = G.fb[0].getContext('2d'),
    one = G.fb[1].getContext('2d'),
    sil = G.fb[2].getContext('2d');
  snap.clearRect(0, 0, G.W, G.H);
  snap.drawImage(G.cv, 0, 0);
  if ('filter' in G.ctx) {
    G.ctx.filter = 'blur(3px)';
    G.ctx.drawImage(G.fb[0], 0, 0);
    G.ctx.filter = 'none';
  }
  G.ctx.fillStyle = 'rgba(255,255,255,.2)';
  G.ctx.fillRect(0, 0, G.W, G.H);
  const base = GT + 16 + r.d;
  G.ctx.fillStyle = 'rgba(30,43,51,.3)';
  G.ctx.beginPath();
  G.ctx.ellipse(OFF - BACK, base + 4, 14, 4.5, 0, 0, 7);
  G.ctx.fill();
  one.clearRect(0, 0, G.W, G.H);
  const main = G.ctx;
  G.ctx = one;
  try {
    drawPerson(OFF - BACK, base, r, {
      run: false
    });
  } finally {
    G.ctx = main;
  }
  sil.clearRect(0, 0, G.W, G.H);
  sil.globalCompositeOperation = 'source-over';
  sil.drawImage(G.fb[1], 0, 0);
  sil.globalCompositeOperation = 'source-in';
  sil.fillStyle = '#fff';
  sil.fillRect(0, 0, G.W, G.H);
  sil.globalCompositeOperation = 'source-over';
  for (const [dx, dy] of [[-2.5, 0], [2.5, 0], [0, -2.5], [0, 2.5], [-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) G.ctx.drawImage(G.fb[2], dx, dy);
  G.ctx.drawImage(G.fb[1], 0, 0);
}
export function drawRace() {
  const th = TH(),
    sky = th.night ? ['#0b1530', '#2b3d6e'] : th.trad ? ['#cfe6f0', '#f4efe0'] : ['#bfe3f2', '#eaf5ee'];
  const g = G.ctx.createLinearGradient(0, 0, 0, GT);
  g.addColorStop(0, sky[0]);
  g.addColorStop(1, sky[1]);
  G.ctx.fillStyle = g;
  G.ctx.fillRect(0, 0, G.W, G.H);
  if (th.night) stars();
  cityBg(th);
  // 도로: 도심은 아스팔트+흰 실선, 전통 마을은 흙길
  G.ctx.fillStyle = th.trad ? th.night ? '#6f6550' : '#cdb98f' : th.night ? '#4a5058' : '#8a9199';
  G.ctx.fillRect(0, GT, G.W, G.GD + 20);
  if (th.trad) {
    G.ctx.fillStyle = 'rgba(90,70,40,.3)';
    G.ctx.fillRect(0, GT, G.W, 3);
    G.ctx.fillRect(0, GT + G.GD + 17, G.W, 3);
  } else {
    G.ctx.fillStyle = th.night ? '#c9ced3' : '#eef1f3';
    G.ctx.fillRect(0, GT + 1, G.W, 2);
    G.ctx.fillRect(0, GT + G.GD + 16, G.W, 2);
  }
  if (th.night) roadPools(th);
  G.ctx.fillStyle = 'rgba(30,43,51,.1)';
  G.ctx.fillRect(0, GT + G.GD + 20 - 6, G.W, 6);
  if (!G.noHeli) drawHeli();
  G.ctx.fillStyle = 'rgba(255,255,255,.16)';
  const s0 = Math.floor((G.camX - OFF) / 160) * 160;
  for (let wx = Math.max(0, s0); wx < G.camX + G.W; wx += 160) G.ctx.fillRect(wx - G.camX + OFF, GT, 3, G.GD + 20);
  let sx = -G.camX + OFF;
  G.ctx.fillStyle = '#fff';
  G.ctx.fillRect(sx - 3, GT, 6, G.GD + 20);
  sx = TRACK - G.camX + OFF;
  if (sx > -30 && sx < G.W + 30) {
    for (let k = 0; k < (G.GD + 20) / 10; k++) for (let c = 0; c < 3; c++) {
      G.ctx.fillStyle = (k + c) % 2 ? '#1e2b33' : '#fff';
      G.ctx.fillRect(sx - 15 + c * 10, GT + k * 10, 10, 10);
    }
  }
  // 진흙 구역
  for (const z of G.muds) {
    const a = z.x0 - G.camX + OFF,
      b = z.x1 - G.camX + OFF;
    if (b < -20 || a > G.W + 20) continue;
    G.ctx.fillStyle = 'rgba(107,74,47,.55)';
    rr(a, GT + 3, b - a, G.GD + 14, 14);
    G.ctx.fill();
    G.ctx.fillStyle = 'rgba(74,50,30,.55)';
    for (let k = 0; k < (z.x1 - z.x0) / 26; k++) {
      const px = a + 13 + k * 26,
        py = GT + 12 + (k * 53 + Math.floor(z.x0)) % Math.max(1, G.GD) * .95;
      G.ctx.beginPath();
      G.ctx.ellipse(px, py, 9, 3.5, 0, 0, 7);
      G.ctx.fill();
    }
  }
  for (const t of G.traps) {
    const tx = t.x - G.camX + OFF;
    if (tx < -120 || tx > G.W + 120) continue;
    if (t.type === 'water') {
      // 물웅덩이: 트랙을 가로지르는 물길, 잔물결이 흐름
      G.ctx.fillStyle = '#4aa3df';
      rr(tx - 26, GT + 2, 52, G.GD + 16, 16);
      G.ctx.fill();
      G.ctx.strokeStyle = 'rgba(255,255,255,.7)';
      G.ctx.lineWidth = 2;
      for (let k = 0; k < (G.GD + 16) / 22; k++) {
        const y = GT + 12 + k * 22,
          o = Math.sin(performance.now() / 400 + k) * 5;
        G.ctx.beginPath();
        G.ctx.moveTo(tx - 12 + o, y);
        G.ctx.quadraticCurveTo(tx + o, y - 4, tx + 12 + o, y);
        G.ctx.stroke();
      }
    } else {
      // 허들: 레인마다 한 칸, 사선으로 늘어섬(위 레인부터 그려 아래 칸이 앞에 보이게)
      for (const u of t.u) hurdle(hx(t, u.d) - G.camX + OFF, GT + 16 + u.d + 4, u.down, u.ft);
    }
  }
  // 스프링 발판
  for (const sp of G.springs) {
    const dm = (sp.d0 + sp.d1) / 2,
      xt = sp.x + (dm - sp.d0) * sp.s - G.camX + OFF,
      xb = sp.x - (sp.d1 - dm) * sp.s - G.camX + OFF;
    if (Math.max(xt, xb) < -40 || Math.min(xt, xb) > G.W + 40) continue;
    const yt = GT + 16 + sp.d0 - 5,
      yb = GT + 16 + sp.d1 + 5,
      hw = 17,
      cm = sp.t > 0 ? .4 : 1;
    const quad = i => {
      G.ctx.beginPath();
      G.ctx.moveTo(xt - hw + i, yt + i * .6);
      G.ctx.lineTo(xt + hw - i, yt + i * .6);
      G.ctx.lineTo(xb + hw - i, yb - i * .6);
      G.ctx.lineTo(xb - hw + i, yb - i * .6);
      G.ctx.closePath();
    };
    // 사선 받침 + 노랑·검정 경고 테두리 + 초록 발판
    G.ctx.fillStyle = 'rgba(30,43,51,.25)';
    G.ctx.save();
    G.ctx.translate(2, 3);
    quad(0);
    G.ctx.fill();
    G.ctx.restore();
    G.ctx.fillStyle = '#2b3138';
    quad(0);
    G.ctx.fill();
    G.ctx.strokeStyle = '#f4c430';
    G.ctx.lineWidth = 3;
    G.ctx.setLineDash([6, 5]);
    quad(1.5);
    G.ctx.stroke();
    G.ctx.setLineDash([]);
    G.ctx.fillStyle = '#2fb67c';
    quad(5);
    G.ctx.fill();
    G.ctx.fillStyle = 'rgba(255,255,255,.25)';
    quad(9);
    G.ctx.fill();
    // 사선을 따라 코일 여러 개(밟히면 눌림)
    const cnt = Math.max(2, Math.round((yb - yt) / 26));
    for (let k = 0; k < cnt; k++) {
      const u = (k + .5) / cnt,
        cx = xt + (xb - xt) * u,
        cy = yt + (yb - yt) * u + 4;
      G.ctx.strokeStyle = '#dfe5ea';
      G.ctx.lineWidth = 2;
      G.ctx.beginPath();
      G.ctx.moveTo(cx - 5, cy);
      for (let j = 1; j <= 5; j++) G.ctx.lineTo(cx + (j % 2 ? 5 : -5), cy - j * 3 * cm);
      G.ctx.stroke();
      G.ctx.fillStyle = '#f4c430';
      rr(cx - 9, cy - 15 * cm - 4, 18, 4, 2);
      G.ctx.fill();
      G.ctx.strokeStyle = '#1e2b33';
      G.ctx.lineWidth = 1;
      rr(cx - 9, cy - 15 * cm - 4, 18, 4, 2);
      G.ctx.stroke();
    }
  }
  G.ctx.font = '16px Jua,sans-serif';
  G.ctx.textAlign = 'left';
  // map
  const mx0 = 70,
    mx1 = G.W - 60,
    my = 10,
    mh = 26,
    mw = mx1 - mx0;
  G.ctx.fillStyle = 'rgba(255,255,255,.75)';
  rr(mx0 - 6, my - 4, mw + 12, mh + 8, 8);
  G.ctx.fill();
  G.ctx.fillStyle = '#7fb069';
  G.ctx.fillRect(mx0, my, mw, 5);
  G.ctx.fillStyle = '#e3d3a6';
  G.ctx.fillRect(mx0, my + 5, mw, mh - 5);
  for (const z of G.muds) {
    G.ctx.fillStyle = 'rgba(107,74,47,.7)';
    G.ctx.fillRect(mx0 + z.x0 / TRACK * mw, my + 5, Math.max(2, (z.x1 - z.x0) / TRACK * mw), mh - 5);
  }
  for (const t of G.traps) {
    G.ctx.fillStyle = t.type === 'water' ? '#4aa3df' : '#e4572e';
    G.ctx.fillRect(mx0 + t.x / TRACK * mw - 1.5, my + 5, 3, mh - 5);
  }
  for (const sp of G.springs) {
    G.ctx.fillStyle = '#2fb67c';
    G.ctx.fillRect(mx0 + sp.x / TRACK * mw - 1.5, my + 5 + (sp.d0 + 12) / (G.GD + 20) * (mh - 5), 3, Math.max(2, (sp.d1 - sp.d0) / (G.GD + 20) * (mh - 5)));
  }
  G.ctx.fillStyle = '#f4c430';
  for (const b of G.boxes) G.ctx.fillRect(mx0 + b.x / TRACK * mw - 1, my + 7 + b.d / G.GD * 10, 2, 2);
  for (let k = 0; k < 4; k++) {
    G.ctx.fillStyle = k % 2 ? '#1e2b33' : '#fff';
    G.ctx.fillRect(mx1 - 4, my + k * 6.5, 4, 6.5);
  }
  const vx = mx0 + (G.camX - OFF) / TRACK * mw,
    vw = G.W / TRACK * mw;
  G.ctx.strokeStyle = '#1e2b33';
  G.ctx.lineWidth = 2;
  G.ctx.strokeRect(vx, my - 2, vw, mh + 4);
  for (const r of G.racers) {
    const px = mx0 + Math.min(r.x / TRACK, 1) * mw,
      py = my + 9 + r.d / G.GD * (mh - 14);
    G.ctx.fillStyle = r.color;
    G.ctx.strokeStyle = '#fff';
    G.ctx.lineWidth = 1.5;
    G.ctx.beginPath();
    G.ctx.arc(px, py, 4.5, 0, 7);
    G.ctx.fill();
    G.ctx.stroke();
  }
  G.ctx.fillStyle = '#1e2b33';
  G.ctx.font = '15px Jua,sans-serif';
  G.ctx.textAlign = 'left';
  G.ctx.fillText('지도', 16, my + 19);
  G.ctx.fillText('도착', mx1 + 12, my + 19);
  for (const b of G.boxes) {
    if (b.t > 0) continue;
    const x = b.x - G.camX + OFF;
    if (x < -30 || x > G.W + 30) continue;
    const y = GT + 16 + b.d - 6;
    G.ctx.fillStyle = 'rgba(30,43,51,.2)';
    G.ctx.beginPath();
    G.ctx.ellipse(x, y + 2, 10, 3, 0, 0, 7);
    G.ctx.fill();
    const by = y - 26 + Math.sin(performance.now() / 300 + b.x) * 3;
    G.ctx.fillStyle = '#f4c430';
    rr(x - 11, by, 22, 22, 5);
    G.ctx.fill();
    G.ctx.strokeStyle = '#1e2b33';
    G.ctx.lineWidth = 2;
    G.ctx.stroke();
    G.ctx.fillStyle = '#1e2b33';
    G.ctx.font = '17px Jua,sans-serif';
    G.ctx.textAlign = 'center';
    G.ctx.fillText('?', x, by + 17);
  }
  G.ctx.font = '20px sans-serif';
  G.ctx.textAlign = 'center';
  for (const b of G.bananas) {
    G.ctx.fillText('🍌', b.x - G.camX + OFF, GT + 16 + b.d);
  }
  // 흙먼지
  for (const p of G.dust) {
    p.x += p.vx * G.fdt;
    p.y += p.vy * G.fdt;
    p.vy -= (p.g === 1 ? 260 : p.g === -1 ? 0 : 60) * G.fdt;
    if (p.y < 0) p.y = 0;
    p.a -= G.fdt * (p.g === -1 ? .9 : 1.8);
    p.r += G.fdt * (p.g === 1 ? 0 : 3);
  }
  G.dust = G.dust.filter(p => p.a > 0);
  G.ctx.fillStyle = '#c9b483';
  for (const p of G.dust) {
    const x = p.x - G.camX + OFF;
    if (x < -20 || x > G.W + 20) continue;
    G.ctx.globalAlpha = p.a * .7;
    G.ctx.fillStyle = p.c || '#c9b483';
    G.ctx.beginPath();
    G.ctx.arc(x, GT + 16 + p.d - p.y, p.r, 0, 7);
    G.ctx.fill();
  }
  G.ctx.globalAlpha = 1;
  liveRank();
  const order = G.racers.slice().sort((a, b) => a.d - b.d);
  for (const r of order) {
    const px = r.x - G.camX + OFF;
    if (px < -60 || px > G.W + 60) continue;
    const base = GT + 16 + r.d,
      py = base - r.h;
    G.ctx.fillStyle = 'rgba(30,43,51,.25)';
    G.ctx.beginPath();
    G.ctx.ellipse(px, base + 4, 13 - r.h / 6, 4, 0, 0, 7);
    G.ctx.fill();
    const cry = r.fin && r.rank === G.n && G.n > 1 || !r.fin && (G.state === 'run' || G.state === 'replay') && r.cur === G.n && (r.x > TRACK - 1800 || G.fin.length >= G.n - 1);
    const stop = r.fin && r.speed < 20;
    drawPerson(px, py, r, {
      ph: r.x * .09,
      stun: r.stun > 0,
      cry: cry,
      run: r.stun <= 0 && !stop,
      veh: r.veh && r.veh.k,
      t: G.clock,
      ready: G.state === 'count',
      h: r.h,
      spr: r.spr,
      spr0: r.spr0,
      trip: r.trip,
      trip0: r.trip0,
      act: r.act > 0 ? r.ak : '',
      actT: r.act,
      sprint: !r.fin && r.mult > 1.2 && (G.state === 'run' || G.state === 'replay'),
      cheer: stop && r.rank <= 3,
      wx: r.x,
      wd: r.d,
      bat: r.bat,
      heat: r.heat,
      boost: r.boost,
      ovh: r.ovh,
      chg: r.chg,
      rp: r.stun > 0 ? 1 - r.stun / 3.6 : 0
    });
    if (r.item) {
      G.ctx.font = '20px sans-serif';
      G.ctx.textAlign = 'center';
      G.ctx.fillStyle = '#000';
      G.ctx.fillText(ITEMS.find(i => i.k === r.item.k).e, px, py - 88);
    }
    G.ctx.textAlign = 'center';
    G.ctx.font = '14px Jua,sans-serif';
    if (r.fin) {
      G.ctx.fillStyle = '#1e2b33';
      G.ctx.font = '18px Jua,sans-serif';
      G.ctx.fillText(r.rank + '위', px, py - 66);
      const tn = G.state === 'replay' ? G.rp : G.rt;
      if (r.rank === 1 && G.winLine && tn - r.time < 3.5) {
        bubble(px, py - 90, G.winLine);
        G.ctx.textAlign = 'center';
      }
    } else {
      const tw = Math.max(34, G.ctx.measureText(r.name).width + 14);
      G.ctx.fillStyle = r.color;
      rr(px - tw / 2, py - 79, tw, 17, 8);
      G.ctx.fill();
      G.ctx.fillStyle = ink(r.color);
      G.ctx.fillText(r.name, px, py - 66);
      if (r.age === 'r') drawBattery(px + tw / 2 + 3, py - 79, r);
      G.ctx.textAlign = 'center';
      G.ctx.font = '14px Jua,sans-serif';
      if (r.stun > 0) {
        G.ctx.fillStyle = '#b8860b';
        for (let k = 0; k < 3; k++) {
          const a = G.clock * 6 + k * 2.1;
          G.ctx.fillText('★', px + Math.cos(a) * 14, py - 58 + Math.sin(a) * 4);
        }
      } else if (G.state === 'run' || G.state === 'replay') {
        if (r.mult > 1.2) {
          G.ctx.fillStyle = '#16895a';
          G.ctx.fillText('▲', px + 26, py - 30);
        } else if (r.mult < .8) {
          G.ctx.fillStyle = '#c0392b';
          G.ctx.fillText('▼', px + 26, py - 30);
        }
      }
    }
  }
  for (const o of G.portals) {
    const x = o.x - G.camX + OFF,
      y = GT + 16 + o.d - 18;
    G.ctx.globalAlpha = Math.min(1, o.t * 2);
    G.ctx.strokeStyle = o.c;
    G.ctx.lineWidth = 4;
    G.ctx.beginPath();
    G.ctx.ellipse(x, y, 9, 24, 0, 0, 7);
    G.ctx.stroke();
  }
  for (const o of G.bolts) {
    G.ctx.globalAlpha = Math.min(1, o.t * 3);
    G.ctx.strokeStyle = '#f4c430';
    G.ctx.lineWidth = 3;
    G.ctx.beginPath();
    const x0 = o.a.x - G.camX + OFF,
      y0 = GT + 16 + o.a.d - 30,
      x1 = o.b.x - G.camX + OFF,
      y1 = GT + 16 + o.b.d - 30;
    G.ctx.moveTo(x0, y0);
    for (let k = 1; k < 8; k++) G.ctx.lineTo(x0 + (x1 - x0) * k / 8, y0 + (y1 - y0) * k / 8 + (k % 2 ? -9 : 9));
    G.ctx.lineTo(x1, y1);
    G.ctx.stroke();
  }
  G.ctx.globalAlpha = 1;
  // grab lines
  for (const r of G.racers) {
    if (r.pull) {
      const a = r.x - G.camX + OFF,
        b = r.pull.v.x - G.camX + OFF;
      G.ctx.strokeStyle = '#1e2b33';
      G.ctx.lineWidth = 3;
      G.ctx.setLineDash([5, 4]);
      G.ctx.beginPath();
      G.ctx.moveTo(a, GT + 16 + r.d - 20);
      G.ctx.lineTo(b, GT + 16 + r.pull.v.d - 20);
      G.ctx.stroke();
      G.ctx.setLineDash([]);
    }
  }
  // effects
  G.ctx.font = '19px Jua,sans-serif';
  G.ctx.textAlign = 'center';
  G.ctx.lineWidth = 4;
  G.ctx.strokeStyle = '#fff';
  for (const f of G.fx) {
    const x = f.x - G.camX + OFF,
      y = GT + 16 + f.d - 70 - f.t * 24;
    G.ctx.globalAlpha = 1 - f.t;
    G.ctx.strokeText(f.s, x, y);
    G.ctx.fillStyle = '#1e2b33';
    G.ctx.fillText(f.s, x, y);
  }
  G.ctx.globalAlpha = 1;
  // live ranking
  const lr = liveRank();
  // 실시간 순위: 10명 초과 시 2열
  if (lr.length) {
    const cols = lr.length > 10 ? 2 : 1,
      rows = Math.ceil(lr.length / cols),
      cw = 160,
      x0 = G.W - 12 - cw * cols;
    G.ctx.fillStyle = 'rgba(255,255,255,.78)';
    rr(x0, 42, cw * cols, rows * 21 + 12, 10);
    G.ctx.fill();
    G.ctx.font = '16px Jua,sans-serif';
    G.ctx.textAlign = 'left';
    lr.forEach((r, k) => {
      const cx = x0 + Math.floor(k / rows) * cw,
        y = 42 + 22 + k % rows * 21;
      G.ctx.fillStyle = '#1e2b33';
      G.ctx.fillText(String(k + 1), cx + 10, y);
      G.ctx.fillStyle = r.color;
      G.ctx.beginPath();
      G.ctx.arc(cx + 40, y - 5, 6, 0, 7);
      G.ctx.fill();
      G.ctx.fillStyle = '#1e2b33';
      G.ctx.fillText(r.name + (r.fin ? ' 도착' : ''), cx + 52, y);
    });
  }
  if (G.state === 'replay' && !G.rec && !G.exporting) {
    const dur = G.frames[G.frames.length - 1].t;
    G.ctx.fillStyle = 'rgba(192,57,43,.92)';
    rr(14, 44, 112, 26, 8);
    G.ctx.fill();
    G.ctx.fillStyle = '#fff';
    G.ctx.font = '16px Jua,sans-serif';
    G.ctx.textAlign = 'left';
    G.ctx.fillText('● REPLAY', 26, 62);
    G.ctx.fillStyle = '#c0392b';
    G.ctx.fillRect(0, G.H - 5, G.W * Math.min(1, G.rp / dur), 5);
  }
  if (G.banner && G.banner.t > 0) {
    G.ctx.fillStyle = 'rgba(30,43,51,.25)';
    G.ctx.fillRect(0, 0, G.W, G.H);
    G.ctx.textAlign = 'center';
    G.ctx.font = '64px Jua,sans-serif';
    G.ctx.lineWidth = 8;
    G.ctx.strokeStyle = '#1e2b33';
    G.ctx.fillStyle = '#fff';
    G.ctx.strokeText(G.banner.s, G.W / 2, G.H / 2);
    G.ctx.fillText(G.banner.s, G.W / 2, G.H / 2);
  }
  if (G.state === 'count') {
    G.ctx.fillStyle = 'rgba(30,43,51,.5)';
    G.ctx.fillRect(0, 0, G.W, G.H);
    G.ctx.fillStyle = '#fff';
    G.ctx.textAlign = 'center';
    G.ctx.font = '120px Jua,sans-serif';
    G.ctx.fillText(String(Math.max(1, Math.ceil(G.cd))), G.W / 2, G.H / 2 + 40);
  }
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
