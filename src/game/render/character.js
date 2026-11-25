// 사람 캐릭터 그리기: 관절 포즈(달리기·점프·스턴·넘어짐 등), 얼굴, 나이별·개성 걸음, 머리카락·흙먼지 효과.
import { AGEP, ARM1, ARM2, HAIR, HIPS, LEG, SKIN } from "../constants.js";
import { robotBody } from "./robot.js";
import { drawVeh } from "./vehicles.js";
import { G } from "../state.js";
import { R, lerp, rr, shade } from "../util.js";
// 각도는 아래 방향이 0, 앞(+x)이 양수. 정강이 = 허벅지 - 무릎(뒤로 접힘), 아래팔 = 위팔 + 팔꿈치(앞으로 접힘)
// fk: 관절 두 마디의 끝점 계산(무릎·발 또는 팔꿈치·손)
export function fk(x, y, a1, l1, a2, l2) {
  const kx = x + Math.sin(a1) * l1,
    ky = y + Math.cos(a1) * l1;
  return [kx, ky, kx + Math.sin(a2) * l2, ky + Math.cos(a2) * l2];
}
export function limb(x, y, a1, l1, a2, l2, w, col) {
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
export function footY(lg, s) {
  return fk(HIPS[s], -14, lg.t, LEG, lg.t - lg.k, LEG)[3];
}
export function pose(legs, arms, o) {
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
export function gait(phi, p) {
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
export function mixPose(a, b, w) {
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
export function face(f, tilt) {
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
export function drawPerson(px, py, r, o) {
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
        x: o.wx + R(-8, 8),
        d: o.wd,
        y: 1,
        vx: R(-120, 120),
        vy: R(40, 120),
        r: R(.8, 1.6),
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
    x: o.wx + R(-6, 6),
    d: o.wd,
    y: 52 * sc,
    vx: R(-25, -5),
    vy: R(25, 45),
    r: R(2, 3.5),
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
        vx: -R(20, 70),
        vy: R(10, 35),
        r: R(1.5, 3),
        a: 1
      });
      an.prevCos[s] = cs;
    }
  }
}
