// 레이스 게임 엔진: 캔버스 렌더링과 게임 로직. UI 상태는 ui.onChange 콜백으로만 내보냅니다.

export function createGame(cv,ui){
const ctx=cv.getContext('2d');
const W=window.innerWidth<700?560:960,GT=232,TRACK=6500,OFF=60,JT=.6,MAXN=20;
// 트랙 깊이(GD)와 캔버스 높이(H)는 인원에 따라 setup()에서 정해짐: 8명까지는 기존 크기, 그 이상은 1명당 12px씩 넓어짐
let GD=152,H=420;
const COLORS=['#e4572e','#2e86de','#f2b705','#2fb67c','#8e5ad6','#ef6aa1','#17a2b8','#5b6770',
  '#a0522d','#7cb518','#ff8c42','#3d5a80','#c71f66','#00a896','#b8860b','#6a4c93','#ff595e','#1982c4','#8ac926','#2b2d42'];
const R=(a,b)=>a+Math.random()*(b-a);
let raf=0,dead=false,msg='',result=null;
const ac=new AbortController();
const L=(t,f)=>cv.addEventListener(t,f,{signal:ac.signal});
function push(){ui.onChange({state:state,msg:msg,n:n,mode:mode,manual:manual,canReplay:frames.length>=2&&(state==='podium'||state==='done'||state==='replay'),replaying:state==='replay',busy:!!(rec||exporting),file:ready?ready.name:null,result:result,want:want,locked:state==='count'||state==='run',lanes:lanes.slice(),cfg:cfg.map(c=>Object.assign({},c))});}
const HINT='인원을 정하고 시작을 누르세요. 밀치고 잡아당기며 순위가 계속 바뀝니다. 구덩이와 가시에 걸리면 스턴!';
let n=4,racers=[],fin=[],traps=[],fx=[],state='idle',clock=0,camX=0,cd=0,endWait=0,last=0;
let boxes=[],bananas=[],portals=[],bolts=[],mode='normal';
// 1등 소감: 종류별 멘트 중 하나를 1위 도착 순간에 뽑아 레이스·시상식에서 말풍선으로 보여 줌
const WIN_LINES={
  c:['야호! 내가 1등이다!','엄마, 나 봤어?!','한 번 더 할래!','사탕 사 주세요!'],
  a:['출근길보다 쉽네요','역시 꾸준함이 답이죠','오늘 회식은 제가 쏩니다! 라고 할뻔.','지각은 면했다!'],
  e:['허허, 아직 안 죽었어','젊은이들, 분발하게','이 동네 오래 살았지','다 지팡이 덕분이야'],
  r:['목표 달성. 1위 확인.','삐빅! 승리 프로토콜 실행','배터리 잔량 충분','인간 대비 성능 우위']};
let winLine='';
let frames=[],bk=null,rp=0,rk=0,rec=null,exporting=false,ready=null,want='first',betMsg='';
let anim=[],quirks=[],dust=[],fdt=0,shake=0;// 동작 표현용(시뮬레이션과 무관)
let rt=0,slowT=0,banner=null,manual=false,mt=0,pt=0,conf=[];
// 기본 이름: 성별에 맞는 영어 이름을 겹치지 않게 랜덤 배정 (입력칸 최대 6자)
const NAMES={m:['레오','맥스','잭','스티브','노아','이든','오웬','다니엘','오스카','휴고','태오','밥','라이언','샘','벤','카이','마이클','제이크','루크','제임스'],
  f:['미아','에마','릴리','아바','클로이','조이','루비','그레이스','엘라','루나','노라','아이비','에이미','루시','소피아','헤이즐','아이리스','제인','로즈','안나']};
function shuffle(a){for(let k=a.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[a[k],a[j]]=[a[j],a[k]];}return a;}
const pool={m:shuffle(NAMES.m.slice()),f:shuffle(NAMES.f.slice())};
const cfg=COLORS.map((c,i)=>{const g=i%2?'f':'m';return {name:pool[g].pop(),color:c,gender:g,age:'a'};});
let lanes=[],pv=null;// lanes[i] = i번 캐릭터의 출발 레인(0=맨 위)
const ITEMS=[{k:'jet',n:'제트팩',e:'🚀',m:2,t:2.2},{k:'moto',n:'오토바이',e:'🏍️',m:1.75,t:3.4},{k:'bike',n:'자전거',e:'🚲',m:1.35,t:4},{k:'wheel',n:'휠체어',e:'♿',m:1.2,t:5},{k:'cart',n:'카트',e:'🏎️',m:1.55,t:3},{k:'kick',n:'킥보드',e:'🛴',m:1.3,t:4},{k:'ekick',n:'전동 킥보드',e:'🛴',m:1.65,t:3},{k:'portal',n:'포탈건',e:'🌀'},{k:'banana',n:'바나나',e:'🍌'},{k:'stun',n:'스턴건',e:'🔫'}];
function ink(c){const v=parseInt(c.slice(1),16);return ((v>>16)*.299+((v>>8)&255)*.587+(v&255)*.114)>150?'#1e2b33':'#fff';}
const SKIN=['#f5d0b0','#e8b98f','#c68c5c','#8d5a3b','#f2c9a5','#d9a273','#b07548','#f5d0b0'];
const HAIR=['#2b1d14','#5a3a22','#c9a227','#1e2b33','#8a2b1b','#2b1d14','#6b4a2f','#111'];

function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function say(r,t){fx.push({x:r.x,d:r.d,t:0,s:t});}

function setup(){
  GD=152+Math.max(0,n-8)*12;H=GT+GD+36;
  cv.width=W;cv.height=H;pv=null;
  racers=[];fin=[];fx=[];traps=[];camX=0;clock=0;endWait=0;rt=0;slowT=0;banner=null;manual=false;
  boxes=[];bananas=[];portals=[];bolts=[];frames=[];ready=null;betMsg='';winLine='';
  anim=[];dust=[];quirks=Array.from({length:n},()=>({stride:R(.88,1.12),arm:R(.8,1.25),lean:R(.75,1.3),cad:R(.92,1.08)}));
  if(mode==='item'){let bx=R(900,1100);while(bx<TRACK-500){for(let d=20;d<=GD-20;d+=37)boxes.push({x:bx,d:d,t:0});bx+=R(650,950);}}
  let x=R(700,850);
  while(x<TRACK-400){traps.push({x:x,type:(traps.length>=2&&Math.random()<.17)?'pit':'spike'});x+=R(450,800);}
  for(let i=0;i<n;i++){
    const s=lanes[i]??i,d=n>1?10+s*((GD-22)/(n-1)):GD/2;
    racers.push({i:i,name:cfg[i].name,color:cfg[i].color,gender:cfg[i].gender,age:cfg[i].age,veh:null,item:null,x:0,d:d,td:d,vd:0,kx:0,speed:0,base:R(215,232),mult:1,change:0,skill:R(.6,.9),dd:{},jt:-1,h:0,stun:0,inv:0,slow:0,cool:R(.5,1.5),pull:null,act:0,ak:'',bat:100,heat:0,boost:0,ovh:0,chg:0,fin:false,rank:0,time:0,cur:i+1});
  }
}

function update(dt){
  clock+=dt;
  const act=racers.filter(r=>!r.fin);
  let lead=0;for(const r of act)lead=Math.max(lead,r.x);
  for(const r of racers){
    if(r.fin){r.speed*=Math.pow(.03,dt);r.x+=r.speed*dt;continue;}
    r.cool-=dt;r.inv-=dt;r.slow-=dt;if(r.act>0)r.act-=dt;
    if(r.stun>0){r.stun-=dt;r.speed=0;r.h=0;r.jt=-1;}
    else{
      r.change-=dt;
      if(r.change<=0){
        const late=r.x>TRACK-1000,q=Math.random();
        r.mult=q<(late?.45:.35)?R(1.3,1.7):q<.7?R(.5,.75):R(.95,1.15);
        r.change=R(.6,1.8);
      }
      const gap=lead-r.x;
      let m=r.mult+Math.min(gap/450,1)*.28-(gap<1?.08:0);
      if(r.age==='r')m=robotStep(r,dt,gap);
      if(r.slow>0)m*=.55;if(r.veh)m*=r.veh.m;
      r.speed+=(r.base*m-r.speed)*Math.min(1,dt*4);
    }
    r.x+=(r.speed+r.kx)*dt;r.kx*=Math.pow(.02,dt);if(r.x<0)r.x=0;
    if(r.pull){r.pull.t-=dt;const v=r.pull.v;if(r.pull.t<=0||v.fin)r.pull=null;else{r.x+=150*dt;v.x-=150*dt;if(v.x<0)v.x=0;}}
    // depth steering
    if(Math.random()<dt*.7)r.td=R(8,GD-6);
    const st=Math.max(-60*dt,Math.min(60*dt,r.td-r.d));
    r.d+=st+r.vd*dt;r.vd*=Math.pow(.01,dt);
    for(const o of racers){if(o!==r&&Math.abs(o.x-r.x)<22&&Math.abs(o.d-r.d)<12)r.d+=(r.d>=o.d?1:-1)*45*dt;}
    r.d=Math.max(4,Math.min(GD-4,r.d));
    if(r.stun<=0){
      // jump AI
      if(r.jt<0&&!(r.veh&&r.veh.k==='jet')){
        for(let k=0;k<traps.length;k++){
          const d=traps[k].x-r.x;
          if(d>0){
            if(d<260){
              if(r.dd[k]===undefined)r.dd[k]=Math.random()<r.skill;
              if(r.dd[k]&&d<=Math.max(40,r.speed)*.3)r.jt=0;
            }
            break;
          }
        }
      }
      if(r.jt>=0){r.jt+=dt;if(r.jt>=JT){r.jt=-1;r.h=0;}else r.h=Math.sin(Math.PI*r.jt/JT)*(r.age==='r'?28:42);}
      if(r.veh&&r.veh.k==='jet')r.h=26+Math.sin(clock*8)*3;else if(r.jt<0)r.h=0;
      // trap hit
      if(r.inv<=0&&r.h<14){
        for(const t of traps){
          if(Math.abs(r.x-t.x)<22){
            if(r.age==='r'&&Math.random()<.4){r.inv=1.5;say(r,'끄떡없음!');break;}
            if(t.type==='pit'){r.stun=2.4;r.speed=0;r.kx=0;r.inv=3;r.jt=-1;r.h=0;r.pull=null;say(r,'풍덩!');}
            else{r.stun=1.6;r.speed=0;r.kx=0;r.inv=2.4;r.jt=-1;r.h=0;say(r,'스턴!');}
            if(r.age==='r'){r.stun*=1.5;r.inv=r.stun+.6;say(r,'재부팅…');}
            break;
          }
        }
      }
    }
    if(r.x>=TRACK){r.fin=true;fin.push(r);r.rank=fin.length;r.time=rt;r.pull=null;if(r.rank===1){const L=WIN_LINES[r.age]||WIN_LINES.a;winLine=L[Math.floor(Math.random()*L.length)];}if(r.rank<=3){slowT=1.4;banner={t:1.4,s:r.rank+'위 '+r.name};}}
  }
  if(mode==='item'){
    for(const b of boxes)if(b.t>0)b.t-=dt;
    for(const b of bananas)b.g-=dt;
    for(const r of racers){
      if(r.fin)continue;
      if(r.veh){r.veh.t-=dt;if(r.veh.t<=0)r.veh=null;}
      if(!r.item&&r.stun<=0)for(const b of boxes)if(b.t<=0&&Math.abs(b.x-r.x)<20&&Math.abs(b.d-r.d)<20){b.t=6;if(r.age==='r'&&Math.random()<.3){r.bat=Math.min(100,r.bat+40);say(r,'🔋 충전!');break;}const it=ITEMS[Math.floor(R(0,ITEMS.length))];r.item={k:it.k,d:R(.5,1.2),life:5};say(r,it.e+it.n);break;}
      if(r.item&&r.stun<=0){r.item.d-=dt;if(r.item.d<=0)useItem(r);}
      if(r.inv<=0&&r.h<14&&r.stun<=0)for(let k=0;k<bananas.length;k++){const b=bananas[k];if(b.g<=0&&Math.abs(b.x-r.x)<16&&Math.abs(b.d-r.d)<18){bananas.splice(k,1);r.stun=1.2;r.speed=0;r.inv=1.5;r.jt=-1;r.h=0;say(r,'미끄덩!');break;}}
    }
  }
  // shoving and grabbing
  for(const a of racers){
    if(a.fin||a.stun>0||a.cool>0)continue;
    let v=null,bd=1e9;
    for(const o of racers){
      if(o===a||o.fin)continue;
      const dx=o.x-a.x,dd=o.d-a.d;
      if(Math.abs(dx)<44&&Math.abs(dd)<26){const s=Math.abs(dx)+Math.abs(dd);if(s<bd){bd=s;v=o;}}
    }
    if(v&&Math.random()<dt*2.2){
      a.cool=R(1.3,2.3);
      if(v.x-a.x>8&&Math.random()<.4&&!a.pull){a.pull={v:v,t:.8};v.slow=.5;a.ak='pull';a.act=.8;say(a,'잡아당기기!');}
      else if(v.veh&&v.veh.k==='wheel'){a.kx-=120;say(v,'끄떡없음!');}else{const pw=(v.age==='r'?.3:1)*(a.age==='r'?1.5:1);v.kx-=240*pw;v.vd+=(v.d===a.d?(Math.random()<.5?-1:1):(v.d<a.d?-1:1))*90*pw;a.kx+=100;v.slow=.4;a.ak='push';a.act=.4;say(a,'밀치기!');}
    }
  }
  for(const f of fx)f.t+=dt;for(const o of portals)o.t-=dt;for(const o of bolts)o.t-=dt;portals=portals.filter(o=>o.t>0);bolts=bolts.filter(o=>o.t>0);
  fx=fx.filter(f=>f.t<1);
  if(racers.every(r=>r.fin)){endWait+=dt;if(endWait>1.3)finish();}
}

function useItem(r){
  const k=r.item.k,it=ITEMS.find(i=>i.k===k);
  if(it.m){r.veh={k:k,t:it.t,m:it.m};r.item=null;r.jt=-1;say(r,it.n+' 탑승!');}
  else if(k==='banana'){bananas.push({x:r.x-30,d:r.d,g:.6});r.item=null;say(r,'바나나 투척!');}
  else if(k==='portal'){const nx=Math.min(TRACK-30,r.x+520);portals.push({x:r.x,d:r.d,t:.7,c:'#2e86de'},{x:nx,d:r.d,t:.7,c:'#f39c12'});r.x=nx;r.inv=1.2;r.item=null;say(r,'포탈!');}
  else{
    let v=null,bd=700;
    for(const o of racers)if(o!==r&&!o.fin&&o.x>r.x&&o.x-r.x<bd){bd=o.x-r.x;v=o;}
    if(v){v.stun=1.8;v.speed=0;v.jt=-1;v.h=0;v.pull=null;bolts.push({a:r,b:v,t:.5});say(v,'감전!');r.item=null;}
    else{r.item.d=.3;r.item.life-=.3;if(r.item.life<=0)r.item=null;}
  }
}
function record(){
  if(frames.length&&rt-frames[frames.length-1].t<1/40)return;
  frames.push({t:rt,camX:camX,clock:clock,bn:banner&&banner.t>0?{s:banner.s,t:banner.t}:null,
    r:racers.map(r=>({i:r.i,name:r.name,color:r.color,gender:r.gender,age:r.age,x:r.x,d:r.d,h:r.h,speed:r.speed,mult:r.mult,stun:r.stun,veh:r.veh?{k:r.veh.k}:null,item:r.item?{k:r.item.k}:null,fin:r.fin,rank:r.rank,cur:r.cur,act:r.act,ak:r.ak,bat:r.bat,heat:r.heat,boost:r.boost,ovh:r.ovh,chg:r.chg,pt:r.pull?racers.indexOf(r.pull.v):-1})),
    bx:boxes.map(b=>b.t>0?'0':'1').join(''),ba:bananas.map(b=>({x:b.x,d:b.d})),po:portals.map(o=>({x:o.x,d:o.d,t:o.t,c:o.c})),
    bo:bolts.map(o=>({a:{x:o.a.x,d:o.a.d},b:{x:o.b.x,d:o.b.d},t:o.t})),fx:fx.map(f=>({x:f.x,d:f.d,t:f.t,s:f.s}))});
}
function applyFrame(f){
  racers=f.r.map(o=>Object.assign({},o));
  racers.forEach((r,k)=>{r.pull=f.r[k].pt>=0?{v:racers[f.r[k].pt]}:null;});
  fin=racers.filter(r=>r.fin).sort((a,b)=>a.rank-b.rank);
  boxes=bk.boxes.map((b,k)=>({x:b.x,d:b.d,t:f.bx[k]==='1'?0:1}));
  bananas=f.ba;portals=f.po;bolts=f.bo;fx=f.fx;camX=f.camX;clock=f.clock;banner=f.bn;
}
function startReplay(){
  bk={racers,fin,boxes,bananas,portals,bolts,fx,camX,clock,banner};
  state='replay';rp=0;rk=0;manual=false;push();
}
function endReplay(){
  ({racers,fin,boxes,bananas,portals,bolts,fx,camX,clock,banner}=bk);
  state='podium';pt=0;conf=[];
  if(rec&&rec.state==='recording')rec.stop();
  push();
}
function lzw(px){
  const clear=256,eoi=257;let size=9,next=258;
  const dict=new Map(),buf=[];let cur=0,bits=0;
  const emit=c=>{cur|=c<<bits;bits+=size;while(bits>=8){buf.push(cur&255);cur>>=8;bits-=8;}};
  const bump=()=>{if(next>(1<<size)-1&&size<12)size++;};
  emit(clear);let p=px[0];
  for(let i=1;i<px.length;i++){
    const c=px[i],key=(p<<8)|c,e=dict.get(key);
    if(e!==undefined){p=e;continue;}
    emit(p);
    if(next<4096){bump();dict.set(key,next++);}
    else{emit(clear);dict.clear();size=9;next=258;}
    p=c;
  }
  emit(p);bump();emit(eoi);if(bits>0)buf.push(cur&255);
  const out=[8];
  for(let i=0;i<buf.length;i+=255){const m=Math.min(255,buf.length-i);out.push(m);for(let k=0;k<m;k++)out.push(buf[i+k]);}
  out.push(0);return out;
}
function gifHeader(w,h){
  const a=[71,73,70,56,57,97,w&255,w>>8,h&255,h>>8,0xF7,0,0];
  for(let i=0;i<256;i++)a.push(Math.round(((i>>5)&7)*255/7),Math.round(((i>>2)&7)*255/7),Math.round((i&3)*255/3));
  a.push(0x21,0xFF,11,78,69,84,83,67,65,80,69,50,46,48,3,1,0,0,0);
  return new Uint8Array(a);
}
function gifFrame(px,w,h,cs){
  const a=[0x21,0xF9,4,0x04,cs&255,cs>>8,0,0,0x2C,0,0,0,0,w&255,w>>8,h&255,h>>8,0];
  return new Uint8Array(a.concat(lzw(px)));
}
function offer(blob,name){
  ready={blob:blob,name:name};
  msg='파일이 준비됐어요. 저장 버튼을 눌러 주세요.';push();
}
function saveReady(){
  if(!ready)return;
  const a=document.createElement('a');a.href=URL.createObjectURL(ready.blob);a.download=ready.name;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  msg='저장했어요!';push();
}
async function exportGif(){
  if(state!=='podium'||frames.length<2)return;
  ready=null;
  startReplay();exporting=true;push();
  const GW=400,GH=Math.round(cv.height*GW/W);
  const oc=document.createElement('canvas');oc.width=GW;oc.height=GH;
  const o=oc.getContext('2d',{willReadFrequently:true});
  const dur=frames[frames.length-1].t+.3,parts=[gifHeader(GW,GH)];
  let k=0,cnt=0;
  for(let t=0;t<=dur;t+=.1){
    if(state!=='replay'){exporting=false;return;}
    while(k<frames.length-1&&frames[k+1].t<=t)k++;
    applyFrame(frames[k]);rp=t;draw();
    o.drawImage(cv,0,0,GW,GH);
    const d=o.getImageData(0,0,GW,GH).data,ix=new Uint8Array(GW*GH);
    for(let i=0,j=0;j<ix.length;i+=4,j++)ix[j]=((d[i]>>5)<<5)|((d[i+1]>>5)<<2)|(d[i+2]>>6);
    parts.push(gifFrame(ix,GW,GH,10));
    if(++cnt%4===0){msg='GIF 만드는 중… '+Math.round(t/dur*100)+'%';push();await new Promise(r=>setTimeout(r));}
  }
  parts.push(new Uint8Array([0x3B]));
  exporting=false;endReplay();
  offer(new Blob(parts,{type:'image/gif'}),'race-replay.gif');
}
function exportVideo(){
  if(state!=='podium'||frames.length<2)return;
  if(!window.MediaRecorder||!cv.captureStream){msg='이 브라우저는 영상 녹화를 지원하지 않아요. GIF로 만들어 보세요.';push();return;}
  const mt=['video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
  if(!mt){msg='이 브라우저는 영상 녹화를 지원하지 않아요. GIF로 만들어 보세요.';push();return;}
  const ext=mt.indexOf('mp4')>=0?'mp4':'webm',chunks=[];
  const mr=new MediaRecorder(cv.captureStream(30),{mimeType:mt,videoBitsPerSecond:4000000});
  mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
  mr.onstop=()=>{rec=null;offer(new Blob(chunks,{type:mt.split(';')[0]}),'race-replay.'+ext);if(ext!=='mp4')msg='MP4 녹화를 지원하지 않는 브라우저라 WebM으로 만들었어요. 저장 버튼을 눌러 주세요.';push();};
  ready=null;
  rec=mr;mr.start();startReplay();
  msg='영상 녹화 중… 리플레이가 끝날 때까지 기다려 주세요.';push();
}
function liveRank(){
  const a=racers.slice().sort((p,q)=>{
    if(p.fin&&q.fin)return p.rank-q.rank;
    if(p.fin!==q.fin)return p.fin?-1:1;
    return q.x-p.x;
  });
  a.forEach((r,k)=>r.cur=k+1);
  return a;
}

function updateCam(dt){
  if(manual){camX+=(mt-camX)*Math.min(1,dt*10);return;}
  let lead=0;
  for(const r of racers)lead=Math.max(lead,Math.min(r.x,TRACK));
  const t=Math.max(0,Math.min(lead-W*.58,TRACK-W*.75));
  camX+=(t-camX)*Math.min(1,dt*6);
}

function hills(par,base,amp,col,seed){
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,GT);
  for(let x=0;x<=W;x+=20){const wx=x+camX*par;ctx.lineTo(x,base-amp*(Math.sin(wx*.006+seed)*.5+Math.sin(wx*.013+seed*2)*.3+.8));}
  ctx.lineTo(W,GT);ctx.closePath();ctx.fill();
}

function drawVeh(k,t){
  ctx.lineWidth=2;ctx.strokeStyle='#1e2b33';ctx.fillStyle='#1e2b33';
  const wob=Math.sin(t*30)*2;
  if(k==='bike'){ctx.beginPath();ctx.arc(-11,-6,6,0,7);ctx.arc(11,-6,6,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(-11,-6);ctx.lineTo(-2,-18);ctx.lineTo(11,-6);ctx.moveTo(-2,-18);ctx.lineTo(8,-18);ctx.lineTo(11,-6);ctx.stroke();}
  else if(k==='moto'){ctx.beginPath();ctx.arc(-12,-7,7,0,7);ctx.arc(12,-7,7,0,7);ctx.fill();ctx.fillStyle='#c0392b';rr(-12,-20,24,11,4);ctx.fill();ctx.fillStyle='#f4c430';ctx.fillRect(12,-19,4,4);}
  else if(k==='kick'||k==='ekick'){ctx.fillStyle=k==='ekick'?'#2e86de':'#7f8c8d';rr(-12,-5,24,4,2);ctx.fill();ctx.fillStyle='#1e2b33';ctx.beginPath();ctx.arc(-10,-1,3,0,7);ctx.arc(10,-1,3,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(9,-5);ctx.lineTo(8,-30);ctx.stroke();if(k==='ekick'){ctx.fillStyle='#f4c430';ctx.fillRect(-8,-9,10,4);}}
  else if(k==='cart'){ctx.fillStyle='#e67e22';rr(-16,-13,32,9,4);ctx.fill();ctx.fillStyle='#1e2b33';ctx.beginPath();ctx.arc(-11,-3,4.5,0,7);ctx.arc(11,-3,4.5,0,7);ctx.fill();}
  else if(k==='wheel'){ctx.beginPath();ctx.arc(-4,-10,10,0,7);ctx.stroke();ctx.beginPath();ctx.arc(13,-3,3,0,7);ctx.fill();ctx.fillStyle='#34495e';ctx.fillRect(-10,-17,14,3);ctx.fillRect(-11,-31,3,15);}
  else if(k==='jet'){ctx.fillStyle='#7f8c8d';rr(-15,-38,8,17,3);ctx.fill();ctx.fillStyle='#ff9f1c';ctx.beginPath();ctx.moveTo(-14,-21);ctx.lineTo(-8,-21);ctx.lineTo(-11,-8+wob);ctx.fill();}
}
// ---- 로봇: 배터리·부스터·과열 (시뮬레이션) ----
// 배터리는 달리는 동안 닳고, 가득 차면 부스터가 자동 발동(배터리 35 소모). 부스터는 열을 올리고 열이 100이면 과열(2초 반속).
// 배터리 0이면 급정지 후 2.2초 수동 충전. 배터리가 있는 동안은 랜덤 배율 대신 일정 속도(크루즈)를 유지.
// 크루즈 배율은 모드별로 시뮬레이션 평균 순위가 사람과 비슷해지도록 맞춘 값(아이템전은 충전 아이템이 있어 낮춤).
function robotStep(r,dt,gap){
  if(r.chg>0){r.chg-=dt;r.bat=Math.min(100,r.bat+28*dt);r.mult=.5;if(r.chg<=0)say(r,'충전 완료');return 0;}
  if(r.bat<=0){r.bat=0;r.chg=2.2;r.speed*=.3;r.boost=0;say(r,'배터리 방전!');return 0;}
  let m=(mode==='item'?1.06:1.16)+Math.min(gap/450,1)*.28-(gap<1?.08:0);
  if(r.boost>0){r.boost-=dt;m=1.75;r.heat+=dt*35;}
  else if(r.bat>=100&&r.ovh<=0){r.boost=1.3;r.bat-=35;say(r,'부스터!');}
  if(r.ovh>0){r.ovh-=dt;m*=.5;}
  else{if(r.boost<=0)r.heat=Math.max(0,r.heat-dt*14);if(r.heat>=100){r.ovh=2;r.heat=40;r.boost=0;say(r,'과열!');}}
  if(r.boost<=0)r.bat-=dt*3.2;
  r.mult=r.boost>0?1.6:r.ovh>0?.6:1;
  return m;
}
// ---- 로봇 그리기: 금속 몸체, LED 얼굴, 부스터 불꽃, 환호 시 머리 회전·가슴 폭죽 ----
function led(f,now,o){
  const c=f==='hot'||f==='sad'?'#ff6a5a':f==='low'||f==='error'?'#ffd166':'#5ff5c8';
  ctx.fillStyle=c;ctx.strokeStyle=c;ctx.lineWidth=1.1;ctx.lineCap='square';
  const tx=(s)=>{ctx.font='bold 4.3px monospace';ctx.textAlign='center';ctx.fillText(s,0,-43.6);};
  if(f==='reboot'){
    for(let k=0;k<4;k++){if(Math.random()<.6){ctx.globalAlpha=.5;ctx.fillRect(-7,-51+Math.random()*10,14,.8);}}
    ctx.globalAlpha=1;ctx.font='bold 3.2px monospace';ctx.textAlign='center';ctx.fillText('REBOOT',0,-46.5);
    ctx.strokeRect(-5.5,-44.5,11,2.6);ctx.fillRect(-5.5,-44.5,11*Math.max(0,Math.min(1,o.rp||0)),2.6);
  }else if(f==='error'){if(now%0.5<.32)tx('ERROR');}
  else if(f==='low'){ctx.font='bold 3.4px monospace';ctx.textAlign='center';ctx.fillText('LOW',0,-46.5);
    ctx.strokeRect(-4.5,-45,8,3.4);ctx.fillRect(3.5,-44,1,1.4);ctx.fillRect(-4.5,-45,8*((now*.8)%1),3.4);}
  else if(f==='happy'){ctx.beginPath();ctx.moveTo(-4.5,-46.5);ctx.lineTo(-3,-48.5);ctx.lineTo(-1.5,-46.5);ctx.moveTo(1.5,-46.5);ctx.lineTo(3,-48.5);ctx.lineTo(4.5,-46.5);ctx.stroke();ctx.fillRect(-2,-43.5,4,1);}
  else if(f==='hot'){ctx.beginPath();ctx.moveTo(-4.5,-49);ctx.lineTo(-2,-47.5);ctx.lineTo(-4.5,-46);ctx.moveTo(4.5,-49);ctx.lineTo(2,-47.5);ctx.lineTo(4.5,-46);ctx.stroke();ctx.fillRect(-2,-43.5,4,1);}
  else if(f==='sad'){ctx.fillRect(-3.5,-49,1.2,3);ctx.fillRect(2.5,-49,1.2,3);const u=(now*1.5)%1;ctx.fillRect(-3.5,-45.5+u*4,1.2,1.2);ctx.fillRect(-2,-42.5,4,.9);}
  else if(f==='focus'){ctx.fillRect(-4,-47.5,3,1.2);ctx.fillRect(1.5,-47.5,3,1.2);ctx.fillRect(-1.5,-43.5,3,.9);}
  else{const bl=(now%3.2)<.12;ctx.fillRect(-4,bl?-47:-48.5,2.2,bl?.6:2.2);ctx.fillRect(2,bl?-47:-48.5,2.2,bl?.6:2.2);ctx.fillRect(-2,-43.6,4,.9);}
  ctx.lineCap='round';
}
function robotBody(P,r,o,f,now){
  const metal='#b4c0ca',dark='#7d8a95',joint='#4b5863';
  for(let s=0;s<2;s++){
    const lg=P.legs[s],kn=fk(HIPS[s],-14,lg.t,LEG,lg.t-lg.k,LEG),e=limb(HIPS[s],-14,lg.t,LEG,lg.t-lg.k,LEG,5,s?dark:shade('#7d8a95',.3));
    ctx.fillStyle=joint;ctx.beginPath();ctx.arc(kn[0],kn[1],1.8,0,7);ctx.fill();rr(e[0]-3,e[1]-2.4,8.5,3.6,1);ctx.fill();
  }
  ctx.save();ctx.translate(0,-14);ctx.rotate(P.lean);ctx.translate(0,14);
  limb(-1.5,-29,P.arms[0].u,ARM1,P.arms[0].u+P.arms[0].f,ARM2,4,shade(metal,.35));
  if(o.boost>0){const fl=9+Math.random()*7;ctx.fillStyle='#ff9f1c';ctx.beginPath();ctx.moveTo(-8,-28);ctx.lineTo(-8-fl,-24);ctx.lineTo(-8,-20);ctx.fill();
    ctx.fillStyle='#ffe08a';ctx.beginPath();ctx.moveTo(-8,-26.5);ctx.lineTo(-8-fl*.55,-24);ctx.lineTo(-8,-21.5);ctx.fill();}
  ctx.fillStyle=metal;rr(-8,-34,16,21,3);ctx.fill();
  ctx.fillStyle=r.color;rr(-5,-30,10,8,2);ctx.fill();
  const ht=Math.min(1,(o.heat||0)/100);ctx.fillStyle='rgb('+Math.round(80+175*ht)+','+Math.round(220-170*ht)+',90)';ctx.beginPath();ctx.arc(0,-18,1.6,0,7);ctx.fill();
  if(o.ovh>0){ctx.fillStyle='rgba(255,70,40,'+(.25+.15*Math.sin(now*14))+')';rr(-8,-34,16,21,3);ctx.fill();}
  // 머리(환호 때 360도 회전)
  ctx.save();ctx.translate(0,-45);ctx.rotate(P.head+(o.cheer?(now*6)%(Math.PI*2):0));ctx.translate(0,45);
  ctx.strokeStyle=joint;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0,-53);ctx.lineTo(0,-57.5);ctx.stroke();
  ctx.fillStyle=(now*2)%1<.5?r.color:'#fff';ctx.beginPath();ctx.arc(0,-58.5,1.7,0,7);ctx.fill();
  ctx.fillStyle=metal;rr(-9,-53,18,15,4);ctx.fill();
  ctx.fillStyle='#0f1a20';rr(-7,-51,14,11,2);ctx.fill();
  led(f,now,o);
  ctx.restore();
  const hand=limb(1.5,-29,P.arms[1].u,ARM1,P.arms[1].u+P.arms[1].f,ARM2,4,metal);
  ctx.fillStyle=joint;ctx.beginPath();ctx.arc(hand[0],hand[1],1.8,0,7);ctx.fill();
  // 환호: 가슴에서 폭죽
  if(o.cheer){for(let k=0;k<8;k++){const u=(now*1.4+(k%2)*.5)%1,a=k*Math.PI/4+(k%2)*.4,rad=3+u*18;
    ctx.globalAlpha=1-u;ctx.fillStyle=COLORS[k%COLORS.length];ctx.beginPath();ctx.arc(Math.cos(a)*rad,-26+Math.sin(a)*rad,1.4,0,7);ctx.fill();}ctx.globalAlpha=1;}
  ctx.restore();
}
function drawBattery(x,y,r){
  const b=Math.max(0,Math.min(100,r.bat))/100;
  ctx.fillStyle='rgba(255,255,255,.85)';rr(x,y,16,8,2);ctx.fill();
  ctx.strokeStyle=r.heat>70||r.ovh>0?'#e4572e':'#1e2b33';ctx.lineWidth=1.3;rr(x,y,16,8,2);ctx.stroke();
  ctx.fillStyle='#1e2b33';ctx.fillRect(x+16,y+2.5,2,3);
  ctx.fillStyle=b>.5?'#2fb67c':b>.2?'#f2b705':'#e4572e';ctx.fillRect(x+1.5,y+1.5,13*b,5);
  if(r.chg>0&&performance.now()%600<350){ctx.fillStyle='#1e2b33';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText('⚡',x+8,y+7.5);}
}
// ---- 캐릭터 동작: 관절(허벅지·정강이, 위팔·아래팔) + 반동·기울기 + 상태별 포즈 + 나이/개성 걸음 + 부가 효과 ----
// 각도는 '아래 방향'이 0, 앞(+x)이 양수. 정강이 = 허벅지 - 무릎(뒤로 접힘), 아래팔 = 위팔 + 팔꿈치(앞으로 접힘)
const LEG=7,ARM1=6.2,ARM2=5.8,HIPS=[-2,2];
const AGEP={c:{cad:1.25,stride:.8,knee:1.1,arm:1.15,lean:.06,bob:1.3},a:{cad:1,stride:1,knee:1,arm:1,lean:.14,bob:1},e:{cad:.9,stride:.5,knee:.55,arm:.35,lean:.28,bob:.45},r:{cad:1,stride:.85,knee:.6,arm:.55,lean:.05,bob:.25}};
function shade(hex,f){const v=parseInt(hex.slice(1),16),ch=s=>Math.round(((v>>s)&255)*(1-f));return 'rgb('+ch(16)+','+ch(8)+','+ch(0)+')';}
function lerp(a,b,w){return a+(b-a)*w;}
function fk(x,y,a1,l1,a2,l2){const kx=x+Math.sin(a1)*l1,ky=y+Math.cos(a1)*l1;return[kx,ky,kx+Math.sin(a2)*l2,ky+Math.cos(a2)*l2];}
function limb(x,y,a1,l1,a2,l2,w,col){const p=fk(x,y,a1,l1,a2,l2);ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(p[0],p[1]);ctx.lineTo(p[2],p[3]);ctx.stroke();return[p[2],p[3]];}
function footY(lg,s){return fk(HIPS[s],-14,lg.t,LEG,lg.t-lg.k,LEG)[3];}
function pose(legs,arms,o){return Object.assign({legs:legs,arms:arms,lean:0,lift:0,rot:0,sx:1,sy:1,head:0},o||{});}
function gait(phi,p){
  const A=.55*p.stride,legs=[],arms=[];
  for(let s=0;s<2;s++){
    const psi=phi+s*Math.PI,sn=Math.sin(psi),cs=Math.cos(psi);
    legs.push({t:A*sn,k:.15+1.15*p.knee*Math.max(0,cs)+.3*Math.max(0,-cs)*(1-Math.abs(sn))});
    arms.push({u:-.85*p.arm*sn,f:1.2+.3*Math.max(0,sn)});
  }
  return pose(legs,arms);
}
function mixPose(a,b,w){
  const m=(x,y)=>lerp(x,y,w);
  return{legs:a.legs.map((l,i)=>({t:m(l.t,b.legs[i].t),k:m(l.k,b.legs[i].k)})),arms:a.arms.map((l,i)=>({u:m(l.u,b.arms[i].u),f:m(l.f,b.arms[i].f)})),
    lean:m(a.lean,b.lean),lift:m(a.lift,b.lift),rot:m(a.rot,b.rot),sx:m(a.sx,b.sx),sy:m(a.sy,b.sy),head:m(a.head,b.head)};
}
function face(f,tilt){
  ctx.save();ctx.translate(0,-34);ctx.rotate(tilt);ctx.translate(0,34);
  ctx.strokeStyle='#1e2b33';ctx.fillStyle='#1e2b33';ctx.lineWidth=1.6;
  if(f==='cry'){
    ctx.beginPath();ctx.moveTo(1,-42);ctx.lineTo(4,-41);ctx.moveTo(5,-42);ctx.lineTo(8,-41);ctx.stroke();
    ctx.beginPath();ctx.arc(5,-34,2.4,Math.PI*1.1,Math.PI*1.9);ctx.stroke();
    ctx.fillStyle='#4fc3f7';
    for(let k=0;k<2;k++){const u=((performance.now()/320+k*.5)%1);ctx.beginPath();ctx.arc(3+k*4.5,-40+u*14,1.8,0,7);ctx.fill();}
  }else if(f==='x'){
    ctx.beginPath();ctx.moveTo(1,-43);ctx.lineTo(4,-40);ctx.moveTo(4,-43);ctx.lineTo(1,-40);ctx.moveTo(5,-43);ctx.lineTo(8,-40);ctx.moveTo(8,-43);ctx.lineTo(5,-40);ctx.stroke();
    ctx.beginPath();ctx.arc(5,-35,2,0,7);ctx.stroke();
  }else if(f==='happy'){
    ctx.beginPath();ctx.arc(2.5,-41,1.6,Math.PI,0);ctx.moveTo(9.1,-41);ctx.arc(7.5,-41,1.6,0,Math.PI,true);ctx.stroke();
    ctx.beginPath();ctx.arc(5,-37.5,3.2,.05*Math.PI,.95*Math.PI);ctx.fill();
  }else if(f==='focus'){
    ctx.beginPath();ctx.arc(3,-41,1.4,0,7);ctx.arc(7.5,-41,1.4,0,7);ctx.fill();
    ctx.beginPath();ctx.moveTo(3,-36);ctx.lineTo(7.5,-36);ctx.stroke();
  }else{
    ctx.beginPath();ctx.arc(3,-41,1.4,0,7);ctx.arc(7.5,-41,1.4,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(5,-38,2.6,.15*Math.PI,.85*Math.PI);ctx.stroke();
  }
  ctx.restore();
}
// o: ph(걸음 위상), run, stun, cry, sad, cheer, veh, t, ready(카운트다운), h(점프 높이), act('push'|'pull'), actT, sprint, wx/wd(월드 좌표: 먼지용)
function drawPerson(px,py,r,o){
  const el=r.age==='e',ch=r.age==='c',fe=r.gender==='f',v=o.veh;
  const seat=v==='moto'||v==='cart'||v==='wheel',ride=v==='bike'||v==='kick'||v==='ekick';
  const hair=el?'#d8d8d8':HAIR[r.i%HAIR.length],skin=SKIN[r.i%SKIN.length];
  const an=anim[r.i]||(anim[r.i]={kind:'',prev:null,cur:null,w:1,hair:.3,hv:0,prevLift:0,prevCos:[1,1],prevH:0,land:0});
  const q=quirks[r.i]||{stride:1,arm:1,lean:1,cad:1},ap=AGEP[r.age]||AGEP.a;
  const gp={stride:ap.stride*q.stride*(o.sprint?1.15:1),knee:ap.knee,arm:ap.arm*q.arm*(o.sprint?1.15:1)};
  const lean0=ap.lean*q.lean*(o.sprint?1.4:1);
  const robo=r.age==='r',ph0=(o.ph||0)*ap.cad*q.cad,STEP=Math.PI/4;
  // 로봇은 위상을 45도 단위로 끊어 '틱틱' 끊기는 기계식 걸음
  const phi=robo?Math.round(ph0/STEP)*STEP:ph0,now=performance.now()/1000,h=o.h||0;
  // 착지 감지: 공중에 있다가 내려오면 0.22초 찌그러짐
  if(an.prevH>3&&h<=.5){an.land=.22;if(robo&&o.wx!==undefined){shake=Math.max(shake,.18);for(let k=0;k<10;k++)dust.push({x:o.wx+R(-8,8),d:o.wd,y:1,vx:R(-120,120),vy:R(40,120),r:R(.8,1.6),a:1,c:k%2?'#ffb020':'#ffe08a',g:1});}}an.prevH=h;an.land=Math.max(0,an.land-fdt);
  // ---- 상태별 포즈 ----
  let kind,P,f='n';
  if(o.sad){kind='sad';P=pose([{t:-.05,k:.1},{t:.08,k:.12}],[{u:1.9,f:1.9},{u:2.1,f:1.8}],{rot:.14,lean:.1});f='cry';}
  else if(o.cheer){kind='cheer';const w=Math.sin(now*10)*.15;P=pose([{t:-.06,k:.06},{t:.06,k:.06}],[{u:2.8+w,f:.15},{u:3-w,f:.1}],{lean:-.06});f='happy';}
  else if(o.stun){kind='stun';const s=Math.sin(now*9);P=pose([{t:-.12,k:.12},{t:.14,k:.18}],[{u:-.25+.1*s,f:.2},{u:.28-.1*s,f:.25}],{rot:Math.sin(now*11)*.16,lean:-.05});f='x';}
  else if(seat){kind='seat';P=pose([{t:1.25,k:1.35},{t:1.4,k:1.4}],[{u:1.1,f:.25},{u:1.25,f:.2}],{lean:.18,lift:-5});f=o.sprint?'focus':'n';}
  else if(v==='jet'){kind='jet';const s=Math.sin(now*6)*.12;P=pose([{t:.15+s,k:.45},{t:.3-s,k:.5}],[{u:.5,f:.9},{u:.7,f:.8}],{lean:.3});f='focus';}
  else if(o.ready){kind='ready';P=pose([{t:-.55,k:.85},{t:.8,k:1.55}],[{u:-.75,f:.5},{u:.55,f:1.3}],{lean:.6,lift:-3.2+.35*Math.sin(now*5)});f='focus';}
  else if(h>2&&!v){kind='jump';const a=Math.min(1,h/30);P=mixPose(gait(phi,gp),pose([{t:.75,k:1.9},{t:1,k:1.75}],[{u:2.2,f:.45},{u:2.6,f:.3}],{lean:.08}),a);}
  else if(o.run){
    kind=ride?'ride':'run';
    P=gait(phi,ride?{stride:.6,knee:.8,arm:.2}:gp);
    if(ride){P.arms=[{u:1.15,f:.3},{u:1.3,f:.25}];P.lean=.2;}
    else{
      P.lean=lean0;
      // 반동: 디딘 발이 땅에 붙게 맞추고, 두 발이 뜨는 순간 살짝 떠오름. 머리는 반 박자 늦게 끄덕임
      const m=Math.max(footY(P.legs[0],0),footY(P.legs[1],1));
      P.lift=m+ap.bob*3.2*Math.max(0,(Math.abs(Math.sin(phi))-.55)/.45);
      P.head=.07*ap.bob*Math.cos(2*phi-.9);
    }
    if(o.act==='push'){const e=Math.min(1,(.4-(o.actT||0))/.12);P.arms=[{u:lerp(P.arms[0].u,1.45,e),f:lerp(P.arms[0].f,.05,e)},{u:lerp(P.arms[1].u,1.55,e),f:lerp(P.arms[1].f,0,e)}];P.lean+=.15*e;f='focus';}
    else if(o.act==='pull'){P.arms=[{u:1.2,f:.9},{u:1.35,f:.8}];P.lean-=.12;f='focus';}
    else if(o.cry)f='cry';
    else if(o.sprint)f='focus';
    if(o.act)kind+='-'+o.act;
  }else{kind='stand';const b=Math.sin(now*2.4);P=pose([{t:-.05,k:.06},{t:.06,k:.08}],[{u:-.1+.03*b,f:.25},{u:.12-.03*b,f:.3}],{lift:.3*b,lean:el?.2:0});}
  if(o.cry&&!o.sad&&f==='n')f='cry';
  if(robo){
    if(kind==='stun')P.rot=(Math.random()-.5)*.05;
    f=o.stun?'reboot':o.chg>1.5?'error':o.chg>0?'low':o.ovh>0?'hot':o.cheer?'happy':(o.sad||f==='cry')?'sad':(o.boost>0||f==='focus')?'focus':'n';
    if(o.chg>0&&kind!=='stun'){P=pose([{t:-.05,k:.08},{t:.06,k:.1}],[{u:-.1,f:.2},{u:.1,f:.2}],{lean:-.03,lift:-1});}
  }
  if(an.land>0){const s=Math.sin(Math.PI*(1-an.land/.22));P.sy*=1-.18*s;P.sx*=1+.12*s;P.lift-=2.5*s;}
  // 상태가 바뀌면 0.15초 동안 이전 자세에서 이어짐
  if(kind!==an.kind){an.prev=an.cur;an.w=an.prev?0:1;an.kind=kind;}
  an.w=Math.min(1,an.w+fdt/.15);
  if(an.w<1&&an.prev)P=Object.assign(mixPose(an.prev,P,an.w),{});
  an.cur=P;
  // 머리카락 스프링: 몸이 튀면 반대로 처지고, 빠를수록 뒤로 날림
  const lv=(P.lift-an.prevLift)/Math.max(fdt,1e-3);an.prevLift=P.lift;
  const spd=o.run?(o.sprint?1.5:1):0,target=.15+.55*spd+lv*.012;
  an.hv+=(140*(target-an.hair)-11*an.hv)*Math.min(fdt,.05);an.hair+=an.hv*Math.min(fdt,.05);
  const sc=1.15*(ch?.82:1);
  // 속도선: 질주 중 몸 뒤로
  if(o.sprint&&o.run&&!seat){
    ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2;
    for(let k=0;k<3;k++){const u=(now*2.3+k*.37+r.i*.13)%1;ctx.globalAlpha=(1-u)*.7;const y=py-(12+k*13)*sc,x0=px-16*sc-u*40;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0-(14+k*6),y);ctx.stroke();}
    ctx.globalAlpha=1;
  }
  ctx.save();ctx.translate(px,py);ctx.scale(sc,sc);ctx.lineCap='round';
  if(v)drawVeh(v,o.t||0);
  ctx.translate(0,-({bike:6,moto:7,cart:6,wheel:5}[v]||0));
  ctx.translate(0,-P.lift);ctx.rotate(P.rot);ctx.scale(P.sx,P.sy);
  let feet=[],hand=[0,0];
  if(robo)robotBody(P,r,o,f,now);else{
  // 다리: 뒤쪽은 한 톤 어둡게
  for(let s=0;s<2;s++){
    const lg=P.legs[s],e=limb(HIPS[s],-14,lg.t,LEG,lg.t-lg.k,LEG,4.5,s?'#2c3e50':shade('#34495e',.35));
    ctx.fillStyle=s?'#1e2b33':'#1b2730';ctx.beginPath();ctx.ellipse(e[0]+1.6,e[1],4.5,2,(lg.t-lg.k)*-.35,0,7);ctx.fill();feet.push(e);
  }
  ctx.save();ctx.translate(0,-14);ctx.rotate(P.lean);ctx.translate(0,14);
  limb(-1.5,-29,P.arms[0].u,ARM1,P.arms[0].u+P.arms[0].f,ARM2,3.5,shade(skin,.22));
  if(fe){ctx.save();ctx.translate(-8,-45);ctx.rotate(an.hair);ctx.fillStyle=hair;rr(-4,0,8,20,3);ctx.fill();ctx.restore();}
  ctx.fillStyle=r.color;rr(-7,-33,14,19,5);ctx.fill();
  if(fe){const fl=o.run&&!seat?2+2.5*Math.abs(Math.sin(2*phi))+(o.sprint?1.5:0):0;
    ctx.beginPath();ctx.moveTo(-7,-17);ctx.lineTo(7,-17);ctx.lineTo(11+fl*.6,-7+fl*.15);ctx.lineTo(-11-fl*1.4,-7-fl*.5);ctx.closePath();ctx.fill();}
  ctx.save();ctx.translate(0,-34);ctx.rotate(P.head);ctx.translate(0,34);
  ctx.fillStyle=skin;ctx.beginPath();ctx.arc(0,-42,8.5,0,7);ctx.fill();
  ctx.fillStyle=hair;ctx.beginPath();ctx.arc(0,-43,9,Math.PI*1.02,Math.PI*1.98);ctx.fill();ctx.fillRect(-9,-44,5,5);
  ctx.restore();
  face(f,P.head);
  hand=limb(1.5,-29,P.arms[1].u,ARM1,P.arms[1].u+P.arms[1].f,ARM2,3.5,skin);
  ctx.restore();
  }
  // 어르신 지팡이(걸어갈 때만): 앞손에서 땅까지
  if(el&&!v&&!o.sad&&!o.cheer){
    const a=P.lean,hx=hand[0]*Math.cos(a)-(hand[1]+14)*Math.sin(a),hy=hand[0]*Math.sin(a)+(hand[1]+14)*Math.cos(a)-14;
    ctx.strokeStyle='#6b4a2f';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+3.5,P.lift/P.sy);ctx.stroke();
  }
  ctx.restore();
  // 흙먼지: 발이 땅을 딛는 순간(허벅지가 뒤로 가기 시작) 월드 좌표에 생성
  // 과열·재부팅 연기
  if(robo&&o.wx!==undefined&&(o.ovh>0||o.stun)&&fdt>0&&Math.random()<fdt*14&&dust.length<300)dust.push({x:o.wx+R(-6,6),d:o.wd,y:52*sc,vx:R(-25,-5),vy:R(25,45),r:R(2,3.5),a:.9,c:'#8d99a3',g:-1});
  if(o.wx!==undefined&&o.run&&!v&&!robo&&h<=.5&&fdt>0){
    for(let s=0;s<2;s++){const cs=Math.cos(phi+s*Math.PI);
      if(an.prevCos[s]>0&&cs<=0&&dust.length<300)for(let k=0;k<3;k++)dust.push({x:o.wx+feet[s][0]*sc,d:o.wd,y:0,vx:-R(20,70),vy:R(10,35),r:R(1.5,3),a:1});
      an.prevCos[s]=cs;}
  }
}

function bubble(x,y,t){
  ctx.font='16px Jua,sans-serif';const w=ctx.measureText(t).width+20,h=28,bx=Math.max(4,Math.min(W-w-4,x-w/2)),tx=Math.max(bx+12,Math.min(bx+w-12,x));
  ctx.fillStyle='#fff';ctx.strokeStyle='#1e2b33';ctx.lineWidth=2;
  rr(bx,y-h,w,h,12);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(tx-6,y-1);ctx.lineTo(tx,y+8);ctx.lineTo(tx+6,y-1);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillRect(tx-5,y-3,10,3);
  ctx.fillStyle='#1e2b33';ctx.textAlign='center';ctx.fillText(t,bx+w/2,y-9);
}
function podiumStep(dt){
  if(pt>2.9)for(let k=0;k<3;k++)conf.push({x:R(0,W),y:-10,vx:R(-40,40),vy:R(90,170),c:COLORS[Math.floor(R(0,8))],a:R(0,6)});
  for(const c of conf){c.x+=c.vx*dt;c.y+=c.vy*dt;c.a+=dt*5;}
  conf=conf.filter(c=>c.y<H+10);
}
let sp=null;
// 조명 세기: t0초부터 0.6초 페이드인 → 4.5초 유지 → 0.6초 페이드아웃 후 전체 컬러로 복귀
function spotA(t0){const FI=.6,HOLD=4.5;return Math.min((pt-t0)/FI,(t0+FI+HOLD+FI-pt)/FI);}
function spotlight(cx,cy,rad,a){
  a=Math.max(0,Math.min(1,a));if(a<=0)return;
  const e=1-(1-a)*(1-a);
  if(!sp)sp=document.createElement('canvas');
  if(sp.width!==W||sp.height!==H){sp.width=W;sp.height=H;}
  const s=sp.getContext('2d');s.clearRect(0,0,W,H);s.drawImage(cv,0,0);
  ctx.save();ctx.globalAlpha=e;
  if('filter' in ctx){ctx.filter='grayscale(1) brightness(.55)';ctx.drawImage(sp,0,0);ctx.filter='none';}
  else{ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,0,W,H);}
  ctx.restore();
  const z=1+.25*e,r=rad*(.85+.15*e)*z;
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.clip();
  ctx.translate(cx,cy);ctx.scale(z,z);ctx.drawImage(sp,-cx,-cy);
  ctx.restore();
  ctx.save();ctx.globalAlpha=e;ctx.strokeStyle='#fff6c8';ctx.lineWidth=4;ctx.shadowColor='#ffd166';ctx.shadowBlur=18;
  ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.stroke();ctx.restore();
}
let podBub=null,lastBub=null;
function drawPodium(){
  podBub=null;lastBub=null;
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#26325c');g.addColorStop(1,'#6f86c9');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.07)';
  for(const lx of [W/4,W/2,W*.75]){const c=W/2,q=W/4,mid=lx===c;ctx.beginPath();ctx.moveTo(lx-14,0);ctx.lineTo(lx+14,0);ctx.lineTo(lx+120*(lx-c)/q+(mid?70:0),370);ctx.lineTo(lx-120*(c-lx)/q-(mid?70:0),370);ctx.fill();}
  ctx.fillStyle='#3b2f3f';ctx.fillRect(0,360,W,H-360);
  ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='36px Jua,sans-serif';ctx.fillText('시상식',W/2,48);
  const dx=Math.min(150,W*.23),slots=[{x:W/2,h:100,c:'#f4c430',d:2.2},{x:W/2-dx,h:70,c:'#c0c6cc',d:1.4},{x:W/2+dx,h:50,c:'#cd7f32',d:.6}];
  slots.forEach((sl,k)=>{
    const r=fin[k];if(!r)return;
    const top=360-sl.h;
    ctx.fillStyle=sl.c;rr(sl.x-62,top,124,sl.h+4,6);ctx.fill();
    ctx.fillStyle='#1e2b33';ctx.font='20px Jua,sans-serif';ctx.fillText((k+1)+'위',sl.x,top+26);
    const a=pt-sl.d;if(a<0||(n>1&&r===fin[n-1]))return;
    const u=Math.min(1,a/.7);
    let off=-320*(1-u)*(1-u);
    if(a>.7)off-=Math.abs(Math.sin((a-.7)*9))*Math.max(0,1-(a-.7)*1.4)*16;
    drawPerson(sl.x,top+off,r,{cheer:a>.7,run:false});
    if(a>.7){
      ctx.font='19px Jua,sans-serif';const tw=ctx.measureText(r.name).width+16;
      ctx.fillStyle=r.color;rr(sl.x-tw/2,top+off-80,tw,22,10);ctx.fill();
      ctx.fillStyle=ink(r.color);ctx.fillText(r.name,sl.x,top+off-63);
      if(k===0){ctx.font='30px sans-serif';ctx.fillText('🏆',sl.x+30,top+off-20);podBub={x:sl.x,y:top+off-88};}
    }
  });
  if(n>1&&fin[n-1]){
    const r=fin[n-1],u=Math.min(1,Math.max(0,(pt-.2)/1.6)),x=-40+130*u,walk=u<1;
    ctx.fillStyle='#2a3350';ctx.beginPath();ctx.moveTo(0,200);ctx.lineTo(150,372);ctx.lineTo(0,372);ctx.fill();
    if(!walk&&r.age!=='r'){ctx.fillStyle='rgba(79,195,247,.5)';ctx.beginPath();ctx.ellipse(x+6,374,Math.max(0,Math.min(34,(pt-1.8)*14)),6,0,0,7);ctx.fill();}
    drawPerson(x,372,r,{run:walk,ph:pt*14,cry:true,sad:!walk});
    // 꼴찌: 이름표 '이름(꼴등)' + 말풍선(조명 효과 위에 그리도록 위치만 기억)
    if(!walk){
      const lb=r.name+'(꼴등)';ctx.textAlign='center';ctx.font='17px Jua,sans-serif';const tw=ctx.measureText(lb).width+16;
      ctx.fillStyle=r.color;rr(x-tw/2,372-98,tw,22,10);ctx.fill();ctx.fillStyle=ink(r.color);ctx.fillText(lb,x,372-81);
      lastBub={x:x,y:372-106,t:r.age==='r'?'삐빅… 패배 감지':'흑흑…'};
    }
  }
  for(const c of conf){ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.a);ctx.fillStyle=c.c;ctx.fillRect(-4,-2,8,4);ctx.restore();}
  // 응원 포커스: 1등 원함이면 1위, 꼴등 원함이면 꼴찌에게 컬러 조명, 나머지는 흑백
  if(want==='first'&&fin[0])spotlight(W/2,360-100-40,72,spotA(3.4));
  else if(want==='last'&&n>1&&fin[n-1])spotlight(100,330,86,spotA(2.4));
  if(podBub&&winLine)bubble(podBub.x,podBub.y,winLine);
  if(lastBub)bubble(lastBub.x,lastBub.y,lastBub.t);
  if(betMsg&&pt>3){ctx.textAlign='center';ctx.font='22px Jua,sans-serif';ctx.fillStyle='#ffd166';ctx.fillText(betMsg,W/2,H-14);}
}
function draw(){
  if(state==='podium'){drawPodium();return;}
  if(state==='idle'){drawPreview();return;}
  if(shake>0){shake-=fdt;ctx.save();ctx.translate(R(-3,3)*shake*5,R(-3,3)*shake*5);drawRace();ctx.restore();}
  else drawRace();
}
// 시작 전 미리보기: 배경·지도 등은 흐리게, 트랙 라인과 캐릭터만 선명하게
function drawPreview(){
  if(!pv){
    const rs=racers;racers=[];drawRace();racers=rs;
    pv=document.createElement('canvas');pv.width=W;pv.height=H;
    const p=pv.getContext('2d');
    p.fillStyle='#d5e9e6';p.fillRect(0,0,W,H);
    if('filter' in p)p.filter='blur(6px)';
    p.drawImage(cv,0,0);p.filter='none';
    p.fillStyle='rgba(255,255,255,.28)';p.fillRect(0,0,W,H);
  }
  ctx.drawImage(pv,0,0);
  const top=GT,bot=GT+GD+20;
  ctx.strokeStyle='#fff';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(0,top);ctx.lineTo(W,top);ctx.moveTo(0,bot);ctx.lineTo(W,bot);ctx.stroke();
  ctx.fillStyle='#fff';ctx.fillRect(OFF-3,top,6,bot-top);
  // 레인 구분선
  const gap=n>1?(GD-22)/(n-1):0;
  ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1;ctx.setLineDash([6,6]);ctx.beginPath();
  for(let k=1;k<n;k++){const y=GT+16+10+(k-.5)*gap+4;ctx.moveTo(0,y);ctx.lineTo(W,y);}
  ctx.stroke();ctx.setLineDash([]);
  const fs=Math.max(11,Math.min(15,gap-2));
  for(const r of racers.slice().sort((a,b)=>a.d-b.d)){
    const base=GT+16+r.d;
    ctx.fillStyle='rgba(30,43,51,.25)';ctx.beginPath();ctx.ellipse(OFF,base+4,13,4,0,0,7);ctx.fill();
    drawPerson(OFF,base,r,{run:false});
  }
  // 이름표는 발 높이 오른쪽, 레인 번호는 출발선 왼쪽 (겹침 방지)
  ctx.font=fs+'px Jua,sans-serif';
  for(const r of racers){
    const y=GT+16+r.d+4,ln=(lanes[r.i]??r.i)+1;
    ctx.textAlign='center';ctx.fillStyle='#1e2b33';ctx.fillText(String(ln),24,y);
    const tw=ctx.measureText(r.name).width+12;
    ctx.fillStyle=r.color;rr(OFF+20,y-fs+1,tw,fs+3,6);ctx.fill();
    ctx.textAlign='left';ctx.fillStyle=ink(r.color);ctx.fillText(r.name,OFF+26,y);
  }
  ctx.textAlign='center';ctx.font='26px Jua,sans-serif';ctx.lineWidth=5;ctx.strokeStyle='#fff';ctx.fillStyle='#1e2b33';
  ctx.strokeText('시작을 누르면 출발!',W/2,GT-60);ctx.fillText('시작을 누르면 출발!',W/2,GT-60);
}
function drawRace(){
  const g=ctx.createLinearGradient(0,0,0,GT);g.addColorStop(0,'#bfe3f2');g.addColorStop(1,'#eaf5ee');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  hills(.2,GT-40,50,'#b4d6b0',1);
  hills(.45,GT-6,40,'#8fc08f',3);
  ctx.fillStyle='#7fb069';ctx.fillRect(0,GT-14,W,16);
  ctx.fillStyle='#e3d3a6';ctx.fillRect(0,GT,W,GD+20);
  ctx.fillStyle='rgba(30,43,51,.08)';ctx.fillRect(0,GT+GD+20-6,W,6);
  ctx.fillStyle='rgba(255,255,255,.35)';
  const s0=Math.floor((camX-OFF)/160)*160;
  for(let wx=Math.max(0,s0);wx<camX+W;wx+=160)ctx.fillRect(wx-camX+OFF,GT,3,GD+20);
  let sx=-camX+OFF;
  ctx.fillStyle='#fff';ctx.fillRect(sx-3,GT,6,GD+20);
  sx=TRACK-camX+OFF;
  if(sx>-30&&sx<W+30){for(let k=0;k<(GD+20)/10;k++)for(let c=0;c<3;c++){ctx.fillStyle=(k+c)%2?'#1e2b33':'#fff';ctx.fillRect(sx-15+c*10,GT+k*10,10,10);}}
  for(const t of traps){
    const tx=t.x-camX+OFF;if(tx<-40||tx>W+40)continue;
    if(t.type==='pit'){
      ctx.fillStyle='#2b1d14';ctx.fillRect(tx-24,GT,48,GD+20);
      ctx.fillStyle='#4a3524';ctx.fillRect(tx-24,GT,5,GD+20);ctx.fillRect(tx+19,GT,5,GD+20);
    }else{
      ctx.fillStyle='#8c2f2f';
      for(let k=0;k<Math.floor(GD/38);k++){const by=GT+30+k*38;for(let c=-1;c<=1;c++){ctx.beginPath();ctx.moveTo(tx+c*12-7,by+4);ctx.lineTo(tx+c*12,by-16);ctx.lineTo(tx+c*12+7,by+4);ctx.fill();}}
    }
  }
  ctx.font='16px Jua,sans-serif';ctx.textAlign='left';
  // map
  const mx0=70,mx1=W-60,my=10,mh=26,mw=mx1-mx0;
  ctx.fillStyle='rgba(255,255,255,.75)';rr(mx0-6,my-4,mw+12,mh+8,8);ctx.fill();
  ctx.fillStyle='#7fb069';ctx.fillRect(mx0,my,mw,5);
  ctx.fillStyle='#e3d3a6';ctx.fillRect(mx0,my+5,mw,mh-5);
  for(const t of traps){ctx.fillStyle=t.type==='pit'?'#2b1d14':'#8c2f2f';ctx.fillRect(mx0+t.x/TRACK*mw-1.5,my+5,3,mh-5);}
  ctx.fillStyle='#f4c430';for(const b of boxes)ctx.fillRect(mx0+b.x/TRACK*mw-1,my+7+b.d/GD*10,2,2);
  for(let k=0;k<4;k++){ctx.fillStyle=k%2?'#1e2b33':'#fff';ctx.fillRect(mx1-4,my+k*6.5,4,6.5);}
  const vx=mx0+(camX-OFF)/TRACK*mw,vw=W/TRACK*mw;
  ctx.strokeStyle='#1e2b33';ctx.lineWidth=2;ctx.strokeRect(vx,my-2,vw,mh+4);
  for(const r of racers){
    const px=mx0+Math.min(r.x/TRACK,1)*mw,py=my+9+r.d/GD*(mh-14);
    ctx.fillStyle=r.color;ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(px,py,4.5,0,7);ctx.fill();ctx.stroke();
  }
  ctx.fillStyle='#1e2b33';ctx.font='15px Jua,sans-serif';ctx.textAlign='left';ctx.fillText('지도',16,my+19);ctx.fillText('도착',mx1+12,my+19);
  for(const b of boxes){
    if(b.t>0)continue;
    const x=b.x-camX+OFF;if(x<-30||x>W+30)continue;
    const y=GT+16+b.d-6;
    ctx.fillStyle='rgba(30,43,51,.2)';ctx.beginPath();ctx.ellipse(x,y+2,10,3,0,0,7);ctx.fill();
    const by=y-26+Math.sin(performance.now()/300+b.x)*3;
    ctx.fillStyle='#f4c430';rr(x-11,by,22,22,5);ctx.fill();ctx.strokeStyle='#1e2b33';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#1e2b33';ctx.font='17px Jua,sans-serif';ctx.textAlign='center';ctx.fillText('?',x,by+17);
  }
  ctx.font='20px sans-serif';ctx.textAlign='center';
  for(const b of bananas){ctx.fillText('🍌',b.x-camX+OFF,GT+16+b.d);}
  // 흙먼지
  for(const p of dust){p.x+=p.vx*fdt;p.y+=p.vy*fdt;p.vy-=(p.g===1?260:p.g===-1?0:60)*fdt;if(p.y<0)p.y=0;p.a-=fdt*(p.g===-1?.9:1.8);p.r+=fdt*(p.g===1?0:3);}
  dust=dust.filter(p=>p.a>0);
  ctx.fillStyle='#c9b483';
  for(const p of dust){const x=p.x-camX+OFF;if(x<-20||x>W+20)continue;ctx.globalAlpha=p.a*.7;ctx.fillStyle=p.c||'#c9b483';ctx.beginPath();ctx.arc(x,GT+16+p.d-p.y,p.r,0,7);ctx.fill();}
  ctx.globalAlpha=1;
  liveRank();
  const order=racers.slice().sort((a,b)=>a.d-b.d);
  for(const r of order){
    const px=r.x-camX+OFF;
    if(px<-60||px>W+60)continue;
    const base=GT+16+r.d,py=base-r.h;
    ctx.fillStyle='rgba(30,43,51,.25)';ctx.beginPath();ctx.ellipse(px,base+4,13-r.h/6,4,0,0,7);ctx.fill();
    const cry=(r.fin&&r.rank===n&&n>1)||(!r.fin&&(state==='run'||state==='replay')&&r.cur===n&&(r.x>TRACK-1800||fin.length>=n-1));
    const stop=r.fin&&r.speed<20;
    drawPerson(px,py,r,{ph:r.x*.09,stun:r.stun>0,cry:cry,run:r.stun<=0&&!stop,veh:r.veh&&r.veh.k,t:clock,
      ready:state==='count',h:r.h,act:r.act>0?r.ak:'',actT:r.act,sprint:!r.fin&&r.mult>1.2&&(state==='run'||state==='replay'),
      cheer:stop&&r.rank<=3,wx:r.x,wd:r.d,bat:r.bat,heat:r.heat,boost:r.boost,ovh:r.ovh,chg:r.chg,rp:r.stun>0?1-r.stun/3.6:0});
    if(r.item){ctx.font='20px sans-serif';ctx.textAlign='center';ctx.fillStyle='#000';ctx.fillText(ITEMS.find(i=>i.k===r.item.k).e,px,py-88);}
    ctx.textAlign='center';ctx.font='14px Jua,sans-serif';
    if(r.fin){ctx.fillStyle='#1e2b33';ctx.font='18px Jua,sans-serif';ctx.fillText(r.rank+'위',px,py-66);
      const tn=state==='replay'?rp:rt;if(r.rank===1&&winLine&&tn-r.time<3.5){bubble(px,py-90,winLine);ctx.textAlign='center';}}
    else{
      const tw=Math.max(34,ctx.measureText(r.name).width+14);
      ctx.fillStyle=r.color;rr(px-tw/2,py-79,tw,17,8);ctx.fill();
      ctx.fillStyle=ink(r.color);ctx.fillText(r.name,px,py-66);
      if(r.age==='r')drawBattery(px+tw/2+3,py-79,r);ctx.textAlign='center';ctx.font='14px Jua,sans-serif';
      if(r.stun>0){ctx.fillStyle='#b8860b';for(let k=0;k<3;k++){const a=clock*6+k*2.1;ctx.fillText('★',px+Math.cos(a)*14,py-58+Math.sin(a)*4);}}
      else if(state==='run'||state==='replay'){
        if(r.mult>1.2){ctx.fillStyle='#16895a';ctx.fillText('▲',px+26,py-30);}
        else if(r.mult<.8){ctx.fillStyle='#c0392b';ctx.fillText('▼',px+26,py-30);}
      }
    }
  }
  for(const o of portals){const x=o.x-camX+OFF,y=GT+16+o.d-18;ctx.globalAlpha=Math.min(1,o.t*2);ctx.strokeStyle=o.c;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(x,y,9,24,0,0,7);ctx.stroke();}
  for(const o of bolts){
    ctx.globalAlpha=Math.min(1,o.t*3);ctx.strokeStyle='#f4c430';ctx.lineWidth=3;ctx.beginPath();
    const x0=o.a.x-camX+OFF,y0=GT+16+o.a.d-30,x1=o.b.x-camX+OFF,y1=GT+16+o.b.d-30;
    ctx.moveTo(x0,y0);for(let k=1;k<8;k++)ctx.lineTo(x0+(x1-x0)*k/8,y0+(y1-y0)*k/8+(k%2?-9:9));
    ctx.lineTo(x1,y1);ctx.stroke();
  }
  ctx.globalAlpha=1;
  // grab lines
  for(const r of racers){
    if(r.pull){const a=r.x-camX+OFF,b=r.pull.v.x-camX+OFF;ctx.strokeStyle='#1e2b33';ctx.lineWidth=3;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(a,GT+16+r.d-20);ctx.lineTo(b,GT+16+r.pull.v.d-20);ctx.stroke();ctx.setLineDash([]);}
  }
  // effects
  ctx.font='19px Jua,sans-serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#fff';
  for(const f of fx){const x=f.x-camX+OFF,y=GT+16+f.d-70-f.t*24;ctx.globalAlpha=1-f.t;ctx.strokeText(f.s,x,y);ctx.fillStyle='#1e2b33';ctx.fillText(f.s,x,y);}
  ctx.globalAlpha=1;
  // live ranking
  const lr=liveRank();
  // 실시간 순위: 10명 초과 시 2열
  if(lr.length){
    const cols=lr.length>10?2:1,rows=Math.ceil(lr.length/cols),cw=160,x0=W-12-cw*cols;
    ctx.fillStyle='rgba(255,255,255,.78)';rr(x0,42,cw*cols,rows*21+12,10);ctx.fill();
    ctx.font='16px Jua,sans-serif';ctx.textAlign='left';
    lr.forEach((r,k)=>{
      const cx=x0+Math.floor(k/rows)*cw,y=42+22+(k%rows)*21;
      ctx.fillStyle='#1e2b33';ctx.fillText(String(k+1),cx+10,y);
      ctx.fillStyle=r.color;ctx.beginPath();ctx.arc(cx+40,y-5,6,0,7);ctx.fill();
      ctx.fillStyle='#1e2b33';ctx.fillText(r.name+(r.fin?' 도착':''),cx+52,y);
    });
  }
  if(state==='replay'&&!rec&&!exporting){
    const dur=frames[frames.length-1].t;
    ctx.fillStyle='rgba(192,57,43,.92)';rr(14,44,112,26,8);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='16px Jua,sans-serif';ctx.textAlign='left';ctx.fillText('● REPLAY',26,62);
    ctx.fillStyle='#c0392b';ctx.fillRect(0,H-5,W*Math.min(1,rp/dur),5);
  }
  if(banner&&banner.t>0){
    ctx.fillStyle='rgba(30,43,51,.25)';ctx.fillRect(0,0,W,H);
    ctx.textAlign='center';ctx.font='64px Jua,sans-serif';ctx.lineWidth=8;ctx.strokeStyle='#1e2b33';ctx.fillStyle='#fff';
    ctx.strokeText(banner.s,W/2,H/2);ctx.fillText(banner.s,W/2,H/2);
  }
  if(state==='count'){
    ctx.fillStyle='rgba(30,43,51,.5)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='120px Jua,sans-serif';
    ctx.fillText(String(Math.max(1,Math.ceil(cd))),W/2,H/2+40);
  }
}

function loop(ts){
  if(dead)return;
  const dt=Math.min(.05,(ts-last)/1000||0);last=ts;
  let sc=1;
  if(slowT>0){slowT-=dt;sc=.28;}
  if(banner)banner.t-=dt;
  if(state==='count'){cd-=dt;if(cd<=0){state='run';clock=0;rt=0;msg='경주 중…';push();}}
  else if(state==='run'){rt+=dt;update(dt*sc);if(state==='run')record();}
  else if(state==='podium'){pt+=dt;podiumStep(dt);}
  else if(state==='replay'){
    if(!exporting){
      rp+=dt;while(rk<frames.length-1&&frames[rk+1].t<=rp)rk++;
      applyFrame(frames[rk]);
      if(rp>frames[frames.length-1].t+.5)endReplay();
    }
  }
  fdt=dt*(state==='run'?sc:1);
  if(state!=='replay'&&((state!=='idle'&&state!=='podium')||manual))updateCam(dt);
  draw();
  raf=requestAnimationFrame(loop);
}

function finish(){
  state='podium';pt=0;conf=[];
  betMsg='';
  // 결과 산출: 원하는 순위(1등/꼴등)에 해당하는 캐릭터 발표
  {const r=want==='first'?fin[0]:fin[fin.length-1];if(r)betMsg='결과 산출 · '+(want==='first'?'1등':'꼴등')+': '+r.name;}
  result={bet:betMsg,
    rank:fin.map(r=>({pos:r.rank+'위',color:r.color,name:r.name,right:r.time.toFixed(2)+'초'}))};
  msg=fin[0].name+'이(가) 우승했습니다!';
  push();
}

function setN(v){
  if(rec&&rec.state==='recording'){rec.onstop=null;rec.stop();}
  rec=null;exporting=false;
  const nn=Math.max(2,Math.min(MAXN,v));
  if(nn!==n||lanes.length!==nn)lanes=Array.from({length:nn},(_,k)=>k);
  n=nn;
  state='idle';result=null;
  msg=mode==='item'?'아이템전: ?박스를 먹으면 탈것·무기·함정이 랜덤으로! 시작을 눌러주세요.':HINT;
  setup();push();
}
function start(){
  if(state==='run'||state==='count')return;
  if(state==='replay')endReplay();
  if(state==='done'||state==='podium')setup();
  result=null;state='count';cd=3;
  msg='곧 출발합니다…';push();
}
function setCfg(i,p){
  Object.assign(cfg[i],p);
  const r=racers[i];if(r){r.name=cfg[i].name;r.color=cfg[i].color;r.gender=cfg[i].gender;r.age=cfg[i].age;}
  push();
}
function toggleReplay(){
  if(state==='replay')endReplay();else if(state==='podium'||state==='done')startReplay();
  push();
}
let drag=false;
function seek(e){
  const b=cv.getBoundingClientRect(),x=(e.clientX-b.left)*W/b.width;
  const f=Math.max(0,Math.min(1,(x-70)/(W-130)));
  mt=Math.max(0,Math.min(TRACK-W*.75,f*TRACK-W/2+OFF));manual=true;push();
}
L('pointerdown',e=>{
  const b=cv.getBoundingClientRect(),y=(e.clientY-b.top)*cv.height/b.height;
  if(y<=46&&state!=='podium'&&state!=='replay'&&state!=='idle'){drag=true;cv.setPointerCapture(e.pointerId);seek(e);}
});
L('pointermove',e=>{if(drag)seek(e);});
L('pointerup',()=>{drag=false;});
L('pointercancel',()=>{drag=false;});
setN(4);
raf=requestAnimationFrame(loop);
return{
  setN:setN,start:start,reset:()=>setN(n),setCfg:setCfg,toggleReplay:toggleReplay,
  setMode:m=>{mode=m;setN(n);},
  shuffleLanes:()=>{if(state==='count'||state==='run')return;shuffle(lanes);if(state==='idle')setup();
    msg='출발 자리를 섞었습니다: '+lanes.map((s,i)=>[s,cfg[i].name]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]).join(' · ');push();},
  resetLanes:()=>{if(state==='count'||state==='run')return;lanes=lanes.map((_,k)=>k);if(state==='idle')setup();msg='출발 자리를 원래대로 되돌렸습니다.';push();},
  setWant:w=>{want=w;push();},
  follow:()=>{manual=false;push();},
  exportGif:exportGif,exportVideo:exportVideo,saveReady:saveReady,
  destroy:()=>{dead=true;cancelAnimationFrame(raf);ac.abort();if(rec&&rec.state==='recording'){rec.onstop=null;rec.stop();}}
};
}
