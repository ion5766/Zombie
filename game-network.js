/* =========================================================================
   MÓDULO DE RED MULTIJUGADOR (window.MPNet)
   - Señalización vía Firebase Firestore (rooms/{code}/peers/{peerId})
   - Conexión real de juego vía WebRTC DataChannel (P2P), topología estrella:
     el HOST tiene una conexión directa a cada cliente y retransmite
     (relay) los mensajes entre clientes. Funciona en LAN (misma red)
     y online (a través de internet), usando Firestore solo para
     encontrarse (no viaja tráfico de juego por Firestore).
   ========================================================================= */
(function(){
"use strict";

/* ---------- 1) CONFIGURA AQUÍ TU PROYECTO DE FIREBASE ----------
   Usa el mismo proyecto de Firebase que ya usas en tu portal, o crea uno
   nuevo (gratis) en https://console.firebase.google.com
   Solo se usa Firestore (para señalización) y Auth anónima (para que las
   reglas de seguridad de Firestore puedan exigir "usuario autenticado"
   sin pedir registro). No se guarda nada del juego en la base de datos,
   solo los datos necesarios para que los jugadores se encuentren. */
const FIREBASE_CONFIG={
  apiKey:"AIzaSyDk6toqC4QHrDLzm8jqkFysJ47E9nLixzw",
  authDomain:"gato-miel-estudio-e6829.firebaseapp.com",
  projectId:"gato-miel-estudio-e6829",
  storageBucket:"gato-miel-estudio-e6829.firebasestorage.app",
  messagingSenderId:"965583286065",
  appId:"1:965583286065:web:d2b7ba006802592d3fca10"
};

const ICE_SERVERS=[
  {urls:"stun:stun.l.google.com:19302"},
  {urls:"stun:stun1.l.google.com:19302"},
  {urls:"turn:openrelay.metered.ca:80",username:"openrelayproject",credential:"openrelayproject"},
  {urls:"turn:openrelay.metered.ca:443",username:"openrelayproject",credential:"openrelayproject"},
  {urls:"turn:openrelay.metered.ca:443?transport=tcp",username:"openrelayproject",credential:"openrelayproject"}
];
const MAX_PLAYERS=20;

let fbApp=null,db=null,fbReady=false;
function initFirebase(){
  if(fbReady)return true;
  try{
    if(FIREBASE_CONFIG.apiKey==="TU_API_KEY"){
      console.warn("[MPNet] Falta configurar FIREBASE_CONFIG en el archivo.");
      return false;
    }
    fbApp=firebase.initializeApp(FIREBASE_CONFIG);
    db=firebase.firestore();
    fbReady=true;
    return true;
  }catch(e){console.error("[MPNet] Error iniciando Firebase",e);return false;}
}
function ensureAuth(){
  return new Promise((resolve,reject)=>{
    if(!fbReady){reject(new Error("Firebase no configurado"));return;}
    const auth=firebase.auth();
    auth.onAuthStateChanged(u=>{if(u)resolve(u);});
    if(!auth.currentUser){auth.signInAnonymously().catch(reject);}
  });
}
function genCode(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s="";for(let i=0;i<5;i++)s+=chars[Math.floor(Math.random()*chars.length)];
  return s;
}
function genId(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);}

/* ---- Estado de red compartido ---- */
const Net={
  active:false,          // ¿partida multijugador?
  isHost:false,
  myId:null,
  myName:'Superviviente',
  roomCode:null,
  roster:new Map(),      // id -> {name}
  remotePlayers:new Map(),// id -> {x,z,yaw,hp,alive,name,avatar:THREE.Group}
  connections:new Map(), // (solo host) id -> {pc,channel}
  hostChannel:null,      // (solo cliente) canal hacia el host
  hostPC:null,
  alivePlayers:new Set(),
  matchEnded:false,
  onRosterChange:null,
  onStatus:null,
  _unsubs:[]
};
window.MPNet=Net;
Net.sendZombieHit=function(netId,dmg,bleed){send({t:'zombieHit',netId,dmg,bleed});};
Net.sendZombieDamageToPlayer=function(targetId,dmg){send({t:'hit',targetId,dmg,sourceId:'zombie',sourceName:'Zombie'});};

function cleanupListeners(){Net._unsubs.forEach(u=>{try{u();}catch(e){}});Net._unsubs=[];}

/* ================= HOST ================= */
async function createRoom(name){
  if(!initFirebase())throw new Error("Firebase no configurado. Revisa FIREBASE_CONFIG en el archivo.");
  await ensureAuth();
  Net.active=true;Net.isHost=true;Net.myName=name||'Host';Net.myId=genId();
  Net.roomCode=genCode();
  Net.roster.set(Net.myId,{name:Net.myName});
  Net.alivePlayers.add(Net.myId);
  await db.collection('rooms').doc(Net.roomCode).set({
    hostId:Net.myId,hostName:Net.myName,createdAt:Date.now(),status:'lobby',maxPlayers:MAX_PLAYERS
  });
  const peersCol=db.collection('rooms').doc(Net.roomCode).collection('peers');
  const seenPeers=new Set();
  const unsub=peersCol.onSnapshot(async snap=>{
    for(const change of snap.docChanges()){
      const pid=change.doc.id;
      const data=change.doc.data();
      if(change.type==='removed'){
        handlePeerLeft(pid);
        continue;
      }
      if(seenPeers.has(pid))continue; // ya tenemos/estamos creando su PC
      if(pid===Net.myId)continue;
      if(Net.roster.size>=MAX_PLAYERS)continue;
      seenPeers.add(pid);
      hostConnectToPeer(pid,data.name||'Jugador',peersCol);
    }
  });
  Net._unsubs.push(unsub);
  return Net.roomCode;
}

function hostConnectToPeer(pid,name,peersCol){
  const pc=new RTCPeerConnection({iceServers:ICE_SERVERS});
  const channel=pc.createDataChannel('game');
  const entry={pc,channel};
  Net.connections.set(pid,entry);
  wireChannel(channel,pid,name);
  pc.onicecandidate=e=>{if(e.candidate){peersCol.doc(pid).update({offerCandidates:firebase.firestore.FieldValue.arrayUnion(e.candidate.toJSON())}).catch(err=>console.error('[MPNet] error ICE host:',err));}};
  pc.onconnectionstatechange=()=>{console.log('[MPNet] connectionState (host, peer '+pid+'):',pc.connectionState);};
  pc.oniceconnectionstatechange=()=>{
    console.log('[MPNet] iceConnectionState (host, peer '+pid+'):',pc.iceConnectionState);
    if(pc.iceConnectionState==='failed'||pc.iceConnectionState==='closed'){handlePeerLeft(pid);}
  };
  pc.createOffer().then(offer=>pc.setLocalDescription(offer)).then(()=>{
    return peersCol.doc(pid).set({name,offer:{type:pc.localDescription.type,sdp:pc.localDescription.sdp},offerCandidates:[],answerCandidates:[]},{merge:true});
  });
  let processedAnswerIce=0;
  const unsub=peersCol.doc(pid).onSnapshot(doc=>{
    const d=doc.data();if(!d)return;
    if(d.answer&&!pc.currentRemoteDescription){
      pc.setRemoteDescription(new RTCSessionDescription(d.answer)).catch(e=>console.error(e));
    }
    if(d.answerCandidates){
      for(let i=processedAnswerIce;i<d.answerCandidates.length;i++){
        pc.addIceCandidate(new RTCIceCandidate(d.answerCandidates[i])).catch(()=>{});
      }
      processedAnswerIce=d.answerCandidates.length;
    }
  });
  Net._unsubs.push(unsub);
}

function handlePeerLeft(pid){
  if(!Net.roster.has(pid))return;
  Net.roster.delete(pid);
  Net.alivePlayers.delete(pid);
  removeRemoteAvatar(pid);
  const c=Net.connections.get(pid);
  if(c){try{c.channel.close();c.pc.close();}catch(e){}Net.connections.delete(pid);}
  if(Net.isHost)broadcastRoster();
  if(Net.onRosterChange)Net.onRosterChange();
  checkMatchEnd();
}

/* ================= CLIENTE ================= */
async function joinRoom(code,name){
  if(!initFirebase())throw new Error("Firebase no configurado. Revisa FIREBASE_CONFIG en el archivo.");
  await ensureAuth();
  code=(code||'').toUpperCase().trim();
  const roomRef=db.collection('rooms').doc(code);
  const roomSnap=await roomRef.get();
  if(!roomSnap.exists)throw new Error("No existe una sala con ese código.");
  Net.active=true;Net.isHost=false;Net.myName=name||'Jugador';Net.myId=genId();Net.roomCode=code;
  const peerRef=roomRef.collection('peers').doc(Net.myId);
  const pc=new RTCPeerConnection({iceServers:ICE_SERVERS});
  Net.hostPC=pc;
  pc.ondatachannel=e=>{Net.hostChannel=e.channel;wireChannel(e.channel,'HOST_'+code,roomSnap.data().hostName||'Host',true);};
  pc.onicecandidate=e=>{if(e.candidate){peerRef.update({answerCandidates:firebase.firestore.FieldValue.arrayUnion(e.candidate.toJSON())}).catch(err=>console.error('[MPNet] error ICE cliente:',err));}};
  pc.onconnectionstatechange=()=>{console.log('[MPNet] connectionState (cliente):',pc.connectionState);};
  pc.oniceconnectionstatechange=()=>{
    console.log('[MPNet] iceConnectionState (cliente):',pc.iceConnectionState);
    if(Net.onIceStateChange)Net.onIceStateChange(pc.iceConnectionState);
  };
  await peerRef.set({name:Net.myName,joinedAt:Date.now(),offerCandidates:[],answerCandidates:[]});
  let processedOfferIce=0;
  const unsub=peerRef.onSnapshot(async doc=>{
    const d=doc.data();if(!d)return;
    if(d.offer&&!pc.currentRemoteDescription){
      await pc.setRemoteDescription(new RTCSessionDescription(d.offer));
      const answer=await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await peerRef.update({answer:{type:pc.localDescription.type,sdp:pc.localDescription.sdp}});
    }
    if(d.offerCandidates){
      for(let i=processedOfferIce;i<d.offerCandidates.length;i++){
        pc.addIceCandidate(new RTCIceCandidate(d.offerCandidates[i])).catch(()=>{});
      }
      processedOfferIce=d.offerCandidates.length;
    }
  });
  Net._unsubs.push(unsub);
}

/* ================= CANAL DE DATOS: envío / recepción ================= */
function wireChannel(channel,peerId,name,isHostChannel){
  channel.onopen=()=>{
    if(Net.isHost){
      Net.roster.set(peerId,{name});
      Net.alivePlayers.add(peerId);
      broadcastRoster();
      if(Net.onRosterChange)Net.onRosterChange();
    }else{
      send({t:'hello',id:Net.myId,name:Net.myName});
      if(isHostChannel&&Net.onConnectedToHost)Net.onConnectedToHost();
    }
  };
  channel.onclose=()=>{if(Net.isHost)handlePeerLeft(peerId);};
  channel.onmessage=ev=>{
    let msg;try{msg=JSON.parse(ev.data);}catch(e){return;}
    handleMessage(msg,peerId,channel);
  };
}
function send(msg){
  const str=JSON.stringify(msg);
  if(Net.isHost){
    for(const [,c] of Net.connections){if(c.channel.readyState==='open')c.channel.send(str);}
  }else if(Net.hostChannel&&Net.hostChannel.readyState==='open'){
    Net.hostChannel.send(str);
  }
}
function relayExcept(msg,exceptId){
  const str=JSON.stringify(msg);
  for(const [pid,c] of Net.connections){if(pid!==exceptId&&c.channel.readyState==='open')c.channel.send(str);}
}

function handleMessage(msg,fromPeerId,channel){
  switch(msg.t){
    case 'hello':
      if(Net.isHost){Net.roster.set(fromPeerId,{name:msg.name});if(Net.onRosterChange)Net.onRosterChange();broadcastRoster();}
      break;
    case 'players':
      Net.roster=new Map(msg.list.map(p=>[p.id,{name:p.name}]));
      Net.alivePlayers=new Set(msg.list.map(p=>p.id));
      if(Net.onRosterChange)Net.onRosterChange();
      break;
    case 'start':
      if(!Net.isHost)startLocalMatch();
      break;
    case 'state':
      updateRemoteAvatar(msg.id,msg.name,msg.x,msg.z,msg.yaw,msg.hp,msg.alive,msg.wKind,msg.wId,msg.jumpY,msg.crouch);
      if(Net.isHost)relayExcept(msg,fromPeerId);
      break;
    case 'hit':
      if(msg.targetId===Net.myId&&window.__game){
        window.__game.applyRemoteDamageToLocal(msg.dmg,msg.sourceName);
      }
      if(Net.isHost&&fromPeerId!==undefined)relayExcept(msg,fromPeerId);
      break;
    case 'death':
      Net.alivePlayers.delete(msg.id);
      pushKillFeed((msg.killerName?msg.killerName+' eliminó a ':'')+msg.name);
      if(Net.isHost)relayExcept(msg,fromPeerId);
      checkMatchEnd();
      break;
    case 'matchEnd':
      showMatchEnd(msg.winnerId===Net.myId,msg.winnerName);
      break;
    case 'zombies':
      if(window.__game&&window.__game.applyZombieSnapshot)window.__game.applyZombieSnapshot(msg.list);
      break;
    case 'zombieHit':
      if(Net.isHost&&window.__game&&window.__game.applyZombieHit)window.__game.applyZombieHit(msg.netId,msg.dmg,msg.bleed);
      break;
    case 'doorState':
      if(window.__game&&window.__game.applyRemoteDoorState)window.__game.applyRemoteDoorState(msg.id,msg.open,msg.broken,msg.hp);
      if(Net.isHost)relayExcept(msg,fromPeerId);
      break;
    case 'windowState':
      if(window.__game&&window.__game.applyRemoteWindowState)window.__game.applyRemoteWindowState(msg.id,msg.broken,msg.hp);
      if(Net.isHost)relayExcept(msg,fromPeerId);
      break;
    case 'lootTaken':
      if(window.__game&&window.__game.applyRemoteLootTaken)window.__game.applyRemoteLootTaken(msg.id);
      if(Net.isHost)relayExcept(msg,fromPeerId);
      break;
    case 'crateOpened':
      if(window.__game&&window.__game.applyRemoteCrateOpened)window.__game.applyRemoteCrateOpened(msg.id);
      if(Net.isHost)relayExcept(msg,fromPeerId);
      break;
    case 'carState':
      if(window.__game&&window.__game.applyRemoteCarState)window.__game.applyRemoteCarState(msg.id,msg.x,msg.z,msg.rot,msg.fuel);
      if(Net.isHost)relayExcept(msg,fromPeerId);
      break;
  }
}

function broadcastRoster(){
  const list=[...Net.roster.entries()].map(([id,v])=>({id,name:v.name}));
  send({t:'players',list});
  if(document.getElementById('mpHostPlayerList'))renderHostLobby();
}

/* ================= Avatares remotos en la escena 3D ================= */
function ensureAvatar(id,name){
  if(Net.remotePlayers.has(id))return Net.remotePlayers.get(id);
  const G=window.__game;if(!G)return null;
  const THREE=G.THREE;
  const grp=new THREE.Group();
  // Los jugadores (a diferencia de los zombies) siempre se ven blancos, con una leve
  // variación de tono por jugador para poder distinguirlos entre sí.
  const hue=(Math.abs(hashStr(id))%360)/360;
  const light=0.88+(Math.abs(hashStr(id))%10)/100;
  const col=new THREE.Color().setHSL(hue,0.06,light);
  const torso=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.62,0.28),new THREE.MeshLambertMaterial({color:col}));
  torso.position.y=1.35;grp.add(torso);
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.30,0.30,0.30),new THREE.MeshLambertMaterial({color:0xd8b48c}));
  head.position.y=1.85;grp.add(head);
  const nameSprite=makeNameSprite(name);
  nameSprite.position.y=2.25;grp.add(nameSprite);
  let fbxInst=null;
  if(G.spawnCharVisual&&G.charTemplateReady&&G.charTemplateReady()){
    fbxInst=G.spawnCharVisual(torso.material);
    if(fbxInst){grp.add(fbxInst);torso.visible=false;head.visible=false;}
  }
  // Si el modelo FBX cargó, el objeto que sostiene el arma se cuelga de la mano derecha
  // animada (con una rotación correctora) para que el arma se mueva con el brazo en vez
  // de quedar flotando en un punto fijo del torso.
  const fbxHandR=fbxInst&&fbxInst.userData.bones&&fbxInst.userData.bones.handR;
  const handProp=new THREE.Group();
  if(fbxHandR){handProp.rotation.set(-0.339,0.037,-1.634);fbxHandR.add(handProp);}
  else{handProp.position.set(0.24,-0.06,-0.20);torso.add(handProp);}
  const gunProp=new THREE.Group();
  const gunBody=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.10,0.30),new THREE.MeshLambertMaterial({color:0x2c2e30}));gunProp.add(gunBody);
  const gunBarrel=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.16,6),new THREE.MeshLambertMaterial({color:0x14161a}));gunBarrel.rotation.x=Math.PI/2;gunBarrel.position.z=-0.22;gunProp.add(gunBarrel);
  gunProp.visible=false;handProp.add(gunProp);
  const meleeProp=new THREE.Group();
  const meleeHandle=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.5,8),new THREE.MeshLambertMaterial({color:0x5a3d1e}));meleeProp.add(meleeHandle);
  const meleeBlade=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.16,0.2),new THREE.MeshLambertMaterial({color:0xaaaaaa}));meleeBlade.position.y=0.3;meleeProp.add(meleeBlade);
  meleeProp.visible=false;handProp.add(meleeProp);
  const itemProp=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.14,0.14),new THREE.MeshLambertMaterial({color:0xc9b458}));itemProp.visible=false;handProp.add(itemProp);
  G.scene.add(grp);
  const rec={grp,torso,head,nameSprite,handProp,gunProp,meleeProp,itemProp,fbxInst,x:0,z:0,yaw:0,hp:100,alive:true,name,tx:0,tz:0,tyaw:0,jumpY:0,tJumpY:0,wKind:'none',crouch:false,crouchAmt:0,animPhase:Math.random()*6.28};
  Net.remotePlayers.set(id,rec);
  return rec;
}
function makeNameSprite(name){
  const G=window.__game;const THREE=G.THREE;
  const cnv=document.createElement('canvas');cnv.width=256;cnv.height=64;
  const ctx=cnv.getContext('2d');ctx.font='bold 34px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';
  ctx.shadowColor='#000';ctx.shadowBlur=6;ctx.fillText((name||'Jugador').slice(0,16),128,42);
  const tex=new THREE.CanvasTexture(cnv);
  const mat=new THREE.SpriteMaterial({map:tex,depthTest:false});
  const spr=new THREE.Sprite(mat);spr.scale.set(1.6,0.4,1);
  return spr;
}
function updateRemoteAvatar(id,name,x,z,yaw,hp,alive,wKind,wId,jumpY,crouch){
  if(id===Net.myId)return;
  const rec=ensureAvatar(id,name);
  if(!rec)return;
  rec.tx=x;rec.tz=z;rec.tyaw=yaw;rec.hp=hp;rec.alive=alive;rec.name=name;
  rec.tJumpY=jumpY||0;
  rec.crouch=!!crouch;
  if(wKind&&wKind!==rec.wKind){
    rec.wKind=wKind;
    rec.gunProp.visible=wKind==='ranged';
    rec.meleeProp.visible=wKind==='melee';
    rec.itemProp.visible=wKind==='item';
  }
  rec.grp.visible=alive;
}
function removeRemoteAvatar(id){
  const rec=Net.remotePlayers.get(id);
  if(!rec)return;
  const G=window.__game;if(G)G.scene.remove(rec.grp);
  Net.remotePlayers.delete(id);
}
function hashStr(s){let h=0;for(let i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))|0;}return h;}

/* ================= Bucle de red (llamado cada frame desde el juego) ============ */
let lastStateSend=0;
window.__netTick=function(dt){
  if(!Net.active||Net.matchEnded)return;
  const G=window.__game;if(!G)return;
  // 1) Interpolar y mover avatares remotos
  for(const [,rec] of Net.remotePlayers){
    const _prevX=rec.x,_prevZ=rec.z;
    rec.x+=(rec.tx-rec.x)*Math.min(1,dt*10);
    rec.z+=(rec.tz-rec.z)*Math.min(1,dt*10);
    let dyaw=rec.tyaw-rec.yaw;while(dyaw>Math.PI)dyaw-=Math.PI*2;while(dyaw<-Math.PI)dyaw+=Math.PI*2;
    rec.yaw+=dyaw*Math.min(1,dt*10);
    rec.jumpY+=((rec.tJumpY||0)-rec.jumpY)*Math.min(1,dt*15);
    rec.crouchAmt=(rec.crouchAmt===undefined?(rec.crouch?1:0):rec.crouchAmt+((rec.crouch?1:0)-rec.crouchAmt)*Math.min(1,dt*10));
    rec.grp.position.set(rec.x,rec.jumpY-rec.crouchAmt*0.32,rec.z);
    rec.grp.rotation.y=rec.yaw;
    if(rec.fbxInst){
      // La velocidad real del jugador remoto controla el ciclo de caminata (piernas/brazos),
      // y jumpY/crouch (recibidos por red) controlan las poses de salto y agachado.
      const spd=Math.hypot(rec.x-_prevX,rec.z-_prevZ)/Math.max(dt,0.0001);
      const moveAmt=Math.min(1,spd/3.2);
      rec.animPhase=(rec.animPhase||0)+dt*(6.5+moveAmt*6.5);
      const jumpAmt=Math.min(1,Math.abs(rec.jumpY)*2.2);
      const isRanged=rec.wKind==='ranged';
      G.poseHumanoidFbx(rec.fbxInst,{phase:rec.animPhase,moveAmt,crouchAmt:rec.crouchAmt,jumpAmt,aimAmt:isRanged?1:0});
    }
  }
  // 2) Enviar nuestro propio estado ~15 veces por segundo
  lastStateSend+=dt;
  if(lastStateSend>1/15){
    lastStateSend=0;
    const s=G.getLocalState();
    send({t:'state',id:Net.myId,name:Net.myName,x:s.x,z:s.z,yaw:s.yaw,hp:s.hp,alive:s.alive,wKind:s.wKind,wId:s.wId,jumpY:s.jumpY,crouch:s.crouch});
    if(s.alive===false)reportOwnDeath();
  }
  // 3) Detección de impactos de bala contra jugadores remotos
  const bullets=G.bullets;
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i];
    for(const [id,rec] of Net.remotePlayers){
      if(!rec.alive)continue;
      const dx=b.x-rec.x,dz=b.z-rec.z,dy=b.y-1.4;
      if(dx*dx+dz*dz+dy*dy<0.42){
        send({t:'hit',targetId:id,dmg:b.dmg,sourceId:Net.myId,sourceName:Net.myName});
        if(b.mesh&&b.mesh.parent)b.mesh.parent.remove(b.mesh);
        bullets.splice(i,1);
        G.showHitMarker();
        break;
      }
    }
  }
  // 4) Host: transmite el estado de los zombies y hace que ataquen a jugadores remotos
  if(Net.isHost){
    lastZombieSend=(lastZombieSend||0)+dt;
    if(lastZombieSend>1/12){
      lastZombieSend=0;
      send({t:'zombies',list:G.getZombieSnapshot()});
    }
  }
};
let lastZombieSend=0;
window.__netDoorState=function(id,open,broken,hp){send({t:'doorState',id,open,broken,hp});};
window.__netWindowState=function(id,broken,hp){send({t:'windowState',id,broken,hp});};
window.__netLootTaken=function(id){send({t:'lootTaken',id});};
window.__netCrateOpened=function(id){send({t:'crateOpened',id});};
window.__netCarState=function(id,x,z,rot,fuel){send({t:'carState',id,x,z,rot,fuel});};
let _reportedDead=false;
function reportOwnDeath(){
  if(_reportedDead)return;_reportedDead=true;
  send({t:'death',id:Net.myId,name:Net.myName});
}
window.__onLocalAttack=function(isRightClick){
  if(!Net.active)return;
  const G=window.__game;if(!G||!G.isAlive())return;
  // Ataque cuerpo a cuerpo simplificado contra jugadores remotos cercanos
  const local=G.getLocalState();
  const item=G.equip[G.activeSlotKey()];
  const meta=item?G.ITEMS[item.id]:null;
  if(meta&&meta.ranged)return; // las armas de fuego ya se resuelven por balas en __netTick
  const dmg=meta&&meta.melee?(isRightClick?(meta.dmgHeavy||52):(meta.dmgLight||28)):(isRightClick?25:12);
  const rng=meta&&meta.melee?2.9:2.5;
  const fx=-Math.sin(local.yaw),fz=-Math.cos(local.yaw);
  for(const [id,rec] of Net.remotePlayers){
    if(!rec.alive)continue;
    const dx=rec.x-local.x,dz=rec.z-local.z,d=Math.hypot(dx,dz);
    if(d<rng){
      const dot=(dx/(d||1))*fx+(dz/(d||1))*fz;
      if(dot>0.55){
        send({t:'hit',targetId:id,dmg,sourceId:Net.myId,sourceName:Net.myName});
      }
    }
  }
};

function checkMatchEnd(){
  if(!Net.isHost||Net.matchEnded)return;
  if(Net.alivePlayers.size<=1&&Net.roster.size>=2){
    Net.matchEnded=true;
    const winnerId=[...Net.alivePlayers][0]||Net.myId;
    const winnerName=(Net.roster.get(winnerId)||{name:'?'}).name;
    send({t:'matchEnd',winnerId,winnerName});
    showMatchEnd(winnerId===Net.myId,winnerName);
  }
}
function showMatchEnd(won,winnerName){
  Net.matchEnded=true;
  const el=document.getElementById('mpMatchEnd');
  document.getElementById('mpMatchEndTitle').textContent=won?'VICTORIA':'DERROTA';
  document.getElementById('mpMatchEndTitle').style.color=won?'var(--accent2)':'var(--danger)';
  document.getElementById('mpMatchEndSub').textContent=won?'¡Eres el último superviviente!':('Ganador: '+winnerName);
  el.style.display='flex';
  if(document.pointerLockElement)document.exitPointerLock();
}
function pushKillFeed(text){
  const wrap=document.getElementById('mpKillFeed');if(!wrap)return;
  const d=document.createElement('div');d.textContent=text;wrap.appendChild(d);
  requestAnimationFrame(()=>d.classList.add('show'));
  setTimeout(()=>{d.style.opacity=0;setTimeout(()=>d.remove(),300);},4200);
}
Net.pushKillFeed=pushKillFeed;

/* ================= Inicio de partida (host y cliente) ================= */
function startLocalMatch(){
  document.getElementById('mpOverlay').style.display='none';
  if(window.__game)window.__game.beginMatch();
}
Net.hostStartGame=function(){
  send({t:'start'});
  startLocalMatch();
};

/* ================= Cableado de la interfaz (lobby) ================= */
function renderHostLobby(){
  const list=document.getElementById('mpHostPlayerList');
  const count=document.getElementById('mpHostCount');
  const startBtn=document.getElementById('mpHostStartBtn');
  if(!list)return;
  list.innerHTML='';
  for(const [id,v] of Net.roster){
    const li=document.createElement('li');
    if(id===Net.myId)li.classList.add('host');
    li.innerHTML='<span class="dot2"></span><b>'+escapeHtml(v.name)+'</b>'+(id===Net.myId?' (tú, host)':'');
    list.appendChild(li);
  }
  count.textContent=Net.roster.size+' / '+MAX_PLAYERS+' jugadores';
  if(Net.roster.size>=2){startBtn.disabled=false;startBtn.textContent='Iniciar partida ▶';}
  else{startBtn.disabled=true;startBtn.textContent='Esperando jugadores… (mínimo 2)';}
}
function escapeHtml(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}

document.addEventListener('DOMContentLoaded',wireLobbyUI);
if(document.readyState==='complete'||document.readyState==='interactive')wireLobbyUI();
function wireLobbyUI(){
  const $=id=>document.getElementById(id);
  if($('mpBtnSolo')._wired)return;
  ['mpBtnSolo','mpBtnHost','mpBtnJoin'].forEach(id=>{$(id)._wired=true;});

  $('mpBtnSolo').onclick=()=>{
    document.getElementById('mpOverlay').style.display='none';
    if(window.__game&&window.__game.spawnInitialZombies)window.__game.spawnInitialZombies();
    if(window.__game&&window.__game.beginMatch)window.__game.beginMatch();
  };
  $('mpBtnHost').onclick=async()=>{
    const name=$('mpPlayerName').value.trim()||'Host';
    $('mpBtnHost').textContent='Creando sala…';
    try{
      const code=await createRoom(name);
      $('mpScreenMode').style.display='none';
      $('mpScreenHost').style.display='block';
      $('mpRoomCodeDisplay').textContent=code;
      Net.onRosterChange=renderHostLobby;
      renderHostLobby();
      if(window.__game&&window.__game.spawnInitialZombies)window.__game.spawnInitialZombies();
    }catch(e){
      $('mpHostStatus').textContent='Error: '+e.message;
      $('mpBtnHost').textContent='Crear sala (Host)';
      alert('No se pudo crear la sala: '+e.message);
    }
  };
  $('mpBtnJoin').onclick=()=>{
    $('mpScreenMode').style.display='none';
    $('mpScreenJoin').style.display='block';
  };
  $('mpHostBack').onclick=()=>{
    $('mpScreenHost').style.display='none';
    $('mpScreenMode').style.display='block';
  };
  $('mpJoinBack').onclick=()=>{
    $('mpScreenJoin').style.display='none';
    $('mpScreenMode').style.display='block';
  };
  $('mpHostStartBtn').onclick=()=>{
    if($('mpHostStartBtn').disabled)return;
    Net.hostStartGame();
  };
  $('mpJoinConnectBtn').onclick=async()=>{
    const name=$('mpPlayerName').value.trim()||'Jugador';
    const code=$('mpJoinCode').value.trim();
    if(!code){$('mpJoinStatus').textContent='Escribe un código de sala.';return;}
    $('mpJoinStatus').textContent='Buscando la sala…';
    $('mpJoinConnectBtn').disabled=true;
    let gotDataChannel=false;
    try{
      await joinRoom(code,name);
      $('mpJoinStatus').textContent='Sala encontrada. Estableciendo conexión con el host…';
      Net.onConnectedToHost=()=>{
        gotDataChannel=true;
        $('mpJoinStatus').textContent='✅ Conectado al host. Esperando a que inicie la partida…';
      };
      Net.onIceStateChange=(state)=>{
        if(gotDataChannel)return;
        if(state==='checking')$('mpJoinStatus').textContent='Sala encontrada. Estableciendo conexión con el host…';
        else if(state==='failed'||state==='disconnected')$('mpJoinStatus').textContent='❌ No se pudo conectar con el host. Prueba estar en la misma red WiFi, o revisa que ambos tengan buena conexión a internet (algunas redes con firewall estricto bloquean la conexión directa).';
      };
      setTimeout(()=>{
        if(!gotDataChannel)$('mpJoinStatus').textContent='⏳ Tardando más de lo normal en conectar… si no conecta en unos segundos más, prueba con ambos en la misma red WiFi.';
      },12000);
      Net.onRosterChange=()=>{
        const list=$('mpJoinPlayerList');list.innerHTML='';
        for(const [id,v] of Net.roster){
          const li=document.createElement('li');
          li.innerHTML='<span class="dot2"></span><b>'+escapeHtml(v.name)+'</b>';
          list.appendChild(li);
        }
      };
    }catch(e){
      $('mpJoinStatus').textContent='Error: '+e.message;
    }finally{
      $('mpJoinConnectBtn').disabled=false;
    }
  };
}
})();
