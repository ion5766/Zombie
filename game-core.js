(function(){"use strict";(function(){const embersWrap=document.getElementById('embers');if(embersWrap){for(let i=0;i<24;i++){const e=document.createElement('div');e.className='ember';const s=2+Math.random()*3;e.style.left=Math.random()*100+'%';e.style.width=s+'px';e.style.height=s+'px';e.style.animationDuration=(7+Math.random()*9)+'s';e.style.animationDelay=(Math.random()*10)+'s';embersWrap.appendChild(e);}}})();function rand(a,b){return a+Math.random()*(b-a);}function clamp(v,a,b){return Math.max(a,Math.min(b,v));}const ITEMS={pistol:{name:'Pistola',icon:'🔫',stack:1,weapon:true,ranged:true,dmg:34,ammo:'ammo9',cooldown:0.28,mag:10,reloadTime:1.3,
desc:'Arma de fuego semiautomática. Dispara munición de 9mm; recárgala con R cuando se vacíe el cargador.'},axe:{name:'Hacha a 2 Manos',icon:'🪓',stack:1,weapon:true,melee:true,dmgLight:28,dmgHeavy:52,bleedDmg:8,bleedDuration:4.0,cooldownLight:0.48,cooldownHeavy:0.95,
desc:'Hacha de leñador a dos manos. Clic izquierdo: tajo rápido. Clic derecho: golpe contundente que provoca sangrado.'},ammo9:{name:'Munición 9mm',icon:'🟡',stack:60,desc:'Cartuchos de 9mm. Se guardan en el inventario y se usan al recargar armas de fuego compatibles, como la pistola.'},
apple:{name:'Manzana',icon:'🍎',stack:20,food:35,thirst:5,useTime:1.4,useLbl:'Comiendo manzana...',desc:'Fruta fresca. Cómela (clic en el hueco) para recuperar hambre y un poco de sed.'},
water:{name:'Agua',icon:'💧',stack:20,thirst:55,useTime:1.4,useLbl:'Bebiendo agua...',desc:'Agua potable embotellada. Bébela para recuperar sed.'},bandage:{name:'Vendaje',icon:'🩹',stack:10,heal:45,useTime:2.6,useLbl:'Vendando la herida...',
desc:'Vendaje improvisado. Úsalo para curar heridas y recuperar salud.'},backpack_standard:{name:'Mochila Estándar',icon:'🎒',stack:1,backpack:true,extraSlots:12,desc:'Mochila básica. Equípala en el hueco de mochila para ampliar tu inventario en 12 huecos extra.'},
hat_cap:{name:'Gorra',icon:'🧢',stack:1,armorSlot:'hat',defense:0.03,desc:'Gorra de tela. Protección mínima. Equípala en el hueco de sombrero.'},mask_bandana:{name:'Bandana',icon:'😷',stack:1,armorSlot:'mask',defense:0.02,
desc:'Cubre el rostro. Protección mínima. Equípala en el hueco de máscara.'},shirt_basic:{name:'Camisa',icon:'👕',stack:1,armorSlot:'shirt',defense:0.05,desc:'Camisa de civil. Ofrece algo de protección. Equípala en el hueco de camisa.'},
pants_basic:{name:'Pantalones',icon:'👖',stack:1,armorSlot:'pants',defense:0.05,desc:'Pantalones de civil. Ofrecen algo de protección. Equípalos en el hueco de pantalones.'},
vest_tactical:{name:'Chaleco Táctico',icon:'🦺',stack:1,armorSlot:'vest',defense:0.20,desc:'Chaleco reforzado. Reduce notablemente el daño recibido. Equípalo en el hueco de chaleco.'},
};function itemName(id){return ITEMS[id]?ITEMS[id].name:id;}function itemIcon(id){return ITEMS[id]?ITEMS[id].icon:'';}function isConsumable(id){const m=ITEMS[id];return m&&(m.food||m.thirst||m.heal);}
const BASE_INV_SIZE=12;let inventory=new Array(BASE_INV_SIZE).fill(null);let equip={primary:null,secondary:null,backpack:null,hat:null,mask:null,shirt:null,pants:null,vest:null};
function playerDamageMultiplier(){let def=0;['hat','mask','shirt','pants','vest'].forEach(k=>{const it=equip[k];if(it&&ITEMS[it.id]&&ITEMS[it.id].defense)def+=ITEMS[it.id].defense;});
return 1-Math.min(0.6,def);}let activeSlotKey='primary';let selectedLoc=null;let menuLoc=null;function getMaxInvSize(){return BASE_INV_SIZE+(equip.backpack?(ITEMS[equip.backpack.id].extraSlots||0):0);}
function syncInventorySize(){const max=getMaxInvSize();while(inventory.length<max)inventory.push(null);if(inventory.length>max)inventory.length=max;}function getItem(loc){return loc.area==='equip'?equip[loc.key]:inventory[loc.index];}
function setItem(loc,item){if(loc.area==='equip')equip[loc.key]=item;else inventory[loc.index]=item;}function addItem(id,qty){qty=qty||1;const meta=ITEMS[id];if(!meta)return false;
for(let i=0;i<inventory.length&&qty>0;i++){const s=inventory[i];if(s&&s.id===id&&s.qty<meta.stack){const add=Math.min(meta.stack-s.qty,qty);s.qty+=add;qty-=add;}}for(let i=0;i<inventory.length&&qty>0;i++){
if(!inventory[i]){const add=Math.min(meta.stack,qty);inventory[i]={id,qty:add};qty-=add;}}refreshInvUI();return qty<=0;}function countItem(id){let n=0;for(const s of inventory)if(s&&s.id===id)n+=s.qty;
for(const k in equip)if(equip[k]&&equip[k].id===id)n+=equip[k].qty||1;return n;}function removeItem(id,qty){for(let i=0;i<inventory.length&&qty>0;i++){const s=inventory[i];
if(s&&s.id===id){const rm=Math.min(s.qty,qty);s.qty-=rm;qty-=rm;if(s.qty<=0)inventory[i]=null;}}refreshInvUI();}const canvas=document.getElementById('renderCanvas');const isCoarsePointer=window.matchMedia&&window.matchMedia('(pointer:coarse)').matches;const renderer=new THREE.WebGLRenderer({canvas,antialias:!isCoarsePointer,logarithmicDepthBuffer:true,powerPreference:'high-performance',stencil:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,isCoarsePointer?1:1.5));renderer.setSize(window.innerWidth,window.innerHeight);const scene=new THREE.Scene();scene.background=new THREE.Color(0xa9c9e6);
/* ===== Modelo de personaje Md_Char_Low_Poly_Man.fbx (jugadores, zombies, inventario, menu) =====
   Este modelo NO trae animaciones propias (solo su pose de referencia), así que en vez de
   reproducir un AnimationClip grabado, las poses de caminar/idle/saltar/agacharse se calculan
   cada frame rotando a mano los huesos del esqueleto (ver poseHumanoidFbx más abajo). Por ahora
   esa animación por código solo se aplica a los JUGADORES; los zombies (que reusan el mismo
   modelo, teñido de verde) se quedan en su pose de referencia (tpose:true), tal como se hacía
   antes con el modelo anterior. */
let charTemplate=null, charTemplateReady=false;
function _fbxBase64ToBuffer(b64){const bin=atob(b64);const buf=new ArrayBuffer(bin.length);const view=new Uint8Array(buf);for(let i=0;i<bin.length;i++)view[i]=bin.charCodeAt(i);return buf;}
(function initCharTemplate(){
  try{
    if(typeof THREE.FBXLoader!=='function'){console.warn('FBXLoader no disponible, se usa el modelo de bloques por defecto.');return;}
    const buf=_fbxBase64ToBuffer(FBX_CHAR_B64);
    const loader=new THREE.FBXLoader();
    const obj=loader.parse(buf,'');
    (function dedupBoneNames(root){
      const seen=new Set();
      root.traverse(o=>{if(o.isBone){if(seen.has(o.name))o.name=o.name+'__dup';else seen.add(o.name);}});
    })(obj);
    // Normaliza escala/orientacion sea cual sea la unidad de exportacion del FBX
    obj.updateMatrixWorld(true);
    let box=new THREE.Box3().setFromObject(obj);
    let size=new THREE.Vector3();box.getSize(size);
    const TARGET_HEIGHT=1.86; // altura aproximada usada por el rig de cajas original
    const s=(size.y>0.0001)?TARGET_HEIGHT/size.y:1;
    obj.scale.setScalar(s);
    // Si el modelo se ve "mirando para adentro de la pantalla" (de espaldas) en vez de de
    // frente, cambia este valor de Math.PI a 0 (o viceversa) — es lo único que depende de
    // cómo se exportó el FBX y solo se puede confirmar viéndolo en pantalla.
    obj.rotation.y=0;
    obj.updateMatrixWorld(true);
    box=new THREE.Box3().setFromObject(obj);
    obj.position.x-=(box.min.x+box.max.x)/2;
    obj.position.z-=(box.min.z+box.max.z)/2;
    obj.position.y-=box.min.y;
    obj.updateMatrixWorld(true);
    obj.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=false;o.receiveShadow=false;}});
    charTemplate=obj;charTemplateReady=true;
    console.log('%c[Modelo FBX] Low Poly Man cargado correctamente ✔','color:#7fd858');
  }catch(e){console.error('[Modelo FBX] No se pudo cargar Md_Char_Low_Poly_Man.fbx, se usa el modelo de bloques por defecto. Motivo:',e);}
})();
// Nombres reales de los huesos de Md_Char_Low_Poly_Man.fbx (no usa el esqueleto Mixamo del
// modelo anterior). Las claves de la derecha (upL, upR, shL...) son las que usa el resto del
// código, así que si el modelo cambia de nuevo solo hay que actualizar los nombres de aquí.
function _fbxFindBones(inst){
  const B=n=>inst.getObjectByName(n);
  const bones={
    hips:B('Hips'),spine:B('Spine_01'),
    upL:B('UpperLeg_L'),upR:B('UpperLeg_R'),
    loL:B('LowerLeg_L'),loR:B('LowerLeg_R'),
    shL:B('Shoulder_L'),shR:B('Shoulder_R'),
    elL:B('Elbow_L'),elR:B('Elbow_R'),
    head:B('Head'),
    handL:B('Hand_L'),handR:B('Hand_R')
  };
  const baseX={},baseY={};
  for(const k in bones){if(bones[k]){baseX[k]=bones[k].rotation.x;baseY[k]=bones[k].rotation.y;}}
  return{bones,baseX,baseY};
}
// Crea una instancia del modelo Low Poly Man. opts.tpose=true (zombies, por ahora) deja el
// modelo tal cual sale del FBX, en su pose de referencia. Por defecto (jugadores, vistas
// previas de menú/inventario) queda listo para que poseHumanoidFbx() lo anime cada frame.
function spawnCharVisual(material,opts){
  if(!charTemplateReady)return null;
  opts=opts||{};
  // Object3D.clone(true) NO reconstruye el Skeleton de un SkinnedMesh: todas las copias
  // seguirían compartiendo el mismo esqueleto del original (por eso ninguna rotación de
  // hueso se veía). THREE.SkeletonUtils.clone sí crea un esqueleto propio por instancia.
  const inst=(THREE.SkeletonUtils&&THREE.SkeletonUtils.clone)?THREE.SkeletonUtils.clone(charTemplate):charTemplate.clone(true);
  inst.traverse(o=>{if(o.isMesh){o.material=material;}});
  const rig=_fbxFindBones(inst);
  inst.userData.bones=rig.bones;inst.userData.baseX=rig.baseX;inst.userData.baseY=rig.baseY;
  inst.userData.isPlayerRig=!opts.tpose;
  inst.userData.animPhase=Math.random()*6.28; // desincroniza el ciclo de piernas entre instancias
  return inst;
}
// Postura de apuntado con arma de fuego (relacionada con el arma equipada, no con el
// ciclo de caminata): el brazo derecho se levanta al frente y el izquierdo acompaña
// como apoyo de dos manos. Se aplica encima de la pose que dejó poseHumanoidFbx.
function animateFbxAim(B,X,aimAmt){
  if(B.shR)B.shR.rotation.x=(X.shR||0)+0.95*aimAmt;
  if(B.elR)B.elR.rotation.x=(B.elR.rotation.x||0)+0.35*aimAmt;
  if(B.shL)B.shL.rotation.x=(X.shL||0)+0.55*aimAmt;
  if(B.elL)B.elL.rotation.x=(B.elL.rotation.x||0)+0.55*aimAmt;
}
// ===== Animación por código de los JUGADORES (Low Poly Man) =====
// Si alguna articulación se dobla "al revés" en pantalla (p.ej. la rodilla dobla hacia
// adelante en vez de hacia atrás), cambia el signo correspondiente aquí (1 <-> -1). Es lo
// único que depende de cómo quedaron orientados los huesos al exportar este FBX en concreto.
const FBX_RIG_SIGN={hip:1,knee:-1,shoulder:1,elbow:1,spine:1};
// params: phase (fase del ciclo de piernas), moveAmt (0-1, cuánto está caminando/corriendo),
// crouchAmt (0-1, agachado), jumpAmt (0-1, en el aire), aimAmt (0-1, apuntando con arma).
function poseHumanoidFbx(inst,params){
  if(!inst||!inst.userData.bones)return;
  const B=inst.userData.bones,X=inst.userData.baseX;
  params=params||{};
  const moveAmt=clamp(params.moveAmt||0,0,1),crouchAmt=clamp(params.crouchAmt||0,0,1),
        jumpAmt=clamp(params.jumpAmt||0,0,1),phase=params.phase||0,aimAmt=params.aimAmt||0;
  const S=FBX_RIG_SIGN,idleAmt=1-Math.max(moveAmt,jumpAmt);
  const idleSway=Math.sin(phase*0.6)*0.045*idleAmt; // leve balanceo al estar quieto (idle)
  const legBend=crouchAmt*0.5+jumpAmt*0.5; // piernas dobladas al agacharse o saltar
  const kneeBend=crouchAmt*0.8+jumpAmt*0.95;
  const walkAmp=moveAmt*0.55*(1-jumpAmt);
  const swing=Math.sin(phase)*walkAmp; // caminar (piernas alternadas)
  const kneeSwingL=Math.max(0,Math.cos(phase))*moveAmt*0.75*(1-jumpAmt);
  const kneeSwingR=Math.max(0,-Math.cos(phase))*moveAmt*0.75*(1-jumpAmt);
  if(B.upL)B.upL.rotation.x=(X.upL||0)+S.hip*(legBend+swing);
  if(B.upR)B.upR.rotation.x=(X.upR||0)+S.hip*(legBend-swing);
  if(B.loL)B.loL.rotation.x=(X.loL||0)+S.knee*(kneeBend+kneeSwingL);
  if(B.loR)B.loR.rotation.x=(X.loR||0)+S.knee*(kneeBend+kneeSwingR);
  if(B.shL)B.shL.rotation.x=(X.shL||0)+S.shoulder*(-swing*0.75+idleSway-jumpAmt*0.35);
  if(B.shR)B.shR.rotation.x=(X.shR||0)+S.shoulder*(swing*0.75-idleSway-jumpAmt*0.35);
  if(B.elL)B.elL.rotation.x=(X.elL||0)+S.elbow*(0.18+Math.max(0,swing)*0.5+jumpAmt*0.3);
  if(B.elR)B.elR.rotation.x=(X.elR||0)+S.elbow*(0.18+Math.max(0,-swing)*0.5+jumpAmt*0.3);
  if(B.spine)B.spine.rotation.x=(X.spine||0)+S.spine*(crouchAmt*0.22+idleAmt*Math.sin(phase*0.6)*0.02);
  if(aimAmt)animateFbxAim(B,X,aimAmt);
}
function syncFbxZombie(z){
  const inst=z.fbxInst;if(!inst)return;
  const B=inst.userData.bones,X=inst.userData.baseX,Y=inst.userData.baseY;
  if(B.upL)B.upL.rotation.x=(X.upL||0)+z.legL.hip.rotation.x;
  if(B.upR)B.upR.rotation.x=(X.upR||0)+z.legR.hip.rotation.x;
  if(B.loL)B.loL.rotation.x=(X.loL||0)-z.legL.knee.rotation.x;
  if(B.loR)B.loR.rotation.x=(X.loR||0)-z.legR.knee.rotation.x;
  if(B.shL)B.shL.rotation.x=(X.shL||0)+z.armL.shoulder.rotation.x;
  if(B.shR)B.shR.rotation.x=(X.shR||0)+z.armR.shoulder.rotation.x;
  if(B.elL)B.elL.rotation.x=(X.elL||0)+z.armL.elbow.rotation.x;
  if(B.elR)B.elR.rotation.x=(X.elR||0)+z.armR.elbow.rotation.x;
  if(B.head)B.head.rotation.y=(Y.head||0)+(z.headPivot.rotation.y||0);
  inst.position.z=z.hips.position.z||0;
  inst.position.y=(z.hips.position.y||0.92)-0.92;
}

/* ====== MAPA DE BLENDER ======
   1) Exporta tu mapa desde Blender como .glb (glTF binario, comprimido).
   2) Coloca el archivo en: app/assets/map/map.glb (junto a este index.html).
   3) Descomenta la línea loadBlenderMap(...) más abajo, al final de este bloque.
   Por ahora esto NO reemplaza colisiones ni el mundo procedural del juego,
   solo lo carga visualmente en la escena para que puedas verlo e iterar.
   La integración de colisiones/spawns con tu mapa se hace en un paso aparte. */
const gltfLoader=(typeof THREE.GLTFLoader==='function')?new THREE.GLTFLoader():null;
function loadBlenderMap(url,opts){opts=opts||{};if(!gltfLoader){console.warn('GLTFLoader no disponible');return;}
gltfLoader.load(url,(gltf)=>{const root=gltf.scene;root.scale.setScalar(opts.scale||1);root.position.set(opts.x||0,opts.y||0,opts.z||0);
scene.add(root);console.log('✅ Mapa de Blender cargado:',url);},undefined,(err)=>{console.log('ℹ️ No se encontró',url,'- usando mapa procedural por defecto.');});}
// loadBlenderMap('./assets/map/map.glb',{scale:1});
scene.fog=new THREE.Fog(0xb6d0e6,40,420);const camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,520);const EYE_HEIGHT_STAND=1.7;const EYE_HEIGHT_CROUCH=0.95;
let currentEyeHeight=EYE_HEIGHT_STAND;camera.position.set(0,EYE_HEIGHT_STAND,0);const hemi=new THREE.HemisphereLight(0xdfe8ea,0x8f9488,.9);scene.add(hemi);const sun=new THREE.DirectionalLight(0xe8eef0,.6);
sun.position.set(30,50,20);scene.add(sun);scene.add(camera);window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();
renderer.setSize(window.innerWidth,window.innerHeight);});const ARENA=460;const SPAWN={x:0,z:-215};const groundMat=new THREE.MeshLambertMaterial({color:0x3d5a2e,polygonOffset:true,polygonOffsetFactor:2,polygonOffsetUnits:2});const ground=new THREE.Mesh(new THREE.PlaneGeometry(ARENA*2+6,ARENA*2+6),groundMat);
ground.rotation.x=-Math.PI/2;scene.add(ground);const wallMat=new THREE.MeshLambertMaterial({color:0x2c3a30,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});function makeWall(x,z,w,d){const m=new THREE.Mesh(new THREE.BoxGeometry(w,3,d),wallMat);m.position.set(x,1.5,z);scene.add(m);}
makeWall(0,-ARENA,ARENA*2+4,1);makeWall(0,ARENA,ARENA*2+4,1);makeWall(-ARENA,0,1,ARENA*2+4);makeWall(ARENA,0,1,ARENA*2+4);const grounditems=[];function spawnGroundItem(x,z,id,qty){
const mesh=new THREE.Mesh(new THREE.SphereGeometry(0.28,10,10),new THREE.MeshBasicMaterial({color:0xffe08a}));mesh.position.set(x,0.5,z);scene.add(mesh);grounditems.push({x,z,id,qty:qty||1,mesh});
const cone=new THREE.Mesh(new THREE.ConeGeometry(0.18,0.5,6),new THREE.MeshBasicMaterial({color:0xffd76b}));cone.position.set(x,1.4,z);cone.rotation.x=Math.PI;scene.add(cone);
}spawnGroundItem(SPAWN.x+4,SPAWN.z+-2.40,'pistol',1);spawnGroundItem(SPAWN.x+1.5,SPAWN.z+0.40,'axe',1);{const box=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.35,0.35),new THREE.MeshLambertMaterial({color:0xd8a83c}));
box.position.set(SPAWN.x+5.4,0.2,SPAWN.z-2.88);scene.add(box);grounditems.push({x:SPAWN.x+5.4,z:SPAWN.z-2.88,id:'ammo9',qty:30,mesh:box});}spawnGroundItem(SPAWN.x+-4,SPAWN.z+-2.40,'apple',3);
spawnGroundItem(SPAWN.x+-5.4,SPAWN.z+-3.36,'water',2);spawnGroundItem(SPAWN.x+-3,SPAWN.z+1.60,'bandage',2);spawnGroundItem(SPAWN.x+2.5,SPAWN.z+2.40,'backpack_standard',1);
spawnGroundItem(SPAWN.x+-2,SPAWN.z+2.80,'vest_tactical',1);spawnGroundItem(SPAWN.x+-1.3,SPAWN.z+3.04,'shirt_basic',1);spawnGroundItem(SPAWN.x+-2.6,SPAWN.z+3.28,'pants_basic',1);
spawnGroundItem(SPAWN.x+-1.8,SPAWN.z+3.68,'hat_cap',1);spawnGroundItem(SPAWN.x-2.9,SPAWN.z+4,'mask_bandana',1);function spawnGroundItemAt(x,y,z,id,qty){const mesh=new THREE.Mesh(new THREE.SphereGeometry(0.22,10,10),new THREE.MeshBasicMaterial({color:0xffe08a}));
mesh.position.set(x,y,z);scene.add(mesh);grounditems.push({x,z,id,qty:qty||1,mesh});const cone=new THREE.Mesh(new THREE.ConeGeometry(0.14,0.4,6),new THREE.MeshBasicMaterial({color:0xffd76b}));
cone.position.set(x,y+0.7,z);cone.rotation.x=Math.PI;scene.add(cone);}const solids=[];let collY=0,collZ=false;const GC=12,SG={},dynS=[],NOS=[];function gridAdd(s){for(let i=Math.floor(s.minX/GC);i<=Math.floor(s.maxX/GC);i++)for(let j=Math.floor(s.minZ/GC);j<=Math.floor(s.maxZ/GC);j++){const k=i+','+j;(SG[k]||(SG[k]=[])).push(s);}}
function near(x,z,r){const i0=Math.floor((x-r)/GC),i1=Math.floor((x+r)/GC),j0=Math.floor((z-r)/GC),j1=Math.floor((z+r)/GC);if(i0===i1&&j0===j1)return SG[i0+','+j0]||NOS;let o=[];for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const a=SG[i+','+j];if(a)o=o.concat(a);}return o;
}function addSolid(cx,cz,w,d,dyn){const obj={minX:cx-w/2,maxX:cx+w/2,minZ:cz-d/2,maxZ:cz+d/2};solids.push(obj);if(dyn)dynS.push(obj);else gridAdd(obj);return obj;}function resolveCollision(x,z,r){return resolveCollisionExcept(x,z,r,null);}
function resolveCollisionExcept(x,z,r,ex){const f=s=>{if(s===ex||(s.y1!==undefined&&(collY<s.y0||collY>s.y1)))return;if(x>s.minX&&x<s.maxX&&z>s.minZ&&z<s.maxZ){const a=x-s.minX,b=s.maxX-x,c=z-s.minZ,e=s.maxZ-z,m=Math.min(a,b,c,e);
if(m===a)x=s.minX-r-.001;else if(m===b)x=s.maxX+r+.001;else if(m===c)z=s.minZ-r-.001;else z=s.maxZ+r+.001;return;}const cx=clamp(x,s.minX,s.maxX),cz=clamp(z,s.minZ,s.maxZ),dx=x-cx,dz=z-cz,dq=dx*dx+dz*dz;
if(dq<r*r){const d=Math.sqrt(dq)||.0001,p=(r-d)+.001;x+=dx/d*p;z+=dz/d*p;}};near(x,z,r+.1).forEach(f);dynS.forEach(f);return{x,z};}const platforms=[];const STAIRS=[];
function stairViolation(x,z,sy,falling){for(const s of STAIRS){if(z<s.minZ||z>s.maxZ||x<s.minX-3||x>s.maxX+3)continue;
if(x>=s.minX-.02&&x<=s.maxX+.02){if(falling)continue;const d=(s.zA-z)*s.sg,i=Math.min(9,Math.max(0,Math.floor(d/.42))),T=s.base+.32*(i+1);if(sy>=s.base-.15&&sy<T-.85)return true;}
else if(!falling&&sy>s.base+.6&&sy<s.top-.6)return true;}return false;}
function guardStairs(){const p=player;if(p.vault)return;const bad=stairViolation(p.x,p.z,p.standY,p.falling);
if(bad&&p.safeOK){p.x=p.safeX;p.z=p.safeZ;p.standY=p.safeY;p.falling=false;}else if(!bad&&!p.falling){p.safeX=p.x;p.safeZ=p.z;p.safeY=p.standY;p.safeOK=true;}}
function resolveIter(x,z,r){let p={x,z};for(let k=0;k<4;k++){const q=resolveAllCollisions(p.x,p.z,r),m=Math.abs(q.x-p.x)+Math.abs(q.z-p.z);p=q;if(m<1e-4)break;}return p;}
function movePlayerSwept(x0,z0,x1,z1,r){const dx=x1-x0,dz=z1-z0,n=Math.min(10,Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12)));let x=x0,z=z0;for(let k=0;k<n;k++){const q=resolveIter(x+dx/n,z+dz/n,r);x=q.x;z=q.z;}return{x,z};}
function pushApartCapped(x,z,r){const ox=x,oz=z;for(const zz of zombies){if(!zz.alive||Math.abs((zz.standY||0)-player.standY)>1.2)continue;const dx=x-zz.x,dz=z-zz.z,dist=Math.hypot(dx,dz),min=r+zz.r;if(dist<min){const push=(min-dist)+.001;x+=(dist>1e-4?dx/dist:1)*push;z+=(dist>1e-4?dz/dist:0)*push;}}let mx=x-ox,mz=z-oz;const m=Math.hypot(mx,mz);if(m>.2){mx*=.2/m;mz*=.2/m;}return{x:ox+mx,z:oz+mz};}
function addPlatform(cx,cz,w,d,topY){platforms.push({minX:cx-w/2,maxX:cx+w/2,minZ:cz-d/2,maxZ:cz+d/2,topY});}
function groundHeightAt(x,z,refY){const hasRef=(refY!==undefined&&refY!==null);const limit=hasRef?refY+0.95:Infinity;let h=0;for(const p of platforms){if(p.topY>h&&p.topY<=limit&&x>=p.minX&&x<=p.maxX&&z>=p.minZ&&z<=p.maxZ)h=p.topY;
}return h;}const wallMat2=new THREE.MeshLambertMaterial({color:0x8c8270});const roofMat=new THREE.MeshLambertMaterial({color:0x6b3a2e});const floorMat=new THREE.MeshLambertMaterial({color:0x7a5c3e});
const woodMat=new THREE.MeshLambertMaterial({color:0x9c7a4a});const darkWoodMat=new THREE.MeshLambertMaterial({color:0x5a4029});const metalMat=new THREE.MeshLambertMaterial({color:0x767a72});
const glassMat=new THREE.MeshLambertMaterial({color:0x9fd6e8,transparent:true,opacity:0.35});function hbox(w,h,d,mat,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
m.position.set(x,y,z);scene.add(m);return m;}const doors=[];const brokenWoodMat=new THREE.MeshLambertMaterial({color:0x3a2c1c});function makeDoor(hingeX,hingeZ,width,height,wallAxis,openDir,col,floorY){
floorY=floorY||0;const XA=wallAxis==='x',pivot=new THREE.Group();pivot.position.set(hingeX,floorY,hingeZ);scene.add(pivot);const orient=new THREE.Group();orient.rotation.y=XA?0:-Math.PI/2;pivot.add(orient);
const lit=c=>(Math.min(255,((c>>16)&255)+26)<<16)|(Math.min(255,((c>>8)&255)+20)<<8)|Math.min(255,(c&255)+14);const dm=col?mt(col):darkWoodMat,lm=col?mt(lit(col)):darkWoodMat,decor=[];
const panel=new THREE.Mesh(new THREE.BoxGeometry(width,height,0.07),dm);panel.position.set(width/2,height/2+0.03,0);orient.add(panel);for(const sd of[-1,1]){for(const ry of[-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(width*.66,height*.36,0.02),lm);m.position.set(0,ry*height*.235,sd*0.04);panel.add(m);decor.push(m);}
const hy=1.0-(height/2+0.03),lev=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.028,0.035),metalMat);lev.position.set(width/2-0.16,hy,sd*0.075);panel.add(lev);decor.push(lev);
const rose=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.13,0.012),metalMat);rose.position.set(width/2-0.09,hy-0.03,sd*0.045);panel.add(rose);decor.push(rose);}const fc=0x3a2a1c,hf=0.06;
if(XA){bx(0.12,height+hf,0.3,fc,hingeX-0.06,floorY+(height+hf)/2,hingeZ,undefined,1);bx(0.12,height+hf,0.3,fc,hingeX+width+0.06,floorY+(height+hf)/2,hingeZ,undefined,1);bx(width+0.24,0.12,0.3,fc,hingeX+width/2,floorY+height+hf,hingeZ,undefined,1);}
else{bx(0.3,height+hf,0.12,fc,hingeX,floorY+(height+hf)/2,hingeZ-0.06,undefined,1);bx(0.3,height+hf,0.12,fc,hingeX,floorY+(height+hf)/2,hingeZ+width+0.06,undefined,1);bx(0.3,0.12,width+0.24,fc,hingeX,floorY+height+hf,hingeZ+width/2,undefined,1);}
const splinters=[];for(let i=0;i<3;i++){const sp=new THREE.Mesh(new THREE.BoxGeometry(rand(0.04,0.08),rand(0.18,0.4),0.02),brokenWoodMat);sp.position.set(width/2+rand(-width*0.4,width*0.4),rand(0.3,height-0.2),rand(-0.05,0.05));
sp.rotation.z=rand(-0.6,0.6);sp.visible=false;orient.add(sp);splinters.push(sp);}const offset=width/2,half=0.16;let minX,maxX,minZ,maxZ;if(XA){minX=Math.min(hingeX,hingeX+width);maxX=Math.max(hingeX,hingeX+width);minZ=hingeZ-half;maxZ=hingeZ+half;}
else{minZ=Math.min(hingeZ,hingeZ+width);maxZ=Math.max(hingeZ,hingeZ+width);minX=hingeX-half;maxX=hingeX+half;}const d={pivot,panel,splinters,decor,open:false,broken:false,
x:hingeX+(XA?offset:0),z:hingeZ+(XA?0:offset),openDir:openDir||1,minX,maxX,minZ,maxZ,hp:55+width*18,maxhp:55+width*18,_seed:rand(0,10),_restRotY:0,_restRotZ:0,floorY,doorHeight:height
};doors.push(d);return d;}function breakDoorVisual(d){d.panel.material=brokenWoodMat;d.decor.forEach(m=>{m.visible=false;});d._restRotZ=(Math.random()<0.5?-1:1)*rand(0.18,0.32);
d._restRotY=d.openDir*rand(1.4,1.9);d.panel.rotation.z=d._restRotZ;d.panel.position.y-=0.06;for(const s of d.splinters)s.visible=true;}function updateDoors(dt){for(const d of doors){
if(d.broken){const sway=Math.sin(performance.now()*0.0011+d._seed)*0.05;d.pivot.rotation.y+=(d._restRotY+sway-d.pivot.rotation.y)*Math.min(1,dt*4);continue;}const target=d.open?d.openDir*1.75:0;
d.pivot.rotation.y+=(target-d.pivot.rotation.y)*Math.min(1,dt*6);}}function resolveDoorCollision(x,z,r){for(const d of doors){const fy=d.floorY||0;if(d.open||d.broken||collY<fy-.2||collY>fy+1.5||Math.abs(x-d.x)>3||Math.abs(z-d.z)>3)continue;
const cx=clamp(x,d.minX,d.maxX),cz=clamp(z,d.minZ,d.maxZ);const dx=x-cx,dz=z-cz,distSq=dx*dx+dz*dz;if(distSq<r*r){const dist=Math.sqrt(distSq)||0.0001,push=(r-dist)+0.001;x+=(dx/dist)*push;z+=(dz/dist)*push;}
}return{x,z};}function netSyncDoor(d){if(window.MPNet&&MPNet.active&&window.__netDoorState)window.__netDoorState(d.netId,d.open,d.broken,d.hp);}
function damageDoor(d,dmg,source){if(d.broken)return;d.hp-=dmg;d.panel.position.x+=(Math.random()-0.5)*0.01;if(d.hp<=0){d.broken=true;d.open=true;breakDoorVisual(d);
if(source==='player'){showMsg('¡Derribaste la puerta! Quedó destrozada y no se puede cerrar. El ruido atrae zombies...');alertZombiesNear(d.x,d.z,15);}else{showMsg('¡Un zombie derribó una puerta! Quedó destrozada. El ruido atrae a otros...');alertZombiesNear(d.x,d.z,13);}
}netSyncDoor(d);}const brokenGlassMat=new THREE.MeshLambertMaterial({color:0x9fd6e8,transparent:true,opacity:0.55,side:THREE.DoubleSide});const windows=[];function makeWindow(hingeX,hingeZ,width,height,wallAxis,sillY){
sillY=sillY==null?0.9:sillY;const half=0.13;let minX,maxX,minZ,maxZ,cx,cz;if(wallAxis==='x'){minX=hingeX;maxX=hingeX+width;minZ=hingeZ-half;maxZ=hingeZ+half;cx=hingeX+width/2;cz=hingeZ;}
else{minZ=hingeZ;maxZ=hingeZ+width;minX=hingeX-half;maxX=hingeX+half;cx=hingeX;cz=hingeZ+width/2;}const glass=new THREE.Mesh(new THREE.BoxGeometry(wallAxis==='x'?width:0.05,height,wallAxis==='x'?0.05:width),glassMat);
glass.position.set(cx,sillY+height/2,cz);scene.add(glass);const w={x:cx,z:cz,minX,maxX,minZ,maxZ,hp:40,maxhp:40,broken:false,glass,width,height,wallAxis,sillY};windows.push(w);
return w;}function makeWindowI(im,i,hx,hz,width,height,wallAxis,sillY){const half=0.13;let minX,maxX,minZ,maxZ,cx,cz;if(wallAxis==='x'){minX=hx;maxX=hx+width;minZ=hz-half;maxZ=hz+half;cx=hx+width/2;cz=hz;}
else{minZ=hz;maxZ=hz+width;minX=hx-half;maxX=hx+half;cx=hx;cz=hz+width/2;}const dm=new THREE.Object3D();dm.position.set(cx,sillY+height/2,cz);dm.scale.set(wallAxis==='x'?width:0.05,height,wallAxis==='x'?0.05:width);dm.updateMatrix();im.setMatrixAt(i,dm.matrix);im.instanceMatrix.needsUpdate=true;
const glass={set visible(v){if(!v){dm.scale.set(0,0,0);dm.updateMatrix();im.setMatrixAt(i,dm.matrix);im.instanceMatrix.needsUpdate=true;}}};const w={x:cx,z:cz,minX,maxX,minZ,maxZ,hp:40,maxhp:40,broken:false,glass,width,height,wallAxis,sillY};
windows.push(w);return w;}function resolveWindowCollision(x,z,r){for(const w of windows){if(w.broken&&collZ)continue;if(Math.abs(x-w.x)>3||Math.abs(z-w.z)>3||Math.abs(w.sillY-.9-collY)>1.7)continue;
const cx=clamp(x,w.minX,w.maxX),cz=clamp(z,w.minZ,w.maxZ);const dx=x-cx,dz=z-cz,distSq=dx*dx+dz*dz;if(distSq<r*r){const dist=Math.sqrt(distSq)||0.0001,push=(r-dist)+0.001;x+=(dx/dist)*push;z+=(dz/dist)*push;}
}return{x,z};}function breakWindowVisual(w){w.glass.visible=false;const jaggedGroup=new THREE.Group();scene.add(jaggedGroup);for(let i=0;i<6;i++){const shard=new THREE.Mesh(new THREE.ConeGeometry(rand(0.03,0.07),rand(0.1,0.22),3),brokenGlassMat);
const alongEdge=rand(-0.5,0.5);const px=w.wallAxis==='x'?w.x+alongEdge*w.width:w.x+(Math.random()<0.5?-1:1)*0.03;const pz=w.wallAxis==='x'?w.z+(Math.random()<0.5?-1:1)*0.03:w.z+alongEdge*w.width;
const edgeY=Math.random()<0.5?w.sillY+0.03:w.sillY+w.height-0.03;shard.position.set(px,edgeY,pz);shard.rotation.z=Math.random()<0.5?Math.PI:0;shard.rotation.x=rand(-0.4,0.4);shard.rotation.y=rand(0,Math.PI*2);
jaggedGroup.add(shard);}w.jaggedGroup=jaggedGroup;const shardsGround=new THREE.Group();scene.add(shardsGround);const gy=(w.sillY-0.9)+0.012;for(let i=0;i<9;i++){const gs=new THREE.Mesh(new THREE.PlaneGeometry(rand(0.05,0.15),rand(0.05,0.15)),brokenGlassMat);
gs.rotation.x=-Math.PI/2;gs.rotation.z=rand(0,Math.PI*2);gs.position.set(w.x+rand(-0.55,0.55),gy,w.z+rand(-0.55,0.55));shardsGround.add(gs);}w.groundShards=shardsGround;}
function damageWindow(w,dmg,source){if(w.broken)return;w.hp-=dmg;if(w.hp<=0){w.broken=true;breakWindowVisual(w);spawnBloodImpact(new THREE.Vector3(w.x,1.4,w.z),0xbfe6ee);
if(source==='player'){showMsg('¡Rompiste la ventana! El ruido atrae zombies...');alertZombiesNear(w.x,w.z,15);}else{showMsg('¡Un zombie rompió una ventana! El ruido atrae a otros...');alertZombiesNear(w.x,w.z,13);}
}if(window.MPNet&&MPNet.active&&window.__netWindowState)window.__netWindowState(w.netId,w.broken,w.hp);}function alertZombiesNear(x,z,radius,full){for(const zz of zombies){if(!zz.alive)continue;const d=Math.hypot(zz.x-x,zz.z-z);if(d>radius*zz.t.hear)continue;const j=(d/radius+.2)*2;zz.lastX=x+rand(-j,j);zz.lastZ=z+rand(-j,j);zz.lastT=0;
zz.aware=Math.max(zz.aware,d<radius*(full||.45)?1.3:.6);}}function resolveAllCollisions(x,z,r){let res=resolveCollision(x,z,r);res=resolveDoorCollision(res.x,res.z,r);res=resolveWindowCollision(res.x,res.z,r);
return res;}function resolveAllCollisionsExceptWindows(x,z,r){let res=resolveCollision(x,z,r);res=resolveDoorCollision(res.x,res.z,r);return res;}function pointBlockedBySolid(x,z){{const g=s=>x>=s.minX&&x<=s.maxX&&z>=s.minZ&&z<=s.maxZ&&!(s.y1!==undefined&&(collY<s.y0||collY>s.y1));if(near(x,z,0).some(g)||dynS.some(g))return true;}
for(const d of doors){const fy=d.floorY||0;if(!d.open&& !d.broken&&x>=d.minX&&x<=d.maxX&&z>=d.minZ&&z<=d.maxZ&&collY>=fy-.2&&collY<=fy+(d.doorHeight||2.3)+.2)return true;}return false;}function pushApartFromZombies(x,z,r,excludeZombie){for(const zz of zombies){
if(!zz.alive||zz===excludeZombie)continue;const dx=x-zz.x,dz=z-zz.z,dist=Math.hypot(dx,dz);const minDist=r+zz.r;if(dist<minDist){const push=(minDist-dist)+0.001;const nx=dist>0.0001?dx/dist:1,nz=dist>0.0001?dz/dist:0;
x+=nx*push;z+=nz*push;}}return{x,z};}function findNearestBreakable(x,z,yy,tx,tz){let best=null,bestS=1e9,type=null;const sc=o=>{const d=Math.hypot(o.x-x,o.z-z);return d>=16?1e9:(tx===undefined?d:d+Math.hypot(o.x-tx,o.z-tz));};
for(const d of doors){if(!d.open&&!d.broken&&(yy===undefined||Math.abs((d.floorY||0)-yy)<1.7)){const q=sc(d);if(q<bestS){bestS=q;best=d;type='door';}}}for(const w of windows){if(!w.broken&&(yy===undefined||Math.abs(w.sillY-.9-yy)<1.7)){const q=sc(w);if(q<bestS){bestS=q;best=w;type='window';}}}
return best?{ref:best,type}:null;}const lootCrates=[];function makeCrate(x,z,loot){const grp=new THREE.Group();grp.position.set(x,0,z);scene.add(grp);const base=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.42,0.5),woodMat);base.position.y=0.21;grp.add(base);
const bandTop=new THREE.Mesh(new THREE.BoxGeometry(0.74,0.05,0.54),metalMat);bandTop.position.y=0.4;grp.add(bandTop);const bandMid=new THREE.Mesh(new THREE.BoxGeometry(0.74,0.05,0.54),metalMat);bandMid.position.y=0.15;grp.add(bandMid);
const lidPivot=new THREE.Group();lidPivot.position.set(0,0.42,-0.25);grp.add(lidPivot);const lid=new THREE.Mesh(new THREE.BoxGeometry(0.74,0.06,0.54),darkWoodMat);lid.position.set(0,0,0.25);lidPivot.add(lid);
const c={x,z,r:0.9,opened:false,lidPivot,loot:loot||['ammo9']};lootCrates.push(c);return c;}function updateCrates(dt){for(const c of lootCrates){const ax=c.axis||'x',target=c.opened?(c.ang===undefined?-1.9:c.ang):0;
c.lidPivot.rotation[ax]+=(target-c.lidPivot.rotation[ax])*Math.min(1,dt*5);}}function openCrate(c){if(c.opened)return;c.opened=true;const found=[];for(const id of c.loot){
const meta=ITEMS[id];if(!meta)continue;const qty=meta.stack>1?Math.round(rand(1,Math.min(6,meta.stack))):1;addItem(id,qty);found.push(itemName(id)+' x'+qty);}showMsg((c.name||'Caja')+' abierto: '+found.join(', '));
if(window.MPNet&&MPNet.active&&window.__netCrateOpened)window.__netCrateOpened(c.netId);
}function pickupGroundItem(gi){addItem(gi.id,gi.qty);scene.remove(gi.mesh);const idx=grounditems.indexOf(gi);if(idx>=0)grounditems.splice(idx,1);if(window.MPNet&&MPNet.active&&window.__netLootTaken)window.__netLootTaken(gi.netId);}
const interiorLights=[];function updateLights(dt){lightFlickerT+=dt;for(const l of interiorLights){l.intensity=l._base+Math.sin(lightFlickerT*3+l._seed)*0.08;}}let lightFlickerT=0;
function furnishHouse(cx,cz,halfW,halfD,dividerX){const shelfX=cx-3,shelfZ=cz+halfD-0.35;hbox(1.4,1.7,0.28,darkWoodMat,shelfX,0.85,shelfZ);hbox(1.3,0.05,0.26,woodMat,shelfX,0.5,shelfZ+0.03);
hbox(1.3,0.05,0.26,woodMat,shelfX,1.0,shelfZ+0.03);hbox(1.3,0.05,0.26,woodMat,shelfX,1.5,shelfZ+0.03);spawnGroundItemAt(shelfX-0.35,1.07,shelfZ,'bandage',3);spawnGroundItemAt(shelfX+0.35,1.57,shelfZ,'apple',4);
const tableX=cx-1.6,tableZ=cz-1.0;hbox(0.9,0.06,0.6,woodMat,tableX,0.72,tableZ);hbox(0.06,0.7,0.06,darkWoodMat,tableX-0.38,0.35,tableZ-0.24);hbox(0.06,0.7,0.06,darkWoodMat,tableX+0.38,0.35,tableZ-0.24);
hbox(0.06,0.7,0.06,darkWoodMat,tableX-0.38,0.35,tableZ+0.24);hbox(0.06,0.7,0.06,darkWoodMat,tableX+0.38,0.35,tableZ+0.24);spawnGroundItemAt(tableX,0.82,tableZ,'water',2);
makeCrate(cx-3.6,cz-2.6,['ammo9','bandage']);makeCrate(dividerX+1.8,cz+1.7,['apple','water']);const bedX=dividerX+1.9,bedZ=cz-1.5;hbox(1.7,0.35,0.9,darkWoodMat,bedX,0.18,bedZ);
hbox(1.6,0.18,0.8,new THREE.MeshLambertMaterial({color:0xcdd6c9}),bedX,0.4,bedZ);hbox(1.7,0.4,0.12,darkWoodMat,bedX,0.4,bedZ-0.45);const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.75,10),new THREE.MeshLambertMaterial({color:0x5a6b3a}));
barrel.position.set(cx-halfW+0.8,0.38,cz+1.5);scene.add(barrel);spawnGroundItemAt(cx-halfW+0.8,0.8,cz+1.1,'ammo9',20);}const cars=[];let isDriving=false;let drivingCar=null;let _carNetT=0;
function makeCarProp(x,z,rotY,bodyColor,loot){const grp=new THREE.Group();grp.position.set(x,0,z);grp.rotation.y=rotY||0;scene.add(grp);const bodyMatC=new THREE.MeshLambertMaterial({color:bodyColor});
const glassMatC=new THREE.MeshLambertMaterial({color:0x9fd6e8,transparent:true,opacity:0.5});const tireMat=new THREE.MeshLambertMaterial({color:0x1c1c1c});const rimMat=new THREE.MeshLambertMaterial({color:0xd0d0d0});
const bumperMat=new THREE.MeshLambertMaterial({color:0x2a2a26});const flatTireMat=new THREE.MeshLambertMaterial({color:0x0c0c0c});const chassis=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.5,4.0),bodyMatC);chassis.position.y=0.6;grp.add(chassis);
const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.55,2.0),bodyMatC);cabin.position.set(0,1.08,-0.2);grp.add(cabin);const glassF=new THREE.Mesh(new THREE.BoxGeometry(1.48,0.46,0.05),glassMatC);glassF.position.set(0,1.08,0.78);grp.add(glassF);
const glassB=glassF.clone();glassB.position.z=-1.18;grp.add(glassB);const wheelsArr=[];[[-1.02,0.38,1.25],[1.02,0.38,1.25],[-1.02,0.38,-1.25],[1.02,0.38,-1.25]].forEach(([wx,wy,wz])=>{
const wheel=new THREE.Mesh(new THREE.CylinderGeometry(0.38,0.38,0.36,16),tireMat);wheel.rotation.z=Math.PI/2;wheel.position.set(wx,wy,wz);grp.add(wheel);const rim=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.37,12),rimMat);
rim.rotation.z=Math.PI/2;rim.position.set(wx,wy,wz);grp.add(rim);wheelsArr.push({mesh:wheel,rim,flatMat:flatTireMat,lx:wx,ly:wy,lz:wz,hp:32,maxhp:32,destroyed:false});});
const bumperF=new THREE.Mesh(new THREE.BoxGeometry(1.78,0.18,0.15),bumperMat);bumperF.position.set(0,0.45,2.0);grp.add(bumperF);const bumperB=bumperF.clone();bumperB.position.z=-2.0;grp.add(bumperB);
const aligned=Math.abs(Math.sin(rotY||0))<0.5;const solidObj=addSolid(x,z,aligned?2.2:4.2,aligned?4.2:2.2,true);const trunkOff=new THREE.Vector3(0,0,-2.4).applyEuler(new THREE.Euler(0,rotY||0,0));
const crate=makeCrate(x+trunkOff.x,z+trunkOff.z,loot||['ammo9']);const hasFuel=Math.random()>0.4;const fuel=hasFuel?Math.floor(rand(35,100)):0;const carData={grp,x,z,rotY:rotY||0,
solidObj,crate,fuel,maxFuel:100,speed:0,maxSpeed:14,accel:11,decel:12,steerSpeed:1.8,wheels:wheelsArr
};cars.push(carData);return grp;}function damageWheel(car,wheel,dmg){if(wheel.destroyed)return;wheel.hp-=dmg;if(wheel.hp<=0){wheel.destroyed=true;wheel.mesh.scale.set(1,0.32,1);
wheel.mesh.position.y=wheel.ly-0.14;wheel.mesh.material=wheel.flatMat;wheel.rim.visible=false;showMsg('¡Reventaste una rueda del vehículo!');}}function carSpeedFactor(car){
if(!car.wheels)return 1;const destroyed=car.wheels.filter(w=>w.destroyed).length;return destroyed===0?1:Math.max(0.18,1-destroyed*0.24);}const LK={x0:206,x1:317,z0:-470,z1:470},WM={},CL=[-108,-54,0,54,108],PI=Math.PI;
const mt=c=>WM[c]||(WM[c]=new THREE.MeshLambertMaterial({color:c,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1}));const WML={};const mtL=(c,ly)=>{const k=c+'|'+(ly||0);return WML[k]||(WML[k]=new THREE.MeshLambertMaterial({color:c,polygonOffset:true,polygonOffsetFactor:ly?-1.5:3,polygonOffsetUnits:ly?-1.5:3}));};const pick=a=>a[Math.floor(Math.random()*a.length)];function plane(w,d,c,x,y,z,op){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),op?new THREE.MeshLambertMaterial({color:c,transparent:true,opacity:op}):mt(c));m.rotation.x=-PI/2;m.position.set(x,y,z);scene.add(m);return m;}
function zoneName(x,z){return'⬜ Llanura';}const LT={dock:['water','apple','bandage','hat_cap','water'],car:['ammo9','bandage','water','apple','ammo9']};const lootFor=(t,n)=>Array.from({length:n},()=>pick(LT[t]));
const BTc={},UB=new THREE.BoxGeometry(1,1,1),UP=UB.attributes.position.array,UN=UB.attributes.normal.array,UI=UB.index.array;let curB='x';function bx(w,h,d,c,x,y,z,ry,ly){const k=curB+'|'+c+'|'+(ly||0),b=BTc[k]||(BTc[k]={p:[],n:[],i:[],c,ly:ly||0}),cs=ry?Math.cos(ry):1,sn=ry?Math.sin(ry):0,o=b.p.length/3;
for(let i=0;i<UP.length;i+=3){const px=UP[i]*w,pz=UP[i+2]*d,nx=UN[i],nz=UN[i+2];b.p.push(px*cs+pz*sn+x,UP[i+1]*h+y,-px*sn+pz*cs+z);b.n.push(nx*cs+nz*sn,UN[i+1],-nx*sn+nz*cs);}
for(let i=0;i<UI.length;i++)b.i.push(UI[i]+o);}function flushBT(){for(const k in BTc){const b=BTc[k],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(b.p),3));g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(b.n),3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(b.i),1));
scene.add(new THREE.Mesh(g,b.c==='g'?glassMat:mtL(b.c,b.ly)));delete BTc[k];}}function signBoard(txt,col,x,y,z,ry){const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');
g.fillStyle=col;g.fillRect(0,0,256,64);g.fillStyle='#fff';g.font='bold 30px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,128,34);const m=new THREE.Mesh(new THREE.PlaneGeometry(5,1.25),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));m.position.set(x,y,z);m.rotation.y=ry;scene.add(m);return m;}const DK={cama:{w:1.7,d:2.1,p:[[1.6,.4,2,0x5a3a22,0,.2,0],[1.5,.25,1.9,0xdfe3e8,0,.52,0],[1.2,.12,.4,0xffffff,0,.72,.7],[1.7,.9,.1,0x5a3a22,0,.55,1]]},sofa:{w:2.1,d:.95,p:[[2,.45,.9,0x4a5a7a,0,.22,0],[2,.5,.25,0x3f4d6b,0,.65,.32],[.25,.3,.9,0x3f4d6b,-.9,.55,0],[.25,.3,.9,0x3f4d6b,.9,.55,0]]},
mesa_c:{w:1.2,d:.7,p:[[1.2,.06,.7,0x6b4a2e,0,.42,0],[.08,.4,.08,0x4a3520,-.5,.2,-.25],[.08,.4,.08,0x4a3520,.5,.2,.25]]},mesa:{w:1.5,d:.9,p:[[1.5,.06,.9,0x8a5a2b,0,.75,0],[.1,.75,.1,0x5a3a22,-.65,.37,-.35],[.1,.75,.1,0x5a3a22,.65,.37,.35]]},
silla:{w:0,d:0,p:[[.45,.06,.45,0x6b4a2e,0,.45,0],[.45,.5,.06,0x6b4a2e,0,.7,.2],[.08,.45,.08,0x4a3520,0,.22,0]]},tv:{w:1.1,d:.4,p:[[1.1,.5,.4,0x3a2a1a,0,.25,0],[1,.6,.06,0x111114,0,.85,0]]},
cocina:{w:1,d:.6,p:[[1,.9,.6,0xd8d8d8,0,.45,0],[.9,.03,.5,0x222222,0,.91,0]]},inodoro:{w:.45,d:.7,p:[[.4,.4,.5,0xf2f2f2,0,.2,-.05],[.4,.5,.15,0xf2f2f2,0,.6,.28]]},lavabo:{w:.6,d:.45,p:[[.55,.85,.4,0xf2f2f2,0,.42,0]]},
banera:{w:1.8,d:.8,p:[[1.75,.55,.75,0xf2f2f2,0,.28,0]]},escritorio:{w:1.6,d:.8,p:[[1.6,.06,.8,0x6b4a2e,0,.74,0],[.06,.7,.7,0x5a3a22,-.75,.35,0],[.06,.7,.7,0x5a3a22,.75,.35,0],[.5,.02,.3,0x111111,0,.78,-.1]]},
silla_of:{w:0,d:0,p:[[.5,.08,.5,0x222222,0,.5,0],[.5,.55,.08,0x222222,0,.8,.25],[.08,.45,.08,0x444444,0,.25,0]]},mostrador:{w:3,d:.8,p:[[3,1.05,.7,0x7a6a55,0,.52,0],[3.1,.06,.85,0xd8d0c0,0,1.08,0]]},
planta:{w:.5,d:.5,p:[[.4,.4,.4,0x8a4a2a,0,.2,0],[.6,.7,.6,0x2f6b32,0,.75,0]]},estante:{w:2,d:.45,p:[[2,1.8,.4,0xc9c2b0,0,.9,0],[1.8,.22,.32,0xd04a3a,0,.5,-.02],[1.8,.22,.32,0x3a7bd0,0,.95,-.02],[1.8,.22,.32,0xe0b13c,0,1.4,-.02]]}
};const FK={cajonera:{w:1.1,d:.5,h:.9,c:0x8a5a2b,dc:0xa8743c,ax:'x',ang:-1.9,nm:'Cajonera',l:['shirt_basic','pants_basic','hat_cap','mask_bandana','bandage']},mesita:{w:.5,d:.45,h:.55,c:0x9c6b3a,dc:0xb98650,ax:'x',ang:-1.9,nm:'Mesita de noche',l:['bandage','ammo9','water','hat_cap']},
armario:{w:1.2,d:.6,h:2.1,c:0x6b4423,dc:0x7d5530,ax:'y',ang:1.9,nm:'Armario',l:['shirt_basic','pants_basic','vest_tactical','backpack_standard','hat_cap','mask_bandana']},
refri:{w:.8,d:.7,h:1.8,c:0xe8e8e8,dc:0xf6f6f6,ax:'y',ang:1.9,nm:'Refrigerador',l:['apple','water','apple','water']},gabinete:{w:1.6,d:.6,h:.9,c:0xb08d57,dc:0xc7a46d,ax:'x',ang:-1.9,nm:'Gabinete',l:['apple','water','bandage','ammo9']},
archivador:{w:.5,d:.65,h:1.3,c:0x8a8f96,dc:0xa2a8b0,ax:'x',ang:-1.9,nm:'Archivador',l:['bandage','water','ammo9','hat_cap','shirt_basic']},caja_fuerte:{w:.9,d:.7,h:.9,c:0x2b2b2e,dc:0x3d3d42,ax:'y',ang:1.9,nm:'Caja fuerte',l:['ammo9','vest_tactical','pistol','ammo9','backpack_standard']},
gondola:{w:2,d:.5,h:1.5,c:0xc9c2b0,dc:0xdfd8c6,ax:'x',ang:-1.9,nm:'Góndola',l:['apple','water','apple','bandage','backpack_standard','mask_bandana']},nevera:{w:1,d:.7,h:1.9,c:0xbfd8e0,dc:0xd8eef4,ax:'y',ang:1.9,nm:'Nevera',l:['water','water','apple']},
registro:{w:.6,d:.5,h:1.1,c:0x3a3a3e,dc:0x55555a,ax:'x',ang:-1.9,nm:'Caja registradora',l:['ammo9','bandage','water']}};const SZ={house:{w:14,d:11,H:3.2,nF:()=>pick([1,1,2,2,2,3]),wc:[0xd9c9a3,0xc7d1d6,0xb7a58a,0xd8b4a0,0xa9b8a0],rc:[0x7a3b2e,0x4a4a52,0x5b3b2a],fc:0x8a6a45,ww:1.6},
store:{w:22,d:16,H:4.2,nF:()=>1,wc:[0xd8b86a],rc:[0x444448],fc:0xb9b3a4,ww:3,sg:['TIENDA','#2e7d32']},rest:{w:20,d:15,H:4,nF:()=>1,wc:[0xa8503c],rc:[0x444448],fc:0x6a4a34,ww:2.6,sg:['RESTAURANTE','#b23a2e']},
bank:{w:22,d:16,H:4.4,nF:()=>1,wc:[0xcfcfc8],rc:[0x555558],fc:0xa89f8f,ww:2.4,sg:['BANCO','#1d4e89']},tower:{w:18,d:18,H:3.2,nF:()=>6+Math.floor(Math.random()*5),wc:[0x6f8493,0x7a8d98,0x5f7f95,0x8ea0a8,0x4d6478,0xa4b4bd],rc:[0x3a3f45],fc:0xc9c5bb,ww:2.6,sg:['CORPORATIVO','#22303c']},
apt:{w:16,d:14,H:3.2,nF:()=>3+Math.floor(Math.random()*2),wc:[0xc8b8a0,0xb9c4c9,0xd0a890,0x9fb0a4],rc:[0x4a4a52],fc:0xc9c5bb,ww:2.2},station:{w:34,d:14,H:5,nF:()=>1,wc:[0xb59a72],rc:[0x3a3f45],fc:0xd4cdbd,ww:3.2,sg:['CENTRAL','#7a2e2e']},cabin:{w:9,d:7,H:3,nF:()=>1,wc:[0x6b4a2e],rc:[0x3a2a1a],fc:0x7a5a3a,ww:1.6}};function sub(R,h){return R.flatMap(r=>{if(h[1]<=r[0]||h[0]>=r[1]||h[3]<=r[2]||h[2]>=r[3])return[r];const o=[],a=Math.max(h[0],r[0]),c=Math.min(h[1],r[1]);if(h[0]>r[0])o.push([r[0],h[0],r[2],r[3]]);if(h[1]<r[1])o.push([h[1],r[1],r[2],r[3]]);if(h[2]>r[2])o.push([a,c,r[2],h[2]]);if(h[3]<r[3])o.push([a,c,h[3],r[3]]);return o;});}
function EXT(t,cx,cz,w,d,H,nF,y){if(t==='house'||t==='cabin')return;const A0={tower:0x2b3138,apt:0xe8e2d4,bank:0x8a8a84,store:0x3a3a3e,rest:0x3a2a1c,station:0x7a2e2e}[t]||0x333333,hw=w/2,hd=d/2,T=y(nF);
for(let f=1;f<=nF;f++)bx(w+.5,.25,d+.5,A0,cx,y(f)-.12,cz);for(const a of[-1,1])for(const b of[-1,1])bx(.9,T,.9,A0,cx+a*hw,T/2,cz+b*hd);
bx(w+.9,.8,.35,A0,cx,T+.7,cz+hd+.1);bx(w+.9,.8,.35,A0,cx,T+.7,cz-hd-.1);bx(.35,.8,d+.9,A0,cx+hw+.1,T+.7,cz);bx(.35,.8,d+.9,A0,cx-hw-.1,T+.7,cz);
if(t==='tower'){for(let x=-hw+3;x<hw-1;x+=3)if(Math.abs(x)>2.5)for(const s of[-1,1])bx(.3,T,.5,0x1f252b,cx+x,T/2,cz+s*(hd+.2));bx(w*.7,5,d*.7,0x9aa4ad,cx,T+3,cz);bx(w*.4,4,d*.4,0x7c8791,cx,T+7.5,cz);bx(.35,12,.35,0xcccccc,cx,T+15,cz);bx(.7,.7,.7,0xff2a2a,cx,T+21.3,cz);}
if(t==='apt'){for(let x=-hw+2;x<hw-1;x+=4)if(Math.abs(x)>1.9)for(const s of[-1,1])bx(1.4,T,.6,0xb8a890,cx+x,T/2,cz+s*(hd+.2));bx(w*.4,2.4,d*.4,0x666a70,cx,T+1.6,cz);}
}
const BLD=[];function makeBuilding(cx,cz,type,sg){const C=SZ[type],w=C.w,d=C.d,H=C.H,nF=C.nF(),hw=w/2,hd=d/2;let wc=pick(C.wc);const y=f=>f*H;
const X=l=>cx+sg*l,Z=l=>cz+sg*l,A=a=>a+(sg>0?0:PI);BLD.push({cx,cz,sg,hw,hd,H,nF,type});const CS=[hw-1.2];const so=(lx,lz,sw,sd,f,rot)=>{const s=addSolid(X(lx),Z(lz),rot?sd:sw,rot?sw:sd);s.y0=y(f)-.5;s.y1=y(f)+H-.5;};
const wb=(ax,fz,s0,e0,ya,yb,col)=>{if(e0-s0<.02||yb-ya<.02)return;ax==='x'?bx(e0-s0,yb-ya,.25,col,(s0+e0)/2,(ya+yb)/2,fz):bx(.25,yb-ya,e0-s0,col,fz,(ya+yb)/2,(s0+e0)/2);};
const WS=[];const bF=(type==='house'&&nF>1&&Math.random()<.6)?1:-1;const sol=(ax,fz,s0,e0,f)=>{if(e0-s0<.05)return;const q=ax==='x'?addSolid((s0+e0)/2,fz,e0-s0,.5):addSolid(fz,(s0+e0)/2,.5,e0-s0);if(f!==undefined){q.y0=y(f)-.5;q.y1=y(f)+H-.5;}};
const run=(ax,fz,a0,a1,f,front)=>{const n=2*Math.floor((a1-a0)/8)+1,cl=(a1-a0)/n,y0=y(f);let cur=a0;for(let i=0;i<n;i++){const m=a0+cl*(i+.5),mid=front&&(i===(n-1)/2||false),isD=mid&&f===0,isB=mid&&f===bF,q=(isD||isB)?.8:C.ww/2,s0=m-q,e0=m+q;
wb(ax,fz,cur,s0,y0,y0+H,wc);sol(ax,fz,cur,s0,f);if(isD||isB)wb(ax,fz,s0,e0,y0+2.3,y0+H,wc);else{wb(ax,fz,s0,e0,y0,y0+.9,wc);wb(ax,fz,s0,e0,y0+2.2,y0+H,wc);for(const yy of[.88,2.22])ax==='x'?bx(e0-s0+.1,.08,.34,0x3a2a1c,m,y0+yy,fz,undefined,1):bx(.34,.08,e0-s0+.1,0x3a2a1c,fz,y0+yy,m,undefined,1);
WS.push([ax,fz,ax==='x'?s0:s0,e0,y0]);}cur=e0;}wb(ax,fz,cur,a1,y0,y0+H,wc);sol(ax,fz,cur,a1,f);};for(let f=0;f<nF;f++){if(f>0)wc=pick(C.wc);run('x',Z(hd),cx-hw,cx+hw,f,true);run('x',Z(-hd),cx-hw,cx+hw,f);run('z',cx-hw,cz-hd,cz+hd,f);run('z',cx+hw,cz-hd,cz+hd,f);}
{const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),glassMat,Math.max(1,WS.length));im.frustumCulled=false;scene.add(im);WS.forEach((q,i)=>q[0]==='x'?makeWindowI(im,i,q[2],q[1],q[3]-q[2],1.3,'x',q[4]+.9):makeWindowI(im,i,q[1],q[2],q[3]-q[2],1.3,'z',q[4]+.9));}
makeDoor(cx-.8,Z(hd),1.6,2.3,'x',sg,type==='house'?pick([0x5a3a22,0x3f5a4a,0x6a2f2a,0x2f3f5a]):type==='cabin'?0x4a3320:0x2c3a46);if(C.sg)signBoard(C.sg[0],C.sg[1],cx,Math.min(H-.55,3.4),Z(hd)+sg*.16,sg>0?0:PI);
bx(w,.1,d,C.fc,cx,.05,cz);for(let f=0;f<nF-1;f++){for(const c of CS){const lx=(f%2?-1:1)*c,zA=hd-2.2,zB=hd-6.4;STAIRS.push({minX:X(lx)-.85,maxX:X(lx)+.85,minZ:Math.min(Z(zA),Z(zB)),maxZ:Math.max(Z(zA),Z(zB)),base:y(f),top:y(f)+3.2,zA:Z(zA),sg});for(let i=0;i<10;i++){const lz=zA-.42*(i+.5),top=y(f)+.32*(i+1);bx(1.7,top-y(f),.42,0x9a9488,X(lx),(y(f)+top)/2,Z(lz));addPlatform(X(lx),Z(lz),1.7,.42,top);const q=addSolid(X(lx),Z(lz),1.7,.42);q.y0=y(f)-.5;q.y1=top-.75;}
for(const sd of[-1,1]){const r=addSolid(X(lx+sd*.95),Z((zA+zB)/2),.2,4.3);r.y0=y(f)-.5;r.y1=y(f)+H-.05;bx(.15,H-.1,4.3,wc,X(lx+sd*.95),y(f)+(H-.1)/2,Z((zA+zB)/2));for(let i=0;i<10;i++)bx(.07,.9,.42,0x3a2a1c,X(lx+sd*.9),y(f)+.32*(i+1)+.45,Z(zA-.42*(i+.5)),undefined,1);}
const e=addSolid(X(lx),Z(zB-.1),1.9,.2);e.y0=y(f)-.5;e.y1=y(f)+2.4;}}for(let f=1;f<nF;f++){const za=Z(hd-2.2),zb=Z(hd-6.4),HL=CS.map(c=>{const h=X(((f-1)%2?-1:1)*c);return[h-.85,h+.85,Math.min(za,zb),Math.max(za,zb)];});let R=[[cx-hw,cx+hw,cz-hd,cz+hd]];for(const h of HL)R=sub(R,h);for(const[x0,x1,q0,q1]of R)if(x1-x0>.05&&q1-q0>.05){bx(x1-x0,.2,q1-q0,0xd8d4c8,(x0+x1)/2,y(f)-.1,(q0+q1)/2);addPlatform((x0+x1)/2,(q0+q1)/2,x1-x0,q1-q0,y(f));}}
bx(w+.6,.3,d+.6,pick(C.rc),cx,y(nF)+.15,cz);EXT(type,cx,cz,w,d,H,nF,y);if(type==='tower'){bx(5,2.2,5,0x555a60,cx,y(nF)+1.4,cz);bx(1,5,1,0x888,cx+4,y(nF)+2.8,cz-4);}if(type==='house'&&Math.random()<.6)bx(.8,1.6,.8,0x7a3b2e,cx+sg*3,y(nF)+1,cz-sg*2);
const KO=(k,lx,lz,f)=>{const q=DK[k]||FK[k],r=Math.max(q.w,q.d)/2+.15;for(const c of CS){if(f<nF-1){const sx=(f%2?-1:1)*c;if(Math.abs(lx-sx)<1.7+r&&lz>hd-6.6-r)return 1;}if(f>0){const sx=((f-1)%2?-1:1)*c;if(Math.abs(lx-sx)<1.7+r&&lz>hd-9.6-r&&lz<hd-1.5+r)return 1;}}return 0;};const F=(k,lx,lz,f,fa)=>{if(KO(k,lx,lz,f))return;fa=fa||0;const th=A(fa),X0=X(lx),Z0=Z(lz),Y=y(f),cs=Math.cos(th),sn=Math.sin(th),rot=Math.abs(Math.sin(fa))>.5;const P=(pw,ph,pd,c,ox,oy,oz)=>bx(pw,ph,pd,c,X0+ox*cs+oz*sn,Y+oy,Z0-ox*sn+oz*cs,th);
const D=DK[k];if(D){D.p.forEach(p=>P(...p));if(D.w)so(lx,lz,D.w,D.d,f,rot);return;}const K=FK[k];P(K.w,K.h,K.d,K.c,0,K.h/2,0);so(lx,lz,K.w,K.d,f,rot);let px,py,pw,ph,mx;if(K.ax==='x'){pw=K.w-.08;ph=K.h*.5;px=0;py=K.h*.3;mx=0;}else{pw=K.w-.06;ph=K.h-.08;px=-K.w/2+.03;py=.04;mx=pw/2;}
const g=new THREE.Group(),piv=new THREE.Group(),pz=-K.d/2;g.position.set(X0+px*cs+pz*sn,Y+py,Z0-px*sn+pz*cs);g.rotation.y=th;g.add(piv);const m=new THREE.Mesh(new THREE.BoxGeometry(pw,ph,.05),mt(K.dc));m.position.set(mx,ph/2,-.025);piv.add(m);scene.add(g);
lootCrates.push({x:X0,z:Z0,r:.9,opened:false,lidPivot:piv,axis:K.ax,ang:K.ang,name:K.nm,y:Y,loot:Array.from({length:1+Math.floor(Math.random()*3)},()=>pick(K.l))});};const L=(f,a)=>a.forEach(([k,lx,lz,fa])=>F(k,lx,lz,f,fa));
const pt=(ax,c,s0,e0,f,gp,door)=>{const seg=(p,q)=>{if(q-p<.05)return;const m=(p+q)/2,l=q-p;if(ax==='x'){bx(l,H-.1,.2,0xe6e0d2,X(m),y(f)+(H-.1)/2,Z(c),undefined,2);so(m,c,l,.3,f);}else{bx(.2,H-.1,l,0xe6e0d2,X(c),y(f)+(H-.1)/2,Z(m),undefined,2);so(c,m,.3,l,f);}};
if(gp){seg(s0,gp[0]);seg(gp[1],e0);if(door){const dh=Math.min(2.15,H-.3),dcol=pick([0x8a6a45,0x6b5442,0x9c7a52]),hh=H-.1-dh;if(ax==='x'){const x0=X(gp[0]),x1=X(gp[1]),hx=Math.min(x0,x1),wid=Math.abs(x1-x0);if(wid>.4){makeDoor(hx,Z(c),wid,dh,'x',Math.random()<.5?-1:1,dcol,y(f));if(hh>.05)bx(wid,hh,.2,0xe6e0d2,X((gp[0]+gp[1])/2),y(f)+dh+hh/2,Z(c),undefined,2);}}else{const z0=Z(gp[0]),z1=Z(gp[1]),hz=Math.min(z0,z1),wid=Math.abs(z1-z0);if(wid>.4){makeDoor(X(c),hz,wid,dh,'z',Math.random()<.5?-1:1,dcol,y(f));if(hh>.05)bx(.2,hh,wid,0xe6e0d2,X(c),y(f)+dh+hh/2,Z((gp[0]+gp[1])/2),undefined,2);}}}}else seg(s0,e0);};if(bF>0){const f=1,zc=Z(hd+1.35),zf=Z(hd+2.65),yy=y(f);bx(6,.2,2.7,0xb9b3a4,cx,yy-.1,zc);addPlatform(cx,zc,6,2.7,yy);
bx(6.1,.07,.07,0x3a2a1c,cx,yy+1,zf);bx(.07,.07,2.7,0x3a2a1c,cx-3,yy+1,zc);bx(.07,.07,2.7,0x3a2a1c,cx+3,yy+1,zc);for(let k=-3;k<=3;k++)bx(.06,1,.06,0x3a2a1c,cx+k,yy+.5,zf);
for(const sd of[-3,3])for(const k of[0,1.35,2.65])bx(.06,1,.06,0x3a2a1c,cx+sd,yy+.5,Z(hd+k));for(const q of[addSolid(cx,zf,6.2,.3),addSolid(cx-3,zc,.3,2.7),addSolid(cx+3,zc,.3,2.7)]){q.y0=yy-.5;q.y1=yy+H-.5;}
F('mesa',-2,hd+1.6,f,0);F('silla',-3,hd+1.6,f,-PI/2);F('silla',-1,hd+1.6,f,PI/2);F('planta',2.4,hd+2.2,f,0);}if(type==='rest'){const zp=Z(hd+1.9),zq=Z(hd+3.4);bx(16,.1,3.6,0xb0a288,cx,.05,zp);
for(const sd of[-1,1]){F('mesa',sd*5.5,hd+1.9,0,0);F('silla',sd*5.5-1.1,hd+1.9,0,-PI/2);F('silla',sd*5.5+1.1,hd+1.9,0,PI/2);F('planta',sd*7.4,hd+.8,0,0);bx(6.5,.07,.07,0x3a2a1c,cx+sd*4.75,.95,zq);for(let k=0;k<=6;k++)bx(.06,.95,.06,0x3a2a1c,cx+sd*(1.5+k*1.08),.48,zq);addSolid(cx+sd*4.75,zq,6.5,.3);}
}for(let f=0;f<nF;f++){if(type==='house'){pt('x',-1.4,-hw+2.7,hw-2.7,f,[-3,-1.4],true);pt('z',1.8,-hd,-1.4,f,[-3.6,-2],true);L(f,[['cama',-4.6,-hd+1.15,PI],['cajonera',-1.9,-hd+.3,PI],['mesita',-6.4,-hd+.3,PI],['inodoro',6.4,-hd+.5,PI],['lavabo',4.3,-hd+.3,PI],['banera',5.3,-2.4,PI]]);bx(2.3,.03,2.9,0x7a4a3a,X(-4.9),y(f)+.02,Z(-hd+1.9));bx(1.1,.02,.7,0xcfd8e0,X(4.9),y(f)+.02,Z(-hd+1.4));
if(f===0){L(f,[['armario',-hw+.35,-3,-PI/2],['sofa',-4.4,-.6,PI],['mesa_c',-4.4,1.5,0],['tv',-2.9,hd-.35,0],['planta',-6.5,hd-.5,0],['refri',2.4,hd-.45,0],['cocina',3.35,hd-.4,0],['gabinete',4.6,hd-.4,0],['mesa',3,1.4,0],['silla',1.9,1.4,-PI/2],['silla',4.1,1.4,PI/2]]);bx(3.6,.03,3.2,0x5a4a7a,X(-4.4),y(f)+.02,Z(0.4));}
else{const hm=f%2?-1:1;L(f,[['armario',.9*hm,-1,PI],['cama',-4*hm,hd-1.15,0],['cajonera',-2.2*hm,hd-.3,0],['escritorio',2.9*hm,hd-.5,0],['silla_of',2.9*hm,hd-1.6,PI],['archivador',4.4*hm,hd-.4,0]]);bx(2.5,.03,2.4,0x4a5a6b,X(2.9*hm),y(f)+.02,Z(hd-1.05));}}else if(type==='cabin'){
L(f,[['cama',-2.7,-hd+1.15,PI],['mesita',-1,-hd+.3,PI],['armario',hw-.35,-1,PI/2],['gabinete',2.4,hd-.35,0],['cocina',.8,hd-.35,0],['mesa',-2,1.2,0],['silla',-3,1.2,-PI/2],['silla',-1,1.2,PI/2]]);
}else if(type==='store'){pt('x',-4.5,-hw,hw,f,[-2,0]);for(const lz of[1.6,-1.6])for(let i=0;i<5;i++)F(i%2?'gondola':'estante',-8+i*3.6,lz,f,lz>0?0:PI);L(f,[['mostrador',6,hd-3.2,0],['registro',6,hd-4.1,0],['refri',-hw+.6,-hd+.5,PI],['nevera',hw-.6,-1,PI/2],['nevera',hw-.6,1.5,PI/2],['nevera',hw-.6,4,PI/2],['planta',-hw+.6,hd-.6,0],['estante',-8,-6.5,PI],['gondola',-4.5,-6.5,PI],['estante',-1,-6.5,PI],['gondola',2.5,-6.5,PI],['gabinete',7,-6.6,PI]]);
}else if(type==='rest'){pt('x',-3.5,-hw,hw,f,[-1,1.6]);for(let i=0;i<4;i++)for(let j=0;j<2;j++){const tx=-6.8+i*4.6,tz=4.6-j*3.6;L(f,[['mesa',tx,tz,0],['silla',tx-1.1,tz,-PI/2],['silla',tx+1.1,tz,PI/2],['silla',tx,tz+.9,PI],['silla',tx,tz-.9,0]]);}
L(f,[['mostrador',7,-2,PI/2],['gabinete',hw-.5,-.4,PI/2],['refri',-7,-hd+.5,PI],['refri',-5.7,-hd+.5,PI],['gabinete',-3,-hd+.4,PI],['cocina',-1,-hd+.4,PI],['cocina',.2,-hd+.4,PI],['mesa',4,-5.6,0],['planta',hw-.6,hd-.6,0],['planta',-hw+.6,hd-.6,0]]);
}else if(type==='bank'){pt('x',-4,-hw,hw,f,[-1.5,1.5]);L(f,[['mostrador',-4,1.6,0],['mostrador',0,1.6,0],['mostrador',4,1.6,0],['archivador',-6,.6,0],['archivador',6,.6,0],['registro',-4,.9,PI],['registro',4,.9,PI],['caja_fuerte',-7,-hd+.5,PI],['caja_fuerte',-4.5,-hd+.5,PI],['caja_fuerte',4.5,-hd+.5,PI],['caja_fuerte',7,-hd+.5,PI],['escritorio',0,-6.2,0],['silla_of',0,-7.2,PI],['sofa',-6,hd-.8,0],['sofa',6,hd-.8,0],['planta',-hw+.6,hd-.6,0],['planta',hw-.6,hd-.6,0]]);
}else if(f===0){L(f,[['mostrador',-3,-1,0],['mostrador',0,-1,0],['sofa',-5,5.5,PI],['sofa',5,5.5,PI],['planta',-hw+.7,-hd+.7,0],['planta',hw-.7,-hd+.7,0],['archivador',-3,-hd+.4,PI],['gabinete',4,-hd+.4,PI],['refri',6.5,-hd+.5,PI]]);
}else{const mir=f%2?-1:1;pt('x',-4.6,-hw,hw,f,mir>0?[-2.4,-.4]:[.4,2.4]);for(let i=0;i<3;i++)for(let j=0;j<2;j++){const tx=mir*(-5+i*4.2),tz=1.6-j*3.4;L(f,[['escritorio',tx,tz,0],['silla_of',tx,tz-1,PI]]);}L(f,[['archivador',mir*(-hw+.5),-7.4,PI/2],['archivador',mir*(-hw+.5),-6.6,PI/2],['gabinete',mir*3,-hd+.4,PI],['refri',mir*5,-hd+.5,PI],['planta',mir*(hw-.7),-1,0],['escritorio',mir*(-3.5),-7.4,PI]]);
}}}const OR=0xc1441f,CLn=[-162,-108,-54,0,54,108,162];
function worldTick(dt){}
function buildIsland(){
groundMat.color.setHex(0xffffff);
makeBuilding(-24,-30,'house',1);
makeBuilding(26,-40,'tower',-1);
makeCarProp(0,-18,0.3,0x8a2e2e,['ammo9','bandage','water']);
makeCrate(-8,-8,['bandage','water','ammo9']);
flushBT();
}
(function(){const _origRandom=Math.random;function _mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}Math.random=_mulberry32(1337);buildIsland();Math.random=_origRandom;})();
function assignNetworkIds(){doors.forEach((d,i)=>{d.netId=i;});windows.forEach((w,i)=>{w.netId=i;});lootCrates.forEach((c,i)=>{c.netId=i;});grounditems.forEach((g,i)=>{g.netId=i;});cars.forEach((c,i)=>{c.netId=i;});}
assignNetworkIds();
const targets=[];const zombies=[];let nextZombieNetId=0;const bloodParticles=[];function makeZombieMesh(){const grp=new THREE.Group();scene.add(grp);const skinHue=0.27+rand(-0.03,0.04);const skinCol=new THREE.Color().setHSL(skinHue,0.32,0.30+rand(-0.06,0.05));
const clothCol=new THREE.Color().setHSL(0.33+rand(-0.03,0.03),0.62,0.4+rand(-0.06,0.08));const bodyMat=new THREE.MeshLambertMaterial({color:clothCol});const headMat=new THREE.MeshLambertMaterial({color:skinCol});
const hips=new THREE.Group();hips.position.y=0.92;grp.add(hips);const torso=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.58,0.28),bodyMat);torso.position.y=0.40;hips.add(torso);
const chestDetail=new THREE.Mesh(new THREE.BoxGeometry(0.52,0.14,0.06),bodyMat);chestDetail.position.set(0,0.55,0.15);hips.add(chestDetail);const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.1,0.12,6),headMat);
neck.position.y=0.72;hips.add(neck);const headPivot=new THREE.Group();headPivot.position.y=0.86;hips.add(headPivot);const head=new THREE.Mesh(new THREE.BoxGeometry(0.32,0.32,0.32),headMat);headPivot.add(head);
const jaw=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.11,0.2),headMat);jaw.position.set(0,-0.2,0.03);headPivot.add(jaw);const eyeMat=new THREE.MeshBasicMaterial({color:0x140a0a});
const eyeL=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.05,0.03),eyeMat);eyeL.position.set(-0.08,0.03,0.16);headPivot.add(eyeL);const eyeR=eyeL.clone();eyeR.position.x=0.08;headPivot.add(eyeR);
const capMat=new THREE.MeshLambertMaterial({color:0x2a2a26});const cap=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.09,0.34),capMat);cap.position.set(0,0.16,0);headPivot.add(cap);
const capBrim=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.05,0.11),capMat);capBrim.position.set(0,0.135,0.19);headPivot.add(capBrim);function makeArm(sign){const shoulder=new THREE.Group();shoulder.position.set(sign*0.32,0.63,0);hips.add(shoulder);
const upperArm=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.36,0.16),bodyMat);upperArm.position.y= -0.18;shoulder.add(upperArm);const elbow=new THREE.Group();elbow.position.y= -0.36;shoulder.add(elbow);
const forearm=new THREE.Mesh(new THREE.BoxGeometry(0.13,0.32,0.14),headMat);forearm.position.y= -0.16;elbow.add(forearm);const hand=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.14,0.12),headMat);hand.position.y= -0.34;elbow.add(hand);
return{shoulder,elbow};}const armL=makeArm(-1),armR=makeArm(1);function makeLeg(sign){const hip=new THREE.Group();hip.position.set(sign*0.15,0.02,0);hips.add(hip);const thigh=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.4,0.2),bodyMat);thigh.position.y= -0.2;hip.add(thigh);
const knee=new THREE.Group();knee.position.y= -0.4;hip.add(knee);const shin=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.4,0.17),bodyMat);shin.position.y= -0.2;knee.add(shin);
const foot=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.1,0.24),headMat);foot.position.set(0,-0.42,0.05);knee.add(foot);return{hip,knee};}const legL=makeLeg(-1),legR=makeLeg(1);
const fbxInst=spawnCharVisual(bodyMat,{tpose:true});
if(fbxInst){grp.add(fbxInst);[torso,chestDetail,neck,head,jaw,eyeL,eyeR,cap,capBrim].forEach(o=>{o.visible=false;});[armL.shoulder,armR.shoulder,legL.hip,legR.hip].forEach(g=>g.traverse(o=>{if(o.isMesh)o.visible=false;}));}
return{grp,hips,torso,headPivot,bodyMat,headMat,armL,armR,legL,legR,fbxInst};}const ZT=[{w:.6,sp:[3.3,3.9],hp:100,sc:[.96,1.06],dm:1,hear:1,col:1},{w:.25,sp:[4.7,5.3],hp:70,sc:[.93,1],dm:.8,hear:1.25,col:1.3},{w:.15,sp:[2.7,3.2],hp:230,sc:[1.12,1.22],dm:1.7,hear:.8,col:.72}];
const zAI={px:0,pz:0,spd:0,noise:0};const angD=(a,b)=>{let d=(b-a)%6.2832;if(d>3.1416)d-=6.2832;if(d<-3.1416)d+=6.2832;return d;};function losClear(x0,z0,x1,z1,m){const D=Math.hypot(x1-x0,z1-z0)||1,ux=(x1-x0)/D,uz=(z1-z0)/D;for(let s=.7;s<D-m;s+=.7)if(pointBlockedBySolid(x0+ux*s,z0+uz*s))return false;return true;}
function steerAng(z,a0){for(const o of[0,.55,-.55,1.1,-1.1,1.7,-1.7]){const a=a0+o*z.avoid,s=Math.sin(a),c=Math.cos(a);if(!pointBlockedBySolid(z.x+s,z.z+c)&&!pointBlockedBySolid(z.x+s*1.9,z.z+c*1.9))return a;}return a0;}
function segBlocked(x0,z0,x1,z1){const D=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.ceil(D/.25));for(let i=1;i<n;i++){const x=x0+(x1-x0)*i/n,z=z0+(z1-z0)*i/n;if(pointBlockedBySolid(x,z))return true;
if(collY<1.5)for(const d of doors){if(!d.open&&!d.broken&&x>=d.minX&&x<=d.maxX&&z>=d.minZ&&z<=d.maxZ)return true;}for(const w of windows){if(!w.broken&&Math.abs(x-w.x)<2&&Math.abs(z-w.z)<2&&Math.abs(w.sillY-.9-collY)<1.7&&x>=w.minX&&x<=w.maxX&&z>=w.minZ&&z<=w.maxZ)return true;}
}return false;}function stairTarget(z){const dy=player.standY-(z.standY||0);if(Math.abs(dy)<.6)return null;const B=BLD.find(b=>b.nF>1&&Math.abs(z.x-b.cx)<b.hw+1&&Math.abs(z.z-b.cz)<b.hd+1);if(!B)return null;
const zf=(z.standY||0)/B.H,up=dy>0,f=up?Math.floor(zf+.02):Math.ceil(zf-.02)-1;if(f<0||f>=B.nF-1)return null;const lx=(f%2?-1:1)*(B.hw-1.2),zA=B.hd-2.2,zB=B.hd-6.4,px=(z.x-B.cx)*B.sg,pz=(z.z-B.cz)*B.sg;
const on=Math.abs(px-lx)<1&&pz>zB-.9&&pz<zA+.9,W=(a,b)=>[B.cx+B.sg*a,B.cz+B.sg*b];return up?(on?W(lx,zB-1.2):W(lx,zA+.5)):(on?W(lx,zA+1.6):W(lx,zB-.6));}function shout(z,r){for(const o of zombies){if(o===z||!o.alive||o.state==='chase'||(o.hunt&&(o.state==='seek'||o.state==='bash')))continue;
if(Math.hypot(o.x-z.x,o.z-z.z)<r){o.aware=1.3;o.lastX=player.x+rand(-1.5,1.5);o.lastZ=player.z+rand(-1.5,1.5);o.lastT=0;o.state='alert';o.alertT=rand(.2,1);}}}function enterChase(z){z.state='chase';z.hunt=true;z.bashHits=undefined;z.bashTarget=null;z.flank=(Math.random()<.5?-1:1)*rand(.5,1.3);z.stuckT=0;shout(z,20);}function startWindowCrawl(z,w){const ax=w.wallAxis;const alongMin=ax==='x'?w.minX:w.minZ,alongMax=ax==='x'?w.maxX:w.maxZ;const wallCoord=ax==='x'?w.z:w.x;const curAlong=clamp(ax==='x'?z.x:z.z,alongMin+0.3,alongMax-0.3);const curCross=ax==='x'?z.z:z.x;const side=curCross>=wallCoord?1:-1;const mk=c=>ax==='x'?{x:curAlong,z:c}:{x:c,z:curAlong};z.crawlStart=mk(wallCoord+side*1.05);z.crawlEnd=mk(wallCoord-side*0.9);z.x=z.crawlStart.x;z.z=z.crawlStart.z;z.crawlHeading=Math.atan2(z.crawlEnd.x-z.crawlStart.x,z.crawlEnd.z-z.crawlStart.z);z.state='crawlIn';z.crawlT=0;z.crawlWin=w;z.vx=0;z.vz=0;}
function zombieProvoke(z){if(!z.alive)return;z.aware=1.2;z.lastX=player.x;z.lastZ=player.z;z.lastT=0;if(z.state!=='chase'&&!(z.hunt&&(z.state==='seek'||z.state==='bash')))enterChase(z);}
function pickBehavior(z){const r=Math.random();if(r<.42){z.state='wander';z.wa=rand(0,6.28);z.wT=rand(2.5,5.5);}else if(r<.78){z.state='patrol';z.stT=14;for(let i=0;i<6;i++){z.tx=clamp(z.hx+rand(-16,16),-ARENA+3,ARENA-3);z.tz=clamp(z.hz+rand(-16,16),-ARENA+3,ARENA-3);if(!pointBlockedBySolid(z.tx,z.tz))break;}}
else if(r<.93){const c=doors.filter(d=>!d.broken&&!d.open&&Math.hypot(d.x-z.x,d.z-z.z)<34);if(c.length){z.state='sniff';z.bashTarget=c[Math.floor(Math.random()*c.length)];z.bashType='door';z.stT=16;z.sniffT=undefined;}else z.idleT=rand(1,3);}
else z.idleT=rand(2,4);}function spawnZombie(x,z){const q=Math.random(),t=q<.6?ZT[0]:q<.85?ZT[1]:ZT[2],sc=rand(t.sc[0],t.sc[1]);const m=makeZombieMesh();m.grp.position.set(x,0,z);m.grp.scale.setScalar(sc);
m.bodyMat.color.multiplyScalar(t.col);m.headMat.color.multiplyScalar(t===ZT[1]?1.15:t.col);zombies.push({x,z,r:.6*sc,hp:t.hp,maxhp:t.hp,speed:rand(t.sp[0],t.sp[1]),t,state:'idle',idleT:rand(.5,3),
heading:rand(0,6.28),vx:0,vz:0,aware:0,gain:0,lastX:x,lastZ:z,lastT:99,senseT:rand(0,.2),flank:0,avoid:Math.random()<.5?-1:1,headYaw:0,headPitch:0,ap:.4,seed:rand(0,6.28),hx:x,hz:z,
attackCd:0,alive:true,hitFlash:0,despawnTimer:0,walkPhase:rand(0,6.28),attackAnimT:0,deathAnimT:0,puddle:null,bleedTimer:0,bleedDmgPerSec:0,bleedTickTimer:0,crawlCd:0,crawlT:0,crawlWin:null,netId:nextZombieNetId++,remote:false,...m
});}function randomZombieSpawnPos(){let x=0,z=0,n=0;collY=0;do{const r=Math.random();if(r<.5){const l=pick(CLn),a=rand(-165,165),j=rand(-3,3);if(Math.random()<.5){x=l+j;z=a;}else{z=l+j;x=a;}}else if(r<.72){x=rand(335,455);z=rand(-150,150);}else if(r<.9){x=rand(-450,-180);z=rand(-450,450);}else{x=rand(-180,190);z=rand(-450,-175);}n++;}while(n<40&&(Math.hypot(x-player.x,z-player.z)<28||pointBlockedBySolid(x,z)||(x>LK.x0-6&&x<LK.x1+4)||(z>190&&z<220)||zombies.some(zz=>zz.alive&&Math.hypot(x-zz.x,z-zz.z)<zz.r+1.2)));return{x,z};}const _bloodGeom=new THREE.BoxGeometry(0.06,0.06,0.06);const _bloodMatCache={};function _bloodMat(color){const key=color||0x8b0000;if(!_bloodMatCache[key])_bloodMatCache[key]=new THREE.MeshBasicMaterial({color:key});return _bloodMatCache[key];}
function spawnBloodImpact(pos,color){const particleCount=10;const geom=_bloodGeom;const mat=_bloodMat(color);
for(let i=0;i<particleCount;i++){const p=new THREE.Mesh(geom,mat);p.position.copy(pos);p.velocity=new THREE.Vector3((Math.random()-0.5)*2.8,Math.random()*2.2+1,(Math.random()-0.5)*2.8
);p.life=0.5;scene.add(p);bloodParticles.push(p);}}function updateBloodParticles(dt){for(let i=bloodParticles.length-1;i>=0;i--){const p=bloodParticles[i];p.life-=dt;p.position.addScaledVector(p.velocity,dt);
p.velocity.y-=9.8*dt;if(p.life<=0){scene.remove(p);bloodParticles.splice(i,1);}}}const player={x:SPAWN.x,z:SPAWN.z,yaw:0,pitch:0,speed:5.4,r:0.5,vy:0,onGround:true,_jumpY:0,standY:0,
hp:100,maxhp:100,hunger:85,thirst:85,stamina:100,alive:true,attackCd:0
};function spawnInitialZombies(){for(let i=0;i<1;i++){const sp=randomZombieSpawnPos();spawnZombie(sp.x,sp.z);}}
function createRemoteZombie(id,x,z,typeIdx,scale){if(zombies.some(zz=>zz.netId===id))return zombies.find(zz=>zz.netId===id);const t=ZT[typeIdx]||ZT[0];const sc=scale||1;const m=makeZombieMesh();m.grp.position.set(x,0,z);m.grp.scale.setScalar(sc);m.bodyMat.color.multiplyScalar(t.col);m.headMat.color.multiplyScalar(typeIdx===1?1.15:t.col);const zz={x,z,r:.6*sc,hp:t.hp,maxhp:t.hp,alive:true,heading:0,tx:x,tz:z,theading:0,netId:id,remote:true,hitFlash:0,standY:0,walkPhase:0,walkAmp:0,animSpeed:0,ap:.4,netMoving:0,...m};zombies.push(zz);return zz;}
function updateRemoteZombies(dt){for(let i=zombies.length-1;i>=0;i--){const z=zombies[i];collY=z.standY||0;collZ=true;if(!z.alive){if(deadZombie(z,dt)){scene.remove(z.grp);if(z.puddle)scene.remove(z.puddle);zombies.splice(i,1);}continue;}
z.hitFlash=Math.max(0,(z.hitFlash||0)-dt);const tint=z.hitFlash>0?0x990000:0x000000;z.bodyMat.emissive.setHex(tint);z.headMat.emissive.setHex(tint);const k=Math.min(1,dt*8);
z.x+=((z.tx!==undefined?z.tx:z.x)-z.x)*k;z.z+=((z.tz!==undefined?z.tz:z.z)-z.z)*k;let dyaw=(z.theading||0)-z.heading;while(dyaw>Math.PI)dyaw-=Math.PI*2;while(dyaw<-Math.PI)dyaw+=Math.PI*2;z.heading+=dyaw*k;
const standTarget=groundHeightAt(z.x,z.z,z.standY);z.standY=(z.standY===undefined?standTarget:z.standY+(standTarget-z.standY)*Math.min(1,dt*20));z.grp.position.set(z.x,z.standY,z.z);z.grp.rotation.y=z.heading;
const targetAnimSpeed=z.netMoving?2.4:0;z.animSpeed=(z.animSpeed===undefined?targetAnimSpeed:z.animSpeed+(targetAnimSpeed-z.animSpeed)*Math.min(1,dt*6));z.walkPhase=(z.walkPhase||0)+dt*z.animSpeed;
const targetAmp=z.animSpeed>0.45?0.85:0;z.walkAmp=(z.walkAmp===undefined?targetAmp:z.walkAmp+(targetAmp-z.walkAmp)*Math.min(1,dt*5));const swing=Math.sin(z.walkPhase)*0.55*z.walkAmp;
z.legL.hip.rotation.x=swing;z.legR.hip.rotation.x=-swing;z.hips.position.y=0.92+Math.abs(Math.sin(z.walkPhase))*0.035*z.walkAmp;z.ap=(z.ap||.4)+((z.netMoving?1.1:.4)-(z.ap||.4))*Math.min(1,dt*4);
z.armL.shoulder.rotation.x=-swing*0.7-z.ap;z.armR.shoulder.rotation.x=swing*0.7-z.ap;z.headPivot.rotation.y+=(0-z.headPivot.rotation.y)*Math.min(1,dt*3);/* syncFbxZombie(z); -- desactivado: el modelo de los zombies se queda en su pose de referencia por ahora */}}
const weaponGroup=new THREE.Group();weaponGroup.position.set(0.26,-0.26,-0.68);weaponGroup.rotation.y=-0.03;weaponGroup.rotation.z=0.01;
camera.add(weaponGroup);const slideMat=new THREE.MeshLambertMaterial({color:0x3a3d3f});const frameMat=new THREE.MeshLambertMaterial({color:0x1c1c1c});const barrelMat=new THREE.MeshLambertMaterial({color:0x14161a});
const weaponMesh=new THREE.Mesh(new THREE.BoxGeometry(0.085,0.11,0.40),slideMat);weaponMesh.position.set(0,0.04,-0.03);weaponGroup.add(weaponMesh);const weaponBarrel=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.16,8),barrelMat);
weaponBarrel.rotation.x=Math.PI/2;weaponBarrel.position.set(0,0.04,-0.29);weaponGroup.add(weaponBarrel);const pistolGrip=new THREE.Mesh(new THREE.BoxGeometry(0.078,0.21,0.11),frameMat);
pistolGrip.position.set(0,-0.10,0.085);pistolGrip.rotation.x=-0.30;weaponGroup.add(pistolGrip);const triggerGuard=new THREE.Mesh(new THREE.TorusGeometry(0.045,0.008,6,10,Math.PI),frameMat);
triggerGuard.rotation.z=Math.PI;triggerGuard.position.set(0,-0.015,0.015);weaponGroup.add(triggerGuard);const trigger=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.03,0.01),new THREE.MeshLambertMaterial({color:0x555555}));
trigger.position.set(0,-0.01,0.02);weaponGroup.add(trigger);const rearSight=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.02,0.016),frameMat);rearSight.position.set(0,0.105,0.13);weaponGroup.add(rearSight);
const frontSight=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.018,0.012),frameMat);frontSight.position.set(0,0.10,-0.19);weaponGroup.add(frontSight);weaponGroup.visible=false;
const WEAPON_REST={x:0.26,y:-0.26,z:-0.68};const muzzleLight=new THREE.PointLight(0xffdd88,0,4,2);muzzleLight.position.set(0,0.04,-0.34);weaponGroup.add(muzzleLight);const gripPoint=new THREE.Object3D();gripPoint.position.set(0,-0.09,0.24);weaponGroup.add(gripPoint);
const supportPoint=new THREE.Object3D();supportPoint.position.set(0.01,0.015,-0.13);weaponGroup.add(supportPoint);const ejectPoint=new THREE.Object3D();ejectPoint.position.set(0.05,0.07,-0.02);weaponGroup.add(ejectPoint);
const axeGroup=new THREE.Group();const axeHandle=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.85,12),new THREE.MeshLambertMaterial({color:0x5a3d1e})
);axeHandle.position.y=0;axeGroup.add(axeHandle);const axeBlade=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.22,0.26),new THREE.MeshLambertMaterial({color:0xaaaaaa})
);axeBlade.position.set(0,0.32,-0.08);axeGroup.add(axeBlade);const axeEdge=new THREE.Mesh(new THREE.BoxGeometry(0.015,0.24,0.08),new THREE.MeshLambertMaterial({color:0xdddddd})
);axeEdge.position.set(0,0.32,-0.21);axeGroup.add(axeEdge);axeGroup.visible=false;camera.add(axeGroup);const AXE_REST_POS={x:0.16,y: -0.28,z: -0.48};const AXE_REST_ROT={x:0.35,y: -0.45,z:0.15};
const armSkinMat=new THREE.MeshLambertMaterial({color:0xd4a373});const sleeveMat=new THREE.MeshLambertMaterial({color:0x46543a});const cuffMat=new THREE.MeshLambertMaterial({color:0x2e3a26});
function buildPlayerArm(mirror){const g=new THREE.Group();const upper=new THREE.Mesh(new THREE.BoxGeometry(0.115,0.115,0.27),sleeveMat);upper.position.set(0,0,0.15);g.add(upper);
const cuff=new THREE.Mesh(new THREE.BoxGeometry(0.105,0.105,0.04),cuffMat);cuff.position.set(0,0,0.01);g.add(cuff);const fore=new THREE.Mesh(new THREE.BoxGeometry(0.095,0.095,0.22),armSkinMat);fore.position.set(0,0,-0.03);g.add(fore);
const hand=new THREE.Mesh(new THREE.BoxGeometry(0.10,0.06,0.10),armSkinMat);hand.position.set(0,-0.01,-0.155);g.add(hand);for(let i=0;i<4;i++){const f=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.055,0.022),armSkinMat);
f.position.set(-0.033+i*0.022,-0.055,-0.195);g.add(f);}const thumb=new THREE.Mesh(new THREE.BoxGeometry(0.022,0.022,0.06),armSkinMat);thumb.position.set(mirror?0.06:-0.06,-0.01,-0.14);g.add(thumb);
return g;}const leftHand=buildPlayerArm(true);const rightHand=buildPlayerArm(false);camera.add(leftHand);camera.add(rightHand);const playerBodyGroup=new THREE.Group();scene.add(playerBodyGroup);
const legClothMat=new THREE.MeshLambertMaterial({color:0x3d4a34});const bootMatP=new THREE.MeshLambertMaterial({color:0x2a2a26});function buildPlayerLeg(sign){const leg=new THREE.Group();leg.position.set(sign*0.14,1.02,0.02);
const thigh=new THREE.Mesh(new THREE.BoxGeometry(0.17,0.42,0.19),legClothMat);thigh.position.y=-0.21;leg.add(thigh);const kneeP=new THREE.Group();kneeP.position.y=-0.42;leg.add(kneeP);
const shin=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.4,0.16),legClothMat);shin.position.y=-0.2;kneeP.add(shin);const boot=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.12,0.25),bootMatP);boot.position.set(0,-0.42,0.05);kneeP.add(boot);
return leg;}const legL=buildPlayerLeg(-1),legR=buildPlayerLeg(1);playerBodyGroup.add(legL,legR);const hipsMesh=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.12,0.22),legClothMat);hipsMesh.position.set(0,1.05,-0.1);playerBodyGroup.add(hipsMesh);
let legPhase=0;const torsoMatP=new THREE.MeshLambertMaterial({color:0x46543a});const playerTorso=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.5,0.26),torsoMatP);playerTorso.position.set(0,1.35,-0.02);playerBodyGroup.add(playerTorso);
playerTorso.layers.set(1);const playerHead=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.28,0.28),armSkinMat);playerHead.position.set(0,1.72,-0.02);playerHead.visible=false;playerBodyGroup.add(playerHead);
const playerCap=new THREE.Mesh(new THREE.BoxGeometry(0.30,0.10,0.30),new THREE.MeshLambertMaterial({color:0x2a2a26}));playerCap.position.set(0,1.865,-0.02);playerCap.visible=false;playerBodyGroup.add(playerCap);
const playerCapBrim=new THREE.Mesh(new THREE.BoxGeometry(0.30,0.05,0.10),new THREE.MeshLambertMaterial({color:0x2a2a26}));playerCapBrim.position.set(0,1.84,-0.18);playerCapBrim.visible=false;playerBodyGroup.add(playerCapBrim);
const backpackMat=new THREE.MeshLambertMaterial({color:0x6b4a2e});const backpackStrapMat=new THREE.MeshLambertMaterial({color:0x3a2a1a});const backpackMesh=new THREE.Group();
const bpBody=new THREE.Mesh(new THREE.BoxGeometry(0.32,0.38,0.18),backpackMat);backpackMesh.add(bpBody);const bpTop=new THREE.Mesh(new THREE.BoxGeometry(0.26,0.12,0.16),backpackMat);bpTop.position.set(0,0.24,0);backpackMesh.add(bpTop);
const bpPocket=new THREE.Mesh(new THREE.BoxGeometry(0.20,0.16,0.06),backpackMat);bpPocket.position.set(0,-0.06,0.12);backpackMesh.add(bpPocket);const bpStrapL=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.4,0.05),backpackStrapMat);bpStrapL.position.set(-0.12,0.02,-0.13);backpackMesh.add(bpStrapL);
const bpStrapR=bpStrapL.clone();bpStrapR.position.x=0.12;backpackMesh.add(bpStrapR);backpackMesh.position.set(0,1.42,0.15);backpackMesh.visible=false;playerBodyGroup.add(backpackMesh);
function updateBackpackVisual(){backpackMesh.visible= !!equip.backpack;}const DEFAULT_TORSO_COLOR=0xf0efe9,DEFAULT_LEG_COLOR=0xe8e6df;const SHIRT_COLORS={shirt_basic:0x3f6591};
const PANTS_COLORS={pants_basic:0x5a4a30};function buildVestMesh(){const g=new THREE.Group();const vestMat=new THREE.MeshLambertMaterial({color:0x2f3a22});const plate=new THREE.Mesh(new THREE.BoxGeometry(0.46,0.36,0.30),vestMat);plate.position.set(0,1.37,-0.01);g.add(plate);
const strapMat=new THREE.MeshLambertMaterial({color:0x1c2416});const strapL=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.44,0.05),strapMat);strapL.position.set(-0.17,1.56,-0.02);g.add(strapL);
const strapR=strapL.clone();strapR.position.x=0.17;g.add(strapR);const pouch=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.10,0.06),strapMat);pouch.position.set(0,1.28,-0.16);g.add(pouch);
return g;}const vestMesh=buildVestMesh();vestMesh.visible=false;playerBodyGroup.add(vestMesh);function buildMaskMesh(){return new THREE.Mesh(new THREE.BoxGeometry(0.26,0.13,0.05),new THREE.MeshLambertMaterial({color:0x30363f}));
}const maskMesh=buildMaskMesh();maskMesh.position.set(0,-0.05,-0.15);maskMesh.visible=false;playerHead.add(maskMesh);function updateEquippedAppearance(){torsoMatP.color.setHex(equip.shirt&&SHIRT_COLORS[equip.shirt.id]?SHIRT_COLORS[equip.shirt.id]:DEFAULT_TORSO_COLOR);
legClothMat.color.setHex(equip.pants&&PANTS_COLORS[equip.pants.id]?PANTS_COLORS[equip.pants.id]:DEFAULT_LEG_COLOR);const hasHat=!!equip.hat;playerCap.visible=hasHat;playerCapBrim.visible=hasHat;
if(typeof cCap!=='undefined'){cCap.visible=hasHat;cCapBrim.visible=hasHat;}vestMesh.visible=!!equip.vest;if(typeof cVest!=='undefined')cVest.visible=!!equip.vest;maskMesh.visible=!!equip.mask;
if(typeof cMaskMesh!=='undefined')cMaskMesh.visible=!!equip.mask;}playerBodyGroup.traverse(o=>{if(o.isMesh)o.layers.set(1);});const charScene=new THREE.Scene();const charCam=new THREE.PerspectiveCamera(32,120/200,0.1,10);
charCam.position.set(0,1.32,2.65);charCam.lookAt(0,1.12,0);charScene.add(new THREE.HemisphereLight(0xffffff,0x222222,1.15));const charSun=new THREE.DirectionalLight(0xffffff,0.55);charSun.position.set(2,4,3);charScene.add(charSun);
const charMannequin=new THREE.Group();charScene.add(charMannequin);const cLegL=buildPlayerLeg(-1),cLegR=buildPlayerLeg(1);charMannequin.add(cLegL,cLegR);const cHips=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.12,0.22),legClothMat);cHips.position.set(0,1.05,-0.1);charMannequin.add(cHips);
const cTorso=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.5,0.26),torsoMatP);cTorso.position.set(0,1.35,-0.02);charMannequin.add(cTorso);const cArmL=buildPlayerArm(true);cArmL.position.set(-0.26,1.52,-0.02);cArmL.rotation.x=0.2;charMannequin.add(cArmL);
const cArmR=buildPlayerArm(false);cArmR.position.set(0.26,1.52,-0.02);cArmR.rotation.x=0.05;charMannequin.add(cArmR);const cHead=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.28,0.28),armSkinMat);cHead.position.set(0,1.72,-0.02);charMannequin.add(cHead);
[cLegL,cLegR,cHips,cTorso,cArmL,cArmR,cHead].forEach(o=>{if(o.isMesh)o.visible=false;else o.traverse(m=>{if(m.isMesh)m.visible=false;});});const cFbx=spawnCharVisual(torsoMatP);if(cFbx)charMannequin.add(cFbx);let invPreviewT=0;
const cCap=new THREE.Mesh(new THREE.BoxGeometry(0.30,0.10,0.30),new THREE.MeshLambertMaterial({color:0x2a2a26}));cCap.position.set(0,1.865,-0.02);cCap.visible=false;charMannequin.add(cCap);
const cCapBrim=new THREE.Mesh(new THREE.BoxGeometry(0.30,0.05,0.10),new THREE.MeshLambertMaterial({color:0x2a2a26}));cCapBrim.position.set(0,1.84,-0.18);cCapBrim.visible=false;charMannequin.add(cCapBrim);
const cBackpack=backpackMesh.clone(true);cBackpack.position.set(0,1.42,0.15);cBackpack.visible=false;charMannequin.add(cBackpack);const cVest=buildVestMesh();cVest.visible=false;charMannequin.add(cVest);
const cMaskMesh=buildMaskMesh();cMaskMesh.position.set(0,1.67,-0.17);cMaskMesh.visible=false;charMannequin.add(cMaskMesh);const cHandItem=new THREE.Group();cHandItem.position.set(0.32,1.18,0.05);cHandItem.rotation.set(0.2,0,0.3);charMannequin.add(cHandItem);
function buildHandItemMesh(itemId){while(cHandItem.children.length)cHandItem.remove(cHandItem.children[0]);const meta=ITEMS[itemId];if(!meta)return;if(meta.melee){cHandItem.add(new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.30,8),new THREE.MeshLambertMaterial({color:0x5a3d1e})));
const blade=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.11,0.13),new THREE.MeshLambertMaterial({color:0xaaaaaa}));blade.position.set(0,0.17,-0.02);cHandItem.add(blade);}else if(meta.ranged){
cHandItem.add(new THREE.Mesh(new THREE.BoxGeometry(0.05,0.07,0.19),new THREE.MeshLambertMaterial({color:0x2c2c2c})));}}const charCanvas=document.getElementById('charPreview');
const charRenderer=charCanvas?new THREE.WebGLRenderer({canvas:charCanvas,antialias:true,alpha:true}):null;if(charRenderer){charRenderer.setPixelRatio(Math.min(window.devicePixelRatio,2));charRenderer.setSize(120,200,false);}
const lobbyCanvas=document.getElementById('lobbyCharPreview');let lobbyRenderer=null,lobbyScene=null,lobbyCam=null,lobbyMannequin=null,lobbyT=0,lFbx=null;
function resizeLobbyRenderer(){if(!lobbyRenderer)return;const w=lobbyCanvas.clientWidth||340,h=lobbyCanvas.clientHeight||520;lobbyRenderer.setSize(w,h,false);lobbyCam.aspect=w/h;lobbyCam.updateProjectionMatrix();}
if(lobbyCanvas){lobbyScene=new THREE.Scene();lobbyCam=new THREE.PerspectiveCamera(26,340/520,0.1,10);lobbyCam.position.set(0,1.34,3.55);lobbyCam.lookAt(0,1.05,0);
const lobbyAmbient=new THREE.HemisphereLight(0x4c5c3a,0x08090a,0.65);lobbyScene.add(lobbyAmbient);
const lobbyKey=new THREE.SpotLight(0x9fe06a,3.1,12,0.55,0.4,1.3);lobbyKey.position.set(-1.7,3.1,2.3);lobbyKey.target.position.set(0,1.15,0);lobbyScene.add(lobbyKey);lobbyScene.add(lobbyKey.target);
const lobbyRim=new THREE.DirectionalLight(0xff8a5c,1.6);lobbyRim.position.set(1.9,2.5,-2.5);lobbyScene.add(lobbyRim);
const lobbyFill=new THREE.DirectionalLight(0xffffff,0.4);lobbyFill.position.set(1.2,1.4,3.2);lobbyScene.add(lobbyFill);
lobbyMannequin=new THREE.Group();lobbyScene.add(lobbyMannequin);
const lLegL=buildPlayerLeg(-1),lLegR=buildPlayerLeg(1);lobbyMannequin.add(lLegL,lLegR);
const lHips=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.12,0.22),legClothMat);lHips.position.set(0,1.05,-0.1);lobbyMannequin.add(lHips);
const lTorso=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.5,0.26),torsoMatP);lTorso.position.set(0,1.35,-0.02);lobbyMannequin.add(lTorso);
const lArmL=buildPlayerArm(true);lArmL.position.set(-0.26,1.52,-0.02);lArmL.rotation.x=0.14;lobbyMannequin.add(lArmL);
const lArmR=buildPlayerArm(false);lArmR.position.set(0.26,1.52,-0.02);lArmR.rotation.x=0.05;lobbyMannequin.add(lArmR);
const lHead=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.28,0.28),armSkinMat);lHead.position.set(0,1.72,-0.02);lobbyMannequin.add(lHead);
[lLegL,lLegR,lHips,lTorso,lArmL,lArmR,lHead].forEach(o=>{if(o.isMesh)o.visible=false;else o.traverse(m=>{if(m.isMesh)m.visible=false;});});lFbx=spawnCharVisual(torsoMatP);if(lFbx)lobbyMannequin.add(lFbx);
const lCap=new THREE.Mesh(new THREE.BoxGeometry(0.30,0.10,0.30),new THREE.MeshLambertMaterial({color:0x2a2a26}));lCap.position.set(0,1.865,-0.02);lCap.visible=false;lobbyMannequin.add(lCap);
const lCapBrim=new THREE.Mesh(new THREE.BoxGeometry(0.30,0.05,0.10),new THREE.MeshLambertMaterial({color:0x2a2a26}));lCapBrim.position.set(0,1.84,-0.18);lCapBrim.visible=false;lobbyMannequin.add(lCapBrim);
const lBackpack=backpackMesh.clone(true);lBackpack.position.set(0,1.42,0.15);lBackpack.visible=true;lobbyMannequin.add(lBackpack);
const lVest=buildVestMesh();lVest.visible=false;lobbyMannequin.add(lVest);
const lMask=buildMaskMesh();lMask.position.set(0,1.67,-0.17);lMask.visible=false;lobbyMannequin.add(lMask);
const lAxe=new THREE.Group();const lAxeHandle=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.62,10),new THREE.MeshLambertMaterial({color:0x5a3d1e}));lAxe.add(lAxeHandle);
const lAxeBlade=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.16,0.19),new THREE.MeshLambertMaterial({color:0xaaaaaa}));lAxeBlade.position.set(0,0.24,-0.06);lAxe.add(lAxeBlade);
lAxe.position.set(0.30,1.15,0.05);lAxe.rotation.set(0.35,0,0.55);lobbyMannequin.add(lAxe);
lobbyMannequin.rotation.y=-0.5;
lobbyRenderer=new THREE.WebGLRenderer({canvas:lobbyCanvas,antialias:true,alpha:true});lobbyRenderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
resizeLobbyRenderer();window.addEventListener('resize',resizeLobbyRenderer);}
function renderLobbyPreview(dt){if(!lobbyRenderer)return;lobbyT+=dt;lobbyMannequin.rotation.y=-0.5+Math.sin(lobbyT*0.32)*0.55;lobbyMannequin.position.y=Math.sin(lobbyT*1.05)*0.018;
if(lFbx)poseHumanoidFbx(lFbx,{phase:lobbyT*1.6,moveAmt:0,crouchAmt:0,jumpAmt:0});
lobbyRenderer.render(lobbyScene,lobbyCam);}
function updateCharacterPreview(){cBackpack.visible= !!equip.backpack;updateEquippedAppearance();const shown=equip.primary||equip.secondary;buildHandItemMesh(shown?shown.id:null);
if(charRenderer)charRenderer.render(charScene,charCam);}const useMesh=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.12,0.12),new THREE.MeshLambertMaterial({color:0xffcf6b}));
useMesh.position.set(0.2,-0.3,-0.45);useMesh.visible=false;camera.add(useMesh);let weaponKick=0;let reloading=false,reloadT=0,reloadDuration=1;let useAction=null;let isAiming=false;
let isCrouching=false;let currentSpread=0;let leftPunchT=0,rightPunchT=0;let axeSwingLightT=0,axeSwingHeavyT=0;let axeHitstopT=0,camPunch=0;let pendingMeleeHit=null;let lastWPressTime=0;
let isSprinting=false;function updateHeldWeaponVisibility(){if(isDriving){weaponGroup.visible=false;axeGroup.visible=false;return{isRanged:false,isAxe:false,activeItem:null};
}const activeItem=equip[activeSlotKey];const id=activeItem?activeItem.id:null;const isRanged= !!(id&&ITEMS[id]&&ITEMS[id].ranged);const isAxe= !!(id&&ITEMS[id]&&ITEMS[id].melee);
weaponGroup.visible=isRanged;axeGroup.visible=isAxe;return{isRanged,isAxe,activeItem};}function isEquippedRanged(){const it=equip[activeSlotKey];return!!(it&&ITEMS[it.id]&&ITEMS[it.id].ranged);}
const keys={};let pointerLocked=false;window.addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k==='w'&& !e.repeat){
const now=performance.now();if(now-lastWPressTime<280)isSprinting=true;lastWPressTime=now;}keys[k]=true;if(e.code==='ShiftLeft')isCrouching=true;if(!gameStarted)return;if(e.key==='1'){activeSlotKey='primary';onSlotChange();}
if(e.key==='2'){activeSlotKey='secondary';onSlotChange();}if(k==='i'){toggleInv();}if(k==='e'){tryInteract();}if(k==='r'){tryReload();}if(e.key===' '){if(!isDriving&&player.onGround&& !isCrouching&&player.stamina>10){player.vy=4.4;player.onGround=false;player.stamina-=10;}}
if(e.key==='Escape'){const im=document.getElementById('itemMenu');if(im&&im.style.display!=='none'){closeItemMenu();}else if(selectedLoc){selectedLoc=null;refreshInvUI();}else closeAllPanels();}
});window.addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys[k]=false;if(k==='w')isSprinting=false;if(e.code==='ShiftLeft')isCrouching=false;});function onSlotChange(){
refreshHotbarUI();updateAmmoHud();updateHeldWeaponVisibility();isAiming=false;}document.addEventListener('pointerlockchange',()=>{pointerLocked=(document.pointerLockElement===canvas);
document.getElementById('lockHint').style.display=(gameStarted&& !pointerLocked&& !anyPanelOpen())?'block':'none';if(!pointerLocked)isAiming=false;});canvas.addEventListener('mousedown',e=>{
if(!gameStarted||anyPanelOpen())return;if(!pointerLocked){canvas.requestPointerLock();return;}if(e.button===2){if(isEquippedRanged())isAiming=true;else doAttack(true);}else if(e.button===0)doAttack(false);
});canvas.addEventListener('mouseup',e=>{if(e.button===2)isAiming=false;});document.addEventListener('mousemove',e=>{if(!gameStarted||anyPanelOpen()|| !pointerLocked)return;
const sens=isAiming?0.0010:0.0022;player.yaw-=e.movementX*sens;player.pitch-=e.movementY*sens;player.pitch=clamp(player.pitch,-1.45,1.45);});function anyPanelOpen(){return document.getElementById('invPanel').classList.contains('open');}
let msgTimer=0;function showMsg(text){const el=document.getElementById('msg');el.textContent=text;el.style.opacity=1;msgTimer=2.2;}function showHelp(text){const el=document.getElementById('helpTxt');el.textContent=text;el.style.opacity=text?1:0;}
function forwardVec(){return{x:-Math.sin(player.yaw),z:-Math.cos(player.yaw)};}function rightVec(f){return{x:-f.z,z:f.x};}function flashHurt(){const f=document.getElementById('fade');f.style.transition='none';f.style.opacity=0.35;
requestAnimationFrame(()=>{f.style.transition='opacity .4s';f.style.opacity=0;});}function showHitMarker(){const hm=document.getElementById('hitMarker');hm.style.transition='none';hm.style.opacity=1;
requestAnimationFrame(()=>{hm.style.transition='opacity .3s';hm.style.opacity=0;});}function playMuzzleFlash(){muzzleLight.intensity=3.5;const mf=document.getElementById('muzzleFlash');
mf.style.transition='none';mf.style.opacity=1;requestAnimationFrame(()=>{mf.style.transition='opacity .08s';mf.style.opacity=0;});}const bullets=[];const BULLET_GRAVITY=6;
const casings=[];const casingGeom=new THREE.CylinderGeometry(0.017,0.02,0.09,7);const casingMat=new THREE.MeshLambertMaterial({color:0xC9A227});function spawnCasing(){const wp=new THREE.Vector3();ejectPoint.getWorldPosition(wp);
const camQuat=new THREE.Quaternion();camera.getWorldQuaternion(camQuat);const dir=new THREE.Vector3(1,0.5+Math.random()*0.4,0.35+Math.random()*0.35).normalize().applyQuaternion(camQuat);
const spd=1.6+Math.random()*1.0;const mesh=new THREE.Mesh(casingGeom,casingMat);mesh.position.copy(wp);mesh.rotation.set(Math.random()*6.28,Math.random()*6.28,Math.random()*6.28);
scene.add(mesh);casings.push({mesh,x:wp.x,y:wp.y,z:wp.z,vx:dir.x*spd,vy:dir.y*spd+0.6,vz:dir.z*spd,avx:rand(-16,16),avy:rand(-16,16),avz:rand(-16,16),life:5.5,standY:player.standY
});}function updateCasings(dt){for(let i=casings.length-1;i>=0;i--){const c=casings[i];c.life-=dt;if(c.life<=0){scene.remove(c.mesh);casings.splice(i,1);continue;}c.vy-=9.8*dt;
c.x+=c.vx*dt;c.y+=c.vy*dt;c.z+=c.vz*dt;const groundY=groundHeightAt(c.x,c.z,c.standY)+0.014;if(c.y<=groundY){c.y=groundY;if(Math.abs(c.vy)>0.35){c.vy=-c.vy*0.38;c.vx*=0.55;c.vz*=0.55;c.avx*=0.5;c.avy*=0.5;c.avz*=0.5;
}else{c.vy=0;c.vx*=0.7;c.vz*=0.7;c.avx*=0.7;c.avy*=0.7;c.avz*=0.7;}}const pushed=resolveAllCollisions(c.x,c.z,0.05);c.x=pushed.x;c.z=pushed.z;c.mesh.position.set(c.x,c.y,c.z);
c.mesh.rotation.x+=c.avx*dt;c.mesh.rotation.y+=c.avy*dt;c.mesh.rotation.z+=c.avz*dt;if(c.life<1)c.mesh.material.opacity=c.life,c.mesh.material.transparent=true;}}function checkMeleeHit(dmg,rng,f,weaponMeta,applyBleed){
let hitSomething=false;for(const t of targets){if(!t.alive)continue;const dx=t.x-player.x,dz=t.z-player.z,d=Math.hypot(dx,dz);if(d<rng){const dot=(dx/(d||1))*f.x+(dz/(d||1))*f.z;if(dot>0.6){hitTarget(t,dmg);hitSomething=true;}}
}for(const z of zombies){if(!z.alive)continue;const dx=z.x-player.x,dz=z.z-player.z,d=Math.hypot(dx,dz);if(d<rng+z.r){const dot=(dx/(d||1))*f.x+(dz/(d||1))*f.z;if(dot>0.6){hitZombie(z,dmg,new THREE.Vector3(z.x,1.0,z.z),applyBleed?weaponMeta:null,f);hitSomething=true;}
}}for(const d0 of doors){if(d0.broken||d0.open||player.standY>1.5)continue;const dx=d0.x-player.x,dz=d0.z-player.z,d=Math.hypot(dx,dz);if(d<rng+0.6&&(dx/(d||1))*f.x+(dz/(d||1))*f.z>0.6){damageDoor(d0,dmg*0.8,'player');hitSomething=true;}
}for(const w of windows){if(w.broken||Math.abs(w.x-player.x)>rng+1||Math.abs(w.z-player.z)>rng+1||Math.abs(w.sillY-.9-player.standY)>1.7)continue;const dx=w.x-player.x,dz=w.z-player.z,d=Math.hypot(dx,dz);
if(d<rng+0.6){const dot=(dx/(d||1))*f.x+(dz/(d||1))*f.z;if(dot>0.6){damageWindow(w,dmg,'player');hitSomething=true;}}}return hitSomething;}function doAttack(isRightClick){
if(!player.alive||reloading||useAction||isDriving)return;if(player.attackCd>0)return;const item=equip[activeSlotKey];const meta=item?ITEMS[item.id]:null;if(meta&&meta.ranged){
if(isRightClick)return;if(!item.loaded||item.loaded<=0){showMsg('Sin munición cargada. Pulsa R para recargar.');player.attackCd=0.2;return;}item.loaded--;updateAmmoHud();
weaponKick=1;playMuzzleFlash();spawnCasing();const bulletDir=new THREE.Vector3();camera.getWorldDirection(bulletDir);if(currentSpread>0){bulletDir.x+=(Math.random()-0.5)*currentSpread;
bulletDir.y+=(Math.random()-0.5)*currentSpread;bulletDir.z+=(Math.random()-0.5)*currentSpread;bulletDir.normalize();}const spawnPos=new THREE.Vector3();camera.getWorldPosition(spawnPos);
spawnPos.addScaledVector(bulletDir,0.4);const mesh=new THREE.Mesh(new THREE.SphereGeometry(0.06,6,6),new THREE.MeshBasicMaterial({color:0xffe97a}));mesh.position.copy(spawnPos);
scene.add(mesh);const speed=75;bullets.push({x:spawnPos.x,y:spawnPos.y,z:spawnPos.z,vx:bulletDir.x*speed,vy:bulletDir.y*speed,vz:bulletDir.z*speed,life:1.6,dmg:meta.dmg,mesh,standY:player.standY});
player.attackCd=meta.cooldown;alertZombiesNear(player.x,player.z,60,.75);return;}if(meta&&meta.melee){if(isRightClick){if(player.stamina<18){showMsg('No hay energía suficiente para ataque fuerte');return;}
player.stamina-=18;player.attackCd=meta.cooldownHeavy||0.95;if(item.id==='axe')axeSwingHeavyT=1.0;pendingMeleeHit={timer:0.28,dmg:meta.dmgHeavy||52,rng:2.9,meta:meta,bleed:true,heavy:(item.id==='axe')};
}else{if(player.stamina<8){showMsg('Sin energía suficiente');return;}player.stamina-=8;player.attackCd=meta.cooldownLight||0.48;if(item.id==='axe')axeSwingLightT=1.0;pendingMeleeHit={timer:0.16,dmg:meta.dmgLight||28,rng:2.5,meta:meta,bleed:false,heavy:false};
}return;}if(isRightClick){if(player.stamina<15){showMsg('Sin energía');return;}player.stamina-=15;player.attackCd=0.8;rightPunchT=1.0;pendingMeleeHit={timer:0.15,dmg:25,rng:2.9,meta:null,bleed:false};
}else{if(player.stamina<6)return;player.stamina-=6;player.attackCd=0.4;leftPunchT=1.0;pendingMeleeHit={timer:0.10,dmg:12,rng:2.3,meta:null,bleed:false};}}function hitTarget(t,dmg){
t.hp-=dmg;showHitMarker();t.board.material.color.set(0xffffff);setTimeout(()=>{if(t.board)t.board.material.color.set(t.baseColor);},90);if(t.hp<=0){t.alive=false;t.grp.visible=false;t.respawn=2.5;showMsg('¡Blanco derribado!');}
}function hitZombie(z,dmg,hitPoint,weaponMeta,hitDir){if(!z.alive)return;if(window.MPNet&&MPNet.active&&!MPNet.isHost){z.hitFlash=0.15;showHitMarker();if(hitPoint)spawnBloodImpact(hitPoint);if(MPNet.sendZombieHit)MPNet.sendZombieHit(z.netId,dmg,weaponMeta&&weaponMeta.bleedDmg?{bleedDmg:weaponMeta.bleedDmg,bleedDuration:weaponMeta.bleedDuration}:null);return;}
z.hp-=dmg;z.hitFlash=0.15;showHitMarker();if(hitPoint)spawnBloodImpact(hitPoint);if(weaponMeta&&weaponMeta.bleedDmg){
z.bleedTimer=weaponMeta.bleedDuration||4.0;z.bleedDmgPerSec=weaponMeta.bleedDmg;z.bleedTickTimer=0;showMsg('¡Sangrado profundo provocado!');}if(z.hp<=0)killZombie(z,hitDir);else zombieProvoke(z);
}function killZombie(z,hitDir){z.alive=false;z.deadT=0;z.settled=false;z.despawnTimer=12.0;showMsg('¡Zombie eliminado!');z.bodyMat.emissive.setHex(0);z.headMat.emissive.setHex(0);
const fx=Math.sin(z.heading),fz=Math.cos(z.heading);let ix=hitDir?hitDir.x:fx*.3,iz=hitDir?hitDir.z:fz*.3;const il=Math.hypot(ix,iz)||1;ix/=il;iz/=il;const p=hitDir?3.4:1;
z.dvx=ix*p+z.vx*.6;z.dvz=iz*p+z.vz*.6;z.dvy=hitDir?2.6:1.2;z.dy=z.standY||0;z.pitchT=((hitDir?ix*fx+iz*fz:Math.random()-.5)>0?1:-1)*1.5708;z.pitch=0;z.pw=z.pitchT*2;z.rollT=rand(-.45,.45);z.roll=0;z.rw=rand(-2,2);z.yaw=z.heading;z.yw=rand(-2.2,2.2);
z.limp=[rand(-1.6,.4),rand(-1.6,.4),rand(.2,.9),rand(-.8,-.1),rand(-.5,.5),rand(-.5,.5),rand(0,.8),rand(-.4,.5),rand(-.6,.6)];const puddleMat=new THREE.MeshBasicMaterial({color:0x4a0000,side:THREE.DoubleSide,transparent:true,opacity:0.85});
z.puddle=new THREE.Mesh(new THREE.CircleGeometry(0.9,16),puddleMat);z.puddle.rotation.x= -Math.PI/2;z.puddle.scale.setScalar(.05);scene.add(z.puddle);}function deadZombie(z,dt){
z.deadT+=dt;z.despawnTimer-=dt;const g=z.grp,k=Math.min(1,dt*7);if(!z.settled){z.dvy-=17*dt;z.dy+=z.dvy*dt;const r=resolveAllCollisions(z.x+z.dvx*dt,z.z+z.dvz*dt,.4);z.x=r.x;z.z=r.z;
z.pw+=((z.pitchT-z.pitch)*34-z.pw*6.5)*dt;z.pitch+=z.pw*dt;z.rw+=((z.rollT-z.roll)*22-z.rw*6)*dt;z.roll+=z.rw*dt;z.yaw+=z.yw*dt;z.yw*=Math.exp(-dt*3);g.rotation.set(z.pitch,z.yaw,z.roll,'YXZ');
const L=z.limp,lp=(o,a,t)=>{o.rotation[a]+=(t-o.rotation[a])*k;};lp(z.armL.shoulder,'x',L[0]);lp(z.armR.shoulder,'x',L[1]);lp(z.armL.shoulder,'z',L[2]);lp(z.armR.shoulder,'z',-L[2]);
lp(z.armL.elbow,'x',L[3]);lp(z.armR.elbow,'x',L[3]*.7);lp(z.legL.hip,'x',L[4]);lp(z.legR.hip,'x',L[5]);lp(z.legL.hip,'z',-.15);lp(z.legR.hip,'z',.15);lp(z.legL.knee,'x',L[6]);lp(z.legR.knee,'x',L[6]*.6);
lp(z.headPivot,'x',L[7]);lp(z.headPivot,'y',L[8]);lp(z.hips,'x',0);z.hips.position.y+=(.92-z.hips.position.y)*k;z.hips.position.z*=1-k;const gh=groundHeightAt(z.x,z.z,z.dy+.3);
g.position.set(z.x,z.dy,z.z);g.updateMatrixWorld(true);const minY=new THREE.Box3().setFromObject(g).min.y;if(minY<gh){z.dy+=gh-minY;if(z.dvy<0)z.dvy=Math.abs(z.dvy)>2.2?-z.dvy*.28:0;}
if(minY<gh+.05){const f=Math.exp(-dt*6);z.dvx*=f;z.dvz*=f;}if(z.deadT>2.2&&minY<gh+.05&&Math.hypot(z.dvx,z.dvz)<.08&&Math.abs(z.pw)<.05&&Math.abs(z.rw)<.05)z.settled=true;
}if(z.puddle){z.puddle.position.set(z.x,groundHeightAt(z.x,z.z,z.dy+.3)+.02,z.z);z.puddle.scale.setScalar(.05+Math.min(1,Math.max(0,(z.deadT-.4)/3))*.95);}return z.despawnTimer<=0;
}function tryReload(){if(reloading||useAction||isDriving)return;const item=equip[activeSlotKey],meta=item?ITEMS[item.id]:null;if(!meta|| !meta.ranged)return;const have=countItem(meta.ammo),cur=item.loaded||0;
if(cur>=meta.mag||have<=0)return;isAiming=false;reloading=true;reloadT=0;reloadDuration=meta.reloadTime;document.getElementById('reloadBarWrap').style.display='block';}function finishReload(){
const item=equip[activeSlotKey],meta=item?ITEMS[item.id]:null;if(meta&&meta.ranged){const use=Math.min(meta.mag-(item.loaded||0),countItem(meta.ammo));if(use>0){removeItem(meta.ammo,use);item.loaded=(item.loaded||0)+use;}
}reloading=false;document.getElementById('reloadBarWrap').style.display='none';updateAmmoHud();}function updateBullets(dt){for(const b of bullets){b.vy-=BULLET_GRAVITY*dt;
b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.life-=dt;b.mesh.position.set(b.x,b.y,b.z);const dirLen=Math.hypot(b.vx,b.vz)||1,dxn=b.vx/dirLen,dzn=b.vz/dirLen;for(const t of targets){if(t.alive&&Math.hypot(b.x-t.x,b.z-t.z)<t.r+0.15&&Math.abs(b.y-1.7)<0.8){hitTarget(t,b.dmg);b.life=0;break;}}
if(b.life>0){for(const w of windows){if(!w.broken&&Math.abs(b.x-w.x)<0.6&&Math.abs(b.z-w.z)<0.6&&Math.abs(b.y-(w.sillY+0.65))<0.85){damageWindow(w,b.dmg,'player');b.life=0;break;}
}if(b.life>0)for(const d0 of doors){if(!d0.broken&&!d0.open&&b.y>0&&b.y<2.4&&b.x>d0.minX-.1&&b.x<d0.maxX+.1&&b.z>d0.minZ-.1&&b.z<d0.maxZ+.1){damageDoor(d0,b.dmg*0.7,'player');b.life=0;break;}
}}if(b.life>0){for(const z of zombies){if(z.alive&&Math.hypot(b.x-z.x,b.z-z.z)<z.r+0.3&&Math.abs(b.y-1.0)<1.0){hitZombie(z,b.dmg,new THREE.Vector3(b.x,b.y,b.z),null,{x:dxn,z:dzn});b.life=0;break;}
}}if(b.life>0){outer:for(const car of cars){if(!car.wheels)continue;const cosR=Math.cos(car.rotY),sinR=Math.sin(car.rotY);for(const w of car.wheels){if(w.destroyed)continue;
const wx=car.x+(w.lx*cosR+w.lz*sinR);const wz=car.z+(-w.lx*sinR+w.lz*cosR);if(Math.hypot(b.x-wx,b.z-wz)<0.42&&Math.abs(b.y-w.ly)<0.45){damageWheel(car,w,b.dmg);b.life=0;break outer;
}}}}if(b.life>0){const gY=groundHeightAt(b.x,b.z,b.standY);if(b.y<=gY){spawnBloodImpact(new THREE.Vector3(b.x,gY+0.02,b.z),0xb8b4a6);b.life=0;}}collY=b.standY||0;if(b.life>0&&pointBlockedBySolid(b.x,b.z)){spawnBloodImpact(new THREE.Vector3(b.x,b.y,b.z),0xb8b4a6);b.life=0;}
}for(let i=bullets.length-1;i>=0;i--)if(bullets[i].life<=0){scene.remove(bullets[i].mesh);bullets.splice(i,1);}}function updateZombies(dt){{const zn=zoneName(player.x,player.z);if(zn!==zoneName.cur){zoneName.cur=zn;document.querySelector('.label').textContent=zn;}}
{const sp=dt>0?Math.hypot(player.x-zAI.px,player.z-zAI.pz)/dt:0;zAI.px=player.x;zAI.pz=player.z;zAI.spd+=(Math.min(sp,30)-zAI.spd)*Math.min(1,dt*8);zAI.noise=!player.alive?0:(isDriving&&drivingCar)?10+Math.abs(drivingCar.speed)*2.6:zAI.spd>.4&&!isCrouching?(isSprinting?16:7.5):0;}
for(let i=zombies.length-1;i>=0;i--){const z=zombies[i];collY=z.standY||0;collZ=true;if(!z.alive){if(deadZombie(z,dt)){scene.remove(z.grp);if(z.puddle)scene.remove(z.puddle);zombies.splice(i,1);const sp=randomZombieSpawnPos();spawnZombie(sp.x,sp.z);}continue;}
if(z.bleedTimer>0){z.bleedTimer-=dt;z.bleedTickTimer=(z.bleedTickTimer||0)+dt;if(z.bleedTickTimer>=0.4){z.bleedTickTimer=0;z.hp-=z.bleedDmgPerSec*0.4;z.hitFlash=0.1;spawnBloodImpact(new THREE.Vector3(z.x,0.8+Math.random()*0.5,z.z));
if(z.hp<=0){killZombie(z);continue;}}}z.hitFlash=Math.max(0,z.hitFlash-dt);const tint=z.hitFlash>0?0x990000:0x000000;z.bodyMat.emissive.setHex(tint);z.headMat.emissive.setHex(tint);
if(z.state==='crawlIn'){z.crawlT+=dt;const T1=0.55,T2=0.85,T3=1.35;let px,pz,bodyPitch,bodyY;if(z.crawlT<T1){const p=z.crawlT/T1,ep=p*p*(3-2*p);px=z.crawlStart.x+(z.crawlEnd.x-z.crawlStart.x)*ep*0.7;pz=z.crawlStart.z+(z.crawlEnd.z-z.crawlStart.z)*ep*0.7;bodyPitch=1.15;bodyY=0.55;}else if(z.crawlT<T2){const p=(z.crawlT-T1)/(T2-T1);px=z.crawlStart.x+(z.crawlEnd.x-z.crawlStart.x)*(0.7+0.3*p);pz=z.crawlStart.z+(z.crawlEnd.z-z.crawlStart.z)*(0.7+0.3*p);bodyPitch=1.15+p*0.35;bodyY=0.55-p*0.42;}else{const p=clamp((z.crawlT-T2)/(T3-T2),0,1),ep=1-Math.pow(1-p,2);px=z.crawlEnd.x;pz=z.crawlEnd.z;bodyPitch=1.5*(1-ep);bodyY=0.13+ep*0.79;}{const rzc=resolveAllCollisionsExceptWindows(px,pz,z.r*0.7);px=rzc.x;pz=rzc.z;}z.x=px;z.z=pz;const groundY=groundHeightAt(z.x,z.z,z.standY);z.standY=(z.standY===undefined?groundY:z.standY+(groundY-z.standY)*Math.min(1,dt*20));z.heading+=angD(z.heading,z.crawlHeading)*Math.min(1,dt*8);z.grp.position.set(z.x,z.standY,z.z);z.grp.rotation.y=z.heading;z.hips.rotation.x=bodyPitch;z.hips.position.y=bodyY;const crawlSwing=Math.sin(z.crawlT*14)*0.5;z.armL.shoulder.rotation.x=-1.3+crawlSwing*0.3;z.armR.shoulder.rotation.x=-1.3-crawlSwing*0.3;z.armL.elbow.rotation.x=-0.4;z.armR.elbow.rotation.x=-0.4;z.legL.hip.rotation.x=crawlSwing*0.6;z.legR.hip.rotation.x=-crawlSwing*0.6;z.headPivot.rotation.x=z.crawlT<T2?0.3:0.3*(1-Math.min(1,(z.crawlT-T2)/(T3-T2)));if(z.crawlT>=T3){z.hips.rotation.x=0;z.hips.position.y=0.92;const rzf=resolveAllCollisions(z.x,z.z,z.r);z.x=rzf.x;z.z=rzf.z;z.state=z.hunt?'chase':'idle';z.idleT=rand(1,2.5);z.crawlCd=1.0;z.crawlWin=null;z.lastX=player.x;z.lastZ=player.z;z.lastT=0;}continue;}if(z.crawlCd>0)z.crawlCd-=dt;else{for(const cw of windows){if(!cw.broken)continue;const ax2=cw.wallAxis;const wallCoord2=ax2==='x'?cw.z:cw.x;const curCross2=ax2==='x'?z.z:z.x;const alongMin2=ax2==='x'?cw.minX:cw.minZ,alongMax2=ax2==='x'?cw.maxX:cw.maxZ;const curAlong2=ax2==='x'?z.x:z.z;if(curAlong2<alongMin2-0.4||curAlong2>alongMax2+0.4)continue;if(Math.abs(cw.sillY-.9-(z.standY||0))>1.7)continue;if(Math.abs(curCross2-wallCoord2)<0.8){startWindowCrawl(z,cw);break;}}}
const T=z.t,driving=isDriving&&drivingCar&&player.alive;const d=Math.hypot(z.x-player.x,z.z-player.z);z.senseT-=dt;z.lastT+=dt;z.attackCd-=dt;if(z.senseT<=0){z.senseT=.16+Math.random()*.1;let g=0;
if(player.alive){const hid=isCrouching&&!driving,R=(driving?18:14)*(z.state==='chase'?1.4:1);const dot=d>.01?((player.x-z.x)*Math.sin(z.heading)+(player.z-z.z)*Math.cos(z.heading))/d:1;
const clear=d<R+4?losClear(z.x,z.z,player.x,player.z,driving?2.6:.8):false;const see=!hid&&clear&&d<R&&dot>(z.state==='chase'?-.25:.35);const near=!hid&&d<4.5&&(clear||d<2.5),touch=d<z.r+player.r+.4&&Math.abs((z.standY||0)-player.standY)<1.3;z.clr=clear&&d<26&&!segBlocked(z.x,z.z,player.x,player.z);
const nr=zAI.noise*T.hear*(clear?1:.55),hear=nr>0&&d<nr;if(touch){g=2.5;z.aware=1.3;}else if(see)g=1.5+(1-d/R)*2.5;else if(near)g=1.3;else if(hear)g=.8+(1-d/nr)*1.6;if(g>0){const pr=(see||near||touch||driving)?0:Math.min(3,d*.2);z.lastX=player.x+rand(-pr,pr);z.lastZ=player.z+rand(-pr,pr);z.lastT=0;z.huntTargetId=null;}
if(window.MPNet&&MPNet.active&&MPNet.isHost&&MPNet.remotePlayers&&MPNet.remotePlayers.size){for(const[rid,rp]of MPNet.remotePlayers){if(!rp.alive)continue;const rd=Math.hypot(z.x-rp.x,z.z-rp.z);if(rd>26)continue;const rclear=losClear(z.x,z.z,rp.x,rp.z,.8);const rsee=rclear&&rd<14;const rtouch=rd<z.r+0.9;let rg=0;if(rtouch){rg=2.5;}else if(rsee)rg=1.5+(1-rd/14)*2.5;else if(rd<4.5&&rclear)rg=1.3;if(rg>0&&(rg>=g||rd<d)){g=Math.max(g,rg);z.lastX=rp.x;z.lastZ=rp.z;z.lastT=0;z.huntTargetId=rid;}}}
}z.gain=g;}z.aware=clamp(z.aware+(z.gain>0?z.gain:-.2)*dt,0,1.3);{const st=z.state;if(st!=='chase'&&(!z.hunt||(st!=='seek'&&st!=='bash'))){if(z.aware>=1)enterChase(z);else if(z.aware>.35&&st!=='alert'&&st!=='investigate'&&st!=='seek'&&st!=='bash'){z.state='alert';z.alertT=rand(.5,1.1);}
}else if(st==='chase'&&z.lastT>4.5){z.state='investigate';z.hunt=false;z.tx=z.lastX;z.tz=z.lastZ;z.stT=9;z.aware=.5;}}let inRange=false,atkTargetId=z.huntTargetId||null,atkLocal=true,atkX=player.x,atkZ=player.z,atkAlive=player.alive,atkR=player.r,atkStandY=player.standY;
if(atkTargetId){if(window.MPNet&&MPNet.remotePlayers&&MPNet.remotePlayers.has(atkTargetId)){const rp=MPNet.remotePlayers.get(atkTargetId);if(rp&&rp.alive){atkLocal=false;atkX=rp.x;atkZ=rp.z;atkAlive=true;atkR=0.5;atkStandY=rp.jumpY||0;}else{atkTargetId=null;z.huntTargetId=null;}}else{atkTargetId=null;z.huntTargetId=null;}}
const dAtk=atkLocal?d:Math.hypot(z.x-atkX,z.z-atkZ);
if(atkAlive&&z.state==='chase'){
if(atkLocal&&driving){const so=drivingCar.solidObj,cx=clamp(z.x,so.minX,so.maxX),cz=clamp(z.z,so.minZ,so.maxZ);inRange=Math.hypot(z.x-cx,z.z-cz)<z.r+.9&&(z.standY||0)<1.3;}else inRange=dAtk<z.r+atkR+.55&&Math.abs((z.standY||0)-atkStandY)<1.3&&!segBlocked(z.x,z.z,atkX,atkZ);
}let sp=0,tx=null,tz=null,look=null;const W=z.speed;switch(z.state){case'chase':{const st=stairTarget(z);tx=st?st[0]:z.lastX;tz=st?st[1]:z.lastZ;sp=W;}look=[z.lastX,z.lastZ];break;
case'alert':z.alertT-=dt;look=[z.lastX,z.lastZ];if(z.alertT<=0){if(z.aware>=1)enterChase(z);else{z.state='investigate';z.tx=z.lastX;z.tz=z.lastZ;z.stT=9;}}break;case'investigate':tx=z.tx;tz=z.tz;sp=W*.5;z.stT-=dt;look=[tx,tz];
if(Math.hypot(tx-z.x,tz-z.z)<1.3||z.stT<=0){z.state='idle';z.idleT=rand(2,4);}break;case'idle':z.idleT-=dt;if(z.idleT<=0)pickBehavior(z);break;case'wander':z.wT-=dt;sp=W*.25;tx=z.x+Math.sin(z.wa)*5;tz=z.z+Math.cos(z.wa)*5;if(z.wT<=0){z.state='idle';z.idleT=rand(1,3.5);}break;
case'patrol':tx=z.tx;tz=z.tz;sp=W*.4;z.stT-=dt;if(Math.hypot(tx-z.x,tz-z.z)<1.5||z.stT<=0){z.state='idle';z.idleT=rand(1,3);}break;case'sniff':{const t=z.bashTarget;if(!t||t.broken||t.open){z.state='idle';z.idleT=2;break;}
look=[t.x,t.z];if(z.sniffT===undefined){z.stT-=dt;const dd=Math.hypot(t.x-z.x,t.z-z.z);if(dd<z.r+1.2)z.sniffT=rand(2.2,3.8);else if(z.stT<=0){z.state='idle';z.idleT=2;}else{tx=t.x;tz=t.z;sp=W*.33;}}
else{z.sniffT-=dt;if(z.sniffT<=0){z.sniffT=undefined;if(Math.random()<.5){z.state='bash';z.bashType='door';z.bashCd=0;z.bashHits=Math.floor(rand(2,5));}else{z.state='idle';z.idleT=rand(1.5,3);}}}
break;}case'seek':if(z.bashTarget){tx=z.bashTarget.x;tz=z.bashTarget.z;sp=W*.9;look=[tx,tz];}else z.state='chase';break;case'bash':if(z.bashTarget)look=[z.bashTarget.x,z.bashTarget.z];break;
}if(inRange&&z.attackCd<=0){if(atkLocal){player.hp-=rand(8,15)*playerDamageMultiplier()*T.dm*(driving?.55:1);flashHurt();showMsg(driving?'¡Los zombies golpean el auto!':'¡El zombie te golpeó!');}else if(window.MPNet&&MPNet.sendZombieDamageToPlayer){MPNet.sendZombieDamageToPlayer(atkTargetId,rand(8,15)*T.dm);}z.attackCd=rand(.9,1.2);z.attackAnimT=1.0;
}let dvx=0,dvz=0;if(sp>0&&tx!==null){const len=Math.hypot(tx-z.x,tz-z.z)||1;let a=Math.atan2(tx-z.x,tz-z.z);if(z.state==='chase')a+=z.flank*clamp((len-2.5)/9,0,1);if(z.state!=='seek'&&z.state!=='sniff')a=steerAng(z,a);
const k=inRange?0:len<1.2?len/1.2:1;dvx=Math.sin(a)*sp*k;dvz=Math.cos(a)*sp*k;}for(const o of zombies){if(o===z||!o.alive)continue;const ox=z.x-o.x,oz=z.z-o.z,od=Math.hypot(ox,oz);
if(od<1.5&&od>.001){const f=(1.5-od)/1.5*1.6;dvx+=ox/od*f;dvz+=oz/od*f;}}const acc=1-Math.exp(-dt*(z.state==='chase'?6:3));z.vx+=(dvx-z.vx)*acc;z.vz+=(dvz-z.vz)*acc;const ox0=z.x,oz0=z.z,nx=z.x+z.vx*dt,nz=z.z+z.vz*dt;
const desiredDist=Math.hypot(nx-z.x,nz-z.z);let rz=resolveAllCollisions(nx,nz,z.r);{const pdx=rz.x-player.x,pdz=rz.z-player.z,pdist=Math.hypot(pdx,pdz);const minDist=z.r+player.r+0.05;
if(pdist<minDist){const push=(minDist-pdist)+0.001;const pnx=pdist>0.0001?pdx/pdist:1,pnz=pdist>0.0001?pdz/pdist:0;rz.x+=pnx*push;rz.z+=pnz*push;}}for(const other of zombies){
if(other===z|| !other.alive)continue;const odx=rz.x-other.x,odz=rz.z-other.z,odist=Math.hypot(odx,odz);const minD=z.r+other.r;if(odist<minD&&odist>0.0001){const push=(minD-odist)*0.5+0.001;
rz.x+=(odx/odist)*push;rz.z+=(odz/odist)*push;}}rz=resolveAllCollisions(rz.x,rz.z,z.r);const movedDist=Math.hypot(rz.x-z.x,rz.z-z.z);z.x=clamp(rz.x,-ARENA+1,ARENA-1);z.z=clamp(rz.z,-ARENA+1,ARENA-1);
if(dt>0){z.vx+=((z.x-ox0)/dt-z.vx)*.5;z.vz+=((z.z-oz0)/dt-z.vz)*.5;}const spdNow=Math.hypot(z.vx,z.vz);{let ha=null;if(inRange)ha=Math.atan2(player.x-z.x,player.z-z.z);else if(spdNow>.3)ha=Math.atan2(z.vx,z.vz);
else if(look)ha=Math.atan2(look[0]-z.x,look[1]-z.z);if(ha!==null)z.heading+=angD(z.heading,ha)*Math.min(1,dt*(z.state==='chase'?9:4));}if(z.state==='chase'||z.state==='investigate'){
const wantDist=Math.hypot(dvx,dvz)*dt;if(wantDist>.02&&movedDist<wantDist*0.35)z.stuckT=(z.stuckT||0)+dt;else z.stuckT=0;if(z.state==='chase'&&!z.clr&&d<26&&z.lastT<3&&!stairTarget(z))z.blockT=(z.blockT||0)+dt;else z.blockT=0;
if(z.stuckT>0.5||z.blockT>1.4){const found=findNearestBreakable(z.x,z.z,z.standY||0,z.lastX,z.lastZ);if(found){z.state='seek';z.bashTarget=found.ref;z.bashType=found.type;z.bashHits=undefined;}
z.stuckT=0;z.blockT=0;}}const goneT=t=>(z.bashType==='door'&&(t.open||t.broken))||(z.bashType==='window'&&t.broken);if(z.state==='seek'&&z.bashTarget){const t=z.bashTarget;
if(goneT(t)){z.state='chase';z.bashTarget=null;}else if(Math.hypot(t.x-z.x,t.z-z.z)<z.r+1.05){z.state='bash';z.bashCd=0;}}if(z.state==='bash'&&z.bashTarget){const t=z.bashTarget;
if(goneT(t)){const rnd=z.bashHits!==undefined;z.bashHits=undefined;z.bashTarget=null;z.state=rnd?'idle':'chase';z.idleT=2;}else{z.bashCd=(z.bashCd||0)-dt;if(z.bashCd<=0){
z.bashCd=0.85;z.attackAnimT=1.0;if(z.bashType==='door')damageDoor(t,rand(9,16));else damageWindow(t,rand(11,18));if(z.bashHits!==undefined&& --z.bashHits<=0){z.bashHits=undefined;z.state='idle';z.idleT=rand(1.5,3);}
}}}else if(z.state==='bash'){z.state='chase';}const standTarget=groundHeightAt(z.x,z.z,z.standY);z.standY=(z.standY===undefined?standTarget:z.standY+(standTarget-z.standY)*Math.min(1,dt*(standTarget>z.standY?26:8)));
z.grp.position.set(z.x,z.standY,z.z);z.grp.rotation.y=z.heading;{const now=performance.now(),lk=look?clamp(angD(z.heading,Math.atan2(look[0]-z.x,look[1]-z.z)),-1,1):Math.sin(now/1700+z.seed)*.5;
const sn=z.state==='sniff'&&z.sniffT!==undefined,hp=sn?.5+Math.sin(now/95)*.07:.08,kk=Math.min(1,dt*5);z.headYaw+=(lk-z.headYaw)*kk;z.headPitch+=(hp-z.headPitch)*kk;z.headPivot.rotation.y=z.headYaw;z.headPivot.rotation.x=z.headPitch;}
const targetAnimSpeed=spdNow>.15?1.6+spdNow*1.9:0;z.animSpeed=z.animSpeed===undefined?targetAnimSpeed:z.animSpeed+(targetAnimSpeed-z.animSpeed)*Math.min(1,dt*6);z.walkPhase=(z.walkPhase||0)+dt*z.animSpeed;
const targetAmp=z.animSpeed>0.45?clamp(.45+spdNow*.18,.5,1):0;z.walkAmp=z.walkAmp===undefined?targetAmp:z.walkAmp+(targetAmp-z.walkAmp)*Math.min(1,dt*5);const swing=Math.sin(z.walkPhase)*0.55*z.walkAmp;
z.legL.hip.rotation.x=swing;z.legR.hip.rotation.x= -swing;z.legL.knee.rotation.x=Math.max(0,-Math.sin(z.walkPhase+0.5))*0.9*z.walkAmp;z.legR.knee.rotation.x=Math.max(0,-Math.sin(z.walkPhase+0.5+Math.PI))*0.9*z.walkAmp;
z.hips.position.y=0.92+Math.abs(Math.sin(z.walkPhase))*0.035*z.walkAmp;z.headPivot.rotation.z=Math.sin(z.walkPhase*0.5)*0.06*z.walkAmp+(1-z.walkAmp)*Math.sin(performance.now()/1400+z.walkPhase)*0.02;
const chaseLean=(z.state==='chase')?0.12*z.walkAmp:0.02*z.walkAmp;z.hips.rotation.x+=(chaseLean-z.hips.rotation.x)*Math.min(1,dt*5);z.ap+=(((z.state==='chase'||z.state==='seek'||z.state==='bash'||z.state==='alert')?1.15:.4)-z.ap)*Math.min(1,dt*4);
const baseArmL= -swing*0.7-z.ap,baseArmR=swing*0.7-z.ap;const elbowSway=Math.sin(z.walkPhase*2)*0.1*z.walkAmp;z.attackAnimT=Math.max(0,(z.attackAnimT||0)-dt*2.4);if(z.attackAnimT>0){
const p=1-z.attackAnimT;let raise,elbowT;if(p<0.28){const k=p/0.28;const ek=k*k*(3-2*k);raise=ek;elbowT=ek*0.3;}else{const k=Math.min(1,(p-0.28)/0.72);const ek=1-Math.pow(1-k,2);raise=1-ek;elbowT=0.3*(1-ek);}
z.armL.shoulder.rotation.x= -Math.PI*0.85*raise-0.2;z.armR.shoulder.rotation.x= -Math.PI*0.85*raise-0.2;z.armL.elbow.rotation.x= -0.15*raise-elbowT;z.armR.elbow.rotation.x= -0.15*raise-elbowT;
z.hips.position.z= -0.12*Math.sin(Math.min(1,p/0.6)*Math.PI);}else{z.armL.shoulder.rotation.x=baseArmL;z.armR.shoulder.rotation.x=baseArmR;z.armL.elbow.rotation.x= -0.5+elbowSway;z.armR.elbow.rotation.x= -0.5+elbowSway;
z.hips.position.z+=(0-z.hips.position.z)*Math.min(1,dt*6);}/* syncFbxZombie(z); -- desactivado: el modelo de los zombies se queda en su pose de referencia por ahora */}}function findNearestInteractable(){let best=null,bestD=Infinity,bestType=null;if(isDriving)return{ref:drivingCar,type:'car_exit'};
for(const car of cars){const d=Math.hypot(car.x-player.x,car.z-player.z);if(d<3.4&&d<bestD){bestD=d;best=car;bestType='car';}}for(const gi of grounditems){const d=Math.hypot(gi.x-player.x,gi.z-player.z);if(d<2.4&&d<bestD){bestD=d;best=gi;bestType='item';}}
for(const c of lootCrates){if(c.opened)continue;const d=Math.hypot(c.x-player.x,c.z-player.z);if(d<2.6&&d<bestD&&Math.abs((c.y||0)-player.standY)<2.2){bestD=d;best=c;bestType='crate';}}
for(const dr of doors){const d=Math.hypot(dr.x-player.x,dr.z-player.z);const fy=dr.floorY||0;if(d<2.8&&d<bestD&&player.standY>=fy-.2&&player.standY<=fy+(dr.doorHeight||2.3)+.2){bestD=d;best=dr;bestType='door';}}for(const w of windows){if(!w.broken||Math.abs(w.x-player.x)>2||Math.abs(w.z-player.z)>2)continue;const d=Math.hypot(w.x-player.x,w.z-player.z);if(d<1.9&&d<bestD&&Math.abs(w.sillY-.9-player.standY)<1.6){bestD=d;best=w;bestType='window';}}
return best?{ref:best,type:bestType}:null;}function vaultWindow(w){if(player.vault||player.falling)return;const ax=w.wallAxis,sg=(ax==='x'?player.z-w.z:player.x-w.x)>=0?1:-1;
const tx=ax==='x'?clamp(player.x,w.minX+.4,w.maxX-.4):w.x-sg*1.3,tz=ax==='x'?w.z-sg*1.3:clamp(player.z,w.minZ+.4,w.maxZ-.4);player.vault={t:0,fx:player.x,fz:player.z,tx,tz};showMsg('Saltas por la ventana');
}function landHurt(drop){const dmg=Math.max(0,(drop-2.5)*13);if(dmg<=0)return;player.hp-=dmg;flashHurt();if(drop>=4||dmg>=25){player.bleed=true;showMsg('¡Caída! -'+Math.round(dmg)+' de salud. 🩸 Estás sangrando: usa un vendaje');}
else showMsg('¡Caída! -'+Math.round(dmg)+' de salud');}function tryInteract(){if(!player.alive)return;const found=findNearestInteractable();if(!found)return;if(found.type==='car_exit'){
isDriving=false;if(drivingCar){const sideVec=new THREE.Vector3(-1.8,0,0).applyEuler(new THREE.Euler(0,drivingCar.rotY,0));player.x=drivingCar.x+sideVec.x;player.z=drivingCar.z+sideVec.z;
drivingCar=null;}showMsg('Saliste del auto');}else if(found.type==='car'){const car=found.ref;if(car.fuel<=0){showMsg('Este auto no tiene gasolina');}else{isDriving=true;
drivingCar=car;showMsg('Conduciendo auto ('+Math.round(car.fuel)+'% gasolina)');}}else if(found.type==='item'){pickupGroundItem(found.ref);
updateAmmoHud();}else if(found.type==='window'){vaultWindow(found.ref);}else if(found.type==='crate'){openCrate(found.ref);}else if(found.type==='door'){
if(found.ref.broken){showMsg('La puerta está destrozada, no se puede cerrar.');}else{found.ref.open=!found.ref.open;netSyncDoor(found.ref);}showMsg(found.ref.open?'Puerta abierta':'Puerta cerrada');
}}function startUse(invIndex){if(useAction||reloading||isDriving)return;const s=inventory[invIndex],meta=s?ITEMS[s.id]:null;if(!meta||!isConsumable(s.id))return;useAction={duration:meta.useTime||1.5,elapsed:0,perSec:{hunger:(meta.food||0)/(meta.useTime||1.5),thirst:(meta.thirst||0)/(meta.useTime||1.5),heal:(meta.heal||0)/(meta.useTime||1.5)}};
s.qty--;if(s.qty<=0)inventory[invIndex]=null;closeAllPanels();refreshInvUI();useMesh.visible=true;document.getElementById('useIc').textContent=meta.icon;document.getElementById('useLbl').textContent=meta.useLbl;document.getElementById('useBar').style.display='flex';
}function updateUse(dt){if(!useAction)return;useAction.elapsed+=dt;const p=clamp(useAction.elapsed/useAction.duration,0,1);player.hunger=clamp(player.hunger+useAction.perSec.hunger*dt,0,100);
player.thirst=clamp(player.thirst+useAction.perSec.thirst*dt,0,100);player.hp=clamp(player.hp+useAction.perSec.heal*dt,0,player.maxhp);if(useAction.perSec.heal>0){useAction.cure=(useAction.cure||0)+dt;if(useAction.cure>1.2&&player.bleed){player.bleed=false;showMsg('Detuviste el sangrado');}}
document.getElementById('usePBar').style.width=(p*100)+'%';useMesh.position.set(0.18+Math.sin(p*Math.PI*6)*0.01,-0.34+Math.sin(p*Math.PI)*0.14,-0.42-Math.sin(p*Math.PI)*0.08);
useMesh.rotation.z=Math.sin(p*Math.PI*8)*0.15;if(p>=1){useAction=null;useMesh.visible=false;document.getElementById('useBar').style.display='none';}}function clickSlot(evt,loc){
const item=getItem(loc);if(!item){closeItemMenu();return;}openItemMenu(evt,loc);}function equipFromStorage(loc){const item=getItem(loc);if(!item)return;const meta=ITEMS[item.id];
let targetKey=null;if(meta.backpack)targetKey='backpack';else if(meta.armorSlot)targetKey=meta.armorSlot;else if(meta.weapon){if(meta.ranged)targetKey='primary';else if(meta.melee)targetKey='secondary';
}if(!targetKey){showMsg('Ese objeto no se puede equipar.');return;}if(targetKey==='backpack'){const newMax=BASE_INV_SIZE+(meta.extraSlots||0);if(newMax<inventory.length){
for(let i=newMax;i<inventory.length;i++){if(inventory[i]&&i!==loc.index){showMsg('Vacía la mochila antes de cambiarla.');return;}}}}const prevEquipped=equip[targetKey];equip[targetKey]=item;inventory[loc.index]=prevEquipped||null;
if(targetKey==='backpack'){syncInventorySize();updateBackpackVisual();}refreshInvUI();updateAmmoHud();updateHeldWeaponVisibility();showMsg(itemName(item.id)+' equipado.');
}function unequipItem(loc){const item=equip[loc.key];if(!item)return;if(loc.key==='backpack'){for(let i=BASE_INV_SIZE;i<inventory.length;i++){if(inventory[i]){showMsg('Vacía la mochila antes de quitártela.');return;}}
let freeIdx=-1;for(let i=0;i<BASE_INV_SIZE;i++){if(!inventory[i]){freeIdx=i;break;}}if(freeIdx===-1){showMsg('No hay espacio en el inventario.');return;}inventory[freeIdx]=item;equip.backpack=null;
syncInventorySize();updateBackpackVisual();}else{const freeIdx=inventory.findIndex(s=>!s);if(freeIdx===-1){showMsg('No hay espacio en el inventario.');return;}inventory[freeIdx]=item;equip[loc.key]=null;
}refreshInvUI();updateAmmoHud();updateHeldWeaponVisibility();showMsg(itemName(item.id)+' desequipado.');}function dropItem(loc){const item=getItem(loc);if(!item)return;setItem(loc,null);
if(loc.area==='equip'&&loc.key==='backpack'){syncInventorySize();updateBackpackVisual();}const dropX=player.x+Math.sin(player.yaw)*0.8,dropZ=player.z+Math.cos(player.yaw)*0.8;
spawnGroundItemAt(dropX,0.5,dropZ,item.id,item.qty||1);refreshInvUI();updateAmmoHud();updateHeldWeaponVisibility();showMsg(itemName(item.id)+' soltado.');}function openItemMenu(evt,loc){
const item=getItem(loc);if(!item)return;hideTooltip();menuLoc=loc;const meta=ITEMS[item.id];const primaryBtn=document.getElementById('itemMenuPrimary');if(loc.area==='equip'){
primaryBtn.style.display='inline-block';primaryBtn.textContent='Desequipar';primaryBtn.onclick=(e)=>{e.stopPropagation();unequipItem(loc);closeItemMenu();};}else if(isConsumable(item.id)){
primaryBtn.style.display='inline-block';primaryBtn.textContent='Usar';primaryBtn.onclick=(e)=>{e.stopPropagation();startUse(loc.index);closeItemMenu();};}else if(meta.weapon||meta.backpack||meta.armorSlot){
primaryBtn.style.display='inline-block';primaryBtn.textContent='Equipar';primaryBtn.onclick=(e)=>{e.stopPropagation();equipFromStorage(loc);closeItemMenu();};}else{primaryBtn.style.display='none';
}document.getElementById('itemMenuDrop').onclick=(e)=>{e.stopPropagation();dropItem(loc);closeItemMenu();};const menu=document.getElementById('itemMenu');menu.style.display='flex';
const pad=6;let x=evt.clientX+pad,y=evt.clientY+pad;const rect=menu.getBoundingClientRect();if(x+rect.width>window.innerWidth-8)x=evt.clientX-rect.width-pad;if(y+rect.height>window.innerHeight-8)y=evt.clientY-rect.height-pad;
menu.style.left=Math.max(4,x)+'px';menu.style.top=Math.max(4,y)+'px';}function closeItemMenu(){const menu=document.getElementById('itemMenu');if(menu)menu.style.display='none';menuLoc=null;}
document.addEventListener('mousedown',(e)=>{const menu=document.getElementById('itemMenu');if(menu&&menu.style.display!=='none'&& !menu.contains(e.target))closeItemMenu();
});function refreshHotbarUI(){const bar=document.getElementById('hotbar');bar.innerHTML='';const tags={primary:'ARMA1',secondary:'ARMA2'};['primary','secondary'].forEach((k,i)=>{
const it=equip[k],el=document.createElement('div');el.className='slot'+(activeSlotKey===k?' active':'');el.innerHTML=`<span class="num">${i+1}</span>${it?itemIcon(it.id):''}<span class="tag">${tags[k]}</span>`;
el.onclick=()=>{activeSlotKey=k;onSlotChange();};el.onmouseenter=(e)=>showTooltip(e,it?it.id:null);el.onmousemove=positionTooltip;el.onmouseleave=hideTooltip;bar.appendChild(el);
});}const tooltipEl=document.getElementById('tooltip');function tooltipHtmlFor(id){const item=ITEMS[id];if(!item)return'';let stats='';if(item.weapon){if(item.ranged)stats+=`💥 Daño ${item.dmg} &nbsp;·&nbsp; 🔄 ${item.cooldown}s &nbsp;·&nbsp; 🔋 ${item.mag} balas<br>`;
else if(item.melee){stats+=`⚔️ Ligero ${item.dmgLight} &nbsp;·&nbsp; 🔨 Pesado ${item.dmgHeavy}<br>`;if(item.bleedDmg)stats+=`🩸 Sangrado ${item.bleedDmg}/tick × ${item.bleedDuration}s<br>`;
}}if(item.food)stats+=`🍗 Hambre +${item.food}<br>`;if(item.thirst)stats+=`💧 Sed +${item.thirst}<br>`;if(item.heal)stats+=`❤️ Salud +${item.heal}<br>`;if(item.extraSlots)stats+=`🎒 +${item.extraSlots} huecos<br>`;
if(item.armorSlot&&item.defense)stats+=`🛡️ Defensa +${Math.round(item.defense*100)}%<br>`;return`<div class="ttName"><span class="ic">${item.icon}</span>${item.name}</div><div class="ttDesc">${item.desc||'Sin descripción.'}</div>${stats?`<div class="ttStats">${stats}</div>`:''}`;
}function positionTooltip(evt){if(!tooltipEl|| !tooltipEl.classList.contains('show'))return;const pad=18;let x=evt.clientX+pad,y=evt.clientY+pad;const rect=tooltipEl.getBoundingClientRect();
if(x+rect.width>window.innerWidth-8)x=evt.clientX-rect.width-pad;if(y+rect.height>window.innerHeight-8)y=evt.clientY-rect.height-pad;tooltipEl.style.left=Math.max(4,x)+'px';tooltipEl.style.top=Math.max(4,y)+'px';
}function showTooltip(evt,id){if(!tooltipEl|| !id|| !ITEMS[id]){hideTooltip();return;}tooltipEl.innerHTML=tooltipHtmlFor(id);tooltipEl.classList.add('show');positionTooltip(evt);
}function hideTooltip(){if(tooltipEl)tooltipEl.classList.remove('show');}function refreshInvUI(){refreshHotbarUI();const capts={primary:'arma principal',secondary:'arma secundaria',backpack:'mochila',hat:'sombrero',mask:'máscara',shirt:'camisa',pants:'pantalón',vest:'chaleco'};
const eqRow=document.getElementById('equipRow');if(eqRow){eqRow.innerHTML='';['primary','secondary'].forEach(k=>{const it=equip[k],el=document.createElement('div');el.className='equipBox'+(selectedLoc&&selectedLoc.area==='equip'&&selectedLoc.key===k?' selected':'')+(activeSlotKey===k?' isActive':'');
el.innerHTML=`${it?itemIcon(it.id):''}${it&&it.qty>1?`<span class="qty">${it.qty}</span>`:''}<span class="capt">${capts[k]}</span>`;el.onclick=(e)=>clickSlot(e,{area:'equip',key:k});
el.onmouseenter=(e)=>showTooltip(e,it?it.id:null);el.onmousemove=positionTooltip;el.onmouseleave=hideTooltip;eqRow.appendChild(el);});}const clothRow=document.getElementById('clothRow');
if(clothRow){clothRow.innerHTML='';['hat','mask','shirt','vest','pants','backpack'].forEach(k=>{const it=equip[k],el=document.createElement('div');el.className='equipBox'+(selectedLoc&&selectedLoc.area==='equip'&&selectedLoc.key===k?' selected':'');
el.innerHTML=`${it?itemIcon(it.id):''}${it&&it.qty>1?`<span class="qty">${it.qty}</span>`:''}<span class="capt">${capts[k]}</span>`;el.onclick=(e)=>clickSlot(e,{area:'equip',key:k});
el.onmouseenter=(e)=>showTooltip(e,it?it.id:null);el.onmousemove=positionTooltip;el.onmouseleave=hideTooltip;clothRow.appendChild(el);});}const grid=document.getElementById('invGrid');if(!grid)return;grid.innerHTML='';
const storageLbl=document.getElementById('storageLbl');if(storageLbl)storageLbl.textContent=equip.backpack?('Mochila ('+inventory.length+')'):('Bolsillos ('+inventory.length+')');
for(let i=0;i<inventory.length;i++){const s=inventory[i],el=document.createElement('div');el.className='gslot'+(selectedLoc&&selectedLoc.area==='storage'&&selectedLoc.index===i?' selected':'')+(s&&isConsumable(s.id)?' usable':'');
el.innerHTML=`${s?itemIcon(s.id):''}${s&&s.qty>1?`<span class="qty">${s.qty}</span>`:''}`;el.onclick=(e)=>clickSlot(e,{area:'storage',index:i});el.onmouseenter=(e)=>showTooltip(e,s?s.id:null);el.onmousemove=positionTooltip;el.onmouseleave=hideTooltip;
grid.appendChild(el);}const nearGrid=document.getElementById('nearbyGrid');if(nearGrid){nearGrid.innerHTML='';const near=grounditems.filter(gi=>Math.hypot(gi.x-player.x,gi.z-player.z)<4.5).sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z));
if(near.length===0){nearGrid.innerHTML='<div class="nearbyEmpty">No hay nada cerca.</div>';}else near.forEach(gi=>{const el=document.createElement('div');el.className='gslot';
el.innerHTML=`${itemIcon(gi.id)}${gi.qty>1?`<span class="qty">${gi.qty}</span>`:''}`;el.title=itemName(gi.id);el.onclick=()=>{pickupGroundItem(gi);refreshInvUI();};
el.onmouseenter=(e)=>showTooltip(e,gi.id);el.onmousemove=positionTooltip;el.onmouseleave=hideTooltip;nearGrid.appendChild(el);});}updateCharacterPreview();updateHeldWeaponVisibility();
}function toggleInv(){const p=document.getElementById('invPanel');p.classList.toggle('open');if(p.classList.contains('open')){selectedLoc=null;refreshInvUI();document.exitPointerLock();}else relockAfterPanelClose();}
document.getElementById('closeInv').onclick=()=>{document.getElementById('invPanel').classList.remove('open');relockAfterPanelClose();};function closeAllPanels(){document.getElementById('invPanel').classList.remove('open');relockAfterPanelClose();}
function relockAfterPanelClose(){hideTooltip();if(gameStarted&&player.alive&&document.pointerLockElement!==canvas)canvas.requestPointerLock();}function updateAmmoHud(){const item=equip[activeSlotKey],meta=item?ITEMS[item.id]:null,hud=document.getElementById('ammoHud');
if(!isDriving&&meta&&meta.ranged){hud.style.display='block';hud.childNodes[0].nodeValue=`${item.loaded||0} / ${meta.mag}`;document.getElementById('ammoSub').textContent='reserva: '+countItem(meta.ammo);}else hud.style.display='none';
}let last=performance.now();let gameStarted=false;let tabHidden=false;const _rHandTmp=new THREE.Vector3();const _lHandTmp=new THREE.Vector3();document.addEventListener('visibilitychange',()=>{tabHidden=document.hidden;if(!tabHidden)last=performance.now();});function update(dt){if(msgTimer>0){msgTimer-=dt;if(msgTimer<=0)document.getElementById('msg').style.opacity=0;}if(player.attackCd>0)player.attackCd-=dt;
if(leftPunchT>0)leftPunchT=Math.max(0,leftPunchT-dt*4.5);if(rightPunchT>0)rightPunchT=Math.max(0,rightPunchT-dt*3.5);if(axeHitstopT>0)axeHitstopT=Math.max(0,axeHitstopT-dt);
const swingDt=axeHitstopT>0?0:dt;if(axeSwingLightT>0)axeSwingLightT=Math.max(0,axeSwingLightT-swingDt*2.8);if(axeSwingHeavyT>0)axeSwingHeavyT=Math.max(0,axeSwingHeavyT-swingDt*1.8);
if(camPunch>0)camPunch=Math.max(0,camPunch-dt*6);if(pendingMeleeHit){pendingMeleeHit.timer-=dt;if(pendingMeleeHit.timer<=0){const connected=checkMeleeHit(pendingMeleeHit.dmg,pendingMeleeHit.rng,forwardVec(),pendingMeleeHit.meta,pendingMeleeHit.bleed);
if(connected){axeHitstopT=pendingMeleeHit.heavy?0.07:0.03;camPunch=pendingMeleeHit.heavy?1.0:0.4;}pendingMeleeHit=null;}}for(const t of targets){if(!t.alive){t.respawn-=dt;if(t.respawn<=0){t.alive=true;t.hp=t.maxhp;t.grp.visible=true;}}}
const moving=(keys['w']||keys['a']||keys['s']||keys['d']);if(!keys['w'])isSprinting=false;let bob=0;const targetEyeHeight=isCrouching?EYE_HEIGHT_CROUCH:EYE_HEIGHT_STAND;currentEyeHeight+=(targetEyeHeight-currentEyeHeight)*dt*10;
const cannotMove=(isAiming&&isCrouching);if(player.alive){if(isDriving&&drivingCar){let accel=0,steer=0;if(keys['w'])accel+=1;if(keys['s'])accel-=1;if(keys['a'])steer+=1;
if(keys['d'])steer-=1;if(accel!==0&&drivingCar.fuel>0){drivingCar.speed+=accel*drivingCar.accel*dt;drivingCar.fuel-=dt*2.5;if(drivingCar.fuel<=0){drivingCar.fuel=0;showMsg('¡El vehículo se quedó sin gasolina!');
}}else{drivingCar.speed*=Math.pow(0.08,dt);}const wheelFactor=carSpeedFactor(drivingCar);drivingCar.speed=clamp(drivingCar.speed,-drivingCar.maxSpeed*0.4*wheelFactor,drivingCar.maxSpeed*wheelFactor);
if(Math.abs(drivingCar.speed)>0.2){const dirSign=Math.sign(drivingCar.speed);const wobble=wheelFactor<1?(Math.sin(performance.now()*0.01)*0.35*(1-wheelFactor)):0;drivingCar.rotY+=(steer*drivingCar.steerSpeed*wheelFactor+wobble)*dt*dirSign;
}const carDirX=Math.sin(drivingCar.rotY);const carDirZ=Math.cos(drivingCar.rotY);let nx=drivingCar.x+carDirX*drivingCar.speed*dt;let nz=drivingCar.z+carDirZ*drivingCar.speed*dt;
collZ=false;collY=0;const res=resolveCollisionExcept(nx,nz,1.3,drivingCar.solidObj);drivingCar.x=clamp(res.x,-ARENA+2,ARENA-2);drivingCar.z=clamp(res.z,-ARENA+2,ARENA-2);
drivingCar.grp.position.set(drivingCar.x,0,drivingCar.z);drivingCar.grp.rotation.y=drivingCar.rotY;drivingCar.solidObj.minX=drivingCar.x-1.2;drivingCar.solidObj.maxX=drivingCar.x+1.2;
drivingCar.solidObj.minZ=drivingCar.z-2.2;drivingCar.solidObj.maxZ=drivingCar.z+2.2;if(drivingCar.crate){const trunkOff=new THREE.Vector3(0,0,-2.4).applyEuler(new THREE.Euler(0,drivingCar.rotY,0));
drivingCar.crate.x=drivingCar.x+trunkOff.x;drivingCar.crate.z=drivingCar.z+trunkOff.z;}
_carNetT+=dt;if(_carNetT>1/12){_carNetT=0;if(window.MPNet&&MPNet.active&&window.__netCarState)window.__netCarState(drivingCar.netId,drivingCar.x,drivingCar.z,drivingCar.rotY,drivingCar.fuel);}
player.x=drivingCar.x;player.z=drivingCar.z;player.yaw=drivingCar.rotY;player.standY=0;
const camDist=5.2;const camHeight=2.2;const camOffset=new THREE.Vector3(0,camHeight,-camDist).applyEuler(new THREE.Euler(0,drivingCar.rotY,0));camera.position.set(drivingCar.x+camOffset.x,camHeight,drivingCar.z+camOffset.z);
camera.lookAt(drivingCar.x,0.8,drivingCar.z);if(Math.abs(drivingCar.speed)>3.0){for(const z of zombies){if(z.alive&&Math.hypot(z.x-drivingCar.x,z.z-drivingCar.z)<2.0){hitZombie(z,150,new THREE.Vector3(z.x,1,z.z),null,{x:carDirX,z:carDirZ});
}}}player.hunger=clamp(player.hunger-0.02*dt,0,100);player.thirst=clamp(player.thirst-0.035*dt,0,100);}else{if(player.vault){const v=player.vault;v.t+=dt/.5;const k=Math.min(1,v.t);player.x=v.fx+(v.tx-v.fx)*k;player.z=v.fz+(v.tz-v.fz)*k;player._jumpY=Math.sin(k*Math.PI)*.6;if(k>=1){player.vault=null;player._jumpY=0;}}
let mvF=0,mvR=0;if(keys['w'])mvF+=1;if(keys['s'])mvF-=1;if(keys['d'])mvR+=1;if(keys['a'])mvR-=1;let spdMultiplier=isCrouching?0.45:(isAiming?0.5:1.0);if(isSprinting&&keys['w']&& !isCrouching&& !isAiming&&player.stamina>0){
spdMultiplier=1.65;player.hunger=clamp(player.hunger-0.2*dt,0,100);player.thirst=clamp(player.thirst-0.32*dt,0,100);player.stamina=clamp(player.stamina-15*dt,0,100);if(player.stamina===0){isSprinting=false;showMsg("¡Sin energía para correr!");}
}else{player.stamina=clamp(player.stamina+6*dt,0,100);}if(moving&&pointerLocked&& !anyPanelOpen()&& !cannotMove&& !player.vault){const f=forwardVec(),r=rightVec(f),len=Math.hypot(mvF,mvR)||1;
const dirX=(f.x*mvF+r.x*mvR)/len,dirZ=(f.z*mvF+r.z*mvR)/len;const spd=player.speed*spdMultiplier;const nx=player.x+dirX*spd*dt,nz=player.z+dirZ*spd*dt;collZ=false;collY=player.standY;const resolved=movePlayerSwept(player.x,player.z,nx,nz,player.r);
const q0=pushApartCapped(resolved.x,resolved.z,player.r),sep=resolveIter(q0.x,q0.z,player.r);player.x=clamp(sep.x,-ARENA+1,ARENA-1);player.z=clamp(sep.z,-ARENA+1,ARENA-1);
const bobFreq=isSprinting?220:140;bob=pointerLocked?Math.sin(performance.now()/bobFreq)*(isCrouching?0.005:0.012):0;}else if(pointerLocked&& !anyPanelOpen()){bob=Math.sin(performance.now()/900)*0.0035;
}if(!player.onGround)player.vy-=9.8*dt;player._jumpY=(player._jumpY||0)+player.vy*dt;if(player._jumpY<=0){player._jumpY=0;player.vy=0;player.onGround=true;}player.hunger=clamp(player.hunger-0.045*dt,0,100);
player.thirst=clamp(player.thirst-0.075*dt,0,100);if(player.bleed){player.hp-=1.1*dt;player._bl=(player._bl||0)+dt;if(player._bl>7){player._bl=0;showMsg('🩸 Sigues sangrando. ¡Usa un vendaje!');}flashHurtMaybe();}
if(player.hunger<=0||player.thirst<=0){player.hp-=2.5*dt;flashHurtMaybe();}else if(player.hunger>60&&player.thirst>60&& !player.bleed&&player.hp<player.maxhp)player.hp=clamp(player.hp+1.0*dt,0,player.maxhp);
if(player.hp<=0)die();guardStairs();const targetStandY=groundHeightAt(player.x,player.z,player.standY);if(player.falling||targetStandY<player.standY-.9){if(!player.falling){player.falling=true;player.fallTop=player.standY;player.fallV=0;}
player.fallV+=24*dt;player.standY-=player.fallV*dt;if(player.standY<=targetStandY){player.standY=targetStandY;player.falling=false;landHurt(player.fallTop-targetStandY);}
}else player.standY+=(targetStandY-player.standY)*Math.min(1,dt*(targetStandY>player.standY?30:12));camera.position.set(player.x,player.standY+currentEyeHeight+player._jumpY,player.z);
camera.rotation.order='YXZ';camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;}}const fuelWrap=document.getElementById('fuelWrap');if(isDriving&&drivingCar){fuelWrap.style.display='block';
const pFuel=clamp(drivingCar.fuel,0,100);document.getElementById('fuelBar').style.width=pFuel+'%';document.getElementById('fuelTxt').textContent=Math.round(pFuel)+'%';}else{
fuelWrap.style.display='none';}const{isRanged,isAxe}=updateHeldWeaponVisibility();let targetSpread;if(isRanged){if(isAiming){if(isCrouching)targetSpread=0.0;else if(moving)targetSpread=0.036;
else targetSpread=0.004;}else{if(isCrouching)targetSpread=moving?0.020:0.014;else targetSpread=moving?0.078:0.032;}}else targetSpread=0.01;const spreadLerpSpeed=(targetSpread>currentSpread)?dt*10:dt*3.4;
currentSpread+=(targetSpread-currentSpread)*Math.min(1,spreadLerpSpeed);const crosshairEl=document.getElementById('crosshair');crosshairEl.style.opacity=isDriving?'0':'1';
const chSize=clamp(6+currentSpread*220,6,30);crosshairEl.style.width=chSize+'px';crosshairEl.style.height=chSize+'px';crosshairEl.style.margin=(-chSize/2)+'px 0 0 '+(-chSize/2)+'px';
const targetFOV=(isAiming&&isRanged)?45:(isSprinting?82:75);const punchFOV=camPunch>0?Math.sin(clamp(camPunch,0,1)*Math.PI)*2.6:0;camera.fov+=(targetFOV+punchFOV-camera.fov)*dt*10;camera.updateProjectionMatrix();
camera.rotation.z=camPunch>0?Math.sin(camPunch*Math.PI)*0.035:0;let tWx=WEAPON_REST.x,tWy=WEAPON_REST.y,tWz=WEAPON_REST.z;if(isAiming&&isRanged){tWx=0;tWy= -0.17;tWz= -0.52;}
if(weaponKick>0){weaponKick=Math.max(0,weaponKick-dt*7);weaponGroup.position.z=tWz+weaponKick*0.16;weaponGroup.rotation.x= -weaponKick*0.35;muzzleLight.intensity=Math.max(0,muzzleLight.intensity-dt*20);
}else if(!reloading&&isRanged){weaponGroup.position.x+=(tWx-weaponGroup.position.x)*dt*12;weaponGroup.position.y+=(tWy+bob-weaponGroup.position.y)*dt*12;weaponGroup.position.z+=(tWz-weaponGroup.position.z)*dt*12;
weaponGroup.rotation.x*=0.8;}if(reloading){reloadT+=dt;const p=clamp(reloadT/reloadDuration,0,1);document.getElementById('reloadBar').style.width=(p*100)+'%';weaponGroup.position.y=WEAPON_REST.y-Math.sin(p*Math.PI)*0.22;
weaponGroup.rotation.z=Math.sin(p*Math.PI)*0.55;if(p>=1){finishReload();weaponGroup.rotation.z=0;}}if(useAction||isDriving){leftHand.visible=rightHand.visible=false;}else if(isRanged){
leftHand.visible=false;rightHand.visible=true;const rightGrip=gripPoint.position.clone().applyEuler(weaponGroup.rotation).add(weaponGroup.position);rightHand.position.copy(rightGrip);
if(rightHand.position.z> -0.40)rightHand.position.z= -0.40;rightHand.rotation.set(weaponGroup.rotation.x+0.22,weaponGroup.rotation.y+0.05,weaponGroup.rotation.z+0.05);}else if(isAxe){
leftHand.visible=rightHand.visible=true;if(axeSwingLightT>0){const p=1.0-axeSwingLightT;if(p<0.20){const t=p/0.20;const e=t*t;axeGroup.position.set(AXE_REST_POS.x+e*0.13,AXE_REST_POS.y+e*0.09+bob,AXE_REST_POS.z+e*0.06);
axeGroup.rotation.set(AXE_REST_ROT.x+e*0.32,AXE_REST_ROT.y+e*0.28,AXE_REST_ROT.z-e*0.5);}else if(p<0.46){const t=(p-0.20)/0.26;const e=1-Math.pow(1-t,4);axeGroup.position.set(AXE_REST_POS.x+0.13-e*0.34,AXE_REST_POS.y+0.09-e*0.23+bob,AXE_REST_POS.z+0.06-e*0.30);
axeGroup.rotation.set(AXE_REST_ROT.x+0.32+e*1.05,AXE_REST_ROT.y+0.28-e*1.0,AXE_REST_ROT.z-0.5+e*1.3);}else{const t=(p-0.46)/0.54;const easeOut=1-Math.pow(1-t,3);axeGroup.position.set(AXE_REST_POS.x-0.21*(1-easeOut),AXE_REST_POS.y-0.14*(1-easeOut)+bob,AXE_REST_POS.z-0.24*(1-easeOut));
axeGroup.rotation.set(AXE_REST_ROT.x+1.37*(1-easeOut),AXE_REST_ROT.y-0.72*(1-easeOut),AXE_REST_ROT.z+0.8*(1-easeOut));}}else if(axeSwingHeavyT>0){const p=1.0-axeSwingHeavyT;
if(p<0.36){const t=Math.pow(p/0.36,2);axeGroup.position.set(AXE_REST_POS.x-t*0.18,AXE_REST_POS.y+t*0.42+bob,AXE_REST_POS.z+t*0.18);axeGroup.rotation.set(AXE_REST_ROT.x-t*1.35,AXE_REST_ROT.y+t*0.45,AXE_REST_ROT.z-t*0.5);
}else if(p<0.50){const t=(p-0.36)/0.14;const e=1-Math.pow(1-t,5);axeGroup.position.set(AXE_REST_POS.x-0.18+e*0.13,AXE_REST_POS.y+0.42-e*0.82+bob,AXE_REST_POS.z+0.18-e*0.45);
axeGroup.rotation.set(AXE_REST_ROT.x-1.35+e*2.85,AXE_REST_ROT.y+0.45-e*0.9,AXE_REST_ROT.z-0.5+e*1.3);}else{const t=(p-0.50)/0.50;const easeOut=1-Math.pow(1-t,4);axeGroup.position.set(AXE_REST_POS.x-0.05+easeOut*0.05,AXE_REST_POS.y-0.40+easeOut*0.40+bob,AXE_REST_POS.z-0.27+easeOut*0.27);
axeGroup.rotation.set(AXE_REST_ROT.x+1.5-easeOut*1.5,AXE_REST_ROT.y-0.45+easeOut*0.45,AXE_REST_ROT.z+0.8-easeOut*0.8);}}else{axeGroup.position.set(AXE_REST_POS.x,AXE_REST_POS.y+bob,AXE_REST_POS.z);
axeGroup.rotation.set(AXE_REST_ROT.x,AXE_REST_ROT.y,AXE_REST_ROT.z);}_rHandTmp.set(0.01,-0.16,0.02).applyEuler(axeGroup.rotation).add(axeGroup.position);const rightHandOffset=_rHandTmp;
_lHandTmp.set(-0.01,0.08,-0.01).applyEuler(axeGroup.rotation).add(axeGroup.position);const leftHandOffset=_lHandTmp;rightHand.position.copy(rightHandOffset);leftHand.position.copy(leftHandOffset);
rightHand.rotation.copy(axeGroup.rotation);leftHand.rotation.copy(axeGroup.rotation);}else{leftHand.visible=rightHand.visible=true;const lpExt=Math.sin(leftPunchT*Math.PI);const rpExt=Math.sin(rightPunchT*Math.PI);
leftHand.position.set(-0.25+lpExt*0.1,-0.28+bob,-0.35-lpExt*0.5);rightHand.position.set(0.25-rpExt*0.1,-0.28+bob,-0.35-rpExt*0.6);leftHand.rotation.set(Math.PI/2,0,lpExt* -0.5);rightHand.rotation.set(Math.PI/2,0,rpExt*0.5);
}updateUse(dt);updateBullets(dt);updateCasings(dt);((window.MPNet&&MPNet.active&&!MPNet.isHost)?updateRemoteZombies:updateZombies)(dt);updateBloodParticles(dt);updateDoors(dt);updateCrates(dt);updateLights(dt);worldTick(dt);playerBodyGroup.visible=player.alive&& !isDriving;
playerBodyGroup.position.set(player.x,player.standY+player._jumpY-(isCrouching?0.32:0),player.z);playerBodyGroup.rotation.y=player.yaw;if(moving&&pointerLocked&& !anyPanelOpen()&& !cannotMove&& !isDriving){
const legSpeed=isSprinting?11:(isCrouching?4:7);legPhase+=dt*legSpeed;const legSwing=Math.sin(legPhase)*(isCrouching?0.32:0.55);legL.rotation.x=legSwing;legR.rotation.x= -legSwing;
}else{legL.rotation.x*=0.85;legR.rotation.x*=0.85;}const nearestInt=findNearestInteractable();let helpText='';if(nearestInt){if(nearestInt.type==='car_exit')helpText='Pulsa E para salir del auto';
else if(nearestInt.type==='car'){if(nearestInt.ref.fuel>0)helpText='Pulsa E para conducir ('+Math.round(nearestInt.ref.fuel)+'% gasolina)';else helpText='Vehículo sin gasolina (0%)';
}else if(nearestInt.type==='item')helpText='Pulsa E para recoger';else if(nearestInt.type==='crate')helpText='Pulsa E para abrir';else if(nearestInt.type==='window')helpText='Pulsa E para saltar por la ventana';
else if(nearestInt.type==='door')helpText=nearestInt.ref.broken?'Puerta destrozada (no se puede cerrar)':(nearestInt.ref.open?'Pulsa E para cerrar la puerta':'Pulsa E para abrir la puerta');
}showHelp(helpText);document.getElementById('hpBar').style.width=clamp(player.hp,0,100)+'%';document.getElementById('hpTxt').textContent=Math.round(player.hp)+(player.bleed?' 🩸':'');
document.getElementById('hunBar').style.width=player.hunger+'%';document.getElementById('hunTxt').textContent=Math.round(player.hunger);document.getElementById('thiBar').style.width=player.thirst+'%';document.getElementById('thiTxt').textContent=Math.round(player.thirst);
document.getElementById('stBar').style.width=player.stamina+'%';document.getElementById('stTxt').textContent=Math.round(player.stamina);}let lastHurtFlash=0;function flashHurtMaybe(){if(performance.now()-lastHurtFlash>800){flashHurt();lastHurtFlash=performance.now();}}
function die(){player.alive=false;document.getElementById('deathStats').textContent='Has caído en combate.';document.getElementById('deathScreen').style.display='flex';document.exitPointerLock();
}document.getElementById('respawnBtn').onclick=()=>{player.alive=true;player.bleed=false;player.falling=false;player.vault=null;player.hp=100;player.hunger=85;player.thirst=85;player.stamina=100;
player.x=SPAWN.x;player.z=SPAWN.z;player.safeOK=false;player._jumpY=0;player.vy=0;player.onGround=true;isDriving=false;drivingCar=null;document.getElementById('deathScreen').style.display='none';
};function loop(now){if(tabHidden){requestAnimationFrame(loop);return;}const dt=Math.min(0.05,(now-last)/1000);last=now;if(gameStarted){update(dt);renderer.render(scene,camera);}else{renderLobbyPreview(dt);}if(anyPanelOpen()&&charRenderer){charMannequin.rotation.y+=dt*0.5;invPreviewT+=dt;if(cFbx)poseHumanoidFbx(cFbx,{phase:invPreviewT*1.6,moveAmt:0,crouchAmt:0,jumpAmt:0});charRenderer.render(charScene,charCam);}
requestAnimationFrame(loop);}document.getElementById('keysToggle').onclick=()=>{document.getElementById('keysPanel').classList.toggle('show');};requestAnimationFrame(loop);let deferredInstallPrompt=null;window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault();deferredInstallPrompt=e;const ib=document.getElementById('installBtn');if(ib)ib.style.display='inline-block';});
const installBtnEl=document.getElementById('installBtn');if(installBtnEl){if(window.matchMedia('(display-mode: standalone)').matches)installBtnEl.style.display='none';installBtnEl.onclick=async()=>{if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;installBtnEl.style.display='none';}else{showMsg('En iOS: usa Compartir ▸ Añadir a pantalla de inicio');}};}
function requestGameFullscreen(){const el=document.documentElement;const req=el.requestFullscreen||el.webkitRequestFullscreen||el.mozRequestFullScreen||el.msRequestFullscreen;if(req){try{req.call(el).catch(()=>{});}catch(e){}}if(screen.orientation&&screen.orientation.lock){try{screen.orientation.lock('landscape').catch(()=>{});}catch(e){}}}
function beginMatch(){requestGameFullscreen();const ss=document.getElementById('startScreen');ss.style.opacity='0';setTimeout(()=>{ss.style.display='none';},420);gameStarted=true;refreshInvUI();updateAmmoHud();canvas.requestPointerLock();}
document.getElementById('startBtn').onclick=function(){
  const ss=document.getElementById('startScreen');
  ss.style.opacity='0';
  setTimeout(()=>{ss.style.display='none';document.getElementById('mpOverlay').style.display='flex';},420);
};
/* ===== Puente para el módulo de red multijugador (window.MPNet) ===== */
window.__game={
THREE,scene,camera,SPAWN,bullets,player,
spawnCharVisual,charTemplateReady:()=>charTemplateReady,animateFbxAim,poseHumanoidFbx,
showMsg,flashHurt,spawnBloodImpact,showHitMarker,
equip,ITEMS,activeSlotKey:()=>activeSlotKey,
beginMatch,
spawnInitialZombies,
isAlive:()=>player.alive,
getLocalState:()=>{const it=equip[activeSlotKey];const meta=it?ITEMS[it.id]:null;const wKind=meta?(meta.ranged?'ranged':meta.melee?'melee':'item'):'none';return{x:player.x,z:player.z,yaw:player.yaw,hp:player.hp,alive:player.alive,jumpY:+((player._jumpY)||0).toFixed(2),crouch:isCrouching,wKind,wId:it?it.id:null};},
getZombieSnapshot:function(){return zombies.filter(z=>!z.remote).map(z=>({id:z.netId,x:+z.x.toFixed(1),z:+z.z.toFixed(1),h:+z.heading.toFixed(2),hp:Math.max(0,Math.round(z.hp)),alive:z.alive,ty:z.t===ZT[1]?1:z.t===ZT[2]?2:0,sc:z.grp.scale.x,mv:Math.hypot(z.vx||0,z.vz||0)>0.3?1:0}));},
applyZombieSnapshot:function(list){for(const e of list){let z=zombies.find(zz=>zz.netId===e.id);if(!z)z=createRemoteZombie(e.id,e.x,e.z,e.ty,e.sc);if(!z)continue;z.tx=e.x;z.tz=e.z;z.theading=e.h;z.hp=e.hp;z.netMoving=e.mv;if(e.alive===false&&z.alive){z.alive=false;killZombie(z,{x:Math.sin(e.h),z:Math.cos(e.h)});}}},
applyZombieHit:function(netId,dmg,bleed){const z=zombies.find(zz=>zz.netId===netId&&zz.alive&&!zz.remote);if(!z)return;z.hp-=dmg;z.hitFlash=0.15;if(bleed){z.bleedTimer=bleed.bleedDuration||4;z.bleedDmgPerSec=bleed.bleedDmg;z.bleedTickTimer=0;}if(z.hp<=0)killZombie(z);},

applyRemoteCarState:function(id,x,z,rot,fuel){const c=cars[id];if(!c||(isDriving&&drivingCar===c))return;c.x=x;c.z=z;c.rotY=rot;c.fuel=fuel;c.grp.position.set(x,0,z);c.grp.rotation.y=rot;c.solidObj.minX=x-1.2;c.solidObj.maxX=x+1.2;c.solidObj.minZ=z-2.2;c.solidObj.maxZ=z+2.2;if(c.crate){const trunkOff=new THREE.Vector3(0,0,-2.4).applyEuler(new THREE.Euler(0,rot,0));c.crate.x=x+trunkOff.x;c.crate.z=z+trunkOff.z;}},
applyRemoteDoorState:function(id,open,broken,hp){const d=doors[id];if(!d)return;d.hp=hp;if(broken&&!d.broken){d.broken=true;breakDoorVisual(d);}d.open=open;},
applyRemoteWindowState:function(id,broken,hp){const w=windows[id];if(!w)return;w.hp=hp;if(broken&&!w.broken){w.broken=true;breakWindowVisual(w);}},
applyRemoteLootTaken:function(id){const gi=grounditems.find(g=>g.netId===id);if(!gi)return;scene.remove(gi.mesh);const idx=grounditems.indexOf(gi);if(idx>=0)grounditems.splice(idx,1);},
applyRemoteCrateOpened:function(id){const c=lootCrates.find(cc=>cc.netId===id);if(!c||c.opened)return;c.opened=true;},
applyRemoteDamageToLocal:function(dmg,fromName){
if(!player.alive)return;
player.hp=clamp(player.hp-dmg,0,player.maxhp||100);
flashHurt();
showHitMarker();
if(player.hp<=0&&player.alive)die();
},
respawnLocal:function(){document.getElementById('respawnBtn').click();}
};
const __origUpdate=update;
update=function(dt){__origUpdate(dt);if(window.__netTick)window.__netTick(dt);};
const __origDoAttack=doAttack;
doAttack=function(isRightClick){__origDoAttack(isRightClick);if(window.__onLocalAttack)window.__onLocalAttack(isRightClick);};
})();
