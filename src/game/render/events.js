// 랜덤 이벤트 그리기: 자세(evPose), 몸에 붙는 소품(evProp), 화면 효과(evFx). 모션 실험실에서 확정한 모양.
// 흔들림은 시간(now)만 써서 게임 난수를 쓰지 않음
import { ARM1, ARM2 } from "../constants.js";
import { EV } from "../events.js";
import { fk } from "./character.js";
import { G } from "../state.js";
import { rr } from "../util.js";
const s01 = q => Math.sin(Math.PI * Math.min(1, Math.max(0, q)));
const stopLegs = P => {
  P.legs = [{ t: -.05, k: .06 }, { t: .06, k: .08 }];
  P.lift = 0;
};
const restArms = P => {
  P.arms = [{ u: -.1, f: .25 }, { u: .12, f: .3 }];
};
function poly(pts) {
  G.ctx.beginPath();
  G.ctx.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts.slice(1)) G.ctx.lineTo(p[0], p[1]);
  G.ctx.closePath();
  G.ctx.fill();
}
// 지팡이를 숨기는 순간(떨어뜨림·들고 질주·높이뛰기)
export function evNoCane(id, q) {
  return id === 'glory' || id === 'dropcane' && q < .75 || id === 'vault' && q >= .2 && q < .8;
}
// 자세: P를 바꾸고 표정을 돌려줌(없으면 그대로)
export function evPose(id, P, q, now) {
  const e = EV[id];
  if (!e) return null;
  if (e.spd(q) === 0) stopLegs(P);
  const A = (u, f) => ({ u, f });
  switch (id) {
    case 'leaves': if (q < .7) { stopLegs(P); P.arms = [A(2.3, 2.1), A(2.5, 2.2)]; P.lean = -.1; P.head = -.15 * Math.sin(now * 14); return 'x'; } break;
    case 'slip': if (q < .75) { const k = Math.min(1, q / .25), up = q > .5 ? (q - .5) / .25 : 0, d = k * (1 - up); stopLegs(P); P.legs = [{ t: -.9 * d, k: .2 }, { t: .9 * d, k: .2 }]; P.rot = -.9 * d; P.lift = -6 * d; P.arms = [A(2.4 * k, .3), A(-1.2 * k, .3)]; return 'x'; } break;
    case 'wind': P.lean = .5; return 'focus';
    case 'idea': if (q < .75) { restArms(P); P.arms[1] = A(2.6, 1.9); return q < .45 ? 'x' : 'happy'; } break;
    case 'tailwind': P.lean = .3; return 'happy';
    case 'roar': return 'happy';
    case 'drink': if (q < .35) P.arms[1] = A(2.2, 1.8); break;
    case 'hifive': if (q < .3) P.arms[1] = A(2.7, .1); return 'happy';
    case 'butterfly': if (q < .8) { P.arms[1] = A(2.6, .4 + .4 * Math.sin(now * 12)); P.head = -.3; return 'happy'; } break;
    case 'icecream': if (q < .75) { stopLegs(P); P.lift = 4 * Math.abs(Math.sin(q * Math.PI * 5)); P.arms = [A(.4, .4), A(2.0, .2)]; P.head = -.35; return 'happy'; } break;
    case 'lace': if (q < .75) { P.legs = [{ t: -.6, k: 1.9 }, { t: .9, k: 1.8 }]; P.lift = -7; P.lean = .9; P.arms = [A(.6 + .2 * Math.sin(now * 20), .6), A(.8, .5)]; return 'focus'; } break;
    case 'parent': return 'happy';
    case 'airplane': P.arms = [A(1.57, 0), A(1.57, 0)]; P.lean = .35; P.rot = .12 * Math.sin(now * 4); return 'happy';
    case 'candy': if (q < .3) P.arms[1] = A(2.2, 1.9); return 'happy';
    case 'phone': P.arms[1] = A(2.6, 2.2); return 'focus';
    case 'selfie': if (q < .75) { P.arms = [A(-.2, .3), A(2.0, .2)]; P.head = -.15; return 'happy'; } break;
    case 'cramp': if (q < .75) { P.legs = [{ t: -.1, k: .1 }, { t: -.6, k: 1.9 }]; P.lift = 3 * Math.abs(Math.sin(q * Math.PI * 6)); P.lean = .55; P.arms = [A(.5, .4), A(.4, .3)]; return 'x'; } break;
    case 'late': P.lean = .4; return 'focus';
    case 'coffee': if (q < .3) P.arms[1] = A(2.2, 1.9); break;
    case 'app': if (q < .3) { P.arms[1] = A(1.7, 1.5); P.head = .2; } return 'focus';
    case 'back': if (q < .75) { P.lean = .75; P.arms = [A(-1.4, 1.6), A(.4, .4)]; return 'x'; } break;
    case 'dropcane': if (q < .75) { const b = s01(q / .75); P.lean = .9 * b; P.legs = [{ t: -.2, k: .8 * b }, { t: .3, k: .9 * b }]; P.lift = -4 * b; P.arms = [A(.4, .3), A(.6 + .5 * b, .2)]; return 'focus'; } break;
    case 'glasses': if (q < .75) { P.head = .3 * Math.sin(q * Math.PI * 4); P.arms = [A(.3 + .2 * Math.sin(now * 9), 1.2), A(.5, 1.4)]; return 'focus'; } break;
    case 'glory': P.lean = .3; P.arms[1] = A(2.8, .1); return 'focus';
    case 'grandkid': if (q > .25 && q < .6) P.arms[1] = A(2.5, .4 + .6 * Math.sin(now * 14)); return 'happy';
    case 'vault': if (q >= .2 && q < .8) { const k = (q - .2) / .6; P.lift = 26 * Math.sin(Math.PI * k); P.rot = -.25 * Math.sin(Math.PI * k); P.legs = [{ t: .8, k: 1.2 }, { t: 1.0, k: 1.1 }]; P.arms = [A(2.4, .2), A(2.6, .2)]; return 'happy'; } break;
    case 'bsod': if (q < .75) { restArms(P); P.head = .25; } break;
    case 'moonwalk': if (q < .75) { const s = Math.sin(q * Math.PI * 8); P.legs = [{ t: .25 * s, k: .05 + .6 * Math.max(0, s) }, { t: -.25 * s, k: .05 + .6 * Math.max(0, -s) }]; P.arms = [A(.3, 1.4), A(2.6, .3)]; P.lean = -.1; } break;
    case 'wifi': if (q < .75) { P.head = .4 * Math.sin(now * 5); P.arms[1] = A(2.8, .2); } break;
    case 'turbo': P.lean = .35; break;
    case 'autopilot': P.lift = 2 + Math.sin(now * 6); P.legs = [{ t: .1, k: .2 }, { t: .15, k: .2 }]; P.arms = [A(-.4, .2), A(-.3, .2)]; P.lean = .15; break;
    case 'wheels': P.legs = [{ t: 0, k: .4 }, { t: .05, k: .4 }]; P.lift = -1; P.lean = .2; P.arms = [A(-.6, .2), A(-.5, .2)]; break;
  }
  return null;
}
// 소품: drawPerson의 몸 변환(떠오름·회전·눌림) 안에서 호출. 기울기·머리 회전을 그대로 밟아 몸에 붙어 움직임
const inLean = (P, fn) => {
  G.ctx.save();
  G.ctx.translate(0, -14);
  G.ctx.rotate(P.lean);
  G.ctx.translate(0, 14);
  fn();
  G.ctx.restore();
};
// 머리 좌표: 사람은 머리 중심 (0,-42)·회전축 (0,-34), 로봇은 얼굴 화면 (-7,-51) 14×11·회전축 (0,-45)
const inHead = (P, robo, fn) => inLean(P, () => {
  const y = robo ? -45 : -34;
  G.ctx.translate(0, y);
  G.ctx.rotate(P.head);
  G.ctx.translate(0, -y);
  fn();
});
// 앞팔: fn(손 x, 손 y, 팔꿈치 x, 팔꿈치 y, 아래팔 각도)
const inHand = (P, fn) => inLean(P, () => {
  const a = P.arms[1],
    e = fk(1.5, -29, a.u, ARM1, a.u + a.f, ARM2);
  fn(e[2], e[3], e[0], e[1], a.u + a.f);
});
export function evProp(id, P, q, now, r, robo) {
  const c = G.ctx;
  c.lineCap = 'round';
  switch (id) {
    case 'idea':
      if (q < .45) inHead(P, robo, () => {
        const y = robo ? -67 : -59;
        c.fillStyle = '#ffd166';
        c.beginPath();
        c.arc(0, y, 4.5, 0, 7);
        c.fill();
        c.fillStyle = '#8a6d1f';
        c.fillRect(-2, y + 4, 4, 2.5);
      });
      break;
    case 'drink':
      if (q < .6) inHand(P, (hx, hy) => {
        if (robo) {
          c.fillStyle = '#2b2d42';
          rr(hx - 2, hy - 6.5, 4, 8, 1);
          c.fill();
          c.fillStyle = '#7dff4a';
          c.fillRect(hx - 1.2, hy - 4, 2.4, 4.6);
          c.fillStyle = '#c9d2d8';
          c.fillRect(hx - 1, hy - 7.6, 2, 1.2);
        } else {
          c.fillStyle = '#7fd3ff';
          rr(hx - 1.5, hy - 6, 3.4, 7, 1);
          c.fill();
          c.fillStyle = '#2e86de';
          c.fillRect(hx - 1.5, hy - 7.2, 3.4, 1.4);
        }
      });
      break;
    case 'butterfly':
      if (q < .85) {
        const bx = 22 + 6 * Math.sin(now * 3),
          by = -56 + 5 * Math.sin(now * 5),
          wv = Math.abs(Math.sin(now * 18));
        c.fillStyle = '#e4572e';
        c.beginPath();
        c.ellipse(bx - 2.2 * wv, by, 2.4 * wv + .5, 1.8, 0, 0, 7);
        c.ellipse(bx + 2.2 * wv, by, 2.4 * wv + .5, 1.8, 0, 0, 7);
        c.fill();
      }
      break;
    case 'candy':
      if (q < .35) inHand(P, (hx, hy) => {
        c.fillStyle = '#ef6aa1';
        c.beginPath();
        c.arc(hx, hy - 3, 2.4, 0, 7);
        c.fill();
        c.strokeStyle = '#f4f1ea';
        c.lineWidth = .8;
        c.beginPath();
        c.moveTo(hx, hy - .6);
        c.lineTo(hx, hy + 3);
        c.stroke();
      });
      break;
    case 'phone':
      inHand(P, (hx, hy) => {
        c.fillStyle = '#1e2b33';
        rr(hx - 1.5, hy - 4.5, 3, 7, 1);
        c.fill();
      });
      break;
    case 'selfie':
      if (q < .75) inHand(P, (hx, hy) => {
        c.fillStyle = '#1e2b33';
        rr(hx - 2, hy - 6, 4, 6.5, 1);
        c.fill();
        if (q > .4 && q < .5) {
          c.fillStyle = 'rgba(255,255,255,.9)';
          c.beginPath();
          c.arc(hx, hy - 3, 9, 0, 7);
          c.fill();
        }
      });
      break;
    case 'coffee':
      if (q < .4) inHand(P, (hx, hy) => {
        c.fillStyle = '#f4f1ea';
        poly([[hx - 2.2, hy - 6], [hx + 2.2, hy - 6], [hx + 1.6, hy + 1], [hx - 1.6, hy + 1]]);
        c.fillStyle = '#8e5b3a';
        c.fillRect(hx - 2.2, hy - 4, 4.4, 2);
      });
      break;
    case 'app':
      // 손목 시계: 아래팔 72% 지점에 팔 방향으로 붙임. 처음엔 화면이 깜빡임
      inHand(P, (hx, hy, ex, ey, a) => {
        c.translate(ex + (hx - ex) * .72, ey + (hy - ey) * .72);
        c.rotate(-a);
        c.fillStyle = '#2b2d42';
        c.fillRect(-2.2, -1.1, 4.4, 2.2);
        c.fillStyle = Math.sin(now * 16) > 0 || q > .3 ? '#2fb67c' : '#a6f0c6';
        rr(-1.5, -1.5, 3, 3, .6);
        c.fill();
      });
      break;
    case 'dropcane':
      if (q < .75) {
        c.strokeStyle = '#6b4a2f';
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(4, P.lift + 1);
        c.lineTo(22, P.lift + 1);
        c.stroke();
      }
      break;
    case 'glasses':
      inHead(P, robo, () => {
        c.strokeStyle = '#1e2b33';
        c.lineWidth = .9;
        c.beginPath();
        c.arc(1, -51, 1.8, 0, 7);
        c.arc(5, -51, 1.8, 0, 7);
        c.stroke();
      });
      break;
    case 'glory':
      inHand(P, (hx, hy) => {
        c.strokeStyle = '#6b4a2f';
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(hx, hy + 4);
        c.lineTo(hx + 3, hy - 16);
        c.stroke();
      });
      break;
    case 'vault':
      if (q >= .2 && q < .8) {
        // 앞손(기울기 반영)에서 땅까지 짚은 지팡이
        const a = P.lean,
          h = fk(1.5, -29, P.arms[1].u, ARM1, P.arms[1].u + P.arms[1].f, ARM2),
          hx = h[2] * Math.cos(a) - (h[3] + 14) * Math.sin(a),
          hy = h[2] * Math.sin(a) + (h[3] + 14) * Math.cos(a) - 14;
        c.strokeStyle = '#6b4a2f';
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(hx, hy);
        c.lineTo(hx - 6, P.lift);
        c.stroke();
      }
      break;
    case 'bsod':
      if (q < .75) inHead(P, true, () => {
        c.fillStyle = '#1f5fd6';
        rr(-7, -51, 14, 11, 2);
        c.fill();
        c.fillStyle = '#fff';
        c.font = 'bold 5px monospace';
        c.textAlign = 'center';
        c.fillText(':(', 0, -43.6);
      });
      break;
    case 'wifi':
      if (q < .75) inHead(P, true, () => {
        c.fillStyle = '#e4572e';
        for (let i = 0; i < 3; i++) {
          c.globalAlpha = i === 0 || Math.sin(now * 6) > 0 ? 1 : .25;
          c.fillRect(11 + i * 3, -54 - i * 2.5, 2, 3 + i * 2.5);
        }
        c.globalAlpha = 1;
      });
      break;
    case 'turbo':
      inLean(P, () => {
        const k = 10 + 5 * Math.sin(now * 40);
        c.fillStyle = '#ffb02e';
        poly([[-8, -30], [-8 - k * 1.6, -25], [-8, -20]]);
        c.fillStyle = '#fff3c4';
        poly([[-8, -28], [-8 - k * .8, -25], [-8, -22]]);
      });
      break;
    case 'autopilot':
      c.fillStyle = 'rgba(57,230,255,.5)';
      c.beginPath();
      c.ellipse(0, P.lift + 1, 10, 2, 0, 0, 7);
      c.fill();
      break;
    case 'wheels':
      for (const x of [-4, 5]) {
        c.fillStyle = '#2b2d42';
        c.beginPath();
        c.arc(x, 0, 3.6, 0, 7);
        c.fill();
        c.strokeStyle = '#c9d2d8';
        c.lineWidth = .8;
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x + 3 * Math.cos(now * 20), 3 * Math.sin(now * 20));
        c.stroke();
      }
      break;
  }
}
// 화면 효과(주자 위치 px, 발 높이 py 기준): 낙엽 돌풍, 맞바람·뒷바람 선
export function evFx(id, px, py, q, now) {
  const c = G.ctx,
    sc = 1.1;
  if (id === 'leaves' && q < .85) {
    const C = ['#e4572e', '#f2b705', '#c0682f', '#a0522d', '#e8a33d'];
    for (let i = 0; i < 12; i++) {
      const u = (q * 1.3 + i * .083) % 1,
        lx = px + (110 - u * 230) * sc,
        ly = py - (18 + i * 13 % 46 + 8 * Math.sin(now * 6 + i)) * sc;
      c.save();
      c.translate(lx, ly);
      c.rotate(now * 5 + i);
      c.scale(1, .55 + .45 * Math.sin(now * 9 + i));
      c.fillStyle = C[i % 5];
      c.beginPath();
      c.ellipse(0, 0, 4.2 * sc, 2 * sc, 0, 0, 7);
      c.fill();
      c.restore();
    }
  } else if (id === 'wind' || id === 'tailwind') {
    const back = id === 'tailwind';
    c.strokeStyle = 'rgba(255,255,255,.9)';
    c.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const u = (now * 1.6 + i * .17) % 1,
        lx = px + (back ? -90 + u * 120 : 80 - u * 170) * sc,
        ly = py - (10 + i * 9) * sc;
      c.globalAlpha = 1 - u;
      c.beginPath();
      c.moveTo(lx, ly);
      c.lineTo(lx + 18 * sc, ly);
      c.stroke();
    }
    c.globalAlpha = 1;
  }
}
// 말풍선: (x, y)가 꼬리 끝. crowd = 관중 말(노란색)
export function bubble(x, y, s, al, crowd) {
  const c = G.ctx;
  c.save();
  c.globalAlpha = al;
  c.font = '13px Jua,sans-serif';
  const w = c.measureText(s).width + 14,
    h = 22,
    bx = Math.max(4, Math.min(G.W - w - 4, x - w / 2));
  c.fillStyle = crowd ? '#fff3c4' : 'rgba(255,255,255,.96)';
  c.strokeStyle = 'rgba(30,43,51,.3)';
  c.lineWidth = 1;
  rr(bx, y - h, w, h, 7);
  c.fill();
  c.stroke();
  c.beginPath();
  c.moveTo(x - 5, y - 1);
  c.lineTo(x, y + 6);
  c.lineTo(x + 5, y - 1);
  c.fill();
  c.fillStyle = '#1e2b33';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(s, bx + w / 2, y - h / 2 + 1);
  c.restore();
}
