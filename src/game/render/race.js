// 레이스 화면 그리기: 배경·도로·장애물·아이템·캐릭터·지도·실시간 순위·카운트다운, 말풍선.
import { GT, ITEMS, LOSE_LINES, OFF, TRACK } from "../constants.js";
import { TH, cityBg, roadPools, stars } from "./background.js";
import { focusR } from "../camera.js";
import { EV } from "../events.js";
import { drawPerson } from "./character.js";
import { bubble as evBubble, evFx } from "./events.js";
import { drawHeli } from "./heli.js";
import { drawPodium } from "./podium.js";
import { drawPreview } from "./preview.js";
import { drawBattery } from "./robot.js";
import { hx, liveRank } from "../sim/race.js";
import { G } from "../state.js";
import { R, hsh, ink, rr } from "../util.js";
// 카운트다운 중인지(실제 경기, 또는 리플레이의 음수 시간 구간)와 남은 초
export function counting() {
  return G.state === 'count' || G.state === 'replay' && G.rp < 0;
}
const cdLeft = () => G.state === 'count' ? G.cd : -G.rp;
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
// 레이스 화면 한 프레임: 하늘·배경 → 도로 → 장애물 → 캐릭터 → 지도·순위·연출
export function drawRace() {
  const th = TH(),
    sky = th.night ? ['#0b1530', '#2b3d6e'] : th.place === 'busan' ? ['#9fd3f0', '#e6f4fb'] : th.place === 'hangang' ? ['#bfe3f2', '#eef6fa'] : th.place === 'stone' ? ['#f5c58a', '#fbe6c4'] : th.trad ? ['#cfe6f0', '#f4efe0'] : ['#bfe3f2', '#eaf5ee'];
  const g = G.ctx.createLinearGradient(0, 0, 0, GT);
  g.addColorStop(0, sky[0]);
  g.addColorStop(1, sky[1]);
  G.ctx.fillStyle = g;
  G.ctx.fillRect(0, 0, G.W, G.H);
  if (th.night) stars();
  cityBg(th);
  // 도로: 도심은 아스팔트+흰 실선, 전통 마을은 흙길
  G.ctx.fillStyle = th.place === 'busan' ? th.night ? '#655b4d' : '#c9ad78' : th.place === 'hangang' ? th.night ? '#435044' : '#82946e' : th.place === 'stone' ? th.night ? '#493d35' : '#98754f' : th.trad ? th.night ? '#6f6550' : '#cdb98f' : th.night ? '#4a5058' : '#8a9199';
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
  const order = G.racers.slice().sort((a, b) => a.d - b.d),
    labels = [];
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
    const stop = r.fin && r.speed < 20,
      e = r.ev && EV[r.ev],
      eq = e ? Math.min(1, r.et / e.dur) : 0;
    drawPerson(px, py, r, {
      ev: e ? { id: r.ev, q: eq } : null,
      flip: !!(e && e.flip && e.flip(eq)),
      ph: r.x * .09,
      stun: r.stun > 0,
      cry: cry,
      run: r.stun <= 0 && !stop,
      veh: r.veh && r.veh.k,
      t: G.clock,
      ready: counting(),
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
    if (e) evFx(r.ev, px, py, eq, performance.now() / 1000);
    if (r.item) {
      G.ctx.font = '20px sans-serif';
      G.ctx.textAlign = 'center';
      G.ctx.fillStyle = '#000';
      G.ctx.fillText(ITEMS.find(i => i.k === r.item.k).e, px, py - 88);
    }
    // 이름표·등수는 모아 두었다가 drawLabels에서 겹침 처리 후 그림
    labels.push({ r, px, py });
    if (!r.fin) {
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
  drawLabels(labels);
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
    if (f.b || f.cr) continue;
    const x = f.x - G.camX + OFF,
      y = GT + 16 + f.d - 70 - f.t * 24;
    G.ctx.globalAlpha = 1 - f.t;
    G.ctx.strokeText(f.s, x, y);
    G.ctx.fillStyle = '#1e2b33';
    G.ctx.fillText(f.s, x, y);
  }
  G.ctx.globalAlpha = 1;
  // 말풍선: 주자 한마디는 그 주자 머리 위를 따라다니고, 관중 말은 위쪽 인도에
  for (const f of G.fx) {
    const al = Math.max(0, Math.min(1, (1 - f.t) / .25));
    if (f.cr) evBubble(f.x - G.camX + OFF, GT - 34, f.s, al, true);
    else if (f.b) {
      const r = G.racers.find(o => o.i === f.ri);
      if (r) evBubble(r.x - G.camX + OFF, GT + 16 + r.d - r.h - (r.age === 'c' ? 66 : 80), f.s, al);
    }
  }
  // 개 산책 행인 말풍선(배경에서 모아 둔 것)
  if (G.dogBub) {
    for (const b of G.dogBub) evBubble(b[0], b[1], b[2], b[3]);
    G.dogBub = [];
  }
  // 실시간 순위(작은 1열): 6명 이하는 전원, 7명 이상은 1~4위 · '⋯ 외 N명' · 꼴찌만
  const lr = liveRank();
  if (lr.length) {
    const many = lr.length > 6,
      rows = many ? [...lr.slice(0, 4).map((r, k) => [r, k]), null, [lr[lr.length - 1], lr.length - 1]] : lr.map((r, k) => [r, k]);
    const w = 132,
      rh = 17,
      x0 = G.W - 12 - w,
      y0 = 42;
    G.ctx.fillStyle = 'rgba(255,255,255,.74)';
    rr(x0, y0, w, rows.length * rh + 10, 8);
    G.ctx.fill();
    G.ctx.font = '13px Jua,sans-serif';
    rows.forEach((e, k) => {
      const y = y0 + 5 + rh * k + 13;
      if (!e) {
        G.ctx.textAlign = 'center';
        G.ctx.fillStyle = '#7b8a93';
        G.ctx.fillText('⋯ 외 ' + (lr.length - 5) + '명', x0 + w / 2, y - 1);
        return;
      }
      const [r, i] = e;
      G.ctx.textAlign = 'right';
      G.ctx.fillStyle = '#5d6e78';
      G.ctx.fillText(String(i + 1), x0 + 22, y);
      G.ctx.fillStyle = r.color;
      G.ctx.beginPath();
      G.ctx.arc(x0 + 31, y - 4.5, 4.5, 0, 7);
      G.ctx.fill();
      G.ctx.textAlign = 'left';
      G.ctx.fillStyle = '#1e2b33';
      let nm = r.name;
      while (nm.length > 1 && G.ctx.measureText(nm).width > 78) nm = nm.slice(0, -1);
      G.ctx.fillText(nm === r.name ? nm : nm + '…', x0 + 40, y);
      if (r.fin) {
        G.ctx.textAlign = 'right';
        G.ctx.fillStyle = '#1f8a5b';
        G.ctx.fillText('✓', x0 + w - 8, y);
      }
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
  if (counting()) {
    G.ctx.fillStyle = 'rgba(30,43,51,.5)';
    G.ctx.fillRect(0, 0, G.W, G.H);
    G.ctx.fillStyle = '#fff';
    G.ctx.textAlign = 'center';
    G.ctx.font = '120px Jua,sans-serif';
    G.ctx.fillText(String(Math.max(1, Math.ceil(cdLeft()))), G.W / 2, G.H / 2 + 40);
  }
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
// 이름표: 카운트다운 중에는 숨기고, 출발 후 0.5초 동안 서서히 나타남.
// 중요한 순서(1위 → 꼴찌 → 카메라가 따라가는 캐릭터 → 나머지 순위순)로 그리면서
// 이미 그린 이름표와 겹치면 건너뛰고, 대신 머리 위에 옷 색 점만 남김(흩어지면 다시 보임)
export function drawLabels(list) {
  if (counting()) return;
  const tn = G.state === 'replay' ? G.rp : G.rt,
    alpha = Math.max(0, Math.min(1, tn / .5));
  if (alpha <= 0) return;
  const rank = (r) => r.fin ? r.rank : r.cur,
    f = focusR(),
    prio = (r) => rank(r) === 1 ? 0 : rank(r) === G.n ? 1 : r === f ? 2 : 3;
  list.sort((a, b) => prio(a.r) - prio(b.r) || rank(a.r) - rank(b.r));
  const placed = [],
    dots = [],
    hit = (q) => placed.some((o) => q.x < o.x + o.w + 2 && o.x < q.x + q.w + 2 && q.y < o.y + o.h + 1 && o.y < q.y + q.h + 1);
  let bub = null,
    lose = null;
  G.ctx.globalAlpha = alpha;
  // 꼴찌가 정해진 순간(나머지가 모두 도착)부터 들어와서 3초까지 우는 말풍선. 말은 그 시각으로 골라 게임 난수를 쓰지 않음
  const before = G.n > 1 && G.fin.length >= G.n - 1 ? G.fin[G.n - 2] : null;
  for (const { r, px, py } of list) {
    // 말풍선은 이름표가 겹쳐 숨겨져도 보이게 먼저 정함
    if (r.fin && r.rank === 1 && G.winLine && tn - r.time < 3.5) bub = [px, py - 90];
    if (before && r !== before && (!r.fin || r.rank === G.n && tn - r.time < 3)) {
      const L = r.age === 'r' ? LOSE_LINES.r : LOSE_LINES.h;
      lose = [px, py - 90, L[Math.floor(hsh(Math.round(before.time * 100)) * L.length)]];
    }
    if (r.fin) {
      const box = { x: px - 17, y: py - 83, w: 34, h: 21 };
      if (hit(box)) { dots.push([px, py, r.color]); continue; }
      placed.push(box);
      G.ctx.textAlign = 'center';
      G.ctx.fillStyle = '#1e2b33';
      G.ctx.font = '18px Jua,sans-serif';
      G.ctx.fillText(r.rank + '위', px, py - 66);
    } else {
      G.ctx.font = '14px Jua,sans-serif';
      const tw = Math.max(34, G.ctx.measureText(r.name).width + 14),
        box = { x: px - tw / 2, y: py - 79, w: tw + (r.age === 'r' ? 21 : 0), h: 17 };
      if (hit(box)) { dots.push([px, py, r.color]); continue; }
      placed.push(box);
      G.ctx.fillStyle = r.color;
      rr(px - tw / 2, py - 79, tw, 17, 8);
      G.ctx.fill();
      G.ctx.textAlign = 'center';
      G.ctx.fillStyle = ink(r.color);
      G.ctx.fillText(r.name, px, py - 66);
      if (r.age === 'r') drawBattery(px + tw / 2 + 3, py - 79, r);
    }
  }
  for (const [px, py, c] of dots) {
    G.ctx.fillStyle = c;
    G.ctx.strokeStyle = '#fff';
    G.ctx.lineWidth = 1.5;
    G.ctx.beginPath();
    G.ctx.arc(px, py - 72, 3.5, 0, 7);
    G.ctx.fill();
    G.ctx.stroke();
  }
  G.ctx.globalAlpha = 1;
  if (bub) bubble(bub[0], bub[1], G.winLine);
  if (lose) bubble(lose[0], lose[1], lose[2]);
  G.ctx.textAlign = 'center';
}
// 말풍선: (x, y)가 꼬리 끝. 화면 밖으로 나가지 않게 좌우로 맞춤
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
