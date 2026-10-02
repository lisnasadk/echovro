
/* ============ CONFIG — the programmer fills these ============ */
const isLocalBackend = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const CONFIG={
  USE_BACKEND:true,
  API_BASE: isLocalBackend ? 'http://localhost:8080' : '',
  EMAILJS_PUBLIC_KEY:'c4-pOoJtU-Uw8x7TZ',
  EMAILJS_SERVICE_ID:'service_kcud9cp',
  EMAILJS_TEMPLATE_ID:'template_ub25zoo',
  DEMO_MODE:false,
  SPOTIFY_CLIENT_ID:'4763676c31c944d7ac4bb1a9d9e4f95a',
  YT_CLIENT_ID:'',                              // ← Google OAuth client id
  YT_SCOPES:'https://www.googleapis.com/auth/youtube.readonly',
  GAANA_AUTH_URL:'',                            // ← Gaana partner/auth URL
  REDIRECT_URI:location.origin+location.pathname,
  SPOTIFY_SCOPES:'user-read-email user-read-private user-top-read user-read-currently-playing user-read-playback-state playlist-read-private'
};

/* ============ 3D PLACES ============
   All places live in the repo's /places folder as .glb files:
     places/city.glb, places/cafe.glb, places/gallery.glb
   Places are fetched in the background once the user reaches the "link music" step (warmPlaces), then cached in memory. */
const PLACES={
 city:{icon:'🏙️',name:'The City',blurb:'Lights, traffic, late nights.',url:'places/city.glb',ground:true,
  credit:'“City Scene” by <a href="https://sketchfab.com/mortalityrexotable" target="_blank" rel="noopener">golukumar</a> · Sketchfab Standard license'},
 cafe:{icon:'☕',name:'The Café',blurb:'Warm corners, quiet talk.',url:'places/cafe.glb',
  credit:'“Cafe-Misti” by <a href="https://sketchfab.com/asimitree" target="_blank" rel="noopener">Simit Rajwadi</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>'},
 gallery:{icon:'🖼️',name:'Picture Gallery',blurb:'Hushed rooms, long looks.',url:'places/gallery.glb',
  credit:'“The Picture Gallery [Low Poly] | VR” by <a href="https://sketchfab.com/abhayexe" target="_blank" rel="noopener">abhayexe</a> · Sketchfab Standard license'}
};

// Music services. `q` builds a search link that opens the song in the person's own app.
const SVC={spotify:{n:'Spotify',q:'https://open.spotify.com/search/'},ytm:{n:'YouTube Music',q:'https://music.youtube.com/search?q='},gaana:{n:'Gaana',q:'https://gaana.com/search/'}};

// Hook: who is at a place + songs for it. Returns {people:[{u,av,s,m,t:[[title,artist],...]}],songs:[[title,artist],...]}
async function fetchPlaceFeed(key,profile){
  if(!CONFIG.USE_BACKEND) return {people:[],songs:[]};
  try {
    const u = (profile && profile.username) || state.username || '';
    const r = await api('/api/places/'+encodeURIComponent(key)+'/feed'+(u?'?user='+encodeURIComponent(u):''));
    if(r.ok) return await r.json();
  } catch(e) { console.warn('fetchPlaceFeed error', e); }
  return {people:[],songs:[]};
}

// Hook: the user's own listening data from their linked service, as [[title,artist],...]
async function fetchMyTracks(profile){
  if(!CONFIG.USE_BACKEND) return [];
  try {
    const svc = (profile && profile.music && profile.music.service) || (state.music && state.music.service) || 'spotify';
    const r = await api('/api/me/tracks?service='+encodeURIComponent(svc));
    if(r.ok) return await r.json();
  } catch(e) { console.warn('fetchMyTracks error', e); }
  return [];
}

// Avatars: 3D files live in /avatars. `rot` (radians) turns a model if it faces the wrong way; `look` is the fallback illustration.
const SK='https://sketchfab.com/3d-models/';
const AVATARS={
 male:[
  {id:'male_avatar_1',label:'Avatar 1',model:'avatars/male_avatar_1.glb',title:'Free Avatar for iClone,',author:'Asfandyar Hesami',src:SK+'free-avatar-for-iclone-4908979179aa43d5835a0509f1519e3b',look:{skin:'#e0b48f',hair:'#2a1c14',shirt:'#6f8bb0',style:'short'}},
  {id:'male_avatar_2',label:'Avatar 2',model:'avatars/male_avatar_2.glb',title:'AVATAR METAVERSO',author:'@METAVERSO',src:SK+'avatar-metaverso-48bcd1c0b664483890530a6be225a444',look:{skin:'#a8704c',hair:'#1a1210',shirt:'#c9703f',style:'curly'}},
  {id:'male_avatar_3',label:'Avatar 3',model:'avatars/male_avatar_3.glb',title:'boy sherry arian',author:'sherry_arian',src:SK+'boy-sherry-arian-ee590dfec61f40f3b2c1ca33819257b0',look:{skin:'#f1cfb0',hair:'#8a6a3f',shirt:'#3b5273',style:'short'}}],
 female:[
  {id:'female_avatar_1',label:'Avatar 1',model:'avatars/female_avatar_1.glb',title:'Girl Avatar - Ready Player Me',author:'Hellencam',src:SK+'girl-avatar-ready-player-me-087b7514d9d54bc689b2ca220f7e74f7',look:{skin:'#f1cfb0',hair:'#5a3a22',shirt:'#eaf0ff',style:'long'}},
  {id:'female_avatar_2',label:'Avatar 2',model:'avatars/female_avatar_2.glb',title:'Sophia Metzger, business-casual attire',author:'XRProfXR',src:SK+'sophia-metzger-business-casual-attire-a1d68ab1c7304a3babfc76517a1adac7',look:{skin:'#c68a62',hair:'#1a1210',shirt:'#8fa8cc',style:'bun'}},
  {id:'female_avatar_3',label:'Avatar 3',model:'avatars/female_avatar_3.glb',title:'Avatar 1',author:'archaosnihilist',src:SK+'avatar-1-34803472a019430fb18694bdbded433d',look:{skin:'#e0b48f',hair:'#8a3b2e',shirt:'#d9a441',style:'long'}}]
};
// Hook: send the finished profile (incl. linked music service + auth code) to your backend here. Called once music is linked.
async function onComplete(profile){
  console.log('EchoVro profile complete', profile);
  if(!CONFIG.USE_BACKEND) return;
  try {
    await api('/api/me/profile', {
      method: 'PUT',
      body: JSON.stringify({
        gender: profile.gender,
        avatar: profile.avatar,
        music: profile.music,
        tracks: profile.tracks || []
      })
    });
  } catch(e) { console.warn('onComplete sync error', e); }
}
/* ============================================================= */

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const state={email:'',username:'',gender:'male',avatar:null,music:null,place:null,tracks:null,history:[]};
let step=0;
const avOf=id=>[...AVATARS.male,...AVATARS.female].find(a=>a.id===id),findAv=()=>avOf(state.avatar);
function go(n){
 if(n>=4&&!state.music){toast('Link a music service to continue.');n=3}   // music linking is mandatory
 step=n;$$('.scr').forEach((s,i)=>s.classList.toggle('on',i===n));$$('#dots i').forEach((d,i)=>d.classList.toggle('on',i===Math.min(n,4)));$('#dots').style.display=n>=5?'none':'';
 $('#pl').classList.toggle('on',n===5);
 document.body.classList.toggle('in5',n===5);
 if(n===1)ensure('male');if(n===2){drawAvatars();ensure(state.gender)}
 if(n===3)warmPlaces();   // start downloading the place models in the background
 if(n===3||n===4){const h=pvw(findAv());$('#me3').innerHTML=$('#me4').innerHTML=h;$('#hi').textContent='Hi, '+state.username+'!';$('#done').textContent='Where shall we meet, '+state.username+'?'}
 if(n===4){ensure('male');ensure('female');drawPlaces()}
 if(n===6)renderRoom();
 $('#pf').style.display=n>=3?'block':'none';
 if(n>=3){if(connsFor!==state.username)loadConns();const a=findAv();$('#pfa').innerHTML=a?pvw(a):'';badge()}}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),3200)}

function face(l){let back='',top='';const h=l.hair;
 if(l.style==='long')back=`<path d="M26 52Q24 22 50 20Q76 22 74 52L77 82L23 82Z" fill="${h}"/>`;
 if(l.style==='curly')top=[[30,38],[38,28],[50,25],[62,28],[70,38]].map(([a,b])=>`<circle cx="${a}" cy="${b}" r="9" fill="${h}"/>`).join('');
 else if(l.style==='bun')top=`<circle cx="50" cy="15" r="9" fill="${h}"/><path d="M31 44Q32 24 50 24Q68 24 69 44Q60 33 50 34Q40 33 31 44Z" fill="${h}"/>`;
 else top=`<path d="M31 44Q30 22 50 22Q70 22 69 44Q62 34 50 35Q38 34 31 44Z" fill="${h}"/>`;
 return `<svg viewBox="0 0 100 100">${back}<path d="M14 100Q16 72 50 70Q84 72 86 100Z" fill="${l.shirt}"/><rect x="44" y="58" width="12" height="14" fill="${l.skin}"/><ellipse cx="50" cy="45" rx="19" ry="22" fill="${l.skin}"/>${top}<circle cx="43" cy="47" r="1.8" fill="#0f1b33"/><circle cx="57" cy="47" r="1.8" fill="#0f1b33"/><path d="M44 56Q50 60 56 56" stroke="#0f1b33" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`}

function drawAvatars(){$('#cr').innerHTML=AVATARS[state.gender].map(a=>`${a.label}: “${a.title}” by <a href="${a.src}" target="_blank" rel="noopener">${a.author}</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>`).join('<br>');$('#grid').innerHTML=AVATARS[state.gender].map((a,i)=>`<button class="av${state.avatar===a.id?' sel':''}" style="--i:${i}" data-id="${a.id}">${pvw(a)}<b>${a.label}</b></button>`).join('');
 $$('.av').forEach(b=>b.onclick=()=>{state.avatar=b.dataset.id;$$('.av').forEach(x=>x.classList.toggle('sel',x===b));$('#b2').disabled=false})}
$$('#s2 .tabs button').forEach(b=>b.onclick=()=>{state.gender=b.dataset.g;state.avatar=null;ensure(state.gender);$('#b2').disabled=true;$$('#s2 .tabs button').forEach(x=>x.classList.toggle('on',x===b));drawAvatars()});

$$('[data-go]').forEach(b=>b.onclick=()=>go(+b.dataset.go));
/* ===== Step 1: sign up / log in with password ===== */
let authMode='signup';
function setAuth(m){authMode=m;const su=m==='signup';
 $$('#atabs button').forEach(b=>b.classList.toggle('on',b.dataset.a===m));
 $('#unw').style.display=$('#pcw').style.display=su?'':'none';
 $('#h1t').textContent=su?'Join the universe':'Welcome back';
 $('#s1s').textContent=su?'Create your account with an email, username and password.':'Log in with your email and password.';
 $('#pw').autocomplete=su?'new-password':'current-password';$('#pw').placeholder=su?'At least 8 characters':'Your password';
 $('#err').textContent='';$('#pw').value=$('#pc').value='';$('#vcard').style.display='none';$('#acard').style.display=''}
$$('#atabs button').forEach(b=>b.onclick=()=>setAuth(b.dataset.a));
$('#pwt').onclick=()=>{const h=$('#pw').type==='password';$('#pw').type=$('#pc').type=h?'text':'password';$('#pwt').textContent=h?'Hide':'Show'};
['em','un','pw','pc'].forEach(i=>$('#'+i).onkeydown=e=>{if(e.key==='Enter')$('#b1').click()});
setAuth('signup');

// Hook: your backend does the real auth. Hash passwords SERVER-SIDE (bcrypt/argon2); with Supabase use
//   signup: supabase.auth.signUp({email,password,options:{data:{username}}})
//   login:  supabase.auth.signInWithPassword({email,password})
// Return {ok:true,username} or {ok:false,error:'message'}.
// Login token (JWT) from the backend. Sent as "Authorization: Bearer ..." on every protected request.
const TOKEN_KEY='echovro_token';
const getToken=()=>{try{return localStorage.getItem(TOKEN_KEY)||''}catch(e){return ''}};
const setToken=t=>{try{t?localStorage.setItem(TOKEN_KEY,t):localStorage.removeItem(TOKEN_KEY)}catch(e){}};
async function api(path,opts={}){const h={'Content-Type':'application/json',...(opts.headers||{})},t=getToken();if(t)h.Authorization='Bearer '+t;
 return fetch(CONFIG.API_BASE+path,{...opts,headers:h})}
async function authRequest(p){
 if(!CONFIG.USE_BACKEND)return{ok:true,username:p.username||(p.email.split('@')[0].replace(/[^a-zA-Z0-9_.]/g,'').slice(0,20)||'guest')};
 const su=p.mode==='signup';
 const body=su?{name:p.username,email:p.email,password:p.password}:{email:p.email,password:p.password};
 try{
  const r=await api(su?'/api/auth/register':'/api/auth/login',{method:'POST',body:JSON.stringify(body)});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)return{ok:false,error:d.message||d.error||(r.status===401?'Wrong email or password.':'Something went wrong.')};
  setToken(d.token||'');
  return{ok:true,username:d.name||d.username||p.username}}
 catch(e){return{ok:false,error:'Cannot reach the server. Is the backend running?'}}}

$('#b1').onclick=async()=>{const e=$('#em').value.trim(),u=$('#un').value.trim(),pw=$('#pw').value,er=$('#err'),su=authMode==='signup';
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))return er.textContent='Please enter a valid email address.';
 if(su&&!/^[a-zA-Z0-9_.]{3,20}$/.test(u))return er.textContent='Username: 3–20 letters, numbers, dots or underscores.';
 if(su){if(pw.length<8)return er.textContent='Password must be at least 8 characters.';
  if(!/[A-Za-z]/.test(pw)||!/\d/.test(pw))return er.textContent='Password needs at least one letter and one number.';
  if(pw!==$('#pc').value)return er.textContent='Passwords do not match.'}
 else if(!pw)return er.textContent='Please enter your password.';
 er.textContent='';const b=$('#b1');b.disabled=true;b.textContent='Please wait…';
 const r=await authRequest({mode:authMode,email:e,username:su?u:undefined,password:pw});
 b.disabled=false;b.textContent='Continue';
 if(!r||!r.ok)return er.textContent=(r&&r.error)||'Something went wrong. Please try again.';
 $('#pw').value=$('#pc').value='';
 state.email=e;state.username=r.username||u;
 if(su)startVerify();else go(2)};

/* ===== Email verification (EmailJS) — sends a 6-digit code after sign up ===== */
let vc=null,vcool=0;
const ejReady=()=>CONFIG.EMAILJS_PUBLIC_KEY&&CONFIG.EMAILJS_SERVICE_ID&&CONFIG.EMAILJS_TEMPLATE_ID&&window.emailjs;
async function sendCode(){
 const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0');
 vc={code,exp:Date.now()+10*60*1000,tries:0};
 if(!ejReady()){
  if(CONFIG.DEMO_MODE){toast('Test mode (EmailJS keys not set) — your code is '+code);return true}
  $('#verr').textContent='Email service is not set up yet.';vc=null;return false}
 try{await emailjs.send(CONFIG.EMAILJS_SERVICE_ID,CONFIG.EMAILJS_TEMPLATE_ID,{to_email:state.email,to_name:state.username,passcode:code,time:'10 minutes'},{publicKey:CONFIG.EMAILJS_PUBLIC_KEY});return true}
 catch(e){console.error('EmailJS',e);$('#verr').textContent='Could not send the email. Check the address and try again.';vc=null;return false}}
async function startVerify(){
 $('#acard').style.display='none';$('#vcard').style.display='';$('#vem').textContent=state.email;$('#vc').value='';$('#verr').textContent='';
 if(await sendCode()){toast('Code sent to '+state.email);vcool=Date.now()+30000;$('#vc').focus()}}
$('#vgo').onclick=()=>{const v=$('#vc').value.trim(),er=$('#verr');
 if(!vc)return er.textContent='Tap Resend to get a new code.';
 if(Date.now()>vc.exp){vc=null;return er.textContent='That code expired. Tap Resend.'}
 if(++vc.tries>5){vc=null;return er.textContent='Too many attempts. Tap Resend for a new code.'}
 if(!/^\d{6}$/.test(v)||v!==vc.code)return er.textContent='Incorrect code.';
 vc=null;er.textContent='';go(2)};
$('#vre').onclick=async()=>{const w=Math.ceil((vcool-Date.now())/1000);if(w>0)return toast('Please wait '+w+'s before resending.');
 $('#verr').textContent='';if(await sendCode()){vcool=Date.now()+30000;toast('New code sent')}};
$('#vbk').onclick=()=>{vc=null;setAuth('signup')};
$('#vc').onkeydown=e=>{if(e.key==='Enter')$('#vgo').click()};
$('#b2').onclick=()=>go(3);

/* ===== Step 3: link a music service (mandatory) — Spotify / YouTube Music / Gaana ===== */
function linkedUI(){const m=state.music&&state.music.service;$$('[data-svc]').forEach(b=>{b.classList.toggle('ok',b.dataset.svc===m);b.classList.toggle('dim',!!m&&b.dataset.svc!==m)});$('#b3').disabled=!m}
function linked(service,code){state.music={service,code};linkedUI();toast(SVC[service].n+' linked.')}
async function connect(k){
 if(CONFIG.DEMO_MODE)return linked(k,'demo');
 const q=new URLSearchParams({redirect_uri:CONFIG.REDIRECT_URI,state:k});
 try{sessionStorage.setItem('echovro_state',JSON.stringify(state))}catch(e){}
 if(k==='gaana'){if(!CONFIG.GAANA_AUTH_URL)return toast('Gaana auth URL not set yet — add it in CONFIG.');
  return location.href=CONFIG.GAANA_AUTH_URL+(CONFIG.GAANA_AUTH_URL.includes('?')?'&':'?')+q}
 const id=k==='spotify'?CONFIG.SPOTIFY_CLIENT_ID:CONFIG.YT_CLIENT_ID;
 if(!id)return toast(SVC[k].n+' client ID not set yet — add it in CONFIG.');
 // Authorization Code + PKCE (no secret in the browser)
 const A='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
 const v=[...crypto.getRandomValues(new Uint8Array(64))].map(b=>A[b%62]).join('');
 const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));
 const c=btoa(String.fromCharCode(...new Uint8Array(d))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 try{sessionStorage.setItem('mus_verifier',v)}catch(e){}
 q.set('client_id',id);q.set('response_type','code');q.set('code_challenge_method','S256');q.set('code_challenge',c);
 if(k==='spotify'){q.set('scope',CONFIG.SPOTIFY_SCOPES);location.href='https://accounts.spotify.com/authorize?'+q}
 else{q.set('scope',CONFIG.YT_SCOPES);q.set('access_type','offline');location.href='https://accounts.google.com/o/oauth2/v2/auth?'+q}}
$$('[data-svc]').forEach(b=>b.onclick=()=>connect(b.dataset.svc));
const finish3=()=>{onComplete({...state});go(4)};
$('#b3').onclick=()=>state.music?finish3():toast('Link a music service to continue.');
// Returning from the music service (?code=...&state=spotify|ytm|gaana): resume.
(async ()=>{
  const q=new URLSearchParams(location.search);
  const code = q.get('code');
  const service = q.get('state') || 'spotify';
  if(code){
    try{
      Object.assign(state,JSON.parse(sessionStorage.getItem('echovro_state')||'{}'));
      state.music={service,code};
      history.replaceState(null,'',location.pathname);
      
      if(service==='spotify'){
        const v=sessionStorage.getItem('mus_verifier');
        if(v && CONFIG.SPOTIFY_CLIENT_ID){
          try{
            const tr=await fetch('https://accounts.spotify.com/api/token',{
              method:'POST',
              headers:{'Content-Type':'application/x-www-form-urlencoded'},
              body:new URLSearchParams({
                client_id:CONFIG.SPOTIFY_CLIENT_ID,
                grant_type:'authorization_code',
                code:code,
                redirect_uri:CONFIG.REDIRECT_URI,
                code_verifier:v
              })
            });
            if(tr.ok){
              const td=await tr.json();
              if(td.access_token){
                const mr=await fetch('https://api.spotify.com/v1/me/top/tracks?limit=25',{
                  headers:{'Authorization':'Bearer '+td.access_token}
                });
                if(mr.ok){
                  const md=await mr.json();
                  if(md.items&&md.items.length){
                    state.tracks=md.items.map(it=>[it.name,(it.artists&&it.artists[0])?it.artists[0].name:'']);
                  }
                }
              }
            }
          }catch(e){console.warn('Spotify track fetch',e)}
        }
      }
      
      if(state.avatar)setTimeout(()=>{linkedUI();finish3()},50);
    }catch(e){}
  }
})();

/* ===== Step 4: choose a place ===== */
function drawPlaces(){$('#places').innerHTML=Object.entries(PLACES).map(([k,p],i)=>`<button class="pc" style="--i:${i}" data-k="${k}"><em>${p.icon}</em><b>${p.name}</b><span>${p.blurb}</span></button>`).join('')+`<button class="pc" data-room="1"><em>🎧</em><b>Listening room</b><span>Listen together, chat live.</span></button>`;
 $$('.pc[data-k]').forEach(b=>b.onclick=()=>enterPlace(b.dataset.k));$('.pc[data-room]').onclick=()=>go(6)}

/* ===== Step 5: the place — scenes are loaded once, cached, and warmed in the background ===== */
let R5=null,ctl=null,cur=null,run=false,seq=0;const sc5=new THREE.Scene(),cam5=new THREE.PerspectiveCamera(50,1,.1,1000);
/* ===== Backdrop: opaque sky "wall" + ground disc so the app UI never shows behind a place ===== */
const SKY={city:['#0b1226','#3a4f7a'],cafe:['#2a1c14','#7a5a40'],gallery:['#16294a','#9db3d3']};
const skyTex={};let floor=null;
function skyFor(k){if(skyTex[k])return skyTex[k];
 const c=document.createElement('canvas');c.width=2;c.height=512;const g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,512),s=SKY[k]||SKY.gallery;
 gr.addColorStop(0,s[0]);gr.addColorStop(1,s[1]);g.fillStyle=gr;g.fillRect(0,0,2,512);
 const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return skyTex[k]=t}
function setBackdrop(k,b,r){   // b = place bounding box AFTER it was centered, r = its largest dimension
 sc5.background=skyFor(k);
 if(floor){sc5.remove(floor);floor.geometry.dispose();floor.material.dispose()}
 floor=new THREE.Mesh(new THREE.CircleGeometry(r*12,64),new THREE.MeshBasicMaterial({color:(SKY[k]||SKY.gallery)[1]}));
 floor.rotation.x=-Math.PI/2;floor.position.y=b.min.y-r*.004;sc5.add(floor)}   // just under the model so it never z-fights
function init5(){if(R5)return;
 R5=new THREE.WebGLRenderer({canvas:$('#pl'),alpha:true,antialias:true});R5.setPixelRatio(Math.min(devicePixelRatio||1,2));R5.outputEncoding=THREE.sRGBEncoding;
 const d=new THREE.DirectionalLight(0xfff1d6,1.4);d.position.set(5,10,6);sc5.add(new THREE.HemisphereLight(0xffffff,0x445577,1.1),d);
 ctl=new THREE.OrbitControls(cam5,R5.domElement);ctl.enableDamping=true;ctl.autoRotate=true;ctl.autoRotateSpeed=.6;
 addEventListener('resize',fit5);fit5()}
function fit5(){if(!R5)return;R5.setSize(innerWidth,innerHeight,false);cam5.aspect=innerWidth/innerHeight;cam5.updateProjectionMatrix()}
// The place files are Draco-compressed, so the loader needs a DRACOLoader with its decoder path.
const draco=new THREE.DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/gltf/');
draco.preload();   // fetch the decoder now instead of on first model
const loadGLTF=(u,pr)=>new Promise((ok,no)=>{
 const l=new THREE.GLTFLoader();l.setDRACOLoader(draco);
 l.load(u,g=>ok(g.scene),e=>e.total&&pr(e.loaded/e.total),no)});
// Cache: each place is downloaded/parsed once. Progress callbacks go to whoever is waiting (prog[k]).
const placeCache={},prog={};
const getPlace=k=>placeCache[k]||(placeCache[k]=loadGLTF(PLACES[k].url,p=>prog[k]&&prog[k](p)));
let warmed=0;
async function warmPlaces(){if(warmed)return;warmed=1;
 for(const k in PLACES){try{await getPlace(k)}catch(e){delete placeCache[k]}}}   // one at a time so bandwidth isn't split
// Detach only — the cached scene keeps its GPU data so re-entering a place is instant.
function drop(){run=false;me=null;nearU=null;cmP=null;$('#cm').classList.remove('on');$('#pad').classList.remove('rdy');if(cur){sc5.remove(cur);cur=null}if(floor){sc5.remove(floor);floor=null}
 if(crowd){sc5.remove(crowd);crowd.traverse(o=>{if(o.isSprite){o.material.map.dispose();o.material.dispose()}});crowd=null}}   // avatar geometry is shared with the previews, so it is not disposed
/* ===== People physically in the place: your avatar + everyone from the feed, standing on the floor ===== */
let crowd=null,me=null,climb=false,nearU=null,nearT=0;const cc={};let cmP=null;const keys={},mray=new THREE.Raycaster(),DOWN=new THREE.Vector3(0,-1,0),LEG=-1;   // LEG: flip to 1 if legs swing backwards
const avReady=id=>new Promise(ok=>{let n=0;(function w(){if(models[id]||++n>80)return ok(models[id]);setTimeout(w,100)})()});   // wait (≤8s) for the avatar file
function nameTag(txt,me,H){const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');
 g.fillStyle=me?'rgba(234,240,255,.95)':'rgba(15,27,51,.82)';g.fillRect(0,8,256,48);g.fillStyle=me?'#0f1b33':'#eaf0ff';g.font='26px ui-monospace,monospace';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,128,32);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));sp.scale.set(H*.9,H*.225,1);sp.position.y=H*1.15;sp.renderOrder=9;return sp}
function songTag(txt,H){const c=document.createElement('canvas');c.width=512;c.height=64;const g=c.getContext('2d');
 g.fillStyle='rgba(111,139,176,.92)';g.fillRect(0,8,512,48);g.fillStyle='#fff';g.font='26px ui-monospace,monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('♪ '+(txt.length>34?txt.slice(0,33)+'…':txt),256,32);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));sp.scale.set(H*1.8,H*.225,1);sp.position.y=H*1.4;sp.renderOrder=9;return sp}
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let feed=null;
// Hook: tell your backend what this user is playing at this place so others see it.
async function onSongSet(p){
  console.log('EchoVro song', p);
  if(!CONFIG.USE_BACKEND) return;
  try {
    await api('/api/places/'+encodeURIComponent(p.place)+'/song', {
      method: 'POST',
      body: JSON.stringify({
        place: p.place,
        username: p.username || state.username,
        song: p.song
      })
    });
  } catch(e) { console.warn('onSongSet error', e); }
}
function setMyTag(){if(!me)return;const w=me.w,o=w.userData.st;
 if(o){w.remove(o);o.material.map.dispose();o.material.dispose();w.userData.st=null}
 if(state.song){w.userData.st=songTag(state.song,me.H);w.add(w.userData.st)}}
function setSong(){const v=$('#sgi').value.trim().slice(0,60);state.song=v;if(v){const q=v.split(/\s+[–-]\s+/);state.history.push([q[0],q[1]||'']);if(state.history.length>20)state.history.shift()}nearU=null;onSongSet({place:state.place,username:state.username,song:v});setMyTag();renderSheet();toast(v?'Now playing: '+v:'Song cleared.')}
function renderSheet(){const f=feed;if(!f||!state.place||!state.music)return;const m=state.music.service,P=PLACES[state.place],mine={u:state.username,av:state.avatar,s:state.song||'—'};
 $('#sheet').innerHTML=`<h3>Your song here</h3><div class="mine"><input id="sgi" list="sgl" maxlength="60" placeholder="Song – artist" value="${esc(state.song||'')}"><button class="btn" id="sgb">Set</button></div><datalist id="sgl">${f.songs.map(x=>`<option value="${esc(x[0]+' – '+x[1])}">`).join('')}</datalist><h3>Here now</h3><div class="pr">${[mine,...f.people].map(p=>`<div class="pp">${pvw(avOf(p.av))}<b>${p.u}</b><i>♪ ${esc(p.s)}</i></div>`).join('')}</div><h3>Songs for this place</h3>${f.songs.map(x=>`<a class="sg" href="${songLink(m,x)}" target="_blank" rel="noopener"><b>${x[0]}</b><span>${x[1]}</span><em>Open in ${SVC[m].n}</em></a>`).join('')}<p class="cr">${P.credit}</p>`;
 $('#sgb').onclick=setSong;$('#sgi').onkeydown=e=>{if(e.key==='Enter')setSong()}}
// Outdoor scenes (ground:true): find the real street level, then keep only flat spots at that level (no rooftops, no raised ledges).
function groundSpots(root,ray,b,H,n){
 const down=new THREE.Vector3(0,-1,0),pts=[];
 for(let rr=0;rr<=H*10;rr+=H*1.4)for(let k=0;k<(rr?14:1);k++){const a=k/14*6.283,x=Math.cos(a)*rr,z=Math.sin(a)*rr;
  ray.set(new THREE.Vector3(x,b.max.y+1,z),down);const h=ray.intersectObject(root,true)[0];   // first surface seen from above
  if(h&&h.face&&h.face.normal.clone().transformDirection(h.object.matrixWorld).y>.85)pts.push({x,z,y:h.point.y})}
 if(pts.length<n)return null;
 const ys=pts.map(q=>q.y).sort((a,c)=>a-c),g=ys[Math.floor(ys.length*.2)],out=[];   // street level = low percentile
 for(const q of pts){if(Math.abs(q.y-g)>H*.15)continue;if(out.every(o=>Math.hypot(o.x-q.x,o.z-q.z)>H*1.1))out.push(q);if(out.length===n)break}
 return out.length===n?out:null}
async function spawnCrowd(root,fp,tok){
 const f=await fp;if(tok!==seq)return;
 root.updateMatrixWorld(true);
 const b=new THREE.Box3().setFromObject(root),sz=b.getSize(new THREE.Vector3()),r=Math.max(sz.x,sz.y,sz.z)||1;
 let H=r*.05;
 if(state.place==='city'){
   H=r*0.015; // Scaled down in city so buildings and skyscrapers tower realistically
 }
 const list=[{u:state.username,av:state.avatar,me:1,s:state.song},...((f&&f.people)||[]).map(p=>({u:p.u,av:p.av,s:p.s,m:p.m,t:p.t}))];
 const grp=new THREE.Group(),ray=new THREE.Raycaster(),n=list.length,R=H*1.5;
 const g0=PLACES[state.place].ground?groundSpots(root,ray,b,H,n):null,spots=[];
 for(let i=0;i<n;i++){if(g0){spots.push(g0[i]);continue}
  const ang=n===1?0:(i/(n-1)-.5)*Math.PI*.9+Math.PI/4,px=Math.sin(ang)*R,pz=Math.cos(ang)*R;   // fan of people in front of the camera
  ray.set(new THREE.Vector3(px,b.min.y+sz.y*.4,pz),new THREE.Vector3(0,-1,0));
  const hit=ray.intersectObject(root,true)[0];spots.push({x:px,z:pz,y:hit?hit.point.y:b.min.y})}
 const cx=spots.reduce((a,q)=>a+q.x,0)/n,cz=spots.reduce((a,q)=>a+q.z,0)/n,gy0=spots[0].y,camX=cx+H*3.4,camZ=cz+H*3.4;
 for(let i=0;i<n;i++){const P=list[i],pv=await avReady(P.av);if(tok!==seq)return;if(!pv)continue;
  const {x:px,z:pz,y:gy}=spots[i];
  const inner=new THREE.Group();inner.add(THREE.SkeletonUtils.clone(pv.children[0]));inner.updateMatrixWorld(true);
  let bb=new THREE.Box3().setFromObject(inner);inner.scale.setScalar(H/((bb.max.y-bb.min.y)||1));inner.updateMatrixWorld(true);
  bb=new THREE.Box3().setFromObject(inner);const cc=bb.getCenter(new THREE.Vector3());inner.position.set(-cc.x,-bb.min.y,-cc.z);
  const w=new THREE.Group();w.add(inner,nameTag(P.u,P.me,H));if(P.s){w.userData.st=songTag(P.s,H);w.add(w.userData.st)}w.position.set(px,gy,pz);
  w.userData.me=P.me;w.userData.P=P;w.userData.ry=w.rotation.y=Math.atan2(camX-px,camZ-pz)+(pv.userData.rot||0);grp.add(w)}
 if(tok!==seq)return;if(!grp.children.length)return;
 sc5.add(grp);crowd=grp;setupMe(grp.children.find(c=>c.userData.me),H);
 cam5.near=Math.min(r/1000,H/50);cam5.updateProjectionMatrix();
 ctl.target.set(cx,gy0+H*.55,cz);cam5.position.set(camX,gy0+H*1.7,camZ);ctl.minDistance=H*1.2;ctl.update()}

async function syncCrowdPresences(newPeople){
 if(!crowd || !me || !run) return;
 const currentNames = new Set((newPeople||[]).map(p=>p.u));
 
 // 1. Remove avatars for users who left
 const toRemove = [];
 crowd.children.forEach(c => {
   if(c.userData.P && !c.userData.me && !currentNames.has(c.userData.P.u)){
     toRemove.push(c);
   }
 });
 toRemove.forEach(c => {
   crowd.remove(c);
   if(c.userData.st){
     c.userData.st.material.map.dispose();
     c.userData.st.material.dispose();
   }
   toast(c.userData.P.u + ' left the place');
   if(nearU === c) {
     nearU = null;
     cmP = null;
     $('#cm').classList.remove('on');
   }
 });

 // 2. Add avatars for newly joined users
 const existingNames = new Set(crowd.children.filter(c=>c.userData.P).map(c=>c.userData.P.u));
 for(const p of (newPeople||[])){
   if(p.u !== state.username && !existingNames.has(p.u)){
     const pv = await avReady(p.av);
     if(!pv || !crowd || !me) continue;
     const H = me.H;
     const inner = new THREE.Group();
     inner.add(THREE.SkeletonUtils.clone(pv.children[0]));
     inner.updateMatrixWorld(true);
     let bb = new THREE.Box3().setFromObject(inner);
     inner.scale.setScalar(H / ((bb.max.y - bb.min.y) || 1));
     inner.updateMatrixWorld(true);
     bb = new THREE.Box3().setFromObject(inner);
     const cc = bb.getCenter(new THREE.Vector3());
     inner.position.set(-cc.x, -bb.min.y, -cc.z);
     
     const w = new THREE.Group();
     w.add(inner, nameTag(p.u, false, H));
     if(p.s){
       w.userData.st = songTag(p.s, H);
       w.add(w.userData.st);
     }
     const ang = Math.random() * Math.PI * 2, dist = H * (1.8 + Math.random() * 2.5);
     const px = me.w.position.x + Math.sin(ang) * dist;
     const pz = me.w.position.z + Math.cos(ang) * dist;
     w.position.set(px, me.w.position.y, pz);
     w.userData.me = false;
     w.userData.P = p;
     w.userData.ry = w.rotation.y = Math.random() * Math.PI * 2;
     crowd.add(w);
     toast(p.u + ' entered the place');
   } else if(p.u !== state.username) {
     const child = crowd.children.find(c => c.userData.P && c.userData.P.u === p.u);
     if(child && child.userData.P.s !== p.s){
       child.userData.P.s = p.s;
       if(child.userData.st){
         child.remove(child.userData.st);
         child.userData.st.material.map.dispose();
         child.userData.st.material.dispose();
         child.userData.st = null;
       }
       if(p.s){
         child.userData.st = songTag(p.s, me.H);
         child.add(child.userData.st);
       }
     }
   }
 }
}
(function loop5(){requestAnimationFrame(loop5);const n=performance.now(),dt=Math.min(.05,(n-(loop5.t||n))/1000);loop5.t=n;
 if(run){if(crowd){const t=n/1000;crowd.children.forEach((w,i)=>{if(me&&w===me.w)return;
  const P=w.userData.P;
  if(P&&P.px!=null){w.position.x+=(P.px-w.position.x)*Math.min(1,dt*8);w.position.y+=(P.py-w.position.y)*Math.min(1,dt*8);w.position.z+=(P.pz-w.position.z)*Math.min(1,dt*8);const dy=P.ry-w.rotation.y;w.rotation.y+=Math.atan2(Math.sin(dy),Math.cos(dy))*Math.min(1,dt*8);}
  else{w.rotation.y=w.userData.ry+Math.sin(t*.8+i*1.7)*.18;}
 })}
 tickMe(dt);tickNear(n);ctl.update();R5.render(sc5,cam5)}})();
/* ===== Controls for your avatar: walk, climb stairs, sit ===== */
function setupMe(w,H){if(!w)return;const inner=w.children[0],rot=((models[state.avatar]||{}).userData||{}).rot||0;
 const bn=(p,s)=>{let r=null;inner.traverse(o=>{if(!r&&o.isBone&&p.test(o.name)&&s.test(o.name))r=o});return r},
  L=/left|[._]l(_|$)/i,R=/right|[._]r(_|$)/i,TH=/up.?leg|thigh/i,KN=/^(?!.*up)(?!.*foot)(?!.*toe).*(leg|calf|shin)$/i;
 const j=[bn(TH,L),bn(TH,R),bn(KN,L),bn(KN,R)].map(b=>b&&{b,r:b.rotation.x});
 me={w,inner,H,j,rot,h:w.userData.ry-rot,ty:w.position.y,iy:inner.position.y,ph:0,a:0,s:0,sit:0,seat:0}}
const shift=(x,y,z)=>{const v=new THREE.Vector3(x,y,z);cam5.position.add(v);ctl.target.add(v)};
/* ===== Compatibility modal: appears when you walk up to someone (uses echovro-ml.js) ===== */
const myTracks=()=>{
  const list=[...(state.tracks||[]),...(state.history||[])];
  if(!list.length && state.song){
    const q=state.song.split(/\s+[–-]\s+/);
    list.push([q[0], q[1]||'']);
  }
  return list;
};
const parseSongStr=s=>{
  if(!s)return null;
  const q=String(s).split(/\s+[–-]\s+/);
  return [q[0], q[1]||''];
};
const trackList=P=>{
  if(P.me)return myTracks();
  if(P.t && Array.isArray(P.t) && P.t.length)return P.t;
  if(P.s){
    const ps=parseSongStr(P.s);
    if(ps)return [ps];
  }
  return [];
};
function showCompat(P){
 const key=P.u+'|'+myTracks().length+'|'+(P.s||'');let r=cc[key];
 if(!r){
  const mine=ML.profile(myTracks()),profs=[mine];
  crowd.children.forEach(w=>{const q=w.userData.P;if(q&&!q.me)profs.push(q.prof||(q.prof=ML.profile(trackList(q))))});
  ML.fit(profs);                                       // TF-IDF weights from everyone in the room
  r=cc[key]=ML.compat(mine,P.prof||(P.prof=ML.profile(trackList(P))));
 }
 const L=g=>ML.LABEL[g]||g,my=SVC[state.music&&state.music.service?state.music.service:'spotify'].n,th=SVC[P.m]?SVC[P.m].n:'';
 $('#cmav').innerHTML=pvw(avOf(P.av));$('#cmn').textContent=P.u;
 $('#cmsv').textContent=th?(th===my?'Also on '+th:my+' ↔ '+th):'';
 $('#cmpct').textContent=r.score==null?'—':r.score+'%';$('#cmlb').textContent=r.label;$('#cmfill').style.width=(r.score||0)+'%';
 $('#cmc').innerHTML=(r.shared&&r.shared.length)?r.shared.map(g=>'<u>'+L(g)+'</u>').join(''):(r.score==null?'':'<u>Similar music vibe</u>');
 $('#cmt').textContent=(P.s?'Listening to: '+P.s+'. ':'')+(r.theirTop&&r.theirTop.length?'Their taste: '+r.theirTop.slice(0,3).map(L).join(', ')+'.':'')+(r.bridge?' They could introduce you to '+L(r.bridge)+'.':'');
 cmP=P;renderCmActions();$('#cm').classList.add('on')}
function tickNear(n){if(!me||!crowd||n-nearT<200)return;nearT=n;const p=me.w.position,H=me.H;let best=null,bd=1e9;
 crowd.children.forEach(w=>{if(w===me.w||!w.userData.P)return;const d=Math.hypot(w.position.x-p.x,w.position.z-p.z)+Math.abs(w.position.y-p.y)*2;if(d<bd){bd=d;best=w}});
 if(best&&bd<(nearU?H*1.7:H*1.1)){if(nearU!==best){nearU=best;showCompat(best.userData.P)}}
 else if(nearU){nearU=null;cmP=null;$('#cm').classList.remove('on')}}
/* ===== Connections: text / voice requests + chat inbox in your profile ===== */
let conns={},connsFor='',ppTab='chats',ppThread=null,call=null,pendingOffer=null,iceBuf=[];
const ckey=()=>'echovro_conns_'+state.username;
async function loadConns(){
  connsFor=state.username;
  try{conns=JSON.parse(localStorage.getItem(ckey())||'{}')}catch(e){conns={}}
  if(CONFIG.USE_BACKEND && getToken()){
    try {
      const r = await api('/api/connections');
      if(r.ok){
        const list = await r.json();
        if(Array.isArray(list)){
          list.forEach(c => {
            const ex = conns[c.u] || {msgs:[], unread:0};
            conns[c.u] = {
              u: c.u,
              av: c.av,
              m: c.m,
              status: c.status,
              dir: c.dir,
              song: c.song,
              msgs: ex.msgs || [],
              unread: ex.unread || 0
            };
          });
          saveConns();
          refresh();
        }
      }
    } catch(e){ console.warn('Failed to sync connections', e); }
  }
}
function saveConns(){try{localStorage.setItem(ckey(),JSON.stringify(conns))}catch(e){}}
// ---- Hooks → your backend (WebSocket/REST). ----
async function onRequestSend(p){
  console.log('EchoVro request', p);
  if(!CONFIG.USE_BACKEND) return;
  try {
    await api('/api/connections/request', {
      method: 'POST',
      body: JSON.stringify({ to: p.to, song: p.song })
    });
  } catch(e) { console.warn('onRequestSend error', e); }
}
async function onRespondSend(p){
  console.log('EchoVro respond', p);
  if(!CONFIG.USE_BACKEND) return;
  try {
    await api('/api/connections/respond', {
      method: 'POST',
      body: JSON.stringify({ to: p.to, accept: !!p.accept })
    });
  } catch(e) { console.warn('onRespondSend error', e); }
}
async function onChatSend(p){
  console.log('EchoVro message', p);
  if(!CONFIG.USE_BACKEND) return;
  try {
    await api('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({ to: p.to, text: p.text })
    });
  } catch(e) { console.warn('onChatSend error', e); }
}
async function signal(m){
  console.log('EchoVro signal', m);
  if(!CONFIG.USE_BACKEND) return;
  try {
    await api('/api/sync/signal', {
      method: 'POST',
      body: JSON.stringify(m)
    });
  } catch(e) { console.warn('signal error', e); }
}
// Call these when your backend pushes something to this user:
window.EchoVroReceive={request:P=>incoming(P),accepted:u=>accepted(u),message:(u,t)=>receiveMsg(u,t),signal:m=>onSignal(m)};

// Real-time synchronization polling (sync events from backend)
async function pollSyncEvents(){
  if(!CONFIG.USE_BACKEND || !getToken() || !state.username) return;
  try {
    const r = await api('/api/sync/events');
    if(r.ok){
      const events = await r.json();
      if(Array.isArray(events)){
        for(const ev of events){
          try {
            const p = ev.payload ? JSON.parse(ev.payload) : {};
            if(ev.eventType === 'request') incoming(p);
            else if(ev.eventType === 'accepted') accepted(p.u || ev.from);
            else if(ev.eventType === 'message') receiveMsg(p.from || ev.from, p.text);
            else if(ev.eventType === 'signal') onSignal(p);
            else if(ev.eventType === 'room' && window.EchoVroReceive.room) window.EchoVroReceive.room(p);
          } catch(err){ console.warn('Error handling sync event', err, ev); }
        }
      }
    }
  } catch(e){}

  if(state.place){
    try {
      const f = await fetchPlaceFeed(state.place, state);
      if(f && (!feed || JSON.stringify(f.people) !== JSON.stringify(feed.people))){
        feed = f;
        renderSheet();
        syncCrowdPresences(f.people);
      }
    } catch(e){}
  }
}
setInterval(pollSyncEvents, 2500);

const fa=av=>{const a=avOf(av);return `<div class="fa">${a?pvw(a):''}</div>`};   // real 3D avatar (.glb) rendered by the shared preview renderer
const bub=m=>`<div class="bub${m.me?' me':''}">${esc(m.t)}</div>`;
function badge(){const n=Object.values(conns).reduce((s,c)=>s+(c.unread||0)+(c.status==='pending'&&c.dir==='in'?1:0),0),b=$('#pfb');b.textContent=n||'';b.style.display=n?'flex':'none'}
function refresh(){badge();renderPanel();renderCmActions()}
function getConn(P){return conns[P.u]||(conns[P.u]={u:P.u,av:P.av,m:P.m,status:'none',msgs:[],unread:0})}
function request(P,song){const c=getConn(P);   // step 1 of everything: a connection request
 if(c.status!=='none')return;
 c.status='pending';c.dir='out';c.song=song;saveConns();onRequestSend({to:P.u,song});refresh();toast('Song sent to '+P.u);}
function accepted(u){const c=conns[u];if(!c||c.status!=='pending')return;c.status='connected';saveConns();refresh();toast(u+' accepted — you are connected');
 openPanel('thread',u)}
function incoming(P){const c=getConn(P);if(c.status!=='none')return;c.status='pending';c.dir='in';c.song=P.song||{t:P.s,svc:P.m};saveConns();refresh();
 toast(P.u+' sent you a song to connect — open Requests in your profile')}
function respond(u,ok){const c=conns[u];if(!c)return;onRespondSend({to:u,accept:ok});
 if(ok){c.status='connected';toast('Connected with '+u)}else c.status='none';
 saveConns();refresh();if(ok)openPanel('thread',u)}
function renderCmActions(){const P=cmP;if(!P)return;const c=conns[P.u],a=$('#cma');
 if(c&&c.status==='connected')a.innerHTML='<button class="btn" data-a="chat">Message</button>';
 else if(c&&c.status==='pending'&&c.dir==='in')a.innerHTML='<button class="btn" data-a="yes">Accept</button><button class="btn g" data-a="no">Decline</button>';
 else if(c&&c.status==='pending')a.innerHTML='<button class="btn" disabled>Request sent…</button>';
 else a.innerHTML='<button class="btn" data-a="connect">Connect through a song</button>';
 a.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const k=b.dataset.a;
  if(k==='chat')openPanel('thread',P.u);else if(k==='connect')openSongPick(P);else respond(P.u,k==='yes')})}
/* ---- profile panel with chat menu ---- */
async function openPanel(view,u){
  ppThread=view==='thread'&&conns[u]&&conns[u].status==='connected'?u:null;
  if(ppThread&&conns[u]){
    conns[u].unread=0;
    saveConns();
    if(CONFIG.USE_BACKEND && getToken()){
      try {
        const r = await api('/api/chat/messages?with='+encodeURIComponent(u));
        if(r.ok){
          const hist = await r.json();
          if(Array.isArray(hist)&&hist.length>0){
            conns[u].msgs = hist.map(m=>({me:m.me, t:m.t}));
            saveConns();
          }
        }
      } catch(e){}
    }
  }
  $('#pp').classList.add('on');renderPanel();badge()
}
function renderPanel(){const p=$('#pp');if(!p.classList.contains('on'))return;const a=findAv();
 $('#ppav').innerHTML=a?pvw(a):'';$('#ppn').textContent=state.username;$('#pps').textContent=state.music?SVC[state.music.service].n+' linked':'';
 const body=$('#ppb'),list=Object.values(conns);
 if(ppThread&&conns[ppThread]&&conns[ppThread].status==='connected'){const c=conns[ppThread];
  body.innerHTML=`<div class="thh"><button class="btn g" id="thb">←</button>${fa(c.av)}<b>${esc(c.u)}</b></div><div id="thm">${(c.msgs||[]).map(bub).join('')||'<p class="emp">Say hi 👋</p>'}</div><div class="mine" style="margin:10px 0 0"><input id="thi" maxlength="300" placeholder="Message…"><button class="btn" id="ths">Send</button></div>`;
  $('#thb').onclick=()=>{ppThread=null;renderPanel()};
  const send=()=>{const v=$('#thi').value.trim();if(v)sendMsg(c.u,v)};$('#ths').onclick=send;$('#thi').onkeydown=e=>{if(e.key==='Enter')send()};
  const m=$('#thm');m.scrollTop=m.scrollHeight;return}
 ppThread=null;
 const chats=list.filter(c=>c.status==='connected'),rin=list.filter(c=>c.status==='pending'&&c.dir==='in'),rout=list.filter(c=>c.status==='pending'&&c.dir==='out'),un=chats.reduce((s,c)=>s+(c.unread||0),0);
 body.innerHTML=`<div class="tabs"><button data-t="chats" class="${ppTab==='chats'?'on':''}">Chats${un?' ('+un+')':''}</button><button data-t="req" class="${ppTab==='req'?'on':''}">Requests${rin.length?' ('+rin.length+')':''}</button></div>`+
  (ppTab==='chats'?(chats.map(c=>{const l=(c.msgs||[]).slice(-1)[0];return `<div class="crow" data-u="${esc(c.u)}">${fa(c.av)}<div><b>${esc(c.u)}</b><i>${l?esc((l.me?'You: ':'')+l.t):'Connected'}</i></div>${c.unread?'<em>'+c.unread+'</em>':''}</div>`}).join('')||'<p class="emp">No connections yet. Walk up to someone and send a text or voice request.</p>')
  :(rin.map(c=>`<div class="crow">${fa(c.av)}<div><b>${esc(c.u)}</b><i>♪ ${esc((c.song&&c.song.t)||'a song')}${c.song&&SVC[c.song.svc]?' · '+SVC[c.song.svc].n:''}</i></div><button class="btn" data-y="${esc(c.u)}">✓</button><button class="btn g" data-n="${esc(c.u)}">✕</button></div>`).join('')+rout.map(c=>`<div class="crow">${fa(c.av)}<div><b>${esc(c.u)}</b><i>request sent…</i></div></div>`).join('')||'<p class="emp">No pending requests.</p>'));
 body.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{ppTab=b.dataset.t;renderPanel()});
 body.querySelectorAll('.crow[data-u]').forEach(r=>r.onclick=()=>openPanel('thread',r.dataset.u));
 body.querySelectorAll('[data-y]').forEach(b=>b.onclick=()=>respond(b.dataset.y,true));
 body.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>respond(b.dataset.n,false))}
function pushBubble(m){const el=$('#thm');if(!el)return;const e=el.querySelector('.emp');if(e)e.remove();el.insertAdjacentHTML('beforeend',bub(m));el.scrollTop=el.scrollHeight}
function sendMsg(u,text){const c=conns[u];if(!c||c.status!=='connected')return;const m={me:1,t:text};c.msgs.push(m);saveConns();onChatSend({to:u,text});$('#thi').value='';pushBubble(m)}
function receiveMsg(u,text){const c=conns[u];if(!c||c.status!=='connected')return;const m={t:text};c.msgs.push(m);
 if($('#pp').classList.contains('on')&&ppThread===u)pushBubble(m);else{c.unread=(c.unread||0)+1;if(!ppThread)renderPanel();toast(u+': '+text.slice(0,40))}saveConns();badge()}
$('#pf').onclick=()=>openPanel();$('#ppx').onclick=()=>$('#pp').classList.remove('on');
/* ---- voice chat (WebRTC; signalling goes through signal()/EchoVroReceive.signal) ---- */
function showCall(t,inc){$('#call').classList.add('on');$('#cl').textContent=t;$('#cacc').style.display=inc?'':'none';$('#cmute').style.display=inc?'none':'';$('#cmute').textContent='Mute'}
function makePc(c,stream){const pc=new RTCPeerConnection({iceServers:[
  {urls:'stun:stun.l.google.com:19302'},
  {urls:'stun:stun1.l.google.com:19302'},
  {urls:'stun:stun2.l.google.com:19302'},
  {urls:'stun:stun.cloudflare.com:3478'}
]});
 stream.getTracks().forEach(t=>pc.addTrack(t,stream));
 const au=new Audio();au.autoplay=true;au.playsInline=true;
 pc.ontrack=e=>{if(call)call.au=au;au.srcObject=e.streams[0];$('#call').appendChild(au);};
 pc.onicecandidate=e=>e.candidate&&signal({to:c.u,type:'ice',data:e.candidate});
 pc.onconnectionstatechange=()=>{const s=pc.connectionState;console.log('[WebRTC]',c.u,s);if(s==='connected')callUp();if(s==='failed'||s==='closed')endCall(true)};
 return pc}
async function mic(){try{return await navigator.mediaDevices.getUserMedia({audio:true,echoCancellation:true,noiseSuppression:true})}catch(e){toast('Microphone access is needed for voice chat. Please allow it in your browser settings.');return null}}
async function openVoice(c){if(!c||c.status!=='connected')return toast('Connect with them first.');if(call)return toast('Already in a call.');const stream=await mic();if(!stream)return;
 call={c,stream,pc:null,au:null,t0:0,iv:0};showCall('Calling '+c.u+'…');
 const pc=call.pc=makePc(c,stream),o=await pc.createOffer({offerToReceiveAudio:true});await pc.setLocalDescription(o);signal({to:c.u,type:'offer',data:{type:o.type,sdp:o.sdp}})}
function callUp(){if(!call||call.t0)return;call.t0=Date.now();const tick=()=>{const s=Math.floor((Date.now()-call.t0)/1000);$('#cl').textContent='🎙 '+call.c.u+' · '+String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};tick();call.iv=setInterval(tick,500)}
async function onSignal(m){
  // Allow signalling from ANY user, not just "connected" ones
  let c=conns[m.from];
  if(!c)c=conns[m.from]={u:m.from,av:'',m:'spotify',status:'none',msgs:[],unread:0};
  if(m.type==='offer'){if(call)return signal({to:m.from,type:'hangup'});pendingOffer=m;iceBuf=[];showCall(c.u+' is calling…',true)}
  else if(m.type==='hangup')endCall(true);
  else if(m.type==='ice'){
    if(call&&call.pc&&call.pc.remoteDescription)try{await call.pc.addIceCandidate(new RTCIceCandidate(m.data))}catch(e){console.warn('ICE err',e)}
    else iceBuf.push(m.data)
  }
  else if(m.type==='answer'&&call&&call.pc){
    await call.pc.setRemoteDescription(new RTCSessionDescription(m.data));
    for(const i of iceBuf)try{await call.pc.addIceCandidate(new RTCIceCandidate(i))}catch(e){}
    iceBuf=[];
  }
}
async function acceptCall(){const m=pendingOffer;if(!m)return;pendingOffer=null;
 let c=conns[m.from];if(!c)c=conns[m.from]={u:m.from,av:'',m:'spotify',status:'none',msgs:[],unread:0};
 const stream=await mic();if(!stream){signal({to:m.from,type:'hangup'});return endCall(true)}
 call={c,stream,pc:null,au:null,t0:0,iv:0};const pc=call.pc=makePc(c,stream);
 await pc.setRemoteDescription(new RTCSessionDescription(m.data));
 for(const i of iceBuf)try{await pc.addIceCandidate(new RTCIceCandidate(i))}catch(e){}iceBuf=[];
 const a=await pc.createAnswer();await pc.setLocalDescription(a);
 signal({to:c.u,type:'answer',data:{type:a.type,sdp:a.sdp}});showCall('Connecting with '+c.u+'…')}
function endCall(remote){if(pendingOffer){if(!remote)signal({to:pendingOffer.from,type:'hangup'});pendingOffer=null}
 if(call){clearInterval(call.iv);call.stream.getTracks().forEach(t=>t.stop());if(call.au)call.au.remove();if(call.pc)call.pc.close();if(!remote)signal({to:call.c.u,type:'hangup'});call=null}
 $('#call').classList.remove('on')}
$('#cend').onclick=()=>endCall(false);$('#cacc').onclick=acceptCall;
$('#cmute').onclick=()=>{if(!call)return;const t=call.stream.getAudioTracks();t.forEach(x=>x.enabled=!x.enabled);$('#cmute').textContent=t[0]&&t[0].enabled?'Mute':'Unmute'};
function findSeat(){const m=me,o=m.w.position,H=m.H;
 for(let i=0;i<12;i++){const a=i/12*6.283,x=o.x+Math.sin(a)*H*.7,z=o.z+Math.cos(a)*H*.7;
  mray.set(new THREE.Vector3(x,o.y+H*.6,z),DOWN);const h=mray.intersectObject(cur,true)[0];
  if(h&&h.face){const d=h.point.y-o.y;if(d>H*.15&&d<H*.4&&h.face.normal.clone().transformDirection(h.object.matrixWorld).y>.8)return{x,z,a}}}
 return null}
function toggleSit(){if(!me)return;const m=me;
 if(m.sit){m.sit=0;m.seat=0}
 else{const s=findSeat();if(s){shift(s.x-m.w.position.x,0,s.z-m.w.position.z);m.w.position.x=s.x;m.w.position.z=s.z;m.h=s.a}m.seat=s?1:0;m.sit=1;ctl.autoRotate=false}
 $('#bs').textContent=m.sit?'STAND':'SIT'}
function tickMe(dt){const m=me;if(!m||!cur)return;const w=m.w,H=m.H,k=keys,dx=(k.r?1:0)-(k.l?1:0),dz=(k.f?1:0)-(k.b?1:0);let go=0;
 if((dx||dz)&&m.sit){m.sit=0;m.seat=0;$('#bs').textContent='SIT'}
 if((dx||dz)&&!m.sit){const t=ctl.target,c=cam5.position;let fx=t.x-c.x,fz=t.z-c.z;const fl=Math.hypot(fx,fz)||1;fx/=fl;fz/=fl;
  let vx=fx*dz-fz*dx,vz=fz*dz+fx*dx;const vl=Math.hypot(vx,vz)||1;vx/=vl;vz/=vl;
  const sp=H*(climb?.7:1.4)*dt,nx=w.position.x+vx*sp,nz=w.position.z+vz*sp,st=H*(climb?.45:.12),ta=Math.atan2(vx,vz);
  m.h+=Math.atan2(Math.sin(ta-m.h),Math.cos(ta-m.h))*Math.min(1,dt*10);
  mray.far=H*.4;mray.set(new THREE.Vector3(w.position.x,w.position.y+st+H*.1,w.position.z),new THREE.Vector3(vx,0,vz));const wall=mray.intersectObject(cur,true).length>0;mray.far=Infinity;   // solid obstacle above step height
  mray.set(new THREE.Vector3(nx,w.position.y+st+H*.3,nz),DOWN);const h=wall?null:mray.intersectObject(cur,true).find(q=>q.point.y-w.position.y<=st&&w.position.y-q.point.y<H*.6);   // highest surface we can step onto (skips rails/slabs above reach)
  if(h){const ox=w.position.x,oz=w.position.z;w.position.x=nx;w.position.z=nz;m.ty=h.point.y;shift(nx-ox,0,nz-oz);go=1}}
 const oy=w.position.y;w.position.y+=(m.ty-oy)*Math.min(1,dt*12);shift(0,w.position.y-oy,0);
 m.a+=((go?(climb?.9:.6):0)-m.a)*Math.min(1,dt*8);m.ph+=dt*(climb?7:9);m.s+=(m.sit-m.s)*Math.min(1,dt*6);
 const s=m.s,sw=Math.sin(m.ph)*m.a*(1-s),A=1.5*s,[tl,tr,kl,kr]=m.j,kn=(m.seat?1.5:.2)*s;
 if(tl)tl.b.rotation.x=tl.r+LEG*(sw+A);if(tr)tr.b.rotation.x=tr.r+LEG*(-sw+A);
 if(kl)kl.b.rotation.x=kl.r-LEG*(Math.max(0,-sw)*1.2+kn);if(kr)kr.b.rotation.x=kr.r-LEG*(Math.max(0,sw)*1.2+kn);
 m.inner.position.y=m.iy-(m.seat?.23:.46)*H*s+Math.abs(Math.sin(m.ph))*H*.015*m.a;
 w.rotation.y=m.h+m.rot;
 // Broadcast position ~3x/sec so other users see me move
 if(go&&CONFIG.USE_BACKEND&&state.username&&state.place){
   const now=performance.now();
   if(!tickMe.lt||now-tickMe.lt>300){
     tickMe.lt=now;
     api('/api/places/'+encodeURIComponent(state.place)+'/move',{method:'POST',body:JSON.stringify({username:state.username,px:w.position.x,py:w.position.y,pz:w.position.z,ry:w.rotation.y})}).catch(()=>{});
   }
 }
}
$$('#pad [data-k]').forEach(b=>{const k=b.dataset.k,f=v=>e=>{e.preventDefault();keys[k]=v;if(v&&ctl)ctl.autoRotate=false};
 b.onpointerdown=f(1);['onpointerup','onpointerleave','onpointercancel'].forEach(ev=>b[ev]=f(0))});
$('#bc').onclick=()=>{climb=!climb;$('#bc').classList.toggle('on',climb)};
$('#bs').onclick=toggleSit;
const KM={KeyW:'f',ArrowUp:'f',KeyS:'b',ArrowDown:'b',KeyA:'l',ArrowLeft:'l',KeyD:'r',ArrowRight:'r'};
addEventListener('keydown',e=>{if(step!==5||e.target.tagName==='INPUT')return;if(KM[e.code]){keys[KM[e.code]]=1;e.preventDefault()}
 if(e.code==='KeyE')toggleSit();if(e.code==='KeyC')$('#bc').click()});
addEventListener('keyup',e=>{if(KM[e.code])keys[KM[e.code]]=0});
const songLink=(m,s)=>SVC[m].q+encodeURIComponent(s[0]+' '+s[1]);
async function enterPlace(k){
 const P=PLACES[k],tok=++seq;state.place=k;state.song='';feed=null;drop();go(5);
 // IMPORTANT: await join so we are in the DB before the feed is fetched
 if(CONFIG.USE_BACKEND && state.username){
   try{ await api('/api/places/'+encodeURIComponent(k)+'/join?user='+encodeURIComponent(state.username),{method:'POST'}); }catch(e){}
 }
 $('#pn').textContent=P.name;$('#pb').textContent=P.blurb;$('#sheet').innerHTML='';$('#ld').style.display='';$('#bar').style.width='0';$('#lt').textContent='Loading '+P.name+'…';
 if(!state.tracks)fetchMyTracks(state).then(t=>{state.tracks=t||[]});
 const fp=fetchPlaceFeed(k,state);fp.then(f=>{if(tok!==seq||!f)return;feed=f;renderSheet()});
 try{init5();
  prog[k]=p=>{$('#bar').style.width=Math.round(p*100)+'%'};
  const root=await getPlace(k);
  if(tok!==seq)return;
  $('#lt').textContent='Building the scene…';
  const b=new THREE.Box3().setFromObject(root),c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3()),r=Math.max(s.x,s.y,s.z)||1;
  root.position.sub(c);sc5.add(root);cur=root;
  setBackdrop(k,new THREE.Box3().setFromObject(root),r);
  cam5.near=r/1000;cam5.far=r*30;cam5.updateProjectionMatrix();cam5.position.set(r*.7,r*.5,r*.7);
  ctl.target.set(0,0,0);ctl.minDistance=r*.05;ctl.maxDistance=r*2.5;ctl.maxPolarAngle=Math.PI*.495;ctl.update();
  await spawnCrowd(root,fp,tok);if(tok!==seq)return;
  $('#ld').style.display='none';run=true;$('#pad').classList.add('rdy');
  // Re-fetch after scene loads to pick up users who joined during the 3D load
  try{const f2=await fetchPlaceFeed(k,state);if(tok===seq&&f2){feed=f2;renderSheet();syncCrowdPresences(f2.people);}}catch(e){}
 }catch(e){delete placeCache[k];console.error('Place load failed',P.url,e);if(tok===seq)$('#lt').textContent='Could not load '+P.url+' — '+((e&&e.message)||(e&&e.target&&('HTTP '+(e.target.status||'error')))||String(e))}}
let sheetOpen=true;
$('#shtog').onclick=()=>{
 sheetOpen=!sheetOpen;
 const s=$('#sheet');
 s.style.maxHeight=sheetOpen?'':'0';
 s.style.padding=sheetOpen?'':'0';
 s.style.opacity=sheetOpen?'1':'0';
 s.style.borderWidth=sheetOpen?'':'0';
 s.style.overflow=sheetOpen?'auto':'hidden';
 $('#shtog').textContent=sheetOpen?'▼ Menu':'▲ Menu';
};
$('#bk').onclick=()=>{
 seq++;
 if(CONFIG.USE_BACKEND && state.username){
   api('/api/places/leave?user='+encodeURIComponent(state.username), {method:'POST'}).catch(()=>{});
 }
 drop();
 go(4);
};

/* ===== Connect through a song: the only way to send a connection request ===== */
let srP=null,srS='';
function srUpd(){$$('#srs [data-s]').forEach(b=>{b.onclick=()=>{srS=b.dataset.s;srUpd()};b.classList.toggle('ok',b.dataset.s===srS)});$('#sro').href=SVC[srS].q+encodeURIComponent($('#sri').value)}
function openSongPick(P){srP=P;srS=state.music.service;$('#srt').textContent='Connect with '+P.u+' through a song';
 $('#srs').innerHTML=Object.keys(SVC).map(k=>`<button class="btn g" data-s="${k}">${SVC[k].n}</button>`).join('');
 $('#srl').innerHTML=(feed?feed.songs:[]).map(x=>`<option value="${esc(x[0]+' – '+x[1])}">`).join('');
 $('#sri').value='';$('#srk').value='';$('#sr').classList.add('on');srUpd()}
$('#sri').oninput=srUpd;$('#srx').onclick=()=>$('#sr').classList.remove('on');
$('#srsend').onclick=()=>{const t=$('#sri').value.trim(),l=$('#srk').value.trim();if(!t&&!l)return toast('Pick a song to send.');
 $('#sr').classList.remove('on');request(srP,{t:t||l,svc:srS,link:l})};

/* ===== Listening room: same song, same moment, with text chat ===== */
let room={with:null,link:'',msgs:[],cds:[],col:'aurora'};
async function onRoomSend(p){
  console.log('EchoVro room', p);
  if(!CONFIG.USE_BACKEND) return;
  try {
    await api('/api/room/event', {
      method: 'POST',
      body: JSON.stringify(p)
    });
  } catch(e) { console.warn('onRoomSend error', e); }
}
function parseLink(u){let m;
 if(m=u.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?track\/(\w+)/))return{svc:'spotify',src:'https://open.spotify.com/embed/track/'+m[1]};
 if(m=u.match(/(?:youtu\.be\/|[?&]v=)([\w-]{11})/))return{svc:'ytm',src:'https://www.youtube.com/embed/'+m[1]};
 if(/gaana\.com\/song\//.test(u))return{svc:'gaana',src:''};
 return null}
function renderRoom(){const f=Object.values(conns).filter(c=>c.status==='connected');
 if(!room.with&&f[0])room.with=f[0].u;
 $('#rwho').innerHTML=f.length?f.map(c=>`<button class="btn g${c.u===room.with?' ok':''}" data-u="${esc(c.u)}">${esc(c.u)}</button>`).join(''):'<p class="emp">Connect with someone through a song first, then invite them here.</p>';
 $$('#rwho [data-u]').forEach(b=>b.onclick=()=>{room.with=b.dataset.u;room.msgs=[];room.cds=[];renderRoom()});
 renderCDs();$('#rch').innerHTML=room.msgs.map(bub).join('')||'<p class="emp">Say hi 👋</p>';$('#rch').scrollTop=1e5;
 const l=room.link&&parseLink(room.link);
 $('#rpl').innerHTML=!l?'':l.src?`<iframe src="${l.src}" allow="autoplay; encrypted-media" style="width:100%;height:${l.svc==='spotify'?152:220}px;border:0"></iframe>`:`<a class="btn" href="${esc(room.link)}" target="_blank" rel="noopener">Open in Gaana</a>`}
$('#rgo').onclick=()=>{const u=$('#rlk').value.trim();if(!parseLink(u))return toast('Paste a Spotify, YouTube Music or Gaana song link.');
 room.link=u;if(room.with)onRoomSend({to:room.with,type:'link',link:u});renderRoom()};
function countdown(at){const iv=setInterval(()=>{const s=Math.ceil((at-Date.now())/1000);if(s>0)return toast('Playing in '+s+'…');clearInterval(iv);
 const l=room.link&&parseLink(room.link),f=$('#rpl iframe');
 if(l&&l.svc==='ytm'&&f){f.src=l.src+'?autoplay=1';toast('Playing together')}else toast('Press play now ▶')},1000)}
$('#rsync').onclick=()=>{if(!room.link||!room.with)return toast('Pick a friend and load a song first.');
 const at=Date.now()+5000;onRoomSend({to:room.with,type:'play',at});countdown(at)};
function sendRoom(){const v=$('#rci').value.trim();if(!v||!room.with)return;room.msgs.push({me:1,t:v});$('#rci').value='';
 onRoomSend({to:room.with,type:'chat',text:v});renderRoom();}
$('#rcs').onclick=sendRoom;$('#rci').onkeydown=e=>{if(e.key==='Enter')sendRoom()};$('#rbk').onclick=()=>go(4);
// Call from your backend: EchoVroReceive.room({from,type:'link'|'play'|'chat',link,at,text})
EchoVroReceive.room=m=>{if(m.type==='link'){room.link=m.link;toast(m.from+' shared a song')}
 if(m.type==='cd'){room.cds.push({t:m.t,svc:m.svc,link:m.link,from:m.from,col:m.col,fresh:1});toast(m.from+' sent you a CD')}
 if(m.type==='chat')room.msgs.push({t:m.text});if(m.type==='play')countdown(m.at);renderRoom()};

/* ===== Songs as CDs: send a song, it lands in the room as a disc. Tap a CD to play it. ===== */
function cdHTML(c,i){const q=c.t.split(/\s+[–-]\s+/);
 return `<button class="cdw${c.me?' sent':''}${c.fresh?' fresh':''}" style="--g:${CDC[c.col]||CDC.aurora}" data-i="${i}" aria-label="Play ${esc(c.t)}"><span class="cd"><span class="disc"></span><span class="cdl"><b>${esc(q[0])}</b><i>${esc(q[1]||'')}</i></span></span><em>${c.me?'You':esc(c.from||room.with||'')}</em></button>`}
const CDC={aurora:'#e9eefb,#9fb6dc,#f3e7cf,#c0a8e0,#8fd6e4,#f6f0e0,#9fb6dc,#e9eefb',gold:'#fff3c4,#e0b04a,#fff8dc,#c98f2b,#f7e3a0,#e0b04a,#fff3c4',rose:'#ffe3ea,#e88aa4,#fff0f3,#c25b7c,#f6b8c8,#e88aa4,#ffe3ea',mint:'#e2fff3,#5fcfa0,#f2fff9,#3a9c7a,#a8ecd0,#5fcfa0,#e2fff3',violet:'#efe3ff,#9a73e0,#f8f2ff,#6b45b8,#c9b0f2,#9a73e0,#efe3ff',midnight:'#5a74a0,#16294a,#9db3d3,#0a1426,#6f8bb0,#16294a,#5a74a0'};
function drawCC(){const el=$('#rcc');if(!el)return;
 el.innerHTML=Object.keys(CDC).map(k=>`<button class="${k===room.col?'on':''}" data-c="${k}" aria-label="${k} CD" style="background:conic-gradient(${CDC[k]})"></button>`).join('');
 $$('#rcc [data-c]').forEach(b=>b.onclick=()=>{room.col=b.dataset.c;drawCC()})}
function renderCDs(){const el=$('#rcd');if(!el)return;drawCC();
 el.innerHTML=room.cds.map(cdHTML).join('')||'<p class="emp">No CDs yet. Send one and it lands here.</p>';
 $$('#rcd .cdw').forEach(b=>b.onclick=()=>playCD(room.cds[+b.dataset.i]));room.cds.forEach(c=>c.fresh=0)}
function playCD(c){if(c.link&&parseLink(c.link)){room.link=c.link;if(room.with)onRoomSend({to:room.with,type:'link',link:c.link});renderRoom();toast('Playing '+c.t)}
 else window.open(SVC[c.svc||state.music.service].q+encodeURIComponent(c.t),'_blank','noopener')}
function sendCD(){const v=$('#rcdi').value.trim();if(!room.with)return toast('Connect with someone first.');if(!v)return toast('Type a song first.');
 const isL=/^https?:\/\//i.test(v),pl=isL?parseLink(v):null,c={me:1,t:isL?'Song link':v.slice(0,60),svc:pl?pl.svc:state.music.service,link:isL?v:'',col:room.col,fresh:1};
 room.cds.push(c);$('#rcdi').value='';onRoomSend({to:room.with,type:'cd',t:c.t,svc:c.svc,link:c.link,col:c.col});renderCDs();toast('CD sent to '+room.with);}
$('#rcdb').onclick=sendCD;$('#rcdi').onkeydown=e=>{if(e.key==='Enter')sendCD()};

/* ===== 3D avatar previews: one shared WebGL renderer drawn into each card's canvas ===== */
const PV=256;   // preview resolution (cards are ≤170px wide)
const pvw=a=>`<div class="pvw" data-id="${a.id}"><div class="ph">${face(a.look)}</div><canvas class="pv" width="${PV}" height="${PV}"></canvas></div>`;
const T=THREE,models={},loading={};let R3=null;
const sc3=new T.Scene(),cam3=new T.PerspectiveCamera(28,1,.01,100);
try{R3=new T.WebGLRenderer({alpha:true,antialias:true});R3.setSize(PV,PV,false);R3.outputEncoding=T.sRGBEncoding;R3.toneMapping=T.ACESFilmicToneMapping;R3.toneMappingExposure=1.05;
 const kl=new T.DirectionalLight(0xfff1d6,1.7),rl=new T.DirectionalLight(0x8fa8cc,1.2);kl.position.set(2,3,4);rl.position.set(-3,2,-3);sc3.add(new T.HemisphereLight(0xdfe8ff,0x16294a,.9),kl,rl)}
catch(e){R3=null;document.body.classList.add('nogl');console.warn('WebGL unavailable — showing illustrated avatars',e)}
function frameOf(root){root.updateMatrixWorld(true);let head=null,hips=null;
 root.traverse(o=>{if(o.isBone){if(/^Head(_\d+)?$/.test(o.name))head=o;if(/^Hips(_\d+)?$/.test(o.name))hips=o}});
 if(head&&hips){const a=head.getWorldPosition(new T.Vector3()),b=hips.getWorldPosition(new T.Vector3()),u=a.y-b.y;return{x:a.x,y:a.y+u*.12,z:a.z,s:u*.95}}
 const b=new T.Box3().setFromObject(root),h=b.max.y-b.min.y;return{x:(b.min.x+b.max.x)/2,y:b.max.y-h*.16,z:(b.min.z+b.max.z)/2,s:h*.36}}
const avLoader=new T.GLTFLoader();avLoader.setDRACOLoader(draco);   // shared loader; also handles Draco-compressed avatars
function ensure(g){if(!R3)return;AVATARS[g].forEach(a=>{if(models[a.id]||loading[a.id])return;loading[a.id]=1;
 avLoader.load(a.model,gl=>{const root=gl.scene;root.traverse(o=>{if(o.isMesh)o.frustumCulled=false});
  const f=frameOf(root),pivot=new T.Group();root.position.x-=f.x;root.position.z-=f.z;pivot.add(root);pivot.visible=false;
  pivot.userData={y:f.y,d:f.s/2/Math.tan(14*Math.PI/180)*1.05,rot:a.rot||0,clips:gl.animations||[]};sc3.add(pivot);models[a.id]=pivot},undefined,e=>{delete loading[a.id];console.warn('Avatar failed to load (serve the site over http/https):',a.model,e)})})}
(function loop3(t){requestAnimationFrame(loop3);if(!R3)return;
 if(t-(loop3.l||0)<33)return;loop3.l=t;   // ~30fps is plenty for a gentle sway
 document.querySelectorAll('.pvw').forEach(w=>{const s=w.closest('.scr,#pp,#pf');if(!s||!(s.matches('.scr,#pp')?s.classList.contains('on'):s.style.display==='block'))return;const m=models[w.dataset.id];if(!m)return;
  const u=m.userData,id=w.dataset.id;m.rotation.y=u.rot+Math.sin(t*.0008+id.charCodeAt(id.length-1))*.45;
  cam3.position.set(0,u.y,u.d);cam3.near=u.d*.05;cam3.far=u.d*30;cam3.updateProjectionMatrix();cam3.lookAt(0,u.y,0);
  m.visible=true;R3.render(sc3,cam3);m.visible=false;
  const c=w.querySelector('canvas').getContext('2d');c.clearRect(0,0,PV,PV);c.drawImage(R3.domElement,0,0);w.classList.add('rdy')})})(0);
// Start fetching every avatar right away (splash screen), so they're ready by the time step 2 opens.
['male','female'].forEach(ensure);

/* ===== Music notes: slam into the screen, then drift through the air ===== */
const cv=$('#c'),x=cv.getContext('2d'),G=['♪','♫','♩','♬'],COL=['#eaf0ff','#8fa8cc','#c9d2e0','#eaf0ff'];
let W,H,dpr,notes=[],rip=[];
function size(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',size);size();
const N=W<700?34:60;
for(let i=0;i<N;i++)notes.push({g:G[i%4],c:COL[i%4],tx:Math.random()*W,ty:Math.random()*H,sz:22+Math.random()*46,delay:Math.random()*2.4,dur:.55+Math.random()*.35,sp:14+Math.random()*30,ph:Math.random()*6.28,hit:false});
let t0=performance.now();
function loop(now){requestAnimationFrame(loop);if(step===5)return;const t=(now-t0)/1000;x.clearRect(0,0,W,H);x.textAlign='center';x.textBaseline='middle';
 rip=rip.filter(r=>r.u<1);rip.forEach(r=>{r.u+=.022;x.strokeStyle=`rgba(234,240,255,${(1-r.u)*.55})`;x.lineWidth=2;x.beginPath();x.arc(r.x,r.y,8+r.u*r.r,0,6.283);x.stroke()});
 notes.forEach(n=>{const u=(t-n.delay)/n.dur;if(u<0)return;let px,py,s,a;
  if(u<1){const e=u*u*u;px=W/2+(n.tx-W/2)*e;py=H/2+(n.ty-H/2)*e;s=.05+e*1.35;a=Math.min(1,u*2.5)}   // flying toward the viewer
  else{if(!n.hit){n.hit=true;n.land=t;rip.push({x:n.tx,y:n.ty,u:0,r:n.sz*2.6})}                    // impact
   const f=t-n.land,k=Math.max(0,1-f*3);s=1+.35*k*Math.sin(f*22);a=1;                              // squash-bounce settle
   n.ty-=n.sp*.016;if(n.ty<-60){n.ty=H+60;n.tx=Math.random()*W}                                     // drift upward
   px=n.tx+Math.sin(t*.7+n.ph)*22;py=n.ty+Math.sin(t*.9+n.ph)*8}
  x.globalAlpha=a*(py>H-80?Math.max(0,(H+60-py)/140):1);x.font=`${n.sz*s}px serif`;x.shadowColor='rgba(143,168,204,.9)';x.shadowBlur=14;x.fillStyle=n.c;x.save();x.translate(px,py);x.rotate(Math.sin(t*.6+n.ph)*.25);x.fillText(n.g,0,0);x.restore()});
 x.globalAlpha=1;x.shadowBlur=0}
requestAnimationFrame(loop);

/* ===== Automatic session restore on startup ===== */
function restoreLocalProfile(){
  try {
    const raw = localStorage.getItem('echovro_user_profile');
    if(raw){
      const p = JSON.parse(raw);
      if(p.username) state.username = p.username;
      if(p.email) state.email = p.email;
      if(p.gender) state.gender = p.gender;
      if(p.avatar) state.avatar = p.avatar;
      if(p.music) state.music = p.music;
      if(p.tracks) state.tracks = p.tracks;
    }
  } catch(e){}
}
restoreLocalProfile();

async function initSession(){
  if(!CONFIG.USE_BACKEND || !getToken()) return;
  try {
    const r = await api('/api/me');
    if(r.ok){
      const p = await r.json();
      if(p && p.name){
        state.username = p.name;
        state.email = p.email || state.email || '';
        if(p.gender) state.gender = p.gender;
        if(p.avatar) state.avatar = p.avatar;
        if(p.musicService) state.music = { service: p.musicService };
        if(p.tracks && p.tracks.length) state.tracks = p.tracks;
        
        localStorage.setItem('echovro_user_profile', JSON.stringify({
          username: state.username,
          email: state.email,
          gender: state.gender,
          avatar: state.avatar,
          music: state.music,
          tracks: state.tracks
        }));
        
        loadConns();
        if(step === 0 || step === 1){
          if(state.avatar && state.music){
            go(4);
          } else if(state.avatar){
            go(3);
          } else {
            go(2);
          }
        }
      }
    }
  } catch(e){}
}
initSession();

window.addEventListener('beforeunload', () => {
  if(CONFIG.USE_BACKEND && state.username && state.place){
    navigator.sendBeacon('/api/places/leave?user=' + encodeURIComponent(state.username));
  }
  if(call){
    endCall(false);
  }
});
