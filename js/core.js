// Tempo, datas e formatação, compartilhados pelas duas páginas. Depende de data.js.
const NOW=2026,C=100,Y0=-10000,Y1=2026,Z0=1700,GAP=24;
// Escala logarítmica dos anos até hoje: prog(y) vai de 0 em 10 mil a.C. a 1 em 2025.
const u=y=>Math.log(NOW-y+C),U0=u(Y0),U1=u(2025);
const prog=y=>(U0-u(y))/(U0-U1);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,k)=>a+(b-a)*k;
function rnd(seed){let s=seed*9301+49297;return()=>((s=(s*9301+49297)%233280)/233280);}
// Pontos da linha a partir de M. preT: instantes da pré-história; timeOf: ano -> segundo da animação.
function makePoints(preT,timeOf){
const P=M.map((m,i)=>({yr:m[0],n:m[1],r:m[2]||0,d:m[3]||'',wiki:m[4]||'',img:m[5]||'',pre:m[0]<Y0,i,X:0,Y:0,t:0}));
const np=P.filter(p=>p.pre).length;if(np!==preT.length)console.warn('PRE_T precisa de '+np+' tempos e tem '+preT.length);
retime(P,preT,timeOf);
P.forEach(p=>{const r=rnd(p.i+1),n=p.r?40:16;p.sp=[];for(let k=0;k<n;k++){const an=r()*Math.PI*2,s=(p.r?240:130)*(.4+r());p.sp.push([Math.cos(an)*s,Math.sin(an)*s,.5+r()*.8]);}});
return P;}
function retime(P,preT,timeOf){let k=0;P.forEach(p=>{p.t=p.pre?preT[k++]:timeOf(p.yr);});}
// Ano exibido no instante t. Trava no ano de cada descoberta no momento da explosão, fica parado
// por HOLD do intervalo e então rola até a próxima, chegando nela exatamente. end: quando chega a NOW.
const HOLD=.4;
function yearOfT(P,t,end){
if(t<=P[0].t)return P[0].yr;
let a=P[0],b=null;for(const p of P){if(p.t<=t)a=p;else{b=p;break;}}
if(!b)b={t:end,yr:NOW};
if(t>=b.t)return b.yr;
const k=clamp(((t-a.t)/(b.t-a.t)-HOLD)/(1-HOLD),0,1);
return NOW+C-Math.exp(lerp(u(a.yr),u(b.yr),k));}
// "1 milhão", "2,3 milhões".
const millions=v=>{const s=(v/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1});return s+(s==='1'?' milhão':' milhões');};
function fmtYear(y){const ago=NOW-y;if(ago>=1e6)return'há '+millions(ago)+' de anos';if(ago>=12000)return'há '+Math.round(ago/1000).toLocaleString('pt-BR')+' mil anos';if(y<0)return Math.round(-y).toLocaleString('pt-BR')+' a.C.';return Math.max(1,Math.floor(y))+' d.C.';}
const fmtShort=y=>y<Y0?fmtYear(y):y<0?Math.round(-y).toLocaleString('pt-BR')+' a.C.':String(Math.floor(y));
const colOf=p=>p.r===1?'#FFD27A':'#E9E3D3';
