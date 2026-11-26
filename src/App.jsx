import { useEffect, useRef, useState } from 'react';
import { createGame } from './game/engine.js';
import './App.css';

const TITLE = '미니 레이스 토너먼트';
const GENDERS = [['m', '남'], ['f', '여']];
const AGES = [['c', '어린이'], ['a', '성인'], ['e', '어르신'], ['r', '로봇']];
// 참가자 창 짧은 설명(자세한 동작은 가이드 페이지에서). 사람 셋은 속도 계산이 같고, 로봇은 방식이 달라도 평균 순위가 비슷하게 맞춰져 있음(npm run check -- --balance)
const AGE_DESC = {
  c: '작은 몸으로 종종걸음을 쳐요.',
  a: '큰 보폭으로 힘차게 달려요.',
  e: '작은 보폭으로 지팡이를 짚고 걸어요.',
  r: '배터리와 부스터로 달려요. 진흙엔 약하고 밀치기엔 강해요.',
};
const MODES = [['normal', '일반'], ['item', '아이템전']];
const WANTS = [['first', '1등 원함'], ['last', '꼴등 원함']];
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
function Seg({ label, value, options, onChange, disabled, small }) {
  return (
    <div className={'seg' + (small ? ' small' : '')} role="radiogroup" aria-label={label}>
      {options.map(([k, t]) => (
        <button type="button" key={k} role="radio" aria-checked={value === k} className={value === k ? 'on' : ''}
          disabled={disabled} onClick={() => onChange(k)}>{t}</button>
      ))}
    </div>
  );
}

function Row({ pos, color, name, right, hl }) {
  return (
    <li className={hl}>
      <span className="pos">{pos}</span>
      <span className="dot" style={{ background: color }} />
      <span>{name}</span>
      <span className="time">{right}</span>
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
          <Seg label="결과산출" value={v.want} options={WANTS} onChange={(w) => game().setWant(w)} />
        </div>
        <div className="field">
          <span className="label">맵</span>
          <div className="map-pick">
            <Seg label="맵 장소" value={place} options={[['city', '서울 도심'], ['trad', '전통 마을']]} onChange={(p) => game().setMap(p + '-' + time)} />
            <Seg label="시간대" value={time} options={[['day', '☀ 낮'], ['night', '☾ 밤']]} onChange={(t) => game().setMap(place + '-' + t)} />
          </div>
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
  // 다음: 기본 탭 → 장신구 탭 → 다음 사람 기본 탭. 이전: 장신구 탭 → 기본 탭, 기본 탭 → 이전 사람 기본 탭
  const go = (d) => {
    if (d > 0 && tab === 'base') setTab('acc');
    else if (d < 0 && tab === 'acc') setTab('base');
    else if (i + d >= 0 && i + d < v.n) { setEditing(i + d); setTab('base'); }
  };
  const touchX = useRef(null);
  return (
    <section className="roster" aria-labelledby="roster-h"
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
      <div className="card-row">
        {tab === 'acc' ? (
          <AccTab c={c} n={i + 1} set={(p) => game().setCfg(i, p)} />
        ) : (
        <div className="card base" role="tabpanel">
          <div className="card-main">
            <input type="color" className="swatch" value={c.color} aria-label={`${i + 1}번 옷 색`} onChange={(e) => game().setCfg(i, { color: e.target.value })} />
            <input className="name" key={`name-${i}-${c.age === 'r'}`} defaultValue={c.name} maxLength={c.age === 'r' ? 9 : 6} aria-label={`${i + 1}번 이름`}
              onChange={(e) => game().setCfg(i, { name: e.target.value.trim() || `${i + 1}번` })} />
            {/* 휴대폰: 캔버스가 낮아 종류·성별을 이름 옆 선택 상자로 */}
            <select className="m-only" value={c.age} aria-label={`${i + 1}번 종류`} onChange={(e) => game().setCfg(i, { age: e.target.value })}>
              {AGES.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
            {c.age !== 'r' && (
              <select className="m-only" value={c.gender} aria-label={`${i + 1}번 성별`} onChange={(e) => game().setCfg(i, { gender: e.target.value })}>
                {GENDERS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
              </select>
            )}
            {c.age !== 'r' && <div className="pc-only gender"><Seg small label={`${i + 1}번 성별`} value={c.gender} options={GENDERS} onChange={(g) => game().setCfg(i, { gender: g })} /></div>}
          </div>
          <div className="pc-only ages">
            <Seg small label={`${i + 1}번 종류`} value={c.age} options={AGES} onChange={(a) => game().setCfg(i, { age: a })} />
          </div>
          <p className="pc-only desc">{AGE_DESC[c.age]}</p>
        </div>
        )}
      </div>
      <div className="roster-foot">
        <p className="status pc-only">{tab === 'acc' ? '장신구를 누르면 오른쪽 색 칸에서 그 장신구의 색을 골라요.' : '어떤 종류를 골라도 이길 확률은 비슷해요.'}</p>
        <button type="button" className="nav" disabled={i === 0 && tab === 'base'} onClick={() => go(-1)}>{tab === 'acc' ? '◀ 기본' : '◀ 이전 사람'}</button>
        <button type="button" className="nav" disabled={i === v.n - 1 && tab === 'acc'} onClick={() => go(1)}>{tab === 'base' ? '장신구 ▶' : '다음 사람 ▶'}</button>
      </div>
    </section>
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

function Result({ r }) {
  return (
    <section id="result" aria-live="polite">
      <h2>최종 순위</h2>
      {r.bet && <p className="sub">{r.bet}</p>}
      <ol>
        {r.rank.map((x, i) => {
          // 1등 원함: 1·2·3위 하이라이트, 꼴등 원함: 꼴찌만
          const hl = r.want === 'last'
            ? (i === r.rank.length - 1 ? 'hl-last' : undefined)
            : (i < 3 ? `hl-${i + 1}` : undefined);
          return <Row key={i} {...x} hl={hl} />;
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
  useEffect(() => { if (rosterOpen) setSeen((s) => (s.includes(editing) ? s : [...s, editing])); }, [rosterOpen, editing]);
  const unseen = v ? Array.from({ length: v.n }, (_, k) => k).filter((k) => !seen.includes(k)) : [];
  const confirmNow = () => { setUnseenNotice(false); setConfirmedSig(rosterSig(v)); };
  const onConfirm = () => (unseen.length ? setUnseenNotice(true) : confirmNow());

  const onStart = () => {
    if (!confirmed) { setNotice(true); return; }
    game().setHover(-1);
    game().start();
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
        <h1>{TITLE}</h1>
        <p className="tagline">참가자를 정하고 출발! 1등과 꼴등은 누가 될까요?</p>
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
      {v && v.result && <Result r={v.result} />}
      {notice && (
        <Notice title="참가자를 먼저 확정해 주세요" goText="최종 결정으로 이동" onClose={() => setNotice(false)} onGo={goConfirm}>
          캔버스 위 참가자 창의 <strong>최종 결정</strong>을 누르면 경기를 시작할 수 있어요.
        </Notice>
      )}
      {unseenNotice && (
        <Notice title="아직 확인하지 않은 참가자가 있어요" closeText="그대로 결정" goText="확인하러 가기"
          onClose={() => setUnseenNotice(false)} onAlt={confirmNow}
          onGo={() => { setUnseenNotice(false); setEditing(unseen[0]); }}>
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
