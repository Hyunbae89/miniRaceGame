// 랜덤 이벤트(레이스 결과에 영향): 공통·종류별 좋은 일/나쁜 일. 모양은 모션 실험실에서 확정한 것.
// who: all | c(어린이) | a(성인) | e(어르신) | r(로봇), good: 좋은 일(빨라짐), dur: 길이(초),
// spd(q): 기본 속도에 곱하는 배율(q = 0~1 진행도, 0이면 멈춤, 음수면 뒤로), flip(q): 뒤돌아 달리기,
// lines: [[시작 비율, 말]], linesBy: 종류별로 다른 말, crowd: 관중 말풍선(문자열 또는 (r) => 문자열), crowdBy: 종류별 관중 말
export const EVENTS = [
  // ---- 공통: 나쁜 일 ----
  { id: 'reverse', who: 'all', good: 0, dur: 2.2, spd: q => q < .6 ? -.5 : 1, flip: q => q < .6, lines: [[0, '어? 결승선이 이쪽 아니야?'], [.6, '아 저쪽이구나!']] },
  { id: 'leaves', who: 'all', good: 0, dur: 1.8, spd: q => q < .7 ? .1 : 1, lines: [[0, '앗, 낙엽이 얼굴에!']] },
  { id: 'slip', who: 'all', good: 0, dur: 1.8, spd: q => q < .75 ? .05 : 1, lines: [[0, '…방금 뭐 밟았어?']] },
  { id: 'wind', who: 'all', good: 0, dur: 2.2, spd: () => .75, lines: [[0, '바람이 왜 이렇게 세!']] },
  { id: 'idea', who: 'all', good: 0, dur: 2, spd: q => q < .75 ? 0 : 1, lines: [[0, '아, 가스 불!'], [.45, '…아 껐구나']], linesBy: { c: [[0, '아, 숙제!'], [.45, '…어제 했구나']], r: [[0, '아, 업데이트 예약!'], [.45, '…자동으로 됐구나']] } },
  // ---- 공통: 좋은 일 ----
  { id: 'tailwind', who: 'all', good: 1, dur: 2.2, spd: () => 1.35, lines: [[0, '바람이 등을 밀어 준다~']] },
  { id: 'roar', who: 'all', good: 1, dur: 2, spd: () => 1.25, crowd: '힘내라~!!', lines: [[.2, '들린다, 이 함성!']] },
  { id: 'drink', who: 'all', good: 1, dur: 2.2, spd: q => q < .35 ? .6 : 1.4, crowd: '물 받아요!', crowdBy: { r: '여기 배터리!' }, lines: [[.35, '캬~ 살 것 같다!']], linesBy: { r: [[.35, '친절한 휴먼, 감동 한도 초과']] } },
  { id: 'hifive', who: 'all', good: 1, dur: 2, spd: q => q < .3 ? .9 : 1.3, crowd: '하이파이브! 짝!', lines: [[.3, '기운 받았다!']] },
  // ---- 어린이 ----
  { id: 'butterfly', who: 'c', good: 0, dur: 2.2, spd: q => q < .8 ? .35 : 1, lines: [[0, '나비다! 기다려~']] },
  { id: 'icecream', who: 'c', good: 0, dur: 1.8, spd: q => q < .75 ? 0 : 1, crowd: '아이스크림 사세요~', lines: [[.15, '엄마, 저거 사 줘!']] },
  { id: 'lace', who: 'c', good: 0, dur: 1.8, spd: q => q < .75 ? 0 : 1, lines: [[0, '앗, 끈 풀렸다!']] },
  { id: 'parent', who: 'c', good: 1, dur: 2.2, spd: q => q < .2 ? 1 : 1.45, crowd: r => r.gender === 'f' ? '우리 딸 최고야!' : '우리 아들 최고야!', lines: [[.25, '엄마! 아빠! 보고 있지?']] },
  { id: 'airplane', who: 'c', good: 1, dur: 2.2, spd: () => 1.35, lines: [[0, '슝~ 비행기 출발!']] },
  { id: 'candy', who: 'c', good: 1, dur: 2.2, spd: q => q < .3 ? .8 : 1.3, lines: [[0, '사탕 먹고 힘내자!']] },
  // ---- 성인 ----
  { id: 'phone', who: 'a', good: 0, dur: 2.4, spd: () => .65, lines: [[0, '네, 부장님… 지금요?']] },
  { id: 'selfie', who: 'a', good: 0, dur: 1.8, spd: q => q < .75 ? 0 : 1, lines: [[0, '인증샷은 못 참지~']] },
  { id: 'cramp', who: 'a', good: 0, dur: 2, spd: q => q < .75 ? .15 : 1, lines: [[0, '아아악 쥐 났다!']] },
  { id: 'late', who: 'a', good: 1, dur: 2.2, spd: () => 1.5, lines: [[0, '전력 질주~ 와아아아~!']] },
  { id: 'coffee', who: 'a', good: 1, dur: 2.2, spd: q => q < .3 ? .8 : 1.4, lines: [[0, '카페인 충전 완료!']] },
  { id: 'app', who: 'a', good: 1, dur: 2.2, spd: q => q < .3 ? .9 : 1.3, lines: [[0, '"목표까지 100m!" 좋아!']] },
  // ---- 어르신 ----
  { id: 'back', who: 'e', good: 0, dur: 2, spd: q => q < .75 ? 0 : 1, lines: [[0, '아이고 허리야…']] },
  { id: 'dropcane', who: 'e', good: 0, dur: 2, spd: q => q < .75 ? 0 : 1, lines: [[0, '어이쿠, 내 지팡이!']] },
  { id: 'glasses', who: 'e', good: 0, dur: 2, spd: q => q < .75 ? .1 : 1, lines: [[0, '안경이 어디 갔지?'], [.5, '…머리 위에 있었네']] },
  { id: 'glory', who: 'e', good: 1, dur: 2.2, spd: () => 1.55, lines: [[0, '내가 왕년에 말이야!']] },
  { id: 'grandkid', who: 'e', good: 1, dur: 2.4, spd: q => q < .25 ? 1 : 1.4, crowd: r => r.gender === 'f' ? '할머니다~!' : '할아버지다~!', lines: [[.3, '오냐, 우리 강아지!']] },
  { id: 'vault', who: 'e', good: 1, dur: 1.8, spd: q => q < .2 ? .8 : 1.7, lines: [[.1, '에헤라디야~!']] },
  // ---- 로봇 ----
  { id: 'bsod', who: 'r', good: 0, dur: 2.2, spd: q => q < .75 ? 0 : 1, lines: [[0, '치명적 오류가 발생했습니다'], [.5, '재부팅 중…']] },
  { id: 'moonwalk', who: 'r', good: 0, dur: 2.2, spd: q => q < .75 ? -.5 : 1, lines: [[0, '춤 모드 활성화♪']] },
  { id: 'wifi', who: 'r', good: 0, dur: 2.2, spd: q => q < .75 ? .4 : 1, lines: [[0, '신호 약함… 신호 약함…']] },
  { id: 'turbo', who: 'r', good: 1, dur: 2.2, spd: () => 1.6, lines: [[0, '터보 엔진 가동!']] },
  { id: 'autopilot', who: 'r', good: 1, dur: 2.2, spd: () => 1.4, lines: [[0, '경로 최적화. 자율 주행 시작']] },
  { id: 'wheels', who: 'r', good: 1, dur: 2.2, spd: () => 1.5, lines: [[0, '바퀴 모드로 변신!']] },
];
export const EV = Object.fromEntries(EVENTS.map(e => [e.id, e]));
// 이 캐릭터에게 생길 수 있는 이벤트: 좋은 일 / 나쁜 일 각각 공통 + 자기 종류
export function eventPool(age, good) {
  return EVENTS.filter(e => !!e.good === !!good && (e.who === 'all' || e.who === age));
}
export const evLines = (e, r) => (e.linesBy && e.linesBy[r.age]) || e.lines;
export const evCrowd = (e, r) => {
  const c = (e.crowdBy && e.crowdBy[r.age]) || e.crowd;
  return typeof c === 'function' ? c(r) : c;
};
