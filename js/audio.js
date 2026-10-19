// Áudio todo sintetizado em Web Audio, compartilhado pelas duas páginas.
// A explosão usa ruído marrom e sub-grave de propósito: ruído branco soava metálico. Manter o caráter grave.
function createSound(level){
const ac=new (window.AudioContext||window.webkitAudioContext)();
const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=6;comp.connect(ac.destination);
const master=ac.createGain();master.gain.value=level;master.connect(comp);
unlockAudio(ac);
return{ac,comp,master,nb:noiseBuf(ac)};}
// iPhone: o Web Audio obedece à chave de silencioso, e a página fica muda mesmo com o volume alto.
// Declarar a sessão como "playback" faz o iOS tratar a página como mídia (Safari 16.4+). Em versões antigas,
// tocar um <audio> silencioso em loop tem o mesmo efeito. Chamar sempre dentro de um clique.
let silentEl=null;
function unlockAudio(ac){
if(navigator.audioSession){try{navigator.audioSession.type='playback';}catch(e){}}
else{if(!silentEl){silentEl=document.createElement('audio');silentEl.src=silentWav();silentEl.loop=true;silentEl.setAttribute('playsinline','');}silentEl.play().catch(()=>{});}
if(ac.state!=='running')ac.resume().catch(()=>{});}
function silentWav(){const n=800,b=new ArrayBuffer(44+n),v=new DataView(b),w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
w(0,'RIFF');v.setUint32(4,36+n,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,8000,true);v.setUint16(32,1,true);v.setUint16(34,8,true);w(36,'data');v.setUint32(40,n,true);
for(let i=0;i<n;i++)v.setUint8(44+i,128);return URL.createObjectURL(new Blob([b],{type:'audio/wav'}));}
function noiseBuf(ac){const b=ac.createBuffer(1,ac.sampleRate*5,ac.sampleRate),d=b.getChannelData(0);let last=0;for(let i=0;i<d.length;i++){last=(last+.02*(Math.random()*2-1))/1.02;d[i]=last*3.5;}return b;}
// pan: -1 (esquerda) a 1 (direita). big: revoluções e marcos, mais longa e profunda.
function boom(au,t,pan,big){const{ac}=au;
const pn=ac.createStereoPanner?ac.createStereoPanner():ac.createGain();if(pn.pan)pn.pan.value=pan;pn.connect(au.master);
const s=ac.createBufferSource();s.buffer=au.nb;s.playbackRate.value=.9+Math.random()*.2;
const f=ac.createBiquadFilter();f.type='lowpass';f.Q.value=.5;f.frequency.setValueAtTime(big?900:650,t);f.frequency.exponentialRampToValueAtTime(big?45:60,t+(big?3.2:1.6));
const f2=ac.createBiquadFilter();f2.type='lowpass';f2.Q.value=.5;f2.frequency.value=big?1200:900;
const ge=ac.createGain(),dur=big?4:2,lv=big?1.3:.9;ge.gain.setValueAtTime(0,t);ge.gain.linearRampToValueAtTime(lv,t+.012);ge.gain.setTargetAtTime(0,t+.05,dur/5);
s.connect(f);f.connect(f2);f2.connect(ge);ge.connect(pn);s.start(t);s.stop(t+dur+.2);
[[big?60:72,big?20:28,big?2.4:1.1,big?1.2:.85],[big?38:45,big?18:24,big?3:1.4,big?.9:.5]].forEach(([a,b,d,v])=>{const o=ac.createOscillator(),og=ac.createGain();o.frequency.setValueAtTime(a,t);o.frequency.exponentialRampToValueAtTime(b,t+d*.7);og.gain.setValueAtTime(0,t);og.gain.linearRampToValueAtTime(v,t+.015);og.gain.setTargetAtTime(0,t+.04,d/4);o.connect(og);og.connect(pn);o.start(t);o.stop(t+d+.5);});
}
// Batida de coração dupla. O intervalo cai de 1,7s para cerca de 0,45s conforme o progresso pr (0 a 1).
function beat(au,t,v){const{ac}=au;[0,.22].forEach((d,k)=>{const o=ac.createOscillator(),gg=ac.createGain();o.frequency.setValueAtTime(62,t+d);o.frequency.exponentialRampToValueAtTime(34,t+d+.18);gg.gain.setValueAtTime(0,t+d);gg.gain.linearRampToValueAtTime(v*(k?.6:1),t+d+.01);gg.gain.exponentialRampToValueAtTime(.001,t+d+.35);o.connect(gg);gg.connect(au.master);o.start(t+d);o.stop(t+d+.4);});}
const beatGap=pr=>1.7-1.25*Math.pow(pr,1.3);
// Drone grave (três dentes de serra atrás de um passa-baixa) e duas triangulares de tensão.
// Começa mudo; quem chama automatiza dg.gain, lp.frequency, tg.gain e a frequência de tos.
function drone(au,t0,t1){const{ac}=au;
const dg=ac.createGain();dg.gain.value=0;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.Q.value=2;lp.frequency.value=110;lp.connect(dg);dg.connect(au.master);
[41.2,41.7,61.8].forEach(f=>{const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(lp);o.start(t0);if(t1)o.stop(t1);});
const tg=ac.createGain();tg.gain.value=0;tg.connect(au.master);
const tos=[220,233].map(f=>{const o=ac.createOscillator();o.type='triangle';o.frequency.value=f;o.connect(tg);o.start(t0);if(t1)o.stop(t1);return o;});
return{dg,lp,tg,tos};}
