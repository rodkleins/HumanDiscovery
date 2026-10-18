// Geometria e desenho no canvas 2D, compartilhados pelas duas páginas. Depende de core.js.
// mob: canvas vertical 1080×1350 com textos maiores; senão 1920×1080.
function geometry(mob){const G=mob?{W:1080,H:1350,L:70,R:760,T:330,B:1130,FS:1.35,SZ:30}:{W:1920,H:1080,L:150,R:1500,T:250,B:880,FS:1,SZ:26};
G.mob=mob;G.PW=Math.round((G.R-G.L)*.185);G.LX=G.L+G.PW+GAP;G.ZW=Math.round((G.R-G.L)*.13);return G;}
// Escalas: F é a escala completa (pré-história log + linear), Z o zoom nos anos a partir de 1700. z de 0 a 1 mistura as duas.
function scales(G,P){const{L,R,T,B,PW,LX,ZW}=G,N=P.length,IZ=P.findIndex(p=>p.yr>=Z0);
const pxF=y=>y<Y0?L+(Math.log(3400000)-Math.log(-y))/(Math.log(3400000)-Math.log(-Y0))*PW:LX+(y-Y0)/(Y1-Y0)*(R-LX);
const pxZ=y=>{const zx=L+ZW+GAP;return y<Z0?L+(pxF(y)-L)/(pxF(Z0)-L)*ZW:zx+(y-Z0)/(Y1-Z0)*(R-zx);};
const pyF=i=>B-(i+1)/N*(B-T);
const pyZ=i=>{const zh=(B-T)*.16;return i<IZ?B-(i+1)/IZ*zh:B-zh-(i-IZ+1)/(N-IZ)*(B-T-zh);};
return{px:(y,z)=>lerp(pxF(y),pxZ(y),z),py:(i,z)=>lerp(pyF(i),pyZ(i),z)};}
const TICKS_F=mob=>mob?[[-10000,'10 mil a.C.'],[-5000,'5 mil a.C.'],[0,'0'],[2026,'2026']]:[[-1e6,'1 milhão'],[-1e5,'100 mil'],[-10000,'10 mil a.C.'],[-8000,'8 mil a.C.'],[-6000,'6 mil a.C.'],[-4000,'4 mil a.C.'],[-2000,'2 mil a.C.'],[0,'0'],[2026,'2026']];
const TICKS_Z=mob=>mob?[[1750,'1750'],[1850,'1850'],[1950,'1950'],[2026,'2026']]:[[1750,'1750'],[1800,'1800'],[1850,'1850'],[1900,'1900'],[1950,'1950'],[2000,'2000'],[2026,'2026']];
function text(g,s,x,y,font,color,align,alpha){g.globalAlpha=clamp(alpha,0,1);g.font=font;g.fillStyle=color;g.textAlign=align||'left';g.fillText(s,x,y);g.globalAlpha=1;}
// Rótulo: nome na cor do tipo e o ano em cinza ao lado.
function lab(g,n,yr,x,y,sz,col,al,a){const ys=fmtShort(yr);g.font='500 '+sz+'px Archivo';const nw=g.measureText(n).width,ysz=Math.round(sz*.8);g.font='400 '+ysz+'px Archivo';const yw=g.measureText(ys).width,gp=sz*.45,w=nw+gp+yw;const x0=al==='left'?x:al==='right'?x-w:x-w/2;text(g,n,x0,y,'500 '+sz+'px Archivo',col,'left',a);text(g,ys,x0+nw+gp,y,'400 '+ysz+'px Archivo','#8A90A0','left',a);}
// Faixa da pré-história, eixo com quebra e marcações. al: opacidade geral.
function drawAxis(g,G,SC,z,al){const{L,R,T,B,PW,ZW,FS,mob}=G,zw=lerp(PW,ZW,z);
g.fillStyle='rgba(94,102,120,'+.06*al+')';g.fillRect(L,T-30,zw+GAP/2,B-T+30);
text(g,z<.5?'pré-história':'antes de 1700',L+zw/2,T-2,'400 '+Math.round(20*FS)+'px Archivo','#6B7285','center',Math.abs(1-2*z)*al);
const b1=L+zw+4,b2=L+zw+GAP-4;g.lineWidth=1;g.strokeStyle='rgba(94,102,120,'+.45*al+')';g.beginPath();g.moveTo(L,B+.5);g.lineTo(b1,B+.5);g.moveTo(b2,B+.5);g.lineTo(R,B+.5);g.stroke();
g.lineWidth=1.5;g.beginPath();g.moveTo(b1,B+8);g.lineTo(b1+8,B-7);g.moveTo(b2-8,B+8);g.lineTo(b2,B-7);g.stroke();
const tk=(list,a)=>{a*=al;if(a<=.01)return;list.forEach(([y,l])=>{const x=SC.px(y,z);g.strokeStyle='rgba(94,102,120,'+.12*a+')';g.lineWidth=1;g.beginPath();g.moveTo(x+.5,T-30);g.lineTo(x+.5,B);g.stroke();text(g,l,x,B+44*FS,'400 '+Math.round(22*FS)+'px Archivo','#6B7285','center',a);});};
tk(TICKS_F(mob),1-z);tk(TICKS_Z(mob),z);}
// Linha acumulada até o instante t, com a ponta interpolada entre dois marcos. Devolve a ponta.
function drawLine(g,P,t){let tip=P[0];if(t<P[0].t)return tip;
g.lineJoin='round';g.lineCap='round';g.lineWidth=3.5;g.strokeStyle='#E9E3D3';g.shadowColor='rgba(255,210,122,.55)';g.shadowBlur=18;
g.beginPath();g.moveTo(P[0].X,P[0].Y);let prev=P[0];
for(let i=1;i<P.length;i++){const p=P[i];if(p.t<=t){g.lineTo(p.X,p.Y);tip=p;prev=p;}else{const k=clamp((t-prev.t)/(p.t-prev.t),0,1);tip={X:prev.X+(p.X-prev.X)*k,Y:prev.Y+(p.Y-prev.Y)*k};g.lineTo(tip.X,tip.Y);break;}}
g.stroke();g.shadowBlur=0;return tip;}
function drawDots(g,done,FS,hl){done.forEach(p=>{const big=hl&&hl(p.i);g.fillStyle=colOf(p);g.beginPath();g.arc(p.X,p.Y,(p.r?6:3.5)*(big?1.6:1)*FS,0,7);g.fill();});}
function drawTip(g,tip,FS){g.fillStyle='#FFD27A';g.shadowColor='#FF8A3D';g.shadowBlur=30;g.beginPath();g.arc(tip.X,tip.Y,5.5*FS,0,7);g.fill();g.shadowBlur=0;}
// Rótulos fixos dos tipos 1 e 2. Antes de 1700 ficam abaixo (revoluções) ou acima (marcos); a imprensa acima e à esquerda.
// Depois de 1700 revoluções à direita da parede e marcos à esquerda (no celular, todos à esquerda), empurrados para cima se colidirem.
function drawLabels(g,G,done,t,la){const{FS,SZ,mob}=G,sides={L:[],R:[]};
const stroke=(p,a)=>{g.strokeStyle=p.r===1?'rgba(255,210,122,'+.6*a+')':'rgba(233,227,211,'+.5*a+')';g.lineWidth=1.5;};
done.forEach(p=>{if(!p.r||p.pre)return;const a=Math.min(1,(t-p.t)*3)*la;
if(p.yr<Z0){let lx,ly,al,l1,l2;
if(p.r===1){lx=p.X;ly=p.Y+44*FS;al='center';l1=[p.X,p.Y+8];l2=[p.X,p.Y+20];}
else if(p.yr<0){lx=p.X;ly=p.Y-26*FS;al='center';l1=[p.X,p.Y-8];l2=[p.X,p.Y-18];}
else{lx=p.X-12;ly=p.Y-26*FS;al='right';l1=[p.X-5,p.Y-6];l2=[p.X-12,p.Y-18];}
stroke(p,a);g.beginPath();g.moveTo(l1[0],l1[1]);g.lineTo(l2[0],l2[1]);g.stroke();
lab(g,p.n,p.yr,lx,ly,SZ,colOf(p),al,a);}
else sides[(mob||p.r!==1)?'L':'R'].push({p,ly:p.Y+SZ*.35,a});});
['L','R'].forEach(s=>{let lim=Infinity;const gp=SZ*1.3;sides[s].sort((a,b)=>b.p.Y-a.p.Y).forEach(o=>{if(o.ly>lim-gp)o.ly=lim-gp;lim=o.ly;const d=s==='R'?1:-1,ax=o.p.X+34*d;
stroke(o.p,o.a);g.beginPath();g.moveTo(o.p.X+10*d,o.p.Y);g.lineTo(ax-6*d,o.ly-SZ*.35);g.stroke();
lab(g,o.p.n,o.p.yr,ax,o.ly,SZ,colOf(o.p),s==='R'?'left':'right',o.a);});});}
// Anel, clarão e faíscas de cada explosão recente.
function drawBursts(g,done,t){done.forEach(p=>{const a=t-p.t,big=p.r>0,life=big?1.8:1;if(a>life)return;const k=a/life,col=p.r===1?'255,210,122':p.r===2?'240,232,215':'255,138,61';
g.strokeStyle='rgba('+col+','+(1-k)*.9+')';g.lineWidth=big?4:2.5;g.beginPath();g.arc(p.X,p.Y,(big?220:70)*Math.pow(k,.5),0,7);g.stroke();
g.fillStyle='rgba('+col+','+(1-k)*.5+')';g.beginPath();g.arc(p.X,p.Y,(big?60:22)*(1-k),0,7);g.fill();
p.sp.forEach(([vx,vy,lf])=>{if(k>lf)return;g.fillStyle='rgba(255,'+(big?220:170)+',120,'+(1-k/lf)+')';g.fillRect(p.X+vx*a,p.Y+vy*a+60*a*a,3,3);});});}
// Intensidade do tremor de tela logo após uma revolução ou marco.
function shakeOf(done,t){let s=0;done.forEach(p=>{const a=t-p.t;if(p.r&&a<.6)s=Math.max(s,(1-a/.6)*(p.r===1?14:9));});return s;}
// Clarão breve na tela inteira após a última revolução ou marco.
function drawFlash(g,G,done,t){const lb=done.filter(p=>p.r).pop();if(lb&&t-lb.t<.35){g.fillStyle='rgba(255,230,190,'+(.2*(1-(t-lb.t)/.35))+')';g.fillRect(-50,-50,G.W+100,G.H+100);}}
// Ano grande e contador no topo.
function drawHUD(g,G,yr,n,fa){const{W,L,mob}=G,cnt=String(n),wd=n===1?'descoberta':'descobertas';
if(mob){text(g,yr,L,130,'400 90px "Instrument Serif"','#E9E3D3','left',fa);text(g,cnt,L,240,'400 72px "Instrument Serif"','#E9E3D3','left',fa);g.font='400 72px "Instrument Serif"';text(g,wd,L+g.measureText(cnt).width+16,240,'400 30px Archivo','#6B7285','left',fa);}
else{text(g,yr,L,170,'400 104px "Instrument Serif"','#E9E3D3','left',fa);text(g,cnt,W-150,160,'400 104px "Instrument Serif"','#E9E3D3','right',fa);text(g,wd,W-150,200,'400 22px Archivo','#6B7285','right',fa);}}
// Legenda grande embaixo com a descoberta mais recente.
function drawCaption(g,G,p,a){lab(g,p.n,p.yr,G.L,G.mob?G.H-70:G.H-56,G.mob?44:40,colOf(p),'left',a);}
function drawIntro(g,G,a){text(g,'Por milhões de anos, quase nada mudou.',G.W/2,G.H/2-40,'400 '+(G.mob?50:64)+'px "Instrument Serif"','#E9E3D3','center',a*.95);}
function drawWhiteFlash(g,G,k){g.fillStyle='rgba(255,240,215,'+k+')';g.fillRect(0,0,G.W,G.H);}
// Fechamento: escurece a tela e mostra as duas frases (a e b são as opacidades de cada uma).
function drawOutro(g,G,a,b){const{W,H,mob}=G;g.fillStyle='rgba(6,8,15,'+Math.min(.82,a)+')';g.fillRect(0,0,W,H);
text(g,'O ritmo nunca foi tão rápido.',W/2,H/2-30,'400 '+(mob?60:76)+'px "Instrument Serif"','#E9E3D3','center',a);
text(g,'E o próximo salto já começou.',W/2,H/2+50,'400 34px Archivo','#FFD27A','center',b);}
