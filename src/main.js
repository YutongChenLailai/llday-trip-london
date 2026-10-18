import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as THREE from 'three';
import { clamp, handState, aimFromHand, releaseReady } from './gesture.js';
import { loadVisited, saveVisited, nextPlace } from './progress.js';
import {unlockSound,toggleSound,playImpact} from './sound.js';
import { mapBounds, mapArtwork } from './map-art.js';
import { places } from './places.js';
import { groupPlaces } from './map-groups.js';
const $ = id => document.getElementById(id);
let storage;
try { storage=window.localStorage; } catch { /* Storage can be disabled by the browser. */ }
const visited=loadVisited(storage,places);
let selectedPlace=null, throwTicket=0;
const map = L.map('map',{zoomControl:false,scrollWheelZoom:false,zoomSnap:.25,minZoom:6,maxZoom:12,maxBounds:[[50.2,-3.7],[53.4,2.5]],maxBoundsViscosity:.9});
L.imageOverlay(mapArtwork,mapBounds,{attribution:'Day trips from London · illustrated regional map'}).addTo(map);
L.control.zoom({position:'bottomright'}).addTo(map);
function resetMap(){map.fitBounds(mapBounds,{padding:[12,12]});}
resetMap();
const pins=L.layerGroup().addTo(map), placePins=L.layerGroup().addTo(map);
function showPlace(place){
  selectedPlace=place;
  $('destination').textContent=place.name;$('destination-note').textContent=place.note;$('rail-note').textContent=`By rail → ${place.station}`;$('rail-source').href=place.source;
  $('explore').href=`https://www.google.com/maps/dir/?api=1&origin=London&destination=${encodeURIComponent(place.station+", England")}&travelmode=transit`;
  $('visit-result').textContent=visited.has(place.name)?'✓ Visited · undo':'✓ Mark as visited';
  $('visit-result').classList.toggle('is-visited',visited.has(place.name));
  $('result').hidden=false;
}
function renderProgress(){
  $('visited-count').textContent=`${visited.size} / ${places.length}`;
  const list=$('place-list');list.replaceChildren();
  places.forEach((place,index)=>{
    const done=visited.has(place.name);
    const label=document.createElement('label');label.className=`place-item${done?' is-visited':''}`;
    const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=done;checkbox.setAttribute('aria-label',`Visited ${place.name}`);
    checkbox.addEventListener('change',()=>toggleVisited(place));
    const name=document.createElement('span');name.textContent=place.name;name.title=place.kind;
    const number=document.createElement('small');number.textContent=String(index+1).padStart(2,'0');
    label.append(checkbox,name,number);list.append(label);

  });
  renderMapPins();
}
function renderMapPins(){
  placePins.clearLayers();
  const groups=groupPlaces(places,place=>map.latLngToContainerPoint([place.lat,place.lng]));
  for(const group of groups){
    if(group.places.length>1){
      const names=group.places.map(p=>p.name).join(', '),position=map.containerPointToLatLng([group.x,group.y]);
      L.marker(position,{icon:L.divIcon({className:'map-cluster',html:`<span>+${group.places.length}</span>`,iconSize:[28,28],iconAnchor:[14,14]}),title:`${group.places.length} destinations: ${names}. Zoom in.`,alt:`Zoom to ${names}`}).addTo(placePins).bindTooltip(group.places.some(p=>p.name==='Brighton')?'Brighton & nearby':group.places.some(p=>p.name==='Southend-on-Sea')?'Southend-on-Sea & nearby':`${group.places.length} places · zoom in`,{permanent:group.places.some(p=>['Brighton','Southend-on-Sea'].includes(p.name)),direction:'top',offset:[0,-12]}).on('click',()=>map.setView(position,Math.min(12,map.getZoom()+1.5)));
      continue;
    }
    const place=group.places[0],index=places.indexOf(place),done=visited.has(place.name);
    L.marker([place.lat,place.lng],{icon:L.divIcon({className:`place-marker${done?' done':''}`,html:`<span>${done?'✓':String(index+1).padStart(2,'0')}</span>`,iconSize:[28,28],iconAnchor:[14,14]}),title:`${place.name}${done?' · visited':''}`,alt:place.name,keyboard:true})
      .addTo(placePins).bindTooltip(place.name,{direction:'top',offset:[0,-14],permanent:['Brighton','Southend-on-Sea'].includes(place.name)}).on('click',()=>{if(mode==='mouse'){const p=map.latLngToContainerPoint([place.lat,place.lng]),size=map.getSize();land({x:p.x/size.x,y:p.y/size.y});}else showPlace(place);});
  }
}
map.on('zoomend',renderMapPins);
function toggleVisited(place){
  if(visited.has(place.name))visited.delete(place.name);else visited.add(place.name);
  const saved=saveVisited(storage,visited);
  $('saved-note').textContent=saved?'Saved in this browser · untick a place to put it back in play.':'Browser storage is unavailable. Your checks will last for this visit only.';
  renderProgress();
  if(selectedPlace?.name===place.name)showPlace(place);
  status(visited.size===places.length?'You’ve explored every spot! Untick a place to play again.':`${visited.size} explored · ${places.length-visited.size} places still to discover.`);
}
$('visit-result').addEventListener('click',()=>{if(selectedPlace)toggleVisited(selectedPlace);});
renderProgress();
const dartSvg='<svg viewBox="0 0 60 120" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="13" r="9" fill="none" stroke="#222" stroke-width="5"/><path d="M30 23v34" stroke="#222" stroke-width="11"/><path d="M25 29h10m-10 8h10m-10 8h10" stroke="#ffff18" stroke-width="3"/><path d="m30 53-20 23 20 38 20-38Z" fill="#bfc4c6" stroke="#222" stroke-width="2"/><path d="M30 53v61L50 76Z" fill="#717980"/></svg>';
let mode='idle',stream,tracker,frameId,lastVideoTime=-1,trackingBusy=false,lastTrackingTime=0,handAngle=-.6;
let aim={x:.5,y:.5},smoothed=null,held=false,heldAt=0,lastHand=null,motion=0,cooldown=0,throwCount=0;
let renderer,scene,camera,dart,loading=false,generation=0,renderWidth=0,renderHeight=0;
const person=$('person'),ctx=person.getContext('2d');
const video = $('video');
function status(text){ $('status').textContent = text; }
function setAim(point){
  aim = point;
  const panel = $('map').getBoundingClientRect(), outer = $('map').parentElement.getBoundingClientRect();
  $('aim').style.left = `${panel.left - outer.left + point.x * panel.width}px`;
  $('aim').style.top = `${panel.top - outer.top + point.y * panel.height}px`;
}
function initDart(){
  if(renderer) return;
  renderer = new THREE.WebGLRenderer({canvas:$('dart'),alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(35,1,.1,100); camera.position.z=10;
  scene.add(new THREE.HemisphereLight(0xffffff,0x737749,3));
  const light = new THREE.DirectionalLight(0xffffff,4); light.position.set(-3,4,7); scene.add(light);
  dart = new THREE.Group();
  const silver=new THREE.MeshStandardMaterial({color:0xbfc4c6,metalness:.8,roughness:.3});
  const dark=new THREE.MeshStandardMaterial({color:0x222222,roughness:.6});
  const yellow=new THREE.MeshStandardMaterial({color:0xffff18,roughness:.7});
  const vertices=[[0,-1.25,0],[-.34,-.55,0],[0,.08,0],[.34,-.55,0],[0,-.55,.13],[0,-.55,-.13]];
  const faces=[[0,1,4],[1,2,4],[2,3,4],[3,0,4],[1,0,5],[2,1,5],[3,2,5],[0,3,5]];
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(faces.flatMap(f=>f.toReversed().flatMap(i=>vertices[i])),3));geometry.computeVertexNormals();
  dart.add(new THREE.Mesh(geometry,silver));
  const handle=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,.8,16),dark);handle.position.y=.48;dart.add(handle);
  for(let i=0;i<6;i++){const wrap=new THREE.Mesh(new THREE.TorusGeometry(.067,.012,6,16),yellow);wrap.rotation.x=Math.PI/2;wrap.position.y=.18+i*.11;dart.add(wrap);}
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.17,.038,8,32),dark);ring.position.y=1.05;dart.add(ring);
  scene.add(dart); dart.visible=false;
}
function renderDart(x,y,scale=1,angle=-.6){
  if(!renderer) return;
  const box=$('camera-stage').getBoundingClientRect();if(renderWidth!==box.width||renderHeight!==box.height){renderWidth=box.width;renderHeight=box.height;renderer.setSize(box.width,box.height,false);camera.aspect=box.width/box.height;camera.updateProjectionMatrix();}
  const halfH=Math.tan(THREE.MathUtils.degToRad(35/2))*10;
  dart.position.set((x-.5)*halfH*2*camera.aspect,(.5-y)*halfH*2,0);
  dart.scale.setScalar(scale);dart.rotation.set(.2,.6,angle);renderer.render(scene,camera);
}
function clearDart(){ if(dart){dart.visible=false;renderer.render(scene,camera);} }
function cameraPoint(x,y){
  const b=$('camera-stage').getBoundingClientRect();
  const fit=Math.min(b.width/person.width,b.height/person.height);
  return {x:((b.width-person.width*fit)/2+x*person.width*fit)/b.width,y:((b.height-person.height*fit)/2+y*person.height*fit)/b.height};
}
function land(point=aim){
  unlockSound();
  if(performance.now()<cooldown) return;
  const size=map.getSize(), aimed=map.containerPointToLatLng([size.x*point.x,size.y*point.y]);
  const place=nextPlace(aimed.lat,aimed.lng,places,visited);
  held=false;clearDart();$('aim').hidden=true;
  if(!place){status('You’ve explored every spot! Untick a place to play again.');$('live-hint').textContent='All places explored ✓';cooldown=performance.now()+1100;return;}
  const ticket=++throwTicket;cooldown=performance.now()+1100;$('result').hidden=true;
  const start=$('camera-stage').getBoundingClientRect(), target=$('map').getBoundingClientRect();
  const landing=map.latLngToContainerPoint([place.lat,place.lng]);
  const flying=document.createElement('div');flying.className='flying-dart';flying.innerHTML=dartSvg;
  flying.style.left=`${start.left+start.width*(smoothed?.x??.55)-50}px`;flying.style.top=`${start.top+start.height*(smoothed?.y??.5)-50}px`;document.body.append(flying);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{flying.style.left=`${target.left+landing.x-18}px`;flying.style.top=`${target.top+landing.y-45}px`;flying.style.transform='rotate(25deg) scale(.4)';}));
  status('Finding a place you haven’t been…');
  setTimeout(()=>{
    flying.remove();if(ticket!==throwTicket)return;
    if(visited.has(place.name)){status('That place was just marked visited. Throw again for a new spot.');return;}
    pins.clearLayers();
    L.marker([place.lat,place.lng],{icon:L.divIcon({className:'pin-icon',html:dartSvg,iconSize:[32,53],iconAnchor:[16,49]})}).addTo(pins);
    playImpact();$('map').classList.remove('impact');void $('map').offsetWidth;$('map').classList.add('impact');throwCount++;showPlace(place);
    status(`Throw ${String(throwCount).padStart(2,'0')} · ${place.name} · a new place to go.`);
    if(mode==='camera')$('live-hint').textContent='Pinch to pick up another dart';
  },650);
}
function stopCamera(){
  generation++;loading=false;cancelAnimationFrame(frameId);tracker?.terminate();tracker=null;trackingBusy=false;lastTrackingTime=0;stream?.getTracks().forEach(track=>track.stop());stream=null;video.srcObject=null;
  mode='idle';held=false;lastHand=null;smoothed=null;lastVideoTime=-1;clearDart();ctx.clearRect(0,0,person.width,person.height);
  $('placeholder').hidden=false;$('onboarding').hidden=false;$('live-hint').hidden=true;$('stop').hidden=true;$('aim').hidden=true;
  $('camera-stage').classList.remove('demo-active');$('onboarding').querySelector('h2').textContent='You’re the controller.';$('onboarding').querySelector('p').textContent='Step in. Pick up a dart. Find your day away.';$('demo').textContent='Try with your mouse first →';$('camera-label').innerHTML='<i></i> CAMERA OFF';$('start').disabled=false;status('Camera off. Ready when you are.');
}
function processTracking(data){
  trackingBusy=false;
  if(mode!=='camera'){data.cutout?.close();return;}
  if(data.type==='error'){stopCamera();status('Tracking stopped. Restart the camera or use mouse mode.');return;}
  if(data.type!=='frame')return;
  ctx.save();ctx.clearRect(0,0,person.width,person.height);ctx.translate(person.width,0);ctx.scale(-1,1);ctx.drawImage(data.cutout,0,0,person.width,person.height);ctx.restore();data.cutout.close();
  const hands=data.hands,now=data.time;
  const points=lastHand?hands.toSorted((a,b)=>Math.hypot(handState(a).x-lastHand.x,handState(a).y-lastHand.y)-Math.hypot(handState(b).x-lastHand.x,handState(b).y-lastHand.y))[0]:hands.toSorted((a,b)=>handState(a).pinch-handState(b).pinch)[0];
      if(points){
        const hand=handState(points),dt=lastHand?Math.max(1,now-lastHand.time):33;
        const speed=lastHand?Math.hypot(hand.x-lastHand.x,hand.y-lastHand.y)*1000/dt:0;
        motion=Math.max(speed,motion*.75);
        smoothed=smoothed?{x:smoothed.x+(hand.x-smoothed.x)*.38,y:smoothed.y+(hand.y-smoothed.y)*.38}:{x:hand.x,y:hand.y};
        if(now>cooldown){
          if(!held&&hand.pinch<.4){held=true;heldAt=now;$('result').hidden=true;motion=0;status('Dart in hand. Move to aim, then flick and release.');}
          if(held){
            setAim(aimFromHand(smoothed.x,smoothed.y));$('aim').hidden=false;
            dart.visible=true;
            handAngle=Math.atan2(-(points[8].y-points[5].y),-(points[8].x-points[5].x))-Math.PI/2;
            $('live-hint').textContent='Dart ready · flick & release';
            if(releaseReady(held,hand.pinch,now-heldAt,motion)) land();
            else if(hand.pinch>.9){held=false;clearDart();$('aim').hidden=true;$('live-hint').textContent='Pinch, then flick as you release';}
          }else{$('live-hint').textContent='Pinch thumb + index to pick up';clearDart();}
        }
        lastHand={...hand,time:now};$('camera-label').innerHTML='<i style="background:#00a878"></i> HAND FOUND';
      }else{
        held=false;smoothed=null;lastHand=null;motion=0;clearDart();$('aim').hidden=true;$('camera-label').innerHTML='<i style="background:#ff5a42"></i> FINDING HAND';$('live-hint').textContent='Bring your hand into frame';
      }
}
function track(now){
  if(mode!=='camera')return;
  if(video.readyState>=2&&!trackingBusy&&now-lastTrackingTime>=50&&video.currentTime!==lastVideoTime){
    trackingBusy=true;lastTrackingTime=now;lastVideoTime=video.currentTime;const ticket=generation;
    createImageBitmap(video).then(frame=>{if(ticket!==generation||!tracker){frame.close();return;}tracker.postMessage({type:'frame',frame,time:now},[frame]);}).catch(()=>{if(ticket===generation){stopCamera();status('Could not read the camera frame. Try restarting.');}});
  }
  if(held&&smoothed&&dart){const position=cameraPoint(smoothed.x,smoothed.y);renderDart(position.x,position.y,clamp((lastHand?.palm??.15)*5,.55,1.3),handAngle);}
  frameId=requestAnimationFrame(track);
}
async function startCamera(){
  unlockSound();if(loading) return;loading=true;const ticket=++generation;$('start').disabled=true;
  status('Allow your camera to begin…');$('stop').hidden=false;
  try{
    if(!navigator.mediaDevices?.getUserMedia) throw new Error('Camera requires localhost or HTTPS.');
    const acquired=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480},facingMode:'user'},audio:false});
    if(ticket!==generation){acquired.getTracks().forEach(t=>t.stop());return;}
    stream=acquired;$('stop').hidden=false;status('Preparing hand tracking and your cutout…');
    tracker=new Worker('/tracking-worker.js');
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Tracking model load timed out')),30000);
      tracker.onmessage=({data})=>{if(data.type==='ready'){clearTimeout(timer);resolve();}else if(data.type==='error'){clearTimeout(timer);reject(new Error(data.message));}};
      tracker.onerror=error=>{clearTimeout(timer);reject(new Error(error.message));};tracker.postMessage({type:'init'});
    });
    if(ticket!==generation) return;
    initDart();video.srcObject=stream;await video.play();if(ticket!==generation)return;
    person.width=video.videoWidth;person.height=video.videoHeight;mode='camera';tracker.onmessage=({data})=>processTracking(data);tracker.onerror=()=>{stopCamera();status('Tracking stopped. Please restart the camera.');};
    $('camera-stage').classList.remove('demo-active');$('placeholder').hidden=true;$('onboarding').hidden=true;$('live-hint').hidden=false;
    status('Show your hand. Pinch thumb + index to hold a dart.');frameId=requestAnimationFrame(track);
  }catch(error){
    if(ticket!==generation)return;
    stopCamera();const messages={NotAllowedError:'Camera permission was declined. Allow it in your browser, or use mouse mode.',NotFoundError:'No camera found. You can still play with your mouse.',NotReadableError:'Camera is in use. Close other camera apps and try again.'};status(messages[error.name]||'Camera setup failed. Try again, or use mouse mode.');console.error(error);
  }finally{if(ticket===generation){loading=false;$('start').disabled=false;}}
}
function demo(){
  unlockSound();stopCamera();mode='mouse';$('camera-stage').classList.add('demo-active');$('camera-label').textContent='MOUSE MODE';
  $('onboarding').querySelector('h2').textContent='Your next day away.';$('onboarding').querySelector('p').textContent='Move across the map. Click to throw.';
  $('demo').textContent='Mouse mode is on · click the map';$('aim').hidden=false;setAim({x:.5,y:.5});
  status('Mouse mode · click the map or press Space to throw.');
}
$('start').addEventListener('click',startCamera);$('stop').addEventListener('click',stopCamera);$('demo').addEventListener('click',demo);
map.on('mousemove',event=>{if(mode==='mouse'&&performance.now()>cooldown){$('aim').hidden=false;const s=map.getSize();setAim({x:event.containerPoint.x/s.x,y:event.containerPoint.y/s.y});}});
map.on('click',event=>{if(mode==='mouse'){const s=map.getSize();land({x:event.containerPoint.x/s.x,y:event.containerPoint.y/s.y});}});
document.addEventListener('keydown',event=>{if(event.code==='Space'&&mode==='mouse'&&!$('instructions').open&&!['BUTTON','A','INPUT'].includes(document.activeElement?.tagName)){event.preventDefault();land();}});
$('again').addEventListener('click',()=>{$('result').hidden=true;if(mode==='mouse')$('aim').hidden=false;});
$('clear').addEventListener('click',()=>{throwTicket++;document.querySelectorAll('.flying-dart').forEach(el=>el.remove());pins.clearLayers();throwCount=0;$('result').hidden=true;status('A fresh map. Where to next?');});
$('reset').addEventListener('click',()=>{resetMap();setAim(aim);});
$('help').addEventListener('click',()=>$('instructions').showModal());$('close-help').addEventListener('click',()=>$('instructions').close());
window.addEventListener('pagehide',stopCamera);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(stream||loading))stopCamera();});
new ResizeObserver(()=>{map.invalidateSize();resetMap();setAim(aim);}).observe($('map'));
window.addEventListener('storage',event=>{
  if(event.storageArea!==storage)return;
  const saved=loadVisited(storage,places);visited.clear();saved.forEach(name=>visited.add(name));renderProgress();
  if(selectedPlace)showPlace(selectedPlace);
});

$('sound').addEventListener('click',()=>{const enabled=toggleSound();$('sound').textContent=enabled?'Sound on ↗':'Sound off ↗';$('sound').setAttribute('aria-pressed',String(enabled));});
