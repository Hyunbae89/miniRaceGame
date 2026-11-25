// 아이템전 아이템 사용(탈것 탑승, 바나나, 포탈건, 스턴건).
import { ITEMS, TRACK } from "../constants.js";
import { say } from "./race.js";
import { G } from "../state.js";
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
