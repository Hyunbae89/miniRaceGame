import { useEffect, useRef, useState } from 'react';
import { createGame } from './game/engine.js';
import './App.css';

const TITLE = '미니 레이스 토너먼트';
const GENDERS = [['m', '남'], ['f', '여']];
const AGES = [['c', '어린이'], ['a', '성인'], ['e', '어르신'], ['r', '로봇']];
// 참가자 창 짧은 설명(자세한 동작은 가이드 페이지에서). 사람 셋은 속도 계산이 같고, 로봇은 방식이 달라도 평균 순위가 비슷하게 맞춰져 있음(npm run check -- --balance)
const AGE_DESC = {
  c: '작고 재빠른 꼬마',
  a: '균형 잡힌 기본형',
  e: '느긋하지만 꿋꿋해요',
  r: '배터리로 달리는 기계',
};
// 설명 칸의 장점·패널티 요약(설계 페이지 기준). 사람 셋은 아직 경기 계산에 넣기 전이라 안내를 붙임, 로봇은 지금 게임 그대로
const AGE_PROS = {
  c: ['잘 피하고 출발이 빨라요', '후반에 지쳐요'],
  a: ['질주를 오래 해요', '특별한 강점이 없어요'],
  e: ['잘 안 넘어져요', '가속이 느려요'],
  r: ['부스터, 밀치기에 강해요', '과열·방전되면 멈춰요'],
};
// 설명 칸 셋째 줄: 실제 경기 계산에 쓰는 수치를 짧게(sim/race.js·robot.js 기준)
const AGE_STATS = {
  c: '점프 성공 +10% · 가속 1.5배 · 후반 0.95배',
  a: '빨라진 구간이 1.5배 오래',
  e: '넘어짐 30% 버팀 · 가속 0.6배',
  r: '부스터 1.75배 · 밀치는 힘 1.5배',
};
const MODES = [['normal', '일반'], ['item', '아이템전']];
// 레이스 배속 3단계(빠르게 = 예전 속도)
const RATES = [[.65, '느리게'], [.8, '보통'], [1, '빠르게']];
// 결과산출: [1등 | − N등 + | 꼴등]. N등을 누르면 2등부터, −는 2등에서 1등으로, +는 꼴등 바로 앞에서 꼴등으로 넘어감
function WantPick({ v, game }) {
  const g = game(), N = Math.min(v.wantN, v.n - 1);
  const pickNth = () => (v.n < 3 ? g.setWant('last') : (g.setWant('nth'), g.setWantN(2)));
  const down = () => (N <= 2 ? g.setWant('first') : g.setWantN(N - 1));
  const up = () => (N >= v.n - 1 ? g.setWant('last') : g.setWantN(N + 1));
  const btn = (k, t) => (
    <button type="button" role="radio" aria-checked={v.want === k} className={v.want === k ? 'on' : ''} onClick={() => g.setWant(k)}>{t}</button>
  );
  return (
    <div className="seg want-seg" role="radiogroup" aria-label="결과산출">
      {btn('first', '1등 원함')}
      {v.want === 'nth' ? (
        <span className="nth-on" role="radio" aria-checked="true">
          <button type="button" className="nth-step" aria-label="한 등수 위로" onClick={down}>−</button>
          <b aria-live="polite">{N}등 원함</b>
          <button type="button" className="nth-step" aria-label="한 등수 아래로" onClick={up}>+</button>
        </span>
      ) : (
        <button type="button" role="radio" aria-checked="false" onClick={pickNth}>N등 원함</button>
      )}
      {btn('last', '꼴등 원함')}
    </div>
  );
}
// 장신구 탭: 왼쪽은 장신구 줄(이름 · 종류 알약), 오른쪽 끝은 모든 장신구가 같이 쓰는 색 칸(2열).
// 장신구를 누르면 그 장신구가 선택되고 색 칸이 그 장신구의 색을 바꿈.
// k 설정 키, opts 종류([값, 이름]), wear 값 자체가 색인 장신구의 기본색, ck 색 키, pal 색 목록,
// cWhen 색을 고를 수 있는 조건(기본: 값이 있을 때), ages 보이는 종류
const PALETTE = ['#e4572e', '#f2b705', '#2fb67c', '#2e86de', '#8e5ad6', '#ef6aa1', '#8e5b3a', '#2b2d42'];
const NEON = ['#5ff5c8', '#39e6ff', '#7dff4a', '#ffd166', '#ff4fd8', '#ff6a5a'];
const HUMAN_ROWS = [
  [{ t: '가방', k: 'bag', wear: '#8e5b3a' }, { t: '목도리', k: 'scarf', wear: '#e74c3c' }],
  [{ t: '모자', k: 'hat', opts: [['', '없음'], ['cap', '캡모자'], ['beanie', '비니'], ['goggle', '고글 모자']], ck: 'hatC' }],
  [{ t: '신발', k: 'shoe', opts: [['', '기본'], ['sneaker', '운동화'], ['boot', '장화']], ck: 'shoeC' },
   { t: '지팡이', k: 'cane', opts: [['wood', '나무'], ['umbrella', '우산'], ['gold', '황금']], ck: 'caneC', cWhen: (v) => v === 'umbrella', ages: ['e'] }],
];
const ROBOT_ROWS = [
  [{ t: '눈 빛', ck: 'eye', pal: NEON }, { t: '경고 띠', k: 'neck', opts: [['', '없음'], ['hazard', '두르기']], ck: 'neckC' },
   { t: '안테나', k: 'ant', opts: [['', '기본'], ['spring', '스프링'], ['dish', '접시']], ck: 'antC' }],
  [{ t: '등', k: 'back', opts: [['', '기본'], ['jet', '제트팩'], ['tank', '코어 탱크']] }],
  [{ t: '발', k: 'foot', opts: [['', '기본'], ['toe', '발가락'], ['rev', '역관절']] }],
];
const accVal = (a, c) => (a.k ? c[a.k] : 'on');
const accColorKey = (a) => (a.wear ? a.k : a.ck);
const accColorOn = (a, c) => !!accColorKey(a) && (a.cWhen ? a.cWhen(accVal(a, c)) : !!accVal(a, c));
function AccTab({ c, n, set }) {
  const rows = (c.age === 'r' ? ROBOT_ROWS : HUMAN_ROWS).map((r) => r.filter((a) => !a.ages || a.ages.includes(c.age))).filter((r) => r.length);
  const items = rows.flat();
  const [pickT, setPickT] = useState(null);
  // 선택된 장신구: 마지막으로 누른 것, 없으면 색을 고를 수 있는 첫 장신구
  const sel = items.find((a) => a.t === pickT) || items.find((a) => accColorOn(a, c)) || items[0];
  const ck = accColorKey(sel),
    on = accColorOn(sel, c),
    pal = sel.pal || PALETTE,
    own = on && !pal.includes(c[ck]);
  return (
    <div className="card acc" role="tabpanel">
      <div className="acc-rows">
        {rows.map((r, k) => (
          <div className="acc-row" key={k}>
            {r.map((a) => {
              const v = accVal(a, c),
                opts = a.wear ? [['', '없음'], [a.wear, '착용']] : a.opts,
                cur = a.wear ? (v ? a.wear : '') : v;
              return (
                <div key={a.t} className={'acc-item' + (a === sel ? ' sel' : '')} style={accColorOn(a, c) ? { '--ac': c[accColorKey(a)] } : undefined} onClick={() => setPickT(a.t)}>
                  <button type="button" className="acc-name" aria-pressed={a === sel}>{a.t}</button>
                  {opts && (
                    <div className="pills" role="radiogroup" aria-label={`${n}번 ${a.t}`}>
                      {opts.map(([o, l]) => (
                        <button type="button" key={o} role="radio" aria-checked={cur === o} className={cur === o ? 'on' : ''} onClick={() => cur !== o && set({ [a.k]: o })}>{l}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className={'palette' + (on ? '' : ' off')} role="radiogroup" aria-label={`${n}번 ${sel.t} 색`}>
        <span className="pal-title">색상</span>
        <div className="pal-grid">
          {pal.map((col) => (
            <button type="button" key={col} role="radio" aria-checked={on && c[ck] === col} aria-label={col} disabled={!on} className={'dot' + (on && c[ck] === col ? ' on' : '')} style={{ background: col }} onClick={() => set({ [ck]: col })} />
          ))}
          <label className={'dot custom' + (own ? ' on' : '')} style={own ? { background: c[ck] } : undefined} title="다른 색 고르기">
            <input type="color" value={ck ? c[ck] : '#000000'} disabled={!on} aria-label={`${n}번 ${sel.t} 다른 색`} onChange={(e) => set({ [ck]: e.target.value })} />
          </label>
        </div>
      </div>
    </div>
  );
}

// 참가자 구성(인원·이름·색·성별·종류)을 한 줄 문자열로: 최종 결정 뒤 바뀌었는지 비교용
const rosterSig = (v) => v.n + '|' + JSON.stringify(v.cfg.slice(0, v.n));

// 버튼 여러 개 중 하나를 고르는 선택 상자
function Seg({ label, value, options, onChange, disabled, small, className = '' }) {
  return (
    <div className={'seg' + (small ? ' small' : '') + (className ? ' ' + className : '')} role="radiogroup" aria-label={label}>
      {options.map(([k, t]) => (
        <button type="button" key={k} role="radio" aria-checked={value === k} className={value === k ? 'on' : ''}
          disabled={disabled} onClick={() => onChange(k)}>{t}</button>
      ))}
    </div>
  );
}

// 켬/끔 스위치(상태를 글자로도 보여 줌)
function Switch({ label, on, onText = '켜짐', offText = '꺼짐', onChange }) {
  return (
    <button type="button" className={'sw' + (on ? ' on' : '')} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}>
      <span className="sw-track" aria-hidden="true"><span className="sw-dot" /></span>{on ? onText : offText}
    </button>
  );
}
const PLACES = [['city', '🏙️ 서울 도심'], ['trad', '🏯 전통 마을'], ['busan', '🌊 부산 바다'], ['hangang', '🌉 한강 공원'], ['stone', '🦕 쥬라기섬']];

function Row({ pos, color, name, right, gap, hl, onPick }) {
  return (
    <li className={hl} title={hl === 'hl-nth' ? '결과 산출로 고른 등수' : '누르면 시상식에서 이 사람을 보여 줘요'} onClick={onPick} role={onPick ? 'button' : undefined} tabIndex={onPick ? 0 : undefined} onKeyDown={onPick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(); } } : undefined}>
      <span className="pos">{pos}</span>
      <span className="dot" style={{ background: color }} />
      <span>{name}</span>
      <span className="time"><span className="gap">{gap}</span>{right}</span>
    </li>
  );
}

// 왼쪽: 참가 인원
function CountPanel({ v, game }) {
  return (
    <section className="panel count-panel" aria-labelledby="count-h">
      <h2 id="count-h" className="eyebrow">참가 인원</h2>
      <div className="count-big" aria-live="polite"><strong>{v.n}</strong><span>명</span></div>
      <div className="count-btns">
        <button type="button" className="sq" aria-label="인원 줄이기" disabled={v.n <= 2} onClick={() => game().setN(v.n - 1)}>−</button>
        <button type="button" className="sq" aria-label="인원 늘리기" disabled={v.n >= 20} onClick={() => game().setN(v.n + 1)}>+</button>
      </div>
      <p className="note">2~20명</p>
      <div className="count-ev">
        <span className="label">랜덤 이벤트</span>
        <Switch label="랜덤 이벤트" on={v.events} onChange={(b) => game().setEvents(b)} />
      </div>
    </section>
  );
}

// 오른쪽: 경기 설정(모드·결과산출·맵) + 시작
function RulesPanel({ v, game, onStart, confirmed }) {
  const [place, time] = v.map.split('-');
  return (
    <section className="panel rules-panel" aria-labelledby="rules-h">
      <h2 id="rules-h" className="eyebrow">경기 설정</h2>
      <div className="rules">
        <div className="field">
          <span className="label">모드</span>
          <Seg label="모드" value={v.mode} options={MODES} onChange={(m) => game().setMode(m)} />
        </div>
        <div className="field">
          <span className="label">결과산출</span>
          <WantPick v={v} game={game} />
        </div>
        <div className="field map-field">
          <div className="map-head">
            <span className="label">맵</span>
            <div className="map-opts">
              {/* 장애물: 나중에 '커스텀'(직접 함정 놓기)이 세 번째 칸으로 들어올 자리 */}
              <div className="opt-grp"><span className="opt-l" aria-hidden="true">장애물</span>
                <Seg label="장애물" small value={v.obstacles ? 'on' : 'off'} options={[['on', '있음'], ['off', '없음']]} onChange={(x) => game().setObstacles(x === 'on')} />
              </div>
              <Seg label="시간대" small value={time} options={[['day', '☀ 낮'], ['night', '☾ 밤']]} onChange={(t) => game().setMap(place + '-' + t)} />
            </div>
          </div>
          <Seg label="맵 장소" value={place} className="chips" options={PLACES} onChange={(p) => game().setMap(p + '-' + time)} />
        </div>
      </div>
      <button type="button" className={'start-big' + (confirmed ? '' : ' locked')} onClick={onStart}>
        {confirmed ? '▶ 경기 시작' : '🔒 경기 시작'}
      </button>
    </section>
  );
}

// 캔버스 위 참가자 창: 한 명씩 이전/다음으로 넘기며 편집하고 최종 결정
function Roster({ v, game, editing, setEditing, onConfirm, confirmRef }) {
  const i = Math.min(editing, v.n - 1), c = v.cfg[i];
  const shuffled = v.lanes.some((s, k) => s !== k);
  const [tab, setTab] = useState('base');
  // 이전·다음 사람으로 바로 이동(보던 탭은 그대로). 기본·장신구는 아래 줄 가운데에서 고름
  const touchX = useRef(null);
  const rosterRef = useRef(null);
  // 실제로 적용된 변경만 참가자 창이 0.4초 반짝임(CSS .roster.flash). 막힌 변경은 부르지 않음
  const flash = () => { const el = rosterRef.current; if (!el) return; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); };
  // 같은 이름·옷 색 막기: 다른 참가자가 쓰는 값이면 적용하지 않고 잠깐 안내
  const [warn, setWarn] = useState(null);
  useEffect(() => { if (!warn) return; const t = setTimeout(() => setWarn(null), 2500); return () => clearTimeout(t); }, [warn]);
  const others = v.cfg.slice(0, v.n).filter((_, k) => k !== i);
  const norm = (s) => s.replace(/^메카 /, '').trim();
  const go = (d) => { setWarn(null); if (i + d >= 0 && i + d < v.n) setEditing(i + d); };
  return (
    <>
    <div className="roster-arrows">
      <button type="button" aria-label="이전 참가자" title="이전 참가자" disabled={i === 0} onClick={() => go(-1)}>▲</button>
      <button type="button" aria-label="다음 참가자" title="다음 참가자" disabled={i === v.n - 1} onClick={() => go(1)}>▼</button>
    </div>
    <section className="roster" aria-labelledby="roster-h" ref={rosterRef}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - touchX.current; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}>
      <div className="roster-head">
        <h2 id="roster-h" className="eyebrow">참가자 <strong>{i + 1}</strong> / {v.n}</h2>
        <span className="lane" title="출발 레인(위에서부터)">{v.lanes[i] + 1}레인</span>
        <div className="roster-tools">
          <button type="button" className="ghost" onClick={() => game().shuffleLanes()}>🔀 자리 섞기</button>
          {shuffled && <button type="button" className="ghost" onClick={() => game().resetLanes()}>원래 자리</button>}
          <button type="button" ref={confirmRef} className="confirm pulse" onClick={onConfirm}>최종 결정</button>
        </div>
      </div>
      <div className="tabs" role="tablist" aria-label="편집 항목">
        {[['base', '기본'], ['acc', '장신구']].map(([k, t]) => (
          <button type="button" key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t}</button>
        ))}
      </div>
      {/* 두 탭을 같은 칸에 겹쳐 두고 안 보이는 쪽만 숨겨, 탭을 바꿔도 창 높이가 그대로 */}
      <div className="card-row stack">
        <div className={'pane' + (tab === 'acc' ? '' : ' off')} aria-hidden={tab !== 'acc'}>
          <AccTab c={c} n={i + 1} set={(p) => { game().setCfg(i, p); game().react(i, 'acc'); flash(); }} />
        </div>
        <div className={'pane' + (tab === 'base' ? '' : ' off')} aria-hidden={tab !== 'base'}>
        <div className="card base" role="tabpanel">
          <div className="card-main">
            <input type="color" className="swatch" value={c.color} aria-label={`${i + 1}번 옷 색`}
              onChange={(e) => {
                if (others.some((o) => o.color.toLowerCase() === e.target.value.toLowerCase())) { setWarn({ m: '다른 참가자가 쓰는 색이에요' }); return; }
                setWarn(null); game().setCfg(i, { color: e.target.value }); flash();
              }} />
            <input className="name" key={`name-${i}-${c.age === 'r'}-${c.gender}`} defaultValue={c.name} maxLength={c.age === 'r' ? 9 : 6} aria-label={`${i + 1}번 이름`}
              onChange={(e) => {
                const t = e.target.value.trim() || `${i + 1}번`;
                // 입력 중 겹치면 적용만 미루고(예: '레오나'를 치는 도중 '레오'), 칸을 떠날 때도 겹치면 원래 이름으로 되돌림
                if (others.some((o) => norm(o.name) === norm(t))) { setWarn({ m: '다른 참가자가 쓰는 이름이에요' }); return; }
                setWarn(null); game().setCfg(i, { name: t }); game().react(i, 'name');
              }}
              onBlur={(e) => { if (norm(e.target.value || '') !== norm(c.name)) e.target.value = c.name; else flash(); }} />
            {/* 휴대폰: 캔버스가 낮아 종류·성별을 이름 옆 선택 상자로 */}
            <select className="m-only" value={c.age} aria-label={`${i + 1}번 종류`} onChange={(e) => { game().setCfg(i, { age: e.target.value }); game().react(i, 'mood', true); flash(); }}>
              {AGES.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
            {c.age !== 'r' && (
              <select className="m-only" value={c.gender} aria-label={`${i + 1}번 성별`} onChange={(e) => { game().setCfg(i, { gender: e.target.value }); flash(); }}>
                {GENDERS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
              </select>
            )}
            {c.age !== 'r' && <div className="pc-only gender"><Seg small label={`${i + 1}번 성별`} value={c.gender} options={GENDERS} onChange={(g) => { game().setCfg(i, { gender: g }); flash(); }} /></div>}
          </div>
          {warn && <p className="dup-warn" role="alert">{warn.m}</p>}
          {/* 휴대폰: 넓은 화면의 설명 칸 대신 종류 한 줄 소개(창 높이는 그대로) */}
          <p className="m-only m-desc">{AGE_DESC[c.age]}</p>
          <div className="pc-only ages">
            <Seg small label={`${i + 1}번 종류`} value={c.age} options={AGES} onChange={(a) => { game().setCfg(i, { age: a }); game().react(i, 'mood', true); flash(); }} />
          </div>
          <div className="pc-only desc">
            <p className="desc-t">{AGE_DESC[c.age]}</p>
            <dl>
              <dt className="pro">장점</dt><dd>{AGE_PROS[c.age][0]}</dd>
              <dt className="con">패널티</dt><dd>{AGE_PROS[c.age][1]}</dd>
              <dt className="num">능력</dt><dd>{AGE_STATS[c.age]}</dd>
            </dl>
          </div>
        </div>
        </div>
      </div>
      <div className="roster-foot">
        <p className="status pc-only">{tab === 'acc' ? '장신구를 누르면 오른쪽 색 칸에서 그 장신구의 색을 골라요.' : '어떤 종류를 골라도 이길 확률은 비슷해요.'}</p>
        <button type="button" className="nav" disabled={i === 0} onClick={() => go(-1)}>◀ 이전<span className="nav-who"> 사람</span></button>
        <div className="seg tab-seg" role="tablist" aria-label="편집 항목">
          {[['base', '기본'], ['acc', '장신구']].map(([k, t]) => (
            <button type="button" key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t}</button>
          ))}
        </div>
        <button type="button" className="nav" disabled={i === v.n - 1} onClick={() => go(1)}>다음<span className="nav-who"> 사람</span> ▶</button>
      </div>
    </section>
    </>
  );
}

// 레이스 중·후 조작
function RaceBar({ v, game, onStop, onNew }) {
  const done = v.canReplay;
  // 보내기: 리플레이 중에 GIF(가벼움) 또는 영상(선명)을 만든 뒤, 준비되면 보내기·저장
  const [pick, setPick] = useState(false);
  const make = (gif) => { setPick(false); gif ? game().exportGif() : game().exportVideo(); };
  return (
    <div className="race-bar">
      <span className="hint">{v.msg}</span>
      {v.locked && <button type="button" className="stop" onClick={onStop}>■ 경기 중단</button>}
      {v.locked && <Seg small label="배속" value={v.rate} options={RATES} onChange={(r) => game().setRate(r)} />}
      {v.locked && <span className="tip">화면을 누른 채 끌면 원하는 곳을 보고, 놓으면 다시 1위를 따라가요</span>}
      {!v.locked && <button type="button" onClick={() => game().start()}>다시 시작</button>}
      {!v.locked && <button type="button" className="ghost" onClick={onNew}>새로 하기</button>}
      {done && !v.busy && <button type="button" className="ghost" onClick={() => game().toggleReplay()}>{v.replaying ? '■ 리플레이 종료' : '▶ 리플레이'}</button>}
      {v.replaying && !v.busy && !pick && <button type="button" onClick={() => setPick(true)}>📤 다른 사람에게 보내기</button>}
      {v.replaying && !v.busy && pick && (
        <span className="share-pick">
          <button type="button" onClick={() => make(true)}>움짤(GIF)</button>
          <button type="button" onClick={() => make(false)}>영상(MP4)</button>
          <button type="button" className="ghost" onClick={() => setPick(false)}>취소</button>
        </span>
      )}
      {v.file && !v.busy && <button type="button" onClick={() => game().shareReady()}>📤 보내기</button>}
      {v.file && !v.busy && <button type="button" className="ghost" onClick={() => game().saveReady()}>⬇ 저장</button>}
    </div>
  );
}

function Result({ r, onPick }) {
  const best = parseFloat(r.rank[0].right);
  const [copy, setCopy] = useState(null);
  useEffect(() => { if (!copy) return; const t = setTimeout(() => setCopy(null), 2000); return () => clearTimeout(t); }, [copy]);
  const gapOf = (x, i) => { const d = parseFloat(x.right) - best; return i === 0 || Number.isNaN(d) ? '' : '+' + d.toFixed(2) + '초'; };
  const copyResult = () => {
    const lines = ['미니 레이스 토너먼트 결과', ...r.rank.map((x, i) => `${x.pos} ${x.name} ${x.right}` + (gapOf(x, i) ? ` (${gapOf(x, i)})` : ''))];
    if (r.bet) lines.push(r.bet);
    // Promise로 감싸 clipboard가 없는 환경의 동기 오류도 "복사 실패"로 처리
    Promise.resolve().then(() => navigator.clipboard.writeText(lines.join('\n'))).then(() => setCopy('ok'), () => setCopy('fail'));
  };
  return (
    <section id="result" aria-live="polite">
      <div className="result-head">
        <h2>최종 순위</h2>
        <button type="button" className="copy-btn" onClick={copyResult}>
          {copy === 'ok' ? '✓ 복사됨' : copy === 'fail' ? '복사 실패' : '📋 결과 복사'}
        </button>
      </div>
      {r.bet && <p className="sub">{r.bet}</p>}
      <ol>
        {r.rank.map((x, i) => {
          const gap = gapOf(x, i);
          // 1등 원함: 1·2·3위 하이라이트, 꼴등 원함: 꼴찌만, N등 원함: 그 등수만
          const hl = r.want === 'last'
            ? (i === r.rank.length - 1 ? 'hl-last' : undefined)
            : r.want === 'nth'
              ? (i === r.wantN - 1 ? 'hl-nth' : undefined)
              : (i < 3 ? `hl-${i + 1}` : undefined);
          return <Row key={i} {...x} gap={gap} hl={hl} onPick={onPick && (() => onPick(i + 1))} />;
        })}
      </ol>
    </section>
  );
}

// 경기 중단 확인 창: 참가자 수정으로 돌아가기 / 완전 초기화 / 취소(경기 계속)
function StopDialog({ onBack, onReset, onCancel }) {
  const cancelRef = useRef(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const k = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onCancel]);
  return (
    <div className="modal-back" onClick={onCancel}>
      <div className="modal stop-modal" role="alertdialog" aria-modal="true" aria-labelledby="stop-h" aria-describedby="stop-p" onClick={(e) => e.stopPropagation()}>
        <h2 id="stop-h">경기를 중단할까요?</h2>
        <p id="stop-p">경기는 잠시 멈춰 있어요. 중단하면 지금 경기 기록은 사라집니다.</p>
        <div className="stop-opts">
          <button type="button" className="opt" onClick={onBack}>
            <strong>참가자 수정으로 돌아가기</strong>
            <span>인원과 참가자 정보는 그대로 두고, 최종 결정 전 상태로 돌아갑니다.</span>
          </button>
          <button type="button" className="opt danger" onClick={onReset}>
            <strong>완전 초기화</strong>
            <span>인원 4명, 이름 새로 뽑기, 모드·결과산출·맵·자리까지 처음 상태로 되돌립니다.</span>
          </button>
        </div>
        <div className="modal-btns">
          <button type="button" ref={cancelRef} className="ghost" onClick={onCancel}>취소하고 경기 계속</button>
        </div>
      </div>
    </div>
  );
}

// 가이드: 실제 화면 캡처(public/guide)와 설명을 한 장씩. 첫 화면의 각 부분 → 레이스 → 시상식 → 리플레이
const GUIDE = [
  ['01-count', '참가 인원', ['− / + 버튼으로 2~20명을 고릅니다.', '인원을 바꾸면 참가자 창이 다시 열려요.']],
  ['02-rules', '경기 설정', ['모드: 일반 / 아이템전(?박스에서 탈것·무기·함정을 얻음)', '결과산출: 시상식 조명을 1등·N등(−/+로 등수 고르기)·꼴등 중 누구에게 줄지', '맵: 서울 도심 / 전통 마을 / 부산 바다 / 한강 공원 / 쥬라기섬 × 낮 / 밤', '랜덤 이벤트: 켜면 달리다가 좋은 일·나쁜 일이 생겨요', '장애물: 허들·물웅덩이·진흙·스프링 발판을 놓을지', '경기 시작: 참가자를 최종 결정한 뒤에 열려요']],
  ['03-roster', '참가자 창 · 기본', ['한 명씩 옷 색·이름·성별·종류(어린이·성인·어르신·로봇)를 정해요.', '오른쪽 설명 칸에서 종류의 특징과 장점·패널티를 볼 수 있어요.', '바꿀 때마다 출발선의 캐릭터가 한마디 해요.', '아래 버튼: 장신구 ▶ → 다음 사람 ▶ 순서로 넘어가요.']],
  ['04-acc', '참가자 창 · 장신구', ['장신구 줄을 누르고 종류를 골라요(없음 · 캡모자 · 비니 …).', '오른쪽 색상 칸은 지금 누른 장신구의 색을 바꿔요. 무지개 점은 다른 색.', '로봇은 눈 빛 · 경고 띠 · 안테나 · 등 · 발 부품을 바꿔요.', '장신구는 모습만 바꾸고 레이스 결과에는 영향이 없어요.']],
  ['05-start', '최종 결정과 시작', ['자리 섞기: 출발 레인 순서를 섞어요.', '최종 결정: 아직 안 본 참가자가 있으면 알려 줘요.', '결정하면 ▶ 시작 버튼이 열리고, 참가자 수정으로 다시 고칠 수 있어요.']],
  ['06-race', '레이스', ['위쪽 지도와 오른쪽 실시간 순위로 전체 흐름을 봐요. 지도를 누르면 그 위치로 이동해요.', '화면을 누른 채 끌면 원하는 곳을 보고, 놓으면 다시 1위를 따라가요.', '배속: 느리게 · 보통 · 빠르게', '말풍선은 랜덤 이벤트예요. 빨라지기도, 멈추거나 거꾸로 뛰기도 해요.', '경기 중단으로 참가자 수정이나 완전 초기화를 할 수 있어요.']],
  ['07-podium', '시상식', ['1~3위가 시상대에 오르고, 결과산출 대상에게 컬러 조명이 켜져요.', '꼴찌는 "꼴등" 표지판 옆에서 울어요.', '아래 최종 순위 표에서 모두의 기록을 봐요.', '다시 시작: 같은 설정으로 한 번 더 · 새로 하기: 같은 참가자로 준비 화면']],
  ['08-replay', '리플레이와 보내기', ['▶ 리플레이로 카운트다운부터 다시 봐요.', '리플레이 중 📤 다른 사람에게 보내기 → 움짤(GIF) 또는 영상(MP4)', '다 만들어지면 📤 보내기(메신저 공유 창) 또는 ⬇ 저장']],
];
// 처음엔 시스템 설정을 따르고, 누르면 그 선택을 기억(index.html이 다음 방문 때 먼저 적용)
function ThemeBtn() {
  const root = document.documentElement;
  const [dark, setDark] = useState(() => (root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches));
  const flip = () => {
    const t = dark ? 'light' : 'dark';
    root.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch {}
    setDark(!dark);
  };
  return (
    <button type="button" className="theme-btn" role="switch" aria-checked={dark} aria-label="다크 모드" onClick={flip}>
      <span className="theme-knob" aria-hidden="true">{dark ? '☾' : '☀'}</span>{dark ? '다크' : '라이트'}
    </button>
  );
}
function Guide({ onClose }) {
  const [k, setK] = useState(0);
  const nextRef = useRef(null);
  const last = k === GUIDE.length - 1;
  useEffect(() => {
    nextRef.current?.focus();
    const key = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') setK((x) => Math.min(GUIDE.length - 1, x + 1));
      else if (e.key === 'ArrowLeft') setK((x) => Math.max(0, x - 1));
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  const [img, title, items] = GUIDE[k];
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal guide" role="dialog" aria-modal="true" aria-labelledby="guide-h" onClick={(e) => e.stopPropagation()}>
        <div className="guide-top">
          <span className="guide-step">{k + 1} / {GUIDE.length}</span>
          <h2 id="guide-h">{title}</h2>
          <button type="button" className="ghost guide-x" aria-label="가이드 닫기" onClick={onClose}>✕</button>
        </div>
        <div className="guide-shot"><img src={`${import.meta.env.BASE_URL}guide/${img}.webp`} alt={`${title} 화면`} /></div>
        <ul className="guide-list">{items.map((t) => <li key={t}>{t}</li>)}</ul>
        <div className="guide-foot">
          <button type="button" className="ghost" disabled={k === 0} onClick={() => setK(k - 1)}>◀ 이전</button>
          <div className="guide-dots" role="tablist" aria-label="가이드 페이지">
            {GUIDE.map(([, t], i) => <button type="button" key={t} role="tab" aria-selected={i === k} aria-label={t} className={i === k ? 'on' : ''} onClick={() => setK(i)} />)}
          </div>
          <button type="button" ref={nextRef} onClick={() => (last ? onClose() : setK(k + 1))}>{last ? '시작하기' : '다음 ▶'}</button>
        </div>
      </div>
    </div>
  );
}

// 안내 창: 최종 결정 전에 시작을 누를 때, 확인하지 않은 참가자가 남았는데 최종 결정을 누를 때
function Notice({ title, children, closeText = '닫기', goText, onClose, onAlt = onClose, onGo }) {
  const okRef = useRef(null);
  useEffect(() => {
    okRef.current?.focus();
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="notice-h" aria-describedby="notice-p" onClick={(e) => e.stopPropagation()}>
        <h2 id="notice-h">{title}</h2>
        <p id="notice-p">{children}</p>
        <div className="modal-btns">
          <button type="button" className="ghost" onClick={onAlt}>{closeText}</button>
          <button type="button" ref={okRef} onClick={onGo}>{goText}</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const confirmRef = useRef(null);
  const [v, setV] = useState(null);
  const [editing, setEditing] = useState(0);
  const [confirmedSig, setConfirmedSig] = useState(null);
  const [notice, setNotice] = useState(false);
  const [guide, setGuide] = useState(false);
  const [stopping, setStopping] = useState(false);
  // 참가자 창에서 한 번이라도 본 참가자 번호(최종 결정 때 안 본 사람이 있으면 알림)
  const [seen, setSeen] = useState([0]);
  const [unseenNotice, setUnseenNotice] = useState(false);
  // 완전 초기화 때 참가자 카드(이름 입력칸)를 새로 그리기 위한 번호
  const [rosterKey, setRosterKey] = useState(0);
  const game = () => gameRef.current;
  // 시작 전(idle)에는 설정 + 미리보기 캔버스, 시작하면 캔버스와 레이스 조작만
  const setup = !v || v.state === 'idle';
  const confirmed = !!v && confirmedSig === rosterSig(v);

  useEffect(() => {
    const g = createGame(canvasRef.current, { onChange: setV });
    gameRef.current = g;
    return () => { g.destroy(); gameRef.current = null; };
  }, []);
  // 인원이 줄어 편집 중 카드가 사라지면 첫 카드로
  useEffect(() => { if (v && editing >= v.n) setEditing(0); }, [v, editing]);
  // 참가자 창이 떠 있는 동안 편집 중인 캐릭터를 캔버스에서 강조
  const rosterOpen = !!v && setup && !confirmed;
  useEffect(() => { game()?.setHover(rosterOpen ? editing : -1); }, [rosterOpen, editing]);
  // 참가자 창에서 그 사람으로 넘어오면 출발선의 캐릭터가 한마디(긴장·자신감·일상 중 하나)
  useEffect(() => { if (rosterOpen) game()?.react(editing, 'mood'); }, [rosterOpen, editing]);
  useEffect(() => { if (rosterOpen) setSeen((s) => (s.includes(editing) ? s : [...s, editing])); }, [rosterOpen, editing]);
  const unseen = v ? Array.from({ length: v.n }, (_, k) => k).filter((k) => !seen.includes(k)) : [];
  const confirmNow = () => { setUnseenNotice(false); setConfirmedSig(rosterSig(v)); };
  const onConfirm = () => (unseen.length ? setUnseenNotice(true) : confirmNow());

  const onStart = () => {
    if (!confirmed) { setNotice(true); return; }
    game().setHover(-1);
    game().start();
    // 화면이 낮으면(휴대폰 가로 등) 캔버스가 다 보이도록 스크롤
    // 시작하면 설정 화면이 사라져 배치가 바뀌므로 다음 화면에서 잼
    setTimeout(() => {
      const r = canvasRef.current?.getBoundingClientRect();
      if (r && (r.top < 0 || r.bottom > window.innerHeight)) canvasRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };
  const openStop = () => { game().setPaused(true); setStopping(true); };
  const cancelStop = () => { game().setPaused(false); setStopping(false); };
  const toSetup = () => {
    setStopping(false);
    setConfirmedSig(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const stopBack = () => { game().stop(); toSetup(); };
  // 시상식 뒤 새로 하기: 같은 참가자로 준비 화면에 돌아가 참가자 창을 첫 사람부터 다시 띄움
  const newRound = () => { game().reset(); setEditing(0); toSetup(); };
  const stopReset = () => { game().resetAll(); setEditing(0); setSeen([0]); setRosterKey((k) => k + 1); toSetup(); };
  const goConfirm = () => {
    setNotice(false);
    confirmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    confirmRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="wrap">
      <header className="top">
        <h1>{TITLE} <button type="button" className="guide-btn" aria-label="가이드 보기" title="가이드" onClick={() => setGuide(true)}>?</button></h1>
        <p className="tagline">참가자를 정하고 출발! 1등과 꼴등은 누가 될까요?</p>
        <ThemeBtn />
      </header>
      {v && setup && (
        <>
          <div className="setup">
            <CountPanel v={v} game={game} />
            <RulesPanel v={v} game={game} onStart={onStart} confirmed={confirmed} />
          </div>
        </>
      )}
      {v && !setup && <RaceBar v={v} game={game} onStop={openStop} onNew={newRound} />}
      <div className={'stage' + (v && v.locked ? ' racing' : '') + (v && v.manual ? ' grabbing' : '')}>
        <canvas ref={canvasRef} id="cv" width="960" height="420" aria-label="레이스 화면" />
        {rosterOpen && (
          <Roster key={rosterKey} v={v} game={game} editing={editing} setEditing={setEditing}
            onConfirm={onConfirm} confirmRef={confirmRef} />
        )}
        {v && setup && confirmed && (
          <>
            <button type="button" className="stage-start" onClick={onStart}>▶ 시작</button>
            <button type="button" className="stage-edit" onClick={() => setConfirmedSig(null)}>✎ 참가자 수정</button>
          </>
        )}
      </div>
      {v && v.result && <Result r={v.result} onPick={(k) => { game().podiumFocus(k); canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} />}
      {guide && <Guide onClose={() => setGuide(false)} />}
      {notice && (
        <Notice title="참가자를 먼저 확정해 주세요" goText="최종 결정으로 이동" onClose={() => setNotice(false)} onGo={goConfirm}>
          캔버스 위 참가자 창의 <strong>최종 결정</strong>을 누르면 경기를 시작할 수 있어요.
        </Notice>
      )}
      {unseenNotice && (
        <Notice title="아직 확인하지 않은 참가자가 있어요" closeText="계속 편집" goText="그대로 결정"
          onClose={() => setUnseenNotice(false)} onAlt={() => { setUnseenNotice(false); setEditing(unseen[0]); }}
          onGo={confirmNow}>
          {unseen.map((k) => k + 1).join(', ')}번 참가자를 아직 보지 않았어요. 이름·종류를 바꾸지 않고 그대로 결정할까요?
        </Notice>
      )}
      {stopping && <StopDialog onBack={stopBack} onReset={stopReset} onCancel={cancelStop} />}
      <footer className="credit">
        © 2026 Hyunbae Jeon · <a href="https://github.com/Hyunbae89/miniRaceGame" target="_blank" rel="noreferrer">github.com/Hyunbae89/miniRaceGame</a>
      </footer>
    </div>
  );
}
