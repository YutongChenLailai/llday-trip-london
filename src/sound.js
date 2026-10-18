let context,enabled=true;
export function unlockSound(){
  if(!enabled)return;
  try{context??=new (window.AudioContext||window.webkitAudioContext)();context.resume().catch(()=>{});}catch{}
}
export function toggleSound(){enabled=!enabled;if(enabled)unlockSound();return enabled;}
export function playImpact(){
  if(!enabled||!context||context.state!=='running')return;
  const now=context.currentTime,volume=context.createGain();volume.gain.value=.55;volume.connect(context.destination);
  const thud=context.createOscillator(),envelope=context.createGain();thud.frequency.setValueAtTime(170,now);thud.frequency.exponentialRampToValueAtTime(38,now+.16);envelope.gain.setValueAtTime(.65,now);envelope.gain.exponentialRampToValueAtTime(.001,now+.25);thud.connect(envelope);envelope.connect(volume);thud.start(now);thud.stop(now+.27);
  const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.09),context.sampleRate),samples=buffer.getChannelData(0);
  for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*(1-i/samples.length)**3;
  const crack=context.createBufferSource(),filter=context.createBiquadFilter();filter.type='highpass';filter.frequency.value=1100;crack.buffer=buffer;crack.connect(filter);filter.connect(volume);crack.start(now);crack.onended=()=>setTimeout(()=>volume.disconnect(),300);
}
