// 로봇 캐릭터 그리기: 금속 몸체, LED 얼굴 표정, 부스터 불꽃, 배터리 아이콘.
import { ARM1, ARM2, COLORS, HIPS, LEG } from "../constants.js";
import { fk, limb } from "./character.js";
import { G } from "../state.js";
import { rr, shade } from "../util.js";
export function led(f, now, o) {
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
export function robotBody(P, r, o, f, now) {
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
export function drawBattery(x, y, r) {
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
