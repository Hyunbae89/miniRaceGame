// 공유 상태: 게임 한 판(createGame 한 번)의 모든 가변 상태. 함수들은 G.x로 읽고 쓴다.
export const G = {};
// BACK: 출발 위치를 출발선(x=0)보다 이만큼 뒤로 둬서, 웅크린 출발 자세의 머리 끝이 출발선 뒤쪽 끝에 맞도록 함
const BACK = 24;
const GT = 232;
const TRACK = 6500;
const OFF = 60;
const JT = .6;
const MAXN = 20;
const COLORS = ['#e4572e', '#2e86de', '#f2b705', '#2fb67c', '#8e5ad6', '#ef6aa1', '#17a2b8', '#5b6770', '#a0522d', '#7cb518', '#ff8c42', '#3d5a80', '#c71f66', '#00a896', '#b8860b', '#6a4c93', '#ff595e', '#1982c4', '#8ac926', '#2b2d42'];
const HINT = '인원을 정하고 시작을 누르세요. 밀치고 잡아당기며 순위가 계속 바뀝니다. 구덩이와 가시에 걸리면 스턴!';
// 1등 소감: 종류별 멘트 중 하나를 1위 도착 순간에 뽑아 레이스·시상식에서 말풍선으로 보여 줌
const WIN_LINES = {
  c: ['야호! 내가 1등이다!', '엄마, 나 봤어?!', '한 번 더 할래!', '사탕 사 주세요!'],
  a: ['출근길보다 쉽네요', '역시 꾸준함이 답이죠', '오늘 회식은 제가 쏩니다! 라고 할뻔.', '지각은 면했다!'],
  e: ['허허, 아직 안 죽었어', '젊은이들, 분발하게', '이 동네 오래 살았지', '다 지팡이 덕분이야'],
  r: ['목표 달성. 1위 확인.', '삐빅! 승리 프로토콜 실행', '배터리 잔량 충분', '인간 대비 성능 우위']
};
// 기본 이름: 성별에 맞는 영어 이름을 겹치지 않게 랜덤 배정 (입력칸 최대 6자)
const NAMES = {
  m: ['레오', '맥스', '잭', '스티브', '노아', '이든', '오웬', '다니엘', '오스카', '휴고', '태오', '밥', '라이언', '샘', '벤', '카이', '마이클', '제이크', '루크', '제임스'],
  f: ['미아', '에마', '릴리', '아바', '클로이', '조이', '루비', '그레이스', '엘라', '루나', '노라', '아이비', '에이미', '루시', '소피아', '헤이즐', '아이리스', '제인', '로즈', '안나']
};
// lanes[i] = i번 캐릭터의 출발 레인(0=맨 위)
const ITEMS = [{
  k: 'jet',
  n: '제트팩',
  e: '🚀',
  m: 2,
  t: 2.2
}, {
  k: 'moto',
  n: '오토바이',
  e: '🏍️',
  m: 1.75,
  t: 3.4
}, {
  k: 'bike',
  n: '자전거',
  e: '🚲',
  m: 1.35,
  t: 4
}, {
  k: 'wheel',
  n: '휠체어',
  e: '♿',
  m: 1.2,
  t: 5
}, {
  k: 'cart',
  n: '카트',
  e: '🏎️',
  m: 1.55,
  t: 3
}, {
  k: 'kick',
  n: '킥보드',
  e: '🛴',
  m: 1.3,
  t: 4
}, {
  k: 'ekick',
  n: '전동 킥보드',
  e: '🛴',
  m: 1.65,
  t: 3
}, {
  k: 'portal',
  n: '포탈건',
  e: '🌀'
}, {
  k: 'banana',
  n: '바나나',
  e: '🍌'
}, {
  k: 'stun',
  n: '스턴건',
  e: '🔫'
}];
const SKIN = ['#f5d0b0', '#e8b98f', '#c68c5c', '#8d5a3b', '#f2c9a5', '#d9a273', '#b07548', '#f5d0b0'];
const HAIR = ['#2b1d14', '#5a3a22', '#c9a227', '#1e2b33', '#8a2b1b', '#2b1d14', '#6b4a2f', '#111'];
const SIGNS = ['힘내!', '화이팅!', 'GO!', '달려라!', '최고!'];
const SHOPS = ['치킨', '카페', 'PC방', '노래방', '편의점', '분식', '약국', '은행', '떡볶이', '24시'];
const SHOPC = ['#e4572e', '#1f6fb2', '#2fb67c', '#8e5ad6', '#f2b705', '#ef6aa1'];
// ---- 캐릭터 동작: 관절(허벅지·정강이, 위팔·아래팔) + 반동·기울기 + 상태별 포즈 + 나이/개성 걸음 + 부가 효과 ----
// 각도는 '아래 방향'이 0, 앞(+x)이 양수. 정강이 = 허벅지 - 무릎(뒤로 접힘), 아래팔 = 위팔 + 팔꿈치(앞으로 접힘)
const LEG = 7;
const ARM1 = 6.2;
const ARM2 = 5.8;
const HIPS = [-2, 2];
const AGEP = {
  c: {
    cad: 1.25,
    stride: .8,
    knee: 1.1,
    arm: 1.15,
    lean: .06,
    bob: 1.3
  },
  a: {
    cad: 1,
    stride: 1,
    knee: 1,
    arm: 1,
    lean: .14,
    bob: 1
  },
  e: {
    cad: .9,
    stride: .5,
    knee: .55,
    arm: .35,
    lean: .28,
    bob: .45
  },
  r: {
    cad: 1,
    stride: .85,
    knee: .6,
    arm: .55,
    lean: .05,
    bob: .25
  }
};
function push() {
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
function shuffle(a) {
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [a[k], a[j]] = [a[j], a[k]];
  }
  return a;
}
function ink(c) {
  const v = parseInt(c.slice(1), 16);
  return (v >> 16) * .299 + (v >> 8 & 255) * .587 + (v & 255) * .114 > 150 ? '#1e2b33' : '#fff';
}
function rr(x, y, w, h, r) {
  G.ctx.beginPath();
  G.ctx.moveTo(x + r, y);
  G.ctx.arcTo(x + w, y, x + w, y + h, r);
  G.ctx.arcTo(x + w, y + h, x, y + h, r);
  G.ctx.arcTo(x, y + h, x, y, r);
  G.ctx.arcTo(x, y, x + w, y, r);
  G.ctx.closePath();
}
function say(r, t) {
  G.fx.push({
    x: r.x,
    d: r.d,
    t: 0,
    s: t
  });
}

// 레인 s의 발 위치(d): 트랙(GT ~ GT+GD+20)을 n등분한 칸의 가운데
function laneD(s) {
  return (s + .5) * (G.GD + 20) / G.n - 16;
}
// 장애물의 깊이 d 위치 x(허들은 사선), 깊이 d의 허들 칸
function hx(t, d) {
  return t.x - (d - ((G.GD + 20) / 2 - 16)) * (t.s || 0);
}
function unitAt(t, d) {
  return t.u[Math.max(0, Math.min(G.n - 1, Math.floor((d + 16) / ((G.GD + 20) / G.n))))];
}
function setup() {
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
    stride: G.R(.88, 1.12),
    arm: G.R(.8, 1.25),
    lean: G.R(.75, 1.3),
    cad: G.R(.92, 1.08)
  }));
  if (G.mode === 'item') {
    let bx = G.R(900, 1100);
    while (bx < TRACK - 500) {
      for (let d = 20; d <= G.GD - 20; d += 37) G.boxes.push({
        x: bx,
        d: d,
        t: 0
      });
      bx += G.R(650, 950);
    }
  }
  let x = G.R(700, 850);
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
    x += G.R(450, 800);
  }
  // 진흙: 장애물 사이 넓은 틈에 최대 3곳. 점프로 못 피하고 지나는 동안 느려짐
  for (let k = 0; k + 1 < G.traps.length && G.muds.length < 3; k++) {
    const a = G.traps[k].x,
      b = G.traps[k + 1].x;
    if (b - a >= 620 && Math.random() < .4) {
      const len = G.R(150, 220),
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
    const sx = G.R(TRACK * .4, TRACK - 250);
    if (G.traps.some(t => Math.abs(sx - t.x) < 140) || G.muds.some(z => sx > z.x0 - 70 && sx < z.x1 + 70) || G.springs.some(p => Math.abs(sx - p.x) < 300)) continue;
    const w = (G.GD + 20) * .42,
      c = laneD(Math.floor(G.R(0, G.n))),
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
      base: G.R(215, 232),
      mult: 1,
      change: 0,
      skill: G.R(.6, .9),
      dd: {},
      jt: -1,
      h: 0,
      stun: 0,
      inv: 0,
      slow: 0,
      cool: G.R(.5, 1.5),
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
function update(dt) {
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
        r.mult = q < (late ? .45 : .35) ? G.R(1.3, 1.7) : q < .7 ? G.R(.5, .75) : G.R(.95, 1.15);
        r.change = G.R(.6, 1.8);
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
    if (Math.random() < dt * .7) r.td = G.R(-8, G.GD - 4);
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
        const it = ITEMS[Math.floor(G.R(0, ITEMS.length))];
        r.item = {
          k: it.k,
          d: G.R(.5, 1.2),
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
      a.cool = G.R(1.3, 2.3);
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
function useItem(r) {
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
function record() {
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
function applyFrame(f) {
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
function startReplay() {
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
function endReplay() {
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
function lzw(px) {
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
function gifHeader(w, h) {
  const a = [71, 73, 70, 56, 57, 97, w & 255, w >> 8, h & 255, h >> 8, 0xF7, 0, 0];
  for (let i = 0; i < 256; i++) a.push(Math.round((i >> 5 & 7) * 255 / 7), Math.round((i >> 2 & 7) * 255 / 7), Math.round((i & 3) * 255 / 3));
  a.push(0x21, 0xFF, 11, 78, 69, 84, 83, 67, 65, 80, 69, 50, 46, 48, 3, 1, 0, 0, 0);
  return new Uint8Array(a);
}
function gifFrame(px, w, h, cs) {
  const a = [0x21, 0xF9, 4, 0x04, cs & 255, cs >> 8, 0, 0, 0x2C, 0, 0, 0, 0, w & 255, w >> 8, h & 255, h >> 8, 0];
  return new Uint8Array(a.concat(lzw(px)));
}
function offer(blob, name) {
  G.ready = {
    blob: blob,
    name: name
  };
  G.msg = '파일이 준비됐어요. 저장 버튼을 눌러 주세요.';
  push();
}
function saveReady() {
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
async function exportGif() {
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
function exportVideo() {
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
function liveRank() {
  const a = G.racers.slice().sort((p, q) => {
    if (p.fin && q.fin) return p.rank - q.rank;
    if (p.fin !== q.fin) return p.fin ? -1 : 1;
    return q.x - p.x;
  });
  a.forEach((r, k) => r.cur = k + 1);
  return a;
}
function updateCam(dt) {
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
function hsh(i) {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}
function TH() {
  return {
    night: G.mapId.endsWith('night'),
    trad: G.mapId.startsWith('trad')
  };
}
function stars() {
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
function ridge(par, seed, base, amp, col, rocky) {
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
function skyline(par, seed, base, minH, maxH, col, win, winP, signs, night) {
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
function landmarks(par, base, night, phase) {
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
function roof(x, top, w, col) {
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
function hanok(x, base, w, night, i) {
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
function palaceGate(x, base, night) {
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
function tree(x, y) {
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
function pine(x, y, i) {
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
function spectator(x, y, i, now, trad) {
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
function walker(x, y, k, now) {
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
function lampXs(spacing, offset, cb) {
  const a = Math.floor((G.camX - OFF - offset - 100) / spacing),
    b = Math.ceil((G.camX - OFF - offset + G.W + 100) / spacing);
  for (let i = a; i <= b; i++) cb(i * spacing + offset - G.camX + OFF, i);
}
function glow(x, y, r, c) {
  const g = G.ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, c);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  G.ctx.fillStyle = g;
  G.ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function nightLights(th) {
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
function roadPools(th) {
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
function cityBg(th) {
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
function focusR() {
  let f = null;
  for (const r of G.racers) if (!r.fin && (!f || r.x > f.x)) f = r;
  return f || G.fin[G.fin.length - 1] || null;
}
// 헬기: 시작 전에는 캔버스 위 마우스 x를 따라감(캔버스 밖으로 나가면 마지막 위치에서 제자리 비행)

function drawHeli() {
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
function hurdle(x, y, down, ft) {
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
function hills(par, base, amp, col, seed) {
  G.ctx.fillStyle = col;
  G.ctx.beginPath();
  G.ctx.moveTo(0, GT);
  for (let x = 0; x <= G.W; x += 20) {
    const wx = x + G.camX * par;
    G.ctx.lineTo(x, base - amp * (Math.sin(wx * .006 + seed) * .5 + Math.sin(wx * .013 + seed * 2) * .3 + .8));
  }
  G.ctx.lineTo(G.W, GT);
  G.ctx.closePath();
  G.ctx.fill();
}
function drawVeh(k, t) {
  G.ctx.lineWidth = 2;
  G.ctx.strokeStyle = '#1e2b33';
  G.ctx.fillStyle = '#1e2b33';
  const wob = Math.sin(t * 30) * 2;
  if (k === 'bike') {
    G.ctx.beginPath();
    G.ctx.arc(-11, -6, 6, 0, 7);
    G.ctx.arc(11, -6, 6, 0, 7);
    G.ctx.stroke();
    G.ctx.beginPath();
    G.ctx.moveTo(-11, -6);
    G.ctx.lineTo(-2, -18);
    G.ctx.lineTo(11, -6);
    G.ctx.moveTo(-2, -18);
    G.ctx.lineTo(8, -18);
    G.ctx.lineTo(11, -6);
    G.ctx.stroke();
  } else if (k === 'moto') {
    G.ctx.beginPath();
    G.ctx.arc(-12, -7, 7, 0, 7);
    G.ctx.arc(12, -7, 7, 0, 7);
    G.ctx.fill();
    G.ctx.fillStyle = '#c0392b';
    rr(-12, -20, 24, 11, 4);
    G.ctx.fill();
    G.ctx.fillStyle = '#f4c430';
    G.ctx.fillRect(12, -19, 4, 4);
  } else if (k === 'kick' || k === 'ekick') {
    G.ctx.fillStyle = k === 'ekick' ? '#2e86de' : '#7f8c8d';
    rr(-12, -5, 24, 4, 2);
    G.ctx.fill();
    G.ctx.fillStyle = '#1e2b33';
    G.ctx.beginPath();
    G.ctx.arc(-10, -1, 3, 0, 7);
    G.ctx.arc(10, -1, 3, 0, 7);
    G.ctx.fill();
    G.ctx.beginPath();
    G.ctx.moveTo(9, -5);
    G.ctx.lineTo(8, -30);
    G.ctx.stroke();
    if (k === 'ekick') {
      G.ctx.fillStyle = '#f4c430';
      G.ctx.fillRect(-8, -9, 10, 4);
    }
  } else if (k === 'cart') {
    G.ctx.fillStyle = '#e67e22';
    rr(-16, -13, 32, 9, 4);
    G.ctx.fill();
    G.ctx.fillStyle = '#1e2b33';
    G.ctx.beginPath();
    G.ctx.arc(-11, -3, 4.5, 0, 7);
    G.ctx.arc(11, -3, 4.5, 0, 7);
    G.ctx.fill();
  } else if (k === 'wheel') {
    G.ctx.beginPath();
    G.ctx.arc(-4, -10, 10, 0, 7);
    G.ctx.stroke();
    G.ctx.beginPath();
    G.ctx.arc(13, -3, 3, 0, 7);
    G.ctx.fill();
    G.ctx.fillStyle = '#34495e';
    G.ctx.fillRect(-10, -17, 14, 3);
    G.ctx.fillRect(-11, -31, 3, 15);
  } else if (k === 'jet') {
    G.ctx.fillStyle = '#7f8c8d';
    rr(-15, -38, 8, 17, 3);
    G.ctx.fill();
    G.ctx.fillStyle = '#ff9f1c';
    G.ctx.beginPath();
    G.ctx.moveTo(-14, -21);
    G.ctx.lineTo(-8, -21);
    G.ctx.lineTo(-11, -8 + wob);
    G.ctx.fill();
  }
}
// ---- 로봇: 배터리·부스터·과열 (시뮬레이션) ----
// 배터리는 달리는 동안 닳고, 가득 차면 부스터가 자동 발동(배터리 35 소모). 부스터는 열을 올리고 열이 100이면 과열(2초 반속).
// 배터리 0이면 급정지 후 2.2초 수동 충전. 배터리가 있는 동안은 랜덤 배율 대신 일정 속도(크루즈)를 유지.
// 크루즈 배율은 모드별로 시뮬레이션 평균 순위가 사람과 비슷해지도록 맞춘 값(아이템전은 충전 아이템이 있어 낮춤).
function robotStep(r, dt, gap) {
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
function led(f, now, o) {
  const c = f === 'hot' || f === 'sad' ? '#ff6a5a' : f === 'low' || f === 'error' ? '#ffd166' : '#5ff5c8';
  G.ctx.fillStyle = c;
  G.ctx.strokeStyle = c;
  G.ctx.lineWidth = 1.1;
  G.ctx.lineCap = 'square';
  const tx = s => {
    G.ctx.font = 'bold 4.3px monospace';
    G.ctx.textAlign = 'center';
    G.ctx.fillText(s, 0, -43.6);
  };
  if (f === 'reboot') {
    for (let k = 0; k < 4; k++) {
      if (Math.random() < .6) {
        G.ctx.globalAlpha = .5;
        G.ctx.fillRect(-7, -51 + Math.random() * 10, 14, .8);
      }
    }
    G.ctx.globalAlpha = 1;
    G.ctx.font = 'bold 3.2px monospace';
    G.ctx.textAlign = 'center';
    G.ctx.fillText('REBOOT', 0, -46.5);
    G.ctx.strokeRect(-5.5, -44.5, 11, 2.6);
    G.ctx.fillRect(-5.5, -44.5, 11 * Math.max(0, Math.min(1, o.rp || 0)), 2.6);
  } else if (f === 'error') {
    if (now % 0.5 < .32) tx('ERROR');
  } else if (f === 'low') {
    G.ctx.font = 'bold 3.4px monospace';
    G.ctx.textAlign = 'center';
    G.ctx.fillText('LOW', 0, -46.5);
    G.ctx.strokeRect(-4.5, -45, 8, 3.4);
    G.ctx.fillRect(3.5, -44, 1, 1.4);
    G.ctx.fillRect(-4.5, -45, 8 * (now * .8 % 1), 3.4);
  } else if (f === 'happy') {
    G.ctx.beginPath();
    G.ctx.moveTo(-4.5, -46.5);
    G.ctx.lineTo(-3, -48.5);
    G.ctx.lineTo(-1.5, -46.5);
    G.ctx.moveTo(1.5, -46.5);
    G.ctx.lineTo(3, -48.5);
    G.ctx.lineTo(4.5, -46.5);
    G.ctx.stroke();
    G.ctx.fillRect(-2, -43.5, 4, 1);
  } else if (f === 'hot') {
    G.ctx.beginPath();
    G.ctx.moveTo(-4.5, -49);
    G.ctx.lineTo(-2, -47.5);
    G.ctx.lineTo(-4.5, -46);
    G.ctx.moveTo(4.5, -49);
    G.ctx.lineTo(2, -47.5);
    G.ctx.lineTo(4.5, -46);
    G.ctx.stroke();
    G.ctx.fillRect(-2, -43.5, 4, 1);
  } else if (f === 'sad') {
    G.ctx.fillRect(-3.5, -49, 1.2, 3);
    G.ctx.fillRect(2.5, -49, 1.2, 3);
    const u = now * 1.5 % 1;
    G.ctx.fillRect(-3.5, -45.5 + u * 4, 1.2, 1.2);
    G.ctx.fillRect(-2, -42.5, 4, .9);
  } else if (f === 'focus') {
    G.ctx.fillRect(-4, -47.5, 3, 1.2);
    G.ctx.fillRect(1.5, -47.5, 3, 1.2);
    G.ctx.fillRect(-1.5, -43.5, 3, .9);
  } else {
    const bl = now % 3.2 < .12;
    G.ctx.fillRect(-4, bl ? -47 : -48.5, 2.2, bl ? .6 : 2.2);
    G.ctx.fillRect(2, bl ? -47 : -48.5, 2.2, bl ? .6 : 2.2);
    G.ctx.fillRect(-2, -43.6, 4, .9);
  }
  G.ctx.lineCap = 'round';
}
function robotBody(P, r, o, f, now) {
  const metal = '#b4c0ca',
    dark = '#7d8a95',
    joint = '#4b5863';
  for (let s = 0; s < 2; s++) {
    const lg = P.legs[s],
      kn = fk(HIPS[s], -14, lg.t, LEG, lg.t - lg.k, LEG),
      e = limb(HIPS[s], -14, lg.t, LEG, lg.t - lg.k, LEG, 5, s ? dark : shade('#7d8a95', .3));
    G.ctx.fillStyle = joint;
    G.ctx.beginPath();
    G.ctx.arc(kn[0], kn[1], 1.8, 0, 7);
    G.ctx.fill();
    rr(e[0] - 3, e[1] - 2.4, 8.5, 3.6, 1);
    G.ctx.fill();
  }
  G.ctx.save();
  G.ctx.translate(0, -14);
  G.ctx.rotate(P.lean);
  G.ctx.translate(0, 14);
  limb(-1.5, -29, P.arms[0].u, ARM1, P.arms[0].u + P.arms[0].f, ARM2, 4, shade(metal, .35));
  if (o.boost > 0) {
    const fl = 9 + Math.random() * 7;
    G.ctx.fillStyle = '#ff9f1c';
    G.ctx.beginPath();
    G.ctx.moveTo(-8, -28);
    G.ctx.lineTo(-8 - fl, -24);
    G.ctx.lineTo(-8, -20);
    G.ctx.fill();
    G.ctx.fillStyle = '#ffe08a';
    G.ctx.beginPath();
    G.ctx.moveTo(-8, -26.5);
    G.ctx.lineTo(-8 - fl * .55, -24);
    G.ctx.lineTo(-8, -21.5);
    G.ctx.fill();
  }
  G.ctx.fillStyle = metal;
  rr(-8, -34, 16, 21, 3);
  G.ctx.fill();
  G.ctx.fillStyle = r.color;
  rr(-5, -30, 10, 8, 2);
  G.ctx.fill();
  const ht = Math.min(1, (o.heat || 0) / 100);
  G.ctx.fillStyle = 'rgb(' + Math.round(80 + 175 * ht) + ',' + Math.round(220 - 170 * ht) + ',90)';
  G.ctx.beginPath();
  G.ctx.arc(0, -18, 1.6, 0, 7);
  G.ctx.fill();
  if (o.ovh > 0) {
    G.ctx.fillStyle = 'rgba(255,70,40,' + (.25 + .15 * Math.sin(now * 14)) + ')';
    rr(-8, -34, 16, 21, 3);
    G.ctx.fill();
  }
  // 머리(환호 때 360도 회전)
  G.ctx.save();
  G.ctx.translate(0, -45);
  G.ctx.rotate(P.head + (o.cheer ? now * 6 % (Math.PI * 2) : 0));
  G.ctx.translate(0, 45);
  G.ctx.strokeStyle = joint;
  G.ctx.lineWidth = 1.4;
  G.ctx.beginPath();
  G.ctx.moveTo(0, -53);
  G.ctx.lineTo(0, -57.5);
  G.ctx.stroke();
  G.ctx.fillStyle = now * 2 % 1 < .5 ? r.color : '#fff';
  G.ctx.beginPath();
  G.ctx.arc(0, -58.5, 1.7, 0, 7);
  G.ctx.fill();
  G.ctx.fillStyle = metal;
  rr(-9, -53, 18, 15, 4);
  G.ctx.fill();
  G.ctx.fillStyle = '#0f1a20';
  rr(-7, -51, 14, 11, 2);
  G.ctx.fill();
  led(f, now, o);
  G.ctx.restore();
  const hand = limb(1.5, -29, P.arms[1].u, ARM1, P.arms[1].u + P.arms[1].f, ARM2, 4, metal);
  G.ctx.fillStyle = joint;
  G.ctx.beginPath();
  G.ctx.arc(hand[0], hand[1], 1.8, 0, 7);
  G.ctx.fill();
  // 환호: 가슴에서 폭죽
  if (o.cheer) {
    for (let k = 0; k < 8; k++) {
      const u = (now * 1.4 + k % 2 * .5) % 1,
        a = k * Math.PI / 4 + k % 2 * .4,
        rad = 3 + u * 18;
      G.ctx.globalAlpha = 1 - u;
      G.ctx.fillStyle = COLORS[k % COLORS.length];
      G.ctx.beginPath();
      G.ctx.arc(Math.cos(a) * rad, -26 + Math.sin(a) * rad, 1.4, 0, 7);
      G.ctx.fill();
    }
    G.ctx.globalAlpha = 1;
  }
  G.ctx.restore();
}
function drawBattery(x, y, r) {
  const b = Math.max(0, Math.min(100, r.bat)) / 100;
  G.ctx.fillStyle = 'rgba(255,255,255,.85)';
  rr(x, y, 16, 8, 2);
  G.ctx.fill();
  G.ctx.strokeStyle = r.heat > 70 || r.ovh > 0 ? '#e4572e' : '#1e2b33';
  G.ctx.lineWidth = 1.3;
  rr(x, y, 16, 8, 2);
  G.ctx.stroke();
  G.ctx.fillStyle = '#1e2b33';
  G.ctx.fillRect(x + 16, y + 2.5, 2, 3);
  G.ctx.fillStyle = b > .5 ? '#2fb67c' : b > .2 ? '#f2b705' : '#e4572e';
  G.ctx.fillRect(x + 1.5, y + 1.5, 13 * b, 5);
  if (r.chg > 0 && performance.now() % 600 < 350) {
    G.ctx.fillStyle = '#1e2b33';
    G.ctx.font = '9px sans-serif';
    G.ctx.textAlign = 'center';
    G.ctx.fillText('⚡', x + 8, y + 7.5);
  }
}
function shade(hex, f) {
  const v = parseInt(hex.slice(1), 16),
    ch = s => Math.round((v >> s & 255) * (1 - f));
  return 'rgb(' + ch(16) + ',' + ch(8) + ',' + ch(0) + ')';
}
function lerp(a, b, w) {
  return a + (b - a) * w;
}
function fk(x, y, a1, l1, a2, l2) {
  const kx = x + Math.sin(a1) * l1,
    ky = y + Math.cos(a1) * l1;
  return [kx, ky, kx + Math.sin(a2) * l2, ky + Math.cos(a2) * l2];
}
function limb(x, y, a1, l1, a2, l2, w, col) {
  const p = fk(x, y, a1, l1, a2, l2);
  G.ctx.strokeStyle = col;
  G.ctx.lineWidth = w;
  G.ctx.lineJoin = 'round';
  G.ctx.beginPath();
  G.ctx.moveTo(x, y);
  G.ctx.lineTo(p[0], p[1]);
  G.ctx.lineTo(p[2], p[3]);
  G.ctx.stroke();
  return [p[2], p[3]];
}
function footY(lg, s) {
  return fk(HIPS[s], -14, lg.t, LEG, lg.t - lg.k, LEG)[3];
}
function pose(legs, arms, o) {
  return Object.assign({
    legs: legs,
    arms: arms,
    lean: 0,
    lift: 0,
    rot: 0,
    sx: 1,
    sy: 1,
    head: 0
  }, o || {});
}
function gait(phi, p) {
  const A = .55 * p.stride,
    legs = [],
    arms = [];
  for (let s = 0; s < 2; s++) {
    const psi = phi + s * Math.PI,
      sn = Math.sin(psi),
      cs = Math.cos(psi);
    legs.push({
      t: A * sn,
      k: .15 + 1.15 * p.knee * Math.max(0, cs) + .3 * Math.max(0, -cs) * (1 - Math.abs(sn))
    });
    arms.push({
      u: -.85 * p.arm * sn,
      f: 1.2 + .3 * Math.max(0, sn)
    });
  }
  return pose(legs, arms);
}
function mixPose(a, b, w) {
  const m = (x, y) => lerp(x, y, w);
  return {
    legs: a.legs.map((l, i) => ({
      t: m(l.t, b.legs[i].t),
      k: m(l.k, b.legs[i].k)
    })),
    arms: a.arms.map((l, i) => ({
      u: m(l.u, b.arms[i].u),
      f: m(l.f, b.arms[i].f)
    })),
    lean: m(a.lean, b.lean),
    lift: m(a.lift, b.lift),
    rot: m(a.rot, b.rot),
    sx: m(a.sx, b.sx),
    sy: m(a.sy, b.sy),
    head: m(a.head, b.head)
  };
}
function face(f, tilt) {
  G.ctx.save();
  G.ctx.translate(0, -34);
  G.ctx.rotate(tilt);
  G.ctx.translate(0, 34);
  G.ctx.strokeStyle = '#1e2b33';
  G.ctx.fillStyle = '#1e2b33';
  G.ctx.lineWidth = 1.6;
  if (f === 'cry') {
    G.ctx.beginPath();
    G.ctx.moveTo(1, -42);
    G.ctx.lineTo(4, -41);
    G.ctx.moveTo(5, -42);
    G.ctx.lineTo(8, -41);
    G.ctx.stroke();
    G.ctx.beginPath();
    G.ctx.arc(5, -34, 2.4, Math.PI * 1.1, Math.PI * 1.9);
    G.ctx.stroke();
    G.ctx.fillStyle = '#4fc3f7';
    for (let k = 0; k < 2; k++) {
      const u = (performance.now() / 320 + k * .5) % 1;
      G.ctx.beginPath();
      G.ctx.arc(3 + k * 4.5, -40 + u * 14, 1.8, 0, 7);
      G.ctx.fill();
    }
  } else if (f === 'x') {
    G.ctx.beginPath();
    G.ctx.moveTo(1, -43);
    G.ctx.lineTo(4, -40);
    G.ctx.moveTo(4, -43);
    G.ctx.lineTo(1, -40);
    G.ctx.moveTo(5, -43);
    G.ctx.lineTo(8, -40);
    G.ctx.moveTo(8, -43);
    G.ctx.lineTo(5, -40);
    G.ctx.stroke();
    G.ctx.beginPath();
    G.ctx.arc(5, -35, 2, 0, 7);
    G.ctx.stroke();
  } else if (f === 'happy') {
    G.ctx.beginPath();
    G.ctx.arc(2.5, -41, 1.6, Math.PI, 0);
    G.ctx.moveTo(9.1, -41);
    G.ctx.arc(7.5, -41, 1.6, 0, Math.PI, true);
    G.ctx.stroke();
    G.ctx.beginPath();
    G.ctx.arc(5, -37.5, 3.2, .05 * Math.PI, .95 * Math.PI);
    G.ctx.fill();
  } else if (f === 'focus') {
    G.ctx.beginPath();
    G.ctx.arc(3, -41, 1.4, 0, 7);
    G.ctx.arc(7.5, -41, 1.4, 0, 7);
    G.ctx.fill();
    G.ctx.beginPath();
    G.ctx.moveTo(3, -36);
    G.ctx.lineTo(7.5, -36);
    G.ctx.stroke();
  } else {
    G.ctx.beginPath();
    G.ctx.arc(3, -41, 1.4, 0, 7);
    G.ctx.arc(7.5, -41, 1.4, 0, 7);
    G.ctx.fill();
    G.ctx.beginPath();
    G.ctx.arc(5, -38, 2.6, .15 * Math.PI, .85 * Math.PI);
    G.ctx.stroke();
  }
  G.ctx.restore();
}
// o: ph(걸음 위상), run, stun, cry, sad, cheer, veh, t, ready(카운트다운), h(점프 높이), act('push'|'pull'), actT, sprint, wx/wd(월드 좌표: 먼지용)
function drawPerson(px, py, r, o) {
  const el = r.age === 'e',
    ch = r.age === 'c',
    fe = r.gender === 'f',
    v = o.veh;
  const seat = v === 'moto' || v === 'cart' || v === 'wheel',
    ride = v === 'bike' || v === 'kick' || v === 'ekick';
  const hair = el ? '#d8d8d8' : HAIR[r.i % HAIR.length],
    skin = SKIN[r.i % SKIN.length];
  const an = G.anim[r.i] || (G.anim[r.i] = {
    kind: '',
    prev: null,
    cur: null,
    w: 1,
    hair: .3,
    hv: 0,
    prevLift: 0,
    prevCos: [1, 1],
    prevH: 0,
    land: 0
  });
  const q = G.quirks[r.i] || {
      stride: 1,
      arm: 1,
      lean: 1,
      cad: 1
    },
    ap = AGEP[r.age] || AGEP.a;
  const gp = {
    stride: ap.stride * q.stride * (o.sprint ? 1.15 : 1),
    knee: ap.knee,
    arm: ap.arm * q.arm * (o.sprint ? 1.15 : 1)
  };
  const lean0 = ap.lean * q.lean * (o.sprint ? 1.4 : 1);
  const robo = r.age === 'r',
    ph0 = (o.ph || 0) * ap.cad * q.cad,
    STEP = Math.PI / 4;
  // 로봇은 위상을 45도 단위로 끊어 '틱틱' 끊기는 기계식 걸음
  const phi = robo ? Math.round(ph0 / STEP) * STEP : ph0,
    now = performance.now() / 1000,
    h = o.h || 0;
  // 착지 감지: 공중에 있다가 내려오면 0.22초 찌그러짐
  if (an.prevH > 3 && h <= .5) {
    an.land = .22;
    if (robo && o.wx !== undefined) {
      G.shake = Math.max(G.shake, .18);
      for (let k = 0; k < 10; k++) G.dust.push({
        x: o.wx + G.R(-8, 8),
        d: o.wd,
        y: 1,
        vx: G.R(-120, 120),
        vy: G.R(40, 120),
        r: G.R(.8, 1.6),
        a: 1,
        c: k % 2 ? '#ffb020' : '#ffe08a',
        g: 1
      });
    }
  }
  an.prevH = h;
  an.land = Math.max(0, an.land - G.fdt);
  // ---- 상태별 포즈 ----
  let kind,
    P,
    f = 'n';
  if (o.trip > 0) {
    kind = 'trip';
    const p = 1 - o.trip / (o.trip0 || 1.5),
      fa = p < .18 ? p / .18 : p < .78 ? 1 : 1 - (p - .78) / .22;
    P = pose([{
      t: -.2 * fa,
      k: .2 + .6 * fa
    }, {
      t: .1,
      k: .2
    }], [{
      u: 1.5 + .6 * fa,
      f: .2
    }, {
      u: 1.7 + .5 * fa,
      f: .15
    }], {
      rot: 1.35 * fa
    });
    f = 'x';
  } else if (o.sad) {
    kind = 'sad';
    P = pose([{
      t: -.05,
      k: .1
    }, {
      t: .08,
      k: .12
    }], [{
      u: 1.9,
      f: 1.9
    }, {
      u: 2.1,
      f: 1.8
    }], {
      rot: .14,
      lean: .1
    });
    f = 'cry';
  } else if (o.cheer) {
    kind = 'cheer';
    const w = Math.sin(now * 10) * .15;
    P = pose([{
      t: -.06,
      k: .06
    }, {
      t: .06,
      k: .06
    }], [{
      u: 2.8 + w,
      f: .15
    }, {
      u: 3 - w,
      f: .1
    }], {
      lean: -.06
    });
    f = 'happy';
  } else if (o.stun) {
    kind = 'stun';
    const s = Math.sin(now * 9);
    P = pose([{
      t: -.12,
      k: .12
    }, {
      t: .14,
      k: .18
    }], [{
      u: -.25 + .1 * s,
      f: .2
    }, {
      u: .28 - .1 * s,
      f: .25
    }], {
      rot: Math.sin(now * 11) * .16,
      lean: -.05
    });
    f = 'x';
  } else if (seat) {
    kind = 'seat';
    P = pose([{
      t: 1.25,
      k: 1.35
    }, {
      t: 1.4,
      k: 1.4
    }], [{
      u: 1.1,
      f: .25
    }, {
      u: 1.25,
      f: .2
    }], {
      lean: .18,
      lift: -5
    });
    f = o.sprint ? 'focus' : 'n';
  } else if (v === 'jet') {
    kind = 'jet';
    const s = Math.sin(now * 6) * .12;
    P = pose([{
      t: .15 + s,
      k: .45
    }, {
      t: .3 - s,
      k: .5
    }], [{
      u: .5,
      f: .9
    }, {
      u: .7,
      f: .8
    }], {
      lean: .3
    });
    f = 'focus';
  } else if (o.ready) {
    kind = 'ready';
    P = pose([{
      t: -.55,
      k: .85
    }, {
      t: .8,
      k: 1.55
    }], [{
      u: -.75,
      f: .5
    }, {
      u: .55,
      f: 1.3
    }], {
      lean: .4,
      lift: -3.2 + .35 * Math.sin(now * 5)
    });
    f = 'focus';
  } else if (h > 2 && !v) {
    kind = 'jump';
    const a = Math.min(1, h / 30);
    P = mixPose(gait(phi, gp), pose([{
      t: .75,
      k: 1.9
    }, {
      t: 1,
      k: 1.75
    }], [{
      u: 2.2,
      f: .45
    }, {
      u: 2.6,
      f: .3
    }], {
      lean: .08
    }), a);
  } else if (o.run) {
    kind = ride ? 'ride' : 'run';
    P = gait(phi, ride ? {
      stride: .6,
      knee: .8,
      arm: .2
    } : gp);
    if (ride) {
      P.arms = [{
        u: 1.15,
        f: .3
      }, {
        u: 1.3,
        f: .25
      }];
      P.lean = .2;
    } else {
      P.lean = lean0;
      // 반동: 디딘 발이 땅에 붙게 맞추고, 두 발이 뜨는 순간 살짝 떠오름. 머리는 반 박자 늦게 끄덕임
      const m = Math.max(footY(P.legs[0], 0), footY(P.legs[1], 1));
      P.lift = m + ap.bob * 3.2 * Math.max(0, (Math.abs(Math.sin(phi)) - .55) / .45);
      P.head = .07 * ap.bob * Math.cos(2 * phi - .9);
    }
    if (o.act === 'push') {
      const e = Math.min(1, (.4 - (o.actT || 0)) / .12);
      P.arms = [{
        u: lerp(P.arms[0].u, 1.45, e),
        f: lerp(P.arms[0].f, .05, e)
      }, {
        u: lerp(P.arms[1].u, 1.55, e),
        f: lerp(P.arms[1].f, 0, e)
      }];
      P.lean += .15 * e;
      f = 'focus';
    } else if (o.act === 'pull') {
      P.arms = [{
        u: 1.2,
        f: .9
      }, {
        u: 1.35,
        f: .8
      }];
      P.lean -= .12;
      f = 'focus';
    } else if (o.cry) f = 'cry';else if (o.sprint) f = 'focus';
    if (o.act) kind += '-' + o.act;
  } else {
    kind = 'stand';
    const b = Math.sin(now * 2.4);
    P = pose([{
      t: -.05,
      k: .06
    }, {
      t: .06,
      k: .08
    }], [{
      u: -.1 + .03 * b,
      f: .25
    }, {
      u: .12 - .03 * b,
      f: .3
    }], {
      lift: .3 * b,
      lean: el ? .2 : 0
    });
  }
  if (o.cry && !o.sad && f === 'n') f = 'cry';
  if (robo) {
    if (kind === 'stun') P.rot = (Math.random() - .5) * .05;
    f = o.stun ? 'reboot' : o.chg > 1.5 ? 'error' : o.chg > 0 ? 'low' : o.ovh > 0 ? 'hot' : o.cheer ? 'happy' : o.sad || f === 'cry' ? 'sad' : o.boost > 0 || f === 'focus' ? 'focus' : 'n';
    if (o.chg > 0 && kind !== 'stun') {
      P = pose([{
        t: -.05,
        k: .08
      }, {
        t: .06,
        k: .1
      }], [{
        u: -.1,
        f: .2
      }, {
        u: .1,
        f: .2
      }], {
        lean: -.03,
        lift: -1
      });
    }
  }
  if (o.spr > 0) {
    P.rot = -(1 - o.spr / (o.spr0 || .75)) * Math.PI * 2;
  }
  if (an.land > 0) {
    const s = Math.sin(Math.PI * (1 - an.land / .22));
    P.sy *= 1 - .18 * s;
    P.sx *= 1 + .12 * s;
    P.lift -= 2.5 * s;
  }
  // 상태가 바뀌면 0.15초 동안 이전 자세에서 이어짐
  if (kind !== an.kind) {
    an.prev = an.cur;
    an.w = an.prev ? 0 : 1;
    an.kind = kind;
  }
  an.w = Math.min(1, an.w + G.fdt / .15);
  if (an.w < 1 && an.prev) P = Object.assign(mixPose(an.prev, P, an.w), {});
  an.cur = P;
  // 머리카락 스프링: 몸이 튀면 반대로 처지고, 빠를수록 뒤로 날림
  const lv = (P.lift - an.prevLift) / Math.max(G.fdt, 1e-3);
  an.prevLift = P.lift;
  const spd = o.run ? o.sprint ? 1.5 : 1 : 0,
    target = .15 + .55 * spd + lv * .012;
  an.hv += (140 * (target - an.hair) - 11 * an.hv) * Math.min(G.fdt, .05);
  an.hair += an.hv * Math.min(G.fdt, .05);
  const sc = 1.15 * (ch ? .82 : 1);
  // 속도선: 질주 중 몸 뒤로
  if (o.sprint && o.run && !seat) {
    G.ctx.strokeStyle = 'rgba(255,255,255,.85)';
    G.ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      const u = (now * 2.3 + k * .37 + r.i * .13) % 1;
      G.ctx.globalAlpha = (1 - u) * .7;
      const y = py - (12 + k * 13) * sc,
        x0 = px - 16 * sc - u * 40;
      G.ctx.beginPath();
      G.ctx.moveTo(x0, y);
      G.ctx.lineTo(x0 - (14 + k * 6), y);
      G.ctx.stroke();
    }
    G.ctx.globalAlpha = 1;
  }
  G.ctx.save();
  G.ctx.translate(px, py);
  G.ctx.scale(sc, sc);
  G.ctx.lineCap = 'round';
  if (v) drawVeh(v, o.t || 0);
  G.ctx.translate(0, -({
    bike: 6,
    moto: 7,
    cart: 6,
    wheel: 5
  }[v] || 0));
  G.ctx.translate(0, -P.lift);
  G.ctx.rotate(P.rot);
  G.ctx.scale(P.sx, P.sy);
  let feet = [],
    hand = [0, 0];
  if (robo) robotBody(P, r, o, f, now);else {
    // 다리: 뒤쪽은 한 톤 어둡게
    for (let s = 0; s < 2; s++) {
      const lg = P.legs[s],
        e = limb(HIPS[s], -14, lg.t, LEG, lg.t - lg.k, LEG, 4.5, s ? '#2c3e50' : shade('#34495e', .35));
      G.ctx.fillStyle = s ? '#1e2b33' : '#1b2730';
      G.ctx.beginPath();
      G.ctx.ellipse(e[0] + 1.6, e[1], 4.5, 2, (lg.t - lg.k) * -.35, 0, 7);
      G.ctx.fill();
      feet.push(e);
    }
    G.ctx.save();
    G.ctx.translate(0, -14);
    G.ctx.rotate(P.lean);
    G.ctx.translate(0, 14);
    limb(-1.5, -29, P.arms[0].u, ARM1, P.arms[0].u + P.arms[0].f, ARM2, 3.5, shade(skin, .22));
    if (fe) {
      G.ctx.save();
      G.ctx.translate(-8, -45);
      G.ctx.rotate(an.hair);
      G.ctx.fillStyle = hair;
      rr(-4, 0, 8, 20, 3);
      G.ctx.fill();
      G.ctx.restore();
    }
    G.ctx.fillStyle = r.color;
    rr(-7, -33, 14, 19, 5);
    G.ctx.fill();
    if (fe) {
      const fl = o.run && !seat ? 2 + 2.5 * Math.abs(Math.sin(2 * phi)) + (o.sprint ? 1.5 : 0) : 0;
      G.ctx.beginPath();
      G.ctx.moveTo(-7, -17);
      G.ctx.lineTo(7, -17);
      G.ctx.lineTo(11 + fl * .6, -7 + fl * .15);
      G.ctx.lineTo(-11 - fl * 1.4, -7 - fl * .5);
      G.ctx.closePath();
      G.ctx.fill();
    }
    G.ctx.save();
    G.ctx.translate(0, -34);
    G.ctx.rotate(P.head);
    G.ctx.translate(0, 34);
    G.ctx.fillStyle = skin;
    G.ctx.beginPath();
    G.ctx.arc(0, -42, 8.5, 0, 7);
    G.ctx.fill();
    G.ctx.fillStyle = hair;
    G.ctx.beginPath();
    G.ctx.arc(0, -43, 9, Math.PI * 1.02, Math.PI * 1.98);
    G.ctx.fill();
    G.ctx.fillRect(-9, -44, 5, 5);
    G.ctx.restore();
    face(f, P.head);
    hand = limb(1.5, -29, P.arms[1].u, ARM1, P.arms[1].u + P.arms[1].f, ARM2, 3.5, skin);
    G.ctx.restore();
  }
  // 어르신 지팡이(걸어갈 때만): 앞손에서 땅까지
  if (el && !v && !o.sad && !o.cheer) {
    const a = P.lean,
      hx = hand[0] * Math.cos(a) - (hand[1] + 14) * Math.sin(a),
      hy = hand[0] * Math.sin(a) + (hand[1] + 14) * Math.cos(a) - 14;
    G.ctx.strokeStyle = '#6b4a2f';
    G.ctx.lineWidth = 2.5;
    G.ctx.beginPath();
    G.ctx.moveTo(hx, hy);
    G.ctx.lineTo(hx + 3.5, P.lift / P.sy);
    G.ctx.stroke();
  }
  G.ctx.restore();
  // 흙먼지: 발이 땅을 딛는 순간(허벅지가 뒤로 가기 시작) 월드 좌표에 생성
  // 과열·재부팅 연기
  if (robo && o.wx !== undefined && (o.ovh > 0 || o.stun) && G.fdt > 0 && Math.random() < G.fdt * 14 && G.dust.length < 300) G.dust.push({
    x: o.wx + G.R(-6, 6),
    d: o.wd,
    y: 52 * sc,
    vx: G.R(-25, -5),
    vy: G.R(25, 45),
    r: G.R(2, 3.5),
    a: .9,
    c: '#8d99a3',
    g: -1
  });
  if (o.wx !== undefined && o.run && !v && !robo && h <= .5 && G.fdt > 0) {
    for (let s = 0; s < 2; s++) {
      const cs = Math.cos(phi + s * Math.PI);
      if (an.prevCos[s] > 0 && cs <= 0 && G.dust.length < 300) for (let k = 0; k < 3; k++) G.dust.push({
        x: o.wx + feet[s][0] * sc,
        d: o.wd,
        y: 0,
        vx: -G.R(20, 70),
        vy: G.R(10, 35),
        r: G.R(1.5, 3),
        a: 1
      });
      an.prevCos[s] = cs;
    }
  }
}
function bubble(x, y, t) {
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
function podiumStep(dt) {
  if (G.pt > 2.9) for (let k = 0; k < 3; k++) G.conf.push({
    x: G.R(0, G.W),
    y: -10,
    vx: G.R(-40, 40),
    vy: G.R(90, 170),
    c: COLORS[Math.floor(G.R(0, 8))],
    a: G.R(0, 6)
  });
  for (const c of G.conf) {
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.a += dt * 5;
  }
  G.conf = G.conf.filter(c => c.y < G.H + 10);
}
// 조명 세기: t0초부터 0.6초 페이드인 → 4.5초 유지 → 0.6초 페이드아웃 후 전체 컬러로 복귀
function spotA(t0) {
  const FI = .6,
    HOLD = 4.5;
  return Math.min((G.pt - t0) / FI, (t0 + FI + HOLD + FI - G.pt) / FI);
}
function spotlight(cx, cy, rad, a) {
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
function lastX() {
  const dx = Math.min(150, G.W * .23);
  return Math.max(70, Math.min(90, G.W / 2 - dx - 84));
}
function lastSign(lx) {
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
function fitText(t, x, y, size, maxW) {
  G.ctx.textAlign = 'center';
  G.ctx.font = size + 'px Jua,sans-serif';
  const w = G.ctx.measureText(t).width;
  if (w > maxW) G.ctx.font = Math.max(10, Math.floor(size * maxW / w)) + 'px Jua,sans-serif';
  G.ctx.fillText(t, x, y);
}
function drawPodium() {
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
function draw() {
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
    G.ctx.translate(G.R(-3, 3) * G.shake * 5, G.R(-3, 3) * G.shake * 5);
    drawRace();
    G.ctx.restore();
  } else drawRace();
}
// 시작 전 미리보기: 배경 위에 트랙 라인·레인 번호·이름표와 서 있는 캐릭터
function drawPreview() {
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

function focusOne(r) {
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
function drawRace() {
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
function loop(ts) {
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
function finish() {
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
function setN(v) {
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
function start() {
  if (G.state === 'run' || G.state === 'count') return;
  if (G.state === 'replay') endReplay();
  if (G.state === 'done' || G.state === 'podium') setup();
  G.result = null;
  G.state = 'count';
  G.cd = 3;
  G.msg = '곧 출발합니다…';
  push();
}
function setCfg(i, p) {
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
function toggleReplay() {
  if (G.state === 'replay') endReplay();else if (G.state === 'podium' || G.state === 'done') startReplay();
  push();
}
function seek(e) {
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
  G.R = (a, b) => a + Math.random() * (b - a);
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
