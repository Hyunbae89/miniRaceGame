// 리플레이: 레이스를 프레임 단위로 기록하고 다시 재생.
import { push } from "./engine.js";
import { ACC_KEYS } from "./constants.js";
import { G } from "./state.js";
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
      bag: r.bag,
      scarf: r.scarf,
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
      pt: r.pull ? G.racers.indexOf(r.pull.v) : -1,
      ev: r.ev,
      et: r.et
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
      s: f.s,
      b: f.b,
      ri: f.ri,
      cr: f.cr
    }))
  });
}
export function applyFrame(f) {
  G.racers = f.r.map(o => Object.assign({}, o));
  G.racers.forEach((r, k) => {
    // 장신구는 프레임에 다 담지 않고 참가자 설정에서 다시 읽음(리플레이 중에는 바뀌지 않음)
    for (const a of ACC_KEYS) r[a] = G.cfg[r.i][a];
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
  // 순위 반짝임(그리기 전용)은 리플레이 처음부터 다시 셈
  G.rkPrev = {};
  G.rkFx = {};
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
  G.rp = G.frames.length ? Math.min(0, G.frames[0].t) : 0;
  G.rk = 0;
  G.manual = false;
  push();
}
// keepRec: 저장 중 리플레이에서 시상식으로 넘어갈 때 녹화를 이어 감
export function endReplay(keepRec) {
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
  if (!keepRec) {
    G.fullRec = false;
    G.recPod = false;
    if (G.rec && G.rec.state === 'recording') G.rec.stop();
  }
  push();
}
export function toggleReplay() {
  if (G.state === 'replay') endReplay();else if (G.state === 'podium' || G.state === 'done') startReplay();
  push();
}
