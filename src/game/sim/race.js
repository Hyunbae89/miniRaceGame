import { ACC_KEYS, BACK, GT, ITEMS, JT, TRACK, WIN_LINES } from "../constants.js";
import { push } from "../engine.js";
import { useItem } from "./items.js";
import { robotStep } from "./robot.js";
import { EV, eventPool, evCrowd, evLines } from "../events.js";
import { G } from "../state.js";
import { R } from "../util.js";
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
  G.dogs = [];
  G.dino = { state: 'wait', x: 260, waitT: 0, runT: 0, pantIn: 9, pantT: 0, jumpT: 0, turnT: 0 };
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
  // 장애물을 끈 경기는 허들·물웅덩이·진흙·스프링 발판을 만들지 않음
  let x = G.obstacles === false ? TRACK : R(700, 850);
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
  for (let tries = 0; G.obstacles !== false && G.springs.length < 4 && tries < 300; tries++) {
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
      ...Object.fromEntries(ACC_KEYS.map(k => [k, G.cfg[i][k]])),
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
      skill: R(.6, .9) + (G.cfg[i].age === 'c' ? .1 : 0),
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
      cur: i + 1,
      ev: '',
      et: 0,
      evL: 0,
      evAt: -1,
      evId: ''
    });
  }
  // 랜덤 이벤트: 약 60%가 트랙 15~80% 지점 중 한 곳에서 한 번. 좋은 일·나쁜 일 반반, 공통 + 자기 종류 중에서
  if (G.events !== false) for (const r of G.racers) {
    if (R(0, 1) >= .6) continue;
    r.evAt = R(TRACK * .15, TRACK * .8);
    const pool = eventPool(r.age, R(0, 1) < .5);
    r.evId = pool[Math.min(pool.length - 1, Math.floor(R(0, pool.length)))].id;
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
    // 랜덤 이벤트: 정해 둔 지점에 오면 시작(넘어짐·탈것·점프 중이면 미룸). 진행 중에는 속도 배율을 이벤트가 정하고 말풍선을 띄움
    let evm = null;
    if (r.evAt >= 0 && r.x >= r.evAt && r.stun <= 0 && r.trip <= 0 && !r.veh && r.jt < 0) {
      r.ev = r.evId;
      r.et = 0;
      r.evL = 0;
      r.evAt = -1;
      const cr = evCrowd(EV[r.ev], r);
      if (cr) G.fx.push({
        x: r.x + 40,
        d: 0,
        t: 0,
        s: cr,
        cr: 1
      });
    }
    if (r.ev) {
      const e = EV[r.ev],
        q = (r.et += dt) / e.dur,
        ls = evLines(e, r);
      // 같은 주자의 새 말풍선은 앞 말풍선을 바로 지움(겹치지 않게)
      while (r.evL < ls.length && q >= ls[r.evL][0]) (G.fx = G.fx.filter(f => !(f.b && f.ri === r.i))).push({
        x: r.x,
        d: r.d,
        t: 0,
        s: ls[r.evL++][1],
        b: 1,
        ri: r.i
      });
      if (q >= 1) r.ev = '';else evm = e.spd(q);
    }
    if (r.trip > 0) r.trip -= dt;else {
      r.change -= dt;
      if (r.change <= 0) {
        const late = r.x > TRACK - 1000,
          q = Math.random();
        r.mult = q < (late ? .45 : .35) ? R(1.3, 1.7) : q < .7 ? R(.5, .75) : R(.95, 1.15);
        r.change = R(.6, 1.8) * (r.age === 'a' && r.mult > 1.2 ? 1.5 : 1);
      }
      const gap = lead - r.x;
      let m = r.mult + Math.min(gap / 450, 1) * .28 - (gap < 1 ? .08 : 0);
      if (r.age === 'r') m = robotStep(r, dt, gap);
      if (r.age === 'c' && r.x > TRACK * .7) m *= .95;
      if (r.slow > 0) m *= .55;
      if (r.veh) m *= r.veh.m;
      const mud = r.h < 14 && !(r.veh && r.veh.k === 'jet') && G.muds.some(z => r.x >= z.x0 && r.x <= z.x1);
      if (mud) {
        m *= r.age === 'r' ? .42 : .55;
        if (!r.inMud) say(r, r.age === 'r' ? '오작동!' : '진흙!');
      }
      r.inMud = mud;
      if (evm !== null) m = evm;
      r.speed += (r.base * m - r.speed) * Math.min(1, dt * (r.age === 'c' ? 6 : r.age === 'e' ? 2.5 : 4));
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
            if (r.age === 'e' && Math.random() < .3) {
              r.inv = 1.5;
              say(r, '어이쿠, 버텼다!');
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
  // 말풍선(b: 주자, cr: 관중)은 약 1.8초, 떠오르는 글자는 1초
  for (const f of G.fx) f.t += dt * (f.b || f.cr ? .55 : 1);
  for (const o of G.portals) o.t -= dt;
  for (const o of G.bolts) o.t -= dt;
  G.portals = G.portals.filter(o => o.t > 0);
  G.bolts = G.bolts.filter(o => o.t > 0);
  G.fx = G.fx.filter(f => f.t < 1);
  if (G.racers.every(r => r.fin)) {
    G.endWait += dt;
    // 꼴찌의 한마디(말풍선)를 읽을 시간을 두고 시상식으로
    if (G.endWait > 2.8) finish();
  }
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
export function finish() {
  G.state = 'podium';
  G.pt = 0;
  G.conf = [];
  G.betMsg = '';
  // 결과 산출: 원하는 순위(1등/꼴등)에 해당하는 캐릭터 발표
  {
    if (G.want === 'nth') G.wantN = Math.max(2, Math.min(G.wantN, G.n - 1));
    const r = G.want === 'first' ? G.fin[0] : G.want === 'nth' ? G.fin[G.wantN - 1] : G.fin[G.fin.length - 1];
    if (r) G.betMsg = '결과 산출 · ' + (G.want === 'first' ? '1등' : G.want === 'nth' ? G.wantN + '등' : '꼴등') + ': ' + r.name;
  }
  G.result = {
    bet: G.betMsg,
    want: G.want,
    wantN: G.wantN,
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
