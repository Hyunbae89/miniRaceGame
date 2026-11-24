// 레이스 게임 엔진: 캔버스 렌더링과 게임 로직. UI 상태는 ui.onChange 콜백으로만 내보냅니다.

export function createGame(cv,ui){
const ctx=cv.getContext('2d');
const W=window.innerWidth<700?560:960,H=420,GT=232,GD=152,TRACK=6500,OFF=60,JT=.6;
const COLORS=['#e4572e','#2e86de','#f2b705','#2fb67c','#8e5ad6','#ef6aa1','#17a2b8','#5b6770'];
const R=(a,b)=>a+Math.random()*(b-a);
let raf=0,dead=false,msg='',result=null;
const ac=new AbortController();
const L=(t,f)=>cv.addEventListener(t,f,{signal:ac.signal});
function push(){ui.onChange({state:state,msg:msg,n:n,mode:mode,manual:manual,canReplay:frames.length>=2&&(state==='podium'||state==='done'||state==='replay'),replaying:state==='replay',busy:!!(rec||exporting),file:ready?ready.name:null,result:result,pick:pickI,want:want,locked:state==='count'||state==='run',cfg:cfg.map(c=>Object.assign({},c))});}
const HINT='인원을 정하고 시작을 누르세요. 밀치고 잡아당기며 순위가 계속 바뀝니다. 구덩이와 가시에 걸리면 스턴!';
let n=4,racers=[],fin=[],traps=[],fx=[],state='idle',clock=0,camX=0,cd=0,endWait=0,last=0;
let boxes=[],bananas=[],portals=[],bolts=[],mode='normal';
let frames=[],bk=null,rp=0,rk=0,rec=null,exporting=false,ready=null,pickI=-1,want='first',betMsg='';
let rt=0,slowT=0,banner=null,manual=false,mt=0,pt=0,conf=[];
const cfg=COLORS.map((c,i)=>({name:(i+1)+'번',color:c,gender:i%2?'f':'m',age:'a'}));
const ITEMS=[{k:'jet',n:'제트팩',e:'🚀',m:2,t:2.2},{k:'moto',n:'오토바이',e:'🏍️',m:1.75,t:3.4},{k:'bike',n:'자전거',e:'🚲',m:1.35,t:4},{k:'wheel',n:'휠체어',e:'♿',m:1.2,t:5},{k:'cart',n:'카트',e:'🏎️',m:1.55,t:3},{k:'kick',n:'킥보드',e:'🛴',m:1.3,t:4},{k:'ekick',n:'전동 킥보드',e:'🛴',m:1.65,t:3},{k:'portal',n:'포탈건',e:'🌀'},{k:'banana',n:'바나나',e:'🍌'},{k:'stun',n:'스턴건',e:'🔫'}];
function ink(c){const v=parseInt(c.slice(1),16);return ((v>>16)*.299+((v>>8)&255)*.587+(v&255)*.114)>150?'#1e2b33':'#fff';}
const SKIN=['#f5d0b0','#e8b98f','#c68c5c','#8d5a3b','#f2c9a5','#d9a273','#b07548','#f5d0b0'];
const HAIR=['#2b1d14','#5a3a22','#c9a227','#1e2b33','#8a2b1b','#2b1d14','#6b4a2f','#111'];

function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function say(r,t){fx.push({x:r.x,d:r.d,t:0,s:t});}

function setup(){
  cv.width=W;cv.height=H;
  racers=[];fin=[];fx=[];traps=[];camX=0;clock=0;endWait=0;rt=0;slowT=0;banner=null;manual=false;
  boxes=[];bananas=[];portals=[];bolts=[];frames=[];ready=null;betMsg='';
  if(mode==='item'){let bx=R(900,1100);while(bx<TRACK-500){for(const d of [20,57,94,131])boxes.push({x:bx,d:d,t:0});bx+=R(650,950);}}
  let x=R(700,850);
  while(x<TRACK-400){traps.push({x:x,type:(traps.length>=2&&Math.random()<.17)?'pit':'spike'});x+=R(450,800);}
  for(let i=0;i<n;i++){
    const d=n>1?10+i*(130/(n-1)):70;
    racers.push({i:i,name:cfg[i].name,color:cfg[i].color,gender:cfg[i].gender,age:cfg[i].age,veh:null,item:null,x:0,d:d,td:d,vd:0,kx:0,speed:0,base:R(215,232),mult:1,change:0,skill:R(.6,.9),dd:{},jt:-1,h:0,stun:0,inv:0,slow:0,cool:R(.5,1.5),pull:null,out:false,why:'',fall:0,fin:false,rank:0,time:0,cur:i+1});
  }
}

function update(dt){
  clock+=dt;
  const act=racers.filter(r=>!r.out&&!r.fin);
  let lead=0;for(const r of act)lead=Math.max(lead,r.x);
  for(const r of racers){
    if(r.out){r.fall+=dt*140;continue;}
    if(r.fin){r.speed*=Math.pow(.03,dt);r.x+=r.speed*dt;continue;}
    r.cool-=dt;r.inv-=dt;r.slow-=dt;
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
      if(r.slow>0)m*=.55;if(r.veh)m*=r.veh.m;
      r.speed+=(r.base*m-r.speed)*Math.min(1,dt*4);
    }
    r.x+=(r.speed+r.kx)*dt;r.kx*=Math.pow(.02,dt);if(r.x<0)r.x=0;
    if(r.pull){r.pull.t-=dt;const v=r.pull.v;if(r.pull.t<=0||v.out||v.fin)r.pull=null;else{r.x+=150*dt;v.x-=150*dt;if(v.x<0)v.x=0;}}
    // depth steering
    if(Math.random()<dt*.7)r.td=R(8,GD-6);
    const st=Math.max(-60*dt,Math.min(60*dt,r.td-r.d));
    r.d+=st+r.vd*dt;r.vd*=Math.pow(.01,dt);
    for(const o of racers){if(o!==r&&!o.out&&Math.abs(o.x-r.x)<22&&Math.abs(o.d-r.d)<12)r.d+=(r.d>=o.d?1:-1)*45*dt;}
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
      if(r.jt>=0){r.jt+=dt;if(r.jt>=JT){r.jt=-1;r.h=0;}else r.h=Math.sin(Math.PI*r.jt/JT)*42;}
      if(r.veh&&r.veh.k==='jet')r.h=26+Math.sin(clock*8)*3;else if(r.jt<0)r.h=0;
      // trap hit
      if(r.inv<=0&&r.h<14){
        for(const t of traps){
          if(Math.abs(r.x-t.x)<22){
            if(t.type==='pit'){r.stun=2.4;r.speed=0;r.kx=0;r.inv=3;r.jt=-1;r.h=0;r.pull=null;say(r,'풍덩!');}
            else{r.stun=1.6;r.speed=0;r.kx=0;r.inv=2.4;r.jt=-1;r.h=0;say(r,'스턴!');}
            break;
          }
        }
      }
    }
    if(!r.out&&r.x>=TRACK){r.fin=true;fin.push(r);r.rank=fin.length;r.time=rt;r.pull=null;if(r.rank<=3){slowT=1.4;banner={t:1.4,s:r.rank+'위 '+r.name};}}
  }
  if(mode==='item'){
    for(const b of boxes)if(b.t>0)b.t-=dt;
    for(const b of bananas)b.g-=dt;
    for(const r of racers){
      if(r.fin)continue;
      if(r.veh){r.veh.t-=dt;if(r.veh.t<=0)r.veh=null;}
      if(!r.item&&r.stun<=0)for(const b of boxes)if(b.t<=0&&Math.abs(b.x-r.x)<20&&Math.abs(b.d-r.d)<20){b.t=6;const it=ITEMS[Math.floor(R(0,ITEMS.length))];r.item={k:it.k,d:R(.5,1.2),life:5};say(r,it.e+it.n);break;}
      if(r.item&&r.stun<=0){r.item.d-=dt;if(r.item.d<=0)useItem(r);}
      if(r.inv<=0&&r.h<14&&r.stun<=0)for(let k=0;k<bananas.length;k++){const b=bananas[k];if(b.g<=0&&Math.abs(b.x-r.x)<16&&Math.abs(b.d-r.d)<18){bananas.splice(k,1);r.stun=1.2;r.speed=0;r.inv=1.5;r.jt=-1;r.h=0;say(r,'미끄덩!');break;}}
    }
  }
  // shoving and grabbing
  for(const a of racers){
    if(a.out||a.fin||a.stun>0||a.cool>0)continue;
    let v=null,bd=1e9;
    for(const o of racers){
      if(o===a||o.out||o.fin)continue;
      const dx=o.x-a.x,dd=o.d-a.d;
      if(Math.abs(dx)<44&&Math.abs(dd)<26){const s=Math.abs(dx)+Math.abs(dd);if(s<bd){bd=s;v=o;}}
    }
    if(v&&Math.random()<dt*2.2){
      a.cool=R(1.3,2.3);
      if(v.x-a.x>8&&Math.random()<.4&&!a.pull){a.pull={v:v,t:.8};v.slow=.5;say(a,'잡아당기기!');}
      else if(v.veh&&v.veh.k==='wheel'){a.kx-=120;say(v,'끄떡없음!');}else{v.kx-=240;v.vd+=(v.d===a.d?(Math.random()<.5?-1:1):(v.d<a.d?-1:1))*90;a.kx+=100;v.slow=.4;say(a,'밀치기!');}
    }
  }
  for(const f of fx)f.t+=dt;for(const o of portals)o.t-=dt;for(const o of bolts)o.t-=dt;portals=portals.filter(o=>o.t>0);bolts=bolts.filter(o=>o.t>0);
  fx=fx.filter(f=>f.t<1);
  if(racers.every(r=>r.fin||r.out)){endWait+=dt;if(endWait>1.3)finish();}
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
    r:racers.map(r=>({i:r.i,name:r.name,color:r.color,gender:r.gender,age:r.age,x:r.x,d:r.d,h:r.h,speed:r.speed,mult:r.mult,stun:r.stun,veh:r.veh?{k:r.veh.k}:null,item:r.item?{k:r.item.k}:null,fin:r.fin,rank:r.rank,out:false,fall:0,cur:r.cur,pt:r.pull?racers.indexOf(r.pull.v):-1})),
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
    if(p.out!==q.out)return p.out?1:-1;
    if(p.fin&&q.fin)return p.rank-q.rank;
    if(p.fin!==q.fin)return p.fin?-1:1;
    return q.x-p.x;
  });
  a.forEach((r,k)=>r.cur=k+1);
  return a;
}

function updateCam(dt){
  if(manual){camX+=(mt-camX)*Math.min(1,dt*10);return;}
  let lead=-1;
  for(const r of racers)if(!r.out)lead=Math.max(lead,Math.min(r.x,TRACK));
  if(lead<0)for(const r of racers)lead=Math.max(lead,r.x);
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
function drawPerson(px,py,r,o){
  const el=r.age==='e',ch=r.age==='c',fe=r.gender==='f',v=o.veh;
  const still=v==='moto'||v==='cart'||v==='wheel'||v==='jet';
  const sw=(o.run&&!still)?Math.sin(o.ph||0):0,ar=el?sw*.35:sw;
  const hair=el?'#d8d8d8':HAIR[r.i];
  ctx.save();ctx.translate(px,py);const sc=1.15*(ch?.82:1);ctx.scale(sc,sc);ctx.lineCap='round';
  if(v)drawVeh(v,o.t||0);
  ctx.translate(0,-({bike:6,moto:7,cart:6,wheel:5}[v]||0));
  if(el)ctx.rotate(.09);
  if(o.sad)ctx.rotate(.14);
  ctx.strokeStyle='#2c3e50';ctx.lineWidth=4.5;
  ctx.beginPath();ctx.moveTo(-3,-14);ctx.lineTo(-3+sw*8,-1);ctx.moveTo(3,-14);ctx.lineTo(3-sw*8,-1);ctx.stroke();
  ctx.fillStyle='#1e2b33';ctx.beginPath();ctx.ellipse(-2+sw*8,0,4.5,2,0,0,7);ctx.ellipse(4-sw*8,0,4.5,2,0,0,7);ctx.fill();
  if(fe){ctx.fillStyle=hair;rr(-12,-45,8,20,3);ctx.fill();}
  ctx.strokeStyle=SKIN[r.i];ctx.lineWidth=3.5;ctx.beginPath();
  if(o.cheer){ctx.moveTo(-6,-29);ctx.lineTo(-11,-43);ctx.moveTo(6,-29);ctx.lineTo(11,-43);}
  else if(o.sad){ctx.moveTo(-6,-29);ctx.lineTo(0,-38);ctx.moveTo(6,-29);ctx.lineTo(5,-37);}
  else if(o.stun){ctx.moveTo(-6,-29);ctx.lineTo(-9,-18);ctx.moveTo(6,-29);ctx.lineTo(9,-18);}
  else{ctx.moveTo(-6,-29);ctx.lineTo(-6-ar*9,-20);ctx.moveTo(6,-29);ctx.lineTo(6+ar*9,-20);}
  ctx.stroke();
  ctx.fillStyle=r.color;rr(-7,-33,14,19,5);ctx.fill();
  if(fe){ctx.beginPath();ctx.moveTo(-7,-17);ctx.lineTo(7,-17);ctx.lineTo(11,-7);ctx.lineTo(-11,-7);ctx.fill();}
  ctx.fillStyle=SKIN[r.i];ctx.beginPath();ctx.arc(0,-42,8.5,0,7);ctx.fill();
  ctx.fillStyle=hair;ctx.beginPath();ctx.arc(0,-43,9,Math.PI*1.02,Math.PI*1.98);ctx.fill();ctx.fillRect(-9,-44,5,5);
  if(el){ctx.strokeStyle='#6b4a2f';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(10,-22);ctx.lineTo(7,-24);ctx.stroke();}
  ctx.strokeStyle='#1e2b33';ctx.fillStyle='#1e2b33';ctx.lineWidth=1.6;
  if(o.cry){
    ctx.beginPath();ctx.moveTo(1,-42);ctx.lineTo(4,-41);ctx.moveTo(5,-42);ctx.lineTo(8,-41);ctx.stroke();
    ctx.beginPath();ctx.arc(5,-34,2.4,Math.PI*1.1,Math.PI*1.9);ctx.stroke();
    ctx.fillStyle='#4fc3f7';
    for(let k=0;k<2;k++){const u=((performance.now()/320+k*.5)%1);ctx.beginPath();ctx.arc(3+k*4.5,-40+u*14,1.8,0,7);ctx.fill();}
  }else if(o.stun){
    ctx.beginPath();ctx.moveTo(1,-43);ctx.lineTo(4,-40);ctx.moveTo(4,-43);ctx.lineTo(1,-40);ctx.moveTo(5,-43);ctx.lineTo(8,-40);ctx.moveTo(8,-43);ctx.lineTo(5,-40);ctx.stroke();
    ctx.beginPath();ctx.arc(5,-35,2,0,7);ctx.stroke();
  }else{
    ctx.beginPath();ctx.arc(3,-41,1.4,0,7);ctx.arc(7.5,-41,1.4,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(5,-38,2.6,.15*Math.PI,.85*Math.PI);ctx.stroke();
  }
  ctx.restore();
}
function podiumStep(dt){
  if(pt>2.9)for(let k=0;k<3;k++)conf.push({x:R(0,W),y:-10,vx:R(-40,40),vy:R(90,170),c:COLORS[Math.floor(R(0,8))],a:R(0,6)});
  for(const c of conf){c.x+=c.vx*dt;c.y+=c.vy*dt;c.a+=dt*5;}
  conf=conf.filter(c=>c.y<H+10);
}
function drawPodium(){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#26325c');g.addColorStop(1,'#6f86c9');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.07)';
  for(const lx of [W/4,W/2,W*.75]){const c=W/2,q=W/4,mid=lx===c;ctx.beginPath();ctx.moveTo(lx-14,0);ctx.lineTo(lx+14,0);ctx.lineTo(lx+120*(lx-c)/q+(mid?70:0),370);ctx.lineTo(lx-120*(c-lx)/q-(mid?70:0),370);ctx.fill();}
  ctx.fillStyle='#3b2f3f';ctx.fillRect(0,360,W,60);
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
      if(k===0){ctx.font='30px sans-serif';ctx.fillText('🏆',sl.x+30,top+off-20);}
    }
  });
  if(n>1&&fin[n-1]){
    const r=fin[n-1],u=Math.min(1,Math.max(0,(pt-.2)/1.6)),x=-40+130*u,walk=u<1;
    ctx.fillStyle='#2a3350';ctx.beginPath();ctx.moveTo(0,200);ctx.lineTo(150,372);ctx.lineTo(0,372);ctx.fill();
    if(!walk){ctx.fillStyle='rgba(79,195,247,.5)';ctx.beginPath();ctx.ellipse(x+6,374,Math.max(0,Math.min(34,(pt-1.8)*14)),6,0,0,7);ctx.fill();}
    drawPerson(x,372,r,{run:walk,ph:pt*14,cry:true,sad:!walk});
    if(!walk){ctx.textAlign='center';ctx.font='17px Jua,sans-serif';ctx.fillStyle='#fff';ctx.fillText('흑흑… '+r.name+' ('+n+'위)',x+10,290);}
  }
  if(betMsg&&pt>3){ctx.textAlign='center';ctx.font='22px Jua,sans-serif';ctx.fillStyle='#ffd166';ctx.fillText(betMsg,W/2,406);}
  for(const c of conf){ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.a);ctx.fillStyle=c.c;ctx.fillRect(-4,-2,8,4);ctx.restore();}
}
function draw(){
  if(state==='podium'){drawPodium();return;}
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
      for(let k=0;k<4;k++){const by=GT+30+k*38;for(let c=-1;c<=1;c++){ctx.beginPath();ctx.moveTo(tx+c*12-7,by+4);ctx.lineTo(tx+c*12,by-16);ctx.lineTo(tx+c*12+7,by+4);ctx.fill();}}
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
  liveRank();
  const order=racers.slice().sort((a,b)=>a.d-b.d);
  for(const r of order){
    const px=r.x-camX+OFF;
    if(px<-60||px>W+60)continue;
    const base=GT+16+r.d,py=base-r.h;
    ctx.fillStyle='rgba(30,43,51,.25)';ctx.beginPath();ctx.ellipse(px,base+4,13-r.h/6,4,0,0,7);ctx.fill();
    const cry=(r.fin&&r.rank===n&&n>1)||(!r.fin&&(state==='run'||state==='replay')&&r.cur===n&&(r.x>TRACK-1800||fin.length>=n-1));
    drawPerson(px,py,r,{ph:r.x*.09,stun:r.stun>0,cry:cry,run:r.stun<=0&&!(r.fin&&r.speed<20),veh:r.veh&&r.veh.k,t:clock});
    if(pickI===r.i&&state!=='podium'){ctx.fillStyle='#f4c430';ctx.strokeStyle='#1e2b33';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px-7,py-106);ctx.lineTo(px+7,py-106);ctx.lineTo(px,py-95);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#1e2b33';ctx.font='13px Jua,sans-serif';ctx.textAlign='center';ctx.fillText(want==='first'?'1등!':'꼴등!',px,py-110);}
    if(r.item){ctx.font='20px sans-serif';ctx.textAlign='center';ctx.fillStyle='#000';ctx.fillText(ITEMS.find(i=>i.k===r.item.k).e,px,py-88);}
    ctx.textAlign='center';ctx.font='14px Jua,sans-serif';
    if(r.fin){ctx.fillStyle='#1e2b33';ctx.font='18px Jua,sans-serif';ctx.fillText(r.rank+'위',px,py-66);}
    else{
      const tw=Math.max(34,ctx.measureText(r.name).width+14);
      ctx.fillStyle=r.color;rr(px-tw/2,py-79,tw,17,8);ctx.fill();
      ctx.fillStyle=ink(r.color);ctx.fillText(r.name,px,py-66);
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
  ctx.fillStyle='rgba(255,255,255,.78)';rr(W-172,42,160,n*21+12,10);ctx.fill();
  ctx.font='16px Jua,sans-serif';ctx.textAlign='left';
  lr.forEach((r,k)=>{
    const y=42+22+k*21;
    ctx.fillStyle='#1e2b33';ctx.fillText(r.out?'–':String(k+1),W-162,y);
    ctx.fillStyle=r.color;ctx.beginPath();ctx.arc(W-132,y-5,6,0,7);ctx.fill();
    ctx.fillStyle=r.out?'#7b8a93':'#1e2b33';ctx.fillText(r.out?r.name+' 탈락':r.name+(r.fin?' 도착':''),W-120,y);
  });
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
  if(state!=='replay'&&((state!=='idle'&&state!=='podium')||manual))updateCam(dt);
  draw();
  raf=requestAnimationFrame(loop);
}

function finish(){
  state='podium';pt=0;conf=[];
  betMsg='';
  if(pickI>=0&&racers[pickI]){const r=racers[pickI],ok=want==='first'?r.rank===1:r.rank===n;betMsg='응원 '+(ok?'성공!':'아쉬워요')+' · '+r.name+' '+(want==='first'?'1등':'꼴등')+' 기원 → '+r.rank+'위';}
  result={bet:betMsg,
    rank:fin.map(r=>({pos:r.rank+'위',color:r.color,name:r.name,right:r.time.toFixed(2)+'초'})),
    outs:racers.filter(r=>r.out).map(r=>({color:r.color,name:r.name,right:r.why}))};
  msg=fin.length?(fin[0].name+'이(가) 우승했습니다!'):'모두 탈락했습니다.';
  push();
}

function setN(v){
  if(rec&&rec.state==='recording'){rec.onstop=null;rec.stop();}
  rec=null;exporting=false;
  n=Math.max(2,Math.min(8,v));
  if(pickI>=n)pickI=-1;
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
  if(y<=46&&state!=='podium'&&state!=='replay'){drag=true;cv.setPointerCapture(e.pointerId);seek(e);}
});
L('pointermove',e=>{if(drag)seek(e);});
L('pointerup',()=>{drag=false;});
L('pointercancel',()=>{drag=false;});
setN(4);
raf=requestAnimationFrame(loop);
return{
  setN:setN,start:start,reset:()=>setN(n),setCfg:setCfg,toggleReplay:toggleReplay,
  setMode:m=>{mode=m;setN(n);},
  setPick:i=>{pickI=i;push();},setWant:w=>{want=w;push();},
  follow:()=>{manual=false;push();},
  exportGif:exportGif,exportVideo:exportVideo,saveReady:saveReady,
  destroy:()=>{dead=true;cancelAnimationFrame(raf);ac.abort();if(rec&&rec.state==='recording'){rec.onstop=null;rec.stop();}}
};
}
