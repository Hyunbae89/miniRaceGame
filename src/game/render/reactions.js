// 편집 반응: 참가자 창에서 이름·장신구를 바꾸거나 그 사람으로 넘어오면, 출발선의 캐릭터가 한마디 하며 짧게 움직임.
// 준비 화면 그림에만 쓰므로 고르는 데 게임 난수 대신 hsh를 씀(같은 설정이면 레이스 결과가 같게)
import { G } from "../state.js";
import { hsh } from "../util.js";
const LINES = {
  nervous: { c: ['엄마 보고 있어?', '떨려서 화장실 가고 싶어…', '넘어지면 어떡하지?'], a: ['어제 야근해서 다리가…', '준비운동 할 걸 그랬나', '심장 소리 들리는 것 같아'], e: ['아이고 무릎아…', '천천히 가도 되지?', '허리 보호대 챙겼나…'], r: ['배터리 87%… 괜찮겠지?', '긴장 모듈이 켜졌습니다', '냉각팬 회전수 상승 중'] },
  confident: { c: ['내가 제일 빠를걸!', '달리기는 내가 1등이야!', '다들 내 뒤만 따라와!'], a: ['몸 다 풀었어. 따라와 봐', '오늘 컨디션 최고!', '이번엔 진짜 1등 한다'], e: ['왕년엔 내가 동네 1등이었어!', '젊은이들, 각오하라고', '지팡이는 장식이야'], r: ['승리 확률 계산 완료: 99%', '부스터 예열 완료!', '최적 경로 탐색 완료'] },
  daily: { c: ['끝나면 아이스크림 먹을래', '신발 끈 묶었다!', '저기 강아지다!'], a: ['끝나고 치킨 콜?', '회사엔 반차 냈어', '주차 어디에 했더라'], e: ['점심은 국밥이지', '손주가 응원 온댔어', '날씨 한번 좋구먼'], r: ['삐빅. 오늘 날씨 맑음', '관절에 기름칠 했습니다', '업데이트는 경기 끝나고'] },
  name: { c: ['와, 새 이름 멋지다!', '이제 나 이 이름이야!'], a: ['이름표 새로 뽑았네', '이름 바꾸니 운이 좋을 것 같은데'], e: ['허허, 이름 좋구먼', '손주가 지어 준 이름이야'], r: ['새 이름 저장 완료', '호출 부호 변경 확인'] },
  acc: { c: ['이거 나한테 어울려?', '짠! 멋지지?'], a: ['오늘 패션 괜찮지?', '장비빨도 실력이야'], e: ['이 나이에 멋 좀 내 봤지', '젊어 보이나?'], r: ['외형 업그레이드 감지', '새 부품 장착 완료'] },
};
const MOVES = { nervous: ['shiver', 'look', 'bounce'], confident: ['pump', 'jump', 'step'], daily: ['wave', 'stretch', 'nod'], name: ['jump', 'cheer'], acc: ['spin', 'pose'] };
// 나이대별 움직임 크기·빠르기
const AMP = { c: 1.25, a: 1, e: .55, r: .9 },
  SPD = { c: 1.25, a: 1, e: .7, r: 1 };
// i번 참가자 반응 시작. mood: nervous·confident·daily(그 사람으로 넘어옴: 셋 중 하나) · name · acc. 반응 중이면 무시(타자 칠 때 연달아 안 뜨게)
export function startReact(i, mood) {
  if (!G.react) G.react = [];
  const cur = G.react[i];
  if (cur && cur.t < cur.dur) return;
  const age = (G.cfg[i] || {}).age || 'a';
  G.rn = (G.rn || 0) + 1;
  const pick = (a, s) => a[Math.min(a.length - 1, Math.floor(hsh(G.rn * 13.7 + i * 3.1 + s) * a.length))];
  if (mood === 'mood') mood = pick(['nervous', 'confident', 'daily'], 1);
  const mv = pick(MOVES[mood], 2);
  G.react[i] = { mv, line: pick(LINES[mood][age], 3), t: 0, dur: (mv === 'spin' ? 1.4 : 1.6) / SPD[age] + .9, age };
}
// 미리보기에서 매 프레임 진행. 끝난 반응은 지움
export function stepReact(dt) {
  if (!G.react) return;
  G.react.forEach((x, i) => {
    if (!x) return;
    x.t += dt * SPD[x.age];
    if (x.t > x.dur + .4) G.react[i] = null;
  });
}
// 그릴 때 쓸 값: 진행도 p(움직임 구간), 앞뒤 이동 dx, 뒤집기, 말풍선 투명도
export function reactView(i) {
  const x = G.react && G.react[i];
  if (!x) return null;
  const mvT = x.dur - .9,
    on = x.t < mvT;
  let p = on ? Math.min(1, x.t / mvT) : 0;
  if (x.age === 'r') p = Math.round(p * 10) / 10;
  const a = AMP[x.age],
    s = Math.sin(Math.PI * p),
    ease = v => v < .5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
  return {
    mv: on ? x.mv : '',
    p,
    a,
    dx: on && x.mv === 'step' ? 12 * a * ease(s) : 0,
    flip: on && x.mv === 'spin' && Math.cos(p * Math.PI * 2) < 0,
    line: x.line,
    alpha: Math.max(0, Math.min(1, x.t / .15, (x.dur + .4 - x.t) / .4))
  };
}
// 자세: P를 바꾸고 표정을 돌려줌
export function reactPose(mv, P, p, a, now) {
  const s = Math.sin(Math.PI * p),
    A = (u, f) => ({ u, f });
  switch (mv) {
    case 'shiver': P.rot = .05 * a * Math.sin(now * 45) * s; P.legs = [{ t: -.15, k: .5 }, { t: .15, k: .55 }]; P.arms = [A(.5, 1.5), A(.55, 1.5)]; P.lift = -1.5 * s; return 'focus';
    case 'look': P.head = .35 * Math.sin(p * Math.PI * 3) * s; P.arms = [A(-.2, .4), A(.3, 1.6)]; return 'focus';
    case 'bounce': P.lift = 4 * a * Math.abs(Math.sin(p * Math.PI * 4)) * s; P.legs = [{ t: -.05, k: .3 }, { t: .06, k: .3 }]; return 'focus';
    case 'pump': { const u = Math.abs(Math.sin(p * Math.PI * 2)); P.arms = [A(-.2, .4), A(.3 + 2.6 * u * s, 1.2 - u)]; P.lean = .08 * s; return 'happy'; }
    case 'jump':
      if (p < .25) { const q = p / .25; P.legs = [{ t: -.1, k: .9 * q }, { t: .1, k: .9 * q }]; P.lift = -3 * q; P.arms = [A(-.6 * q, .3), A(-.5 * q, .3)]; return 'n'; }
      if (p < .75) { const q = (p - .25) / .5; P.lift = 20 * a * Math.sin(Math.PI * q); P.legs = [{ t: .6, k: 1.6 }, { t: .8, k: 1.5 }]; P.arms = [A(2.5, .3), A(2.8, .2)]; return 'happy'; }
      { const k = Math.sin(Math.PI * (p - .75) / .25); P.sy = 1 - .15 * k; P.sx = 1 + .1 * k; P.legs = [{ t: .1, k: .6 * k }, { t: .2, k: .6 * k }]; return 'happy'; }
    case 'step': P.lean = .25 * s; P.legs = [{ t: -.35 * Math.sin(p * Math.PI * 4) * s, k: .4 }, { t: .35 * Math.sin(p * Math.PI * 4) * s, k: .4 }]; P.lift = Math.abs(Math.sin(p * Math.PI * 4)) * 1.5 * s; return 'focus';
    case 'wave': P.arms = [A(-.1, .25), A(2.5 * s, .4 + .7 * Math.sin(now * 14) * s)]; P.head = -.08 * s; return 'happy';
    case 'stretch': P.arms = [A(2.9 * s, .1), A(3.0 * s, .1)]; P.lean = -.2 * s; P.lift = 1.5 * s; return 'n';
    case 'nod': P.head = .18 * Math.sin(p * Math.PI * 6) * s; P.arms = [A(-.1, .25), A(.3, 1.2 * s)]; return 'happy';
    case 'cheer': { const w = Math.sin(now * 10) * .15; P.arms = [A(2.8 * s + w, .15), A(3 * s - w, .1)]; P.lift = 6 * a * Math.abs(Math.sin(p * Math.PI * 3)) * s; return 'happy'; }
    case 'spin': P.sx = Math.max(.15, Math.abs(Math.cos(p * Math.PI * 2))); P.lift = 5 * a * s; P.arms = [A(1.4 * s, .2), A(1.5 * s, .2)]; return 'happy';
    case 'pose': P.arms = [A(-.9 * s, 2.2 * s), A(1.8 * s, .3)]; P.lean = -.1 * s; P.legs = [{ t: -.35 * s, k: .1 }, { t: .25 * s, k: .15 }]; return 'happy';
  }
  return null;
}
