import { say } from "./race.js";
import { G } from "../state.js";
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
