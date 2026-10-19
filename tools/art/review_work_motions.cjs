// Normal-speed business recordings plus isolated A/B equipment views.
// Never overwrites the historical game-*.png captures.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert');
const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'../..');
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1]};
const OUT=path.resolve(arg('--out',path.join(ROOT,'docs/art/work-motions','review-'+new Date().toISOString().replace(/[:.]/g,'-'))));
const REF=arg('--ref',null),SECONDS=Number(arg('--seconds','65'));
const HOOK='window.__review={state,get sim(){return sim},get crew(){return crew},characterSprite,characterMotion,render,point,dims,workImages,furnitureViews,step,walk};';
async function serve(p){
 await p.route('http://bakery.test/**',r=>{
  const n=new URL(r.request().url()).pathname.slice(1)||'index.html',f=path.join(ROOT,n);
  if(!fs.existsSync(f))return r.fulfill({status:404,body:''});
  let body=REF&&['index.html','character-motion.js'].includes(n)?execFileSync('git',['show',REF+':'+n],{cwd:ROOT}):fs.readFileSync(f);
  if(n==='index.html')body=body.toString().replace('})();',HOOK+'})();');
  return r.fulfill({body,contentType:n.endsWith('.html')?'text/html':n.endsWith('.js')?'application/javascript':n.endsWith('.css')?'text/css':n.endsWith('.json')?'application/json':'image/webp'});
 });
 await p.goto('http://bakery.test/?demo=motion');
 await p.waitForFunction(()=>Object.values(__review.workImages).every(x=>Object.keys(x).length===4)&&Object.values(__review.furnitureViews).every(x=>x.filter(Boolean).length===4));
}
async function business(browser,size,swap){
 const name=`size-${size}-${swap?'swapped':'default'}`,dir=path.join(OUT,name);fs.mkdirSync(dir,{recursive:true});
 const context=await browser.newContext({viewport:{width:390,height:844},recordVideo:{dir,size:{width:390,height:844}}});
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>localStorage.setItem('bakery_web_v1','{"review":"untouched"}'));
 await serve(p);
 await p.evaluate(({size,swap})=>{
  const t=__review;for(const a of t.crew.staff){a.look={width:size,height:size,scale:size};t.crew.setRole(a.id,(a.id==='owner')!==swap?'kitchen':'hall')}
  window.__observed={};
  // Observe real timers; no step()/walk() calls or replacement timers.
  window.__observeTimer=setInterval(()=>{for(const a of t.crew.staff){const sp=t.characterSprite(a);if(!sp)continue;const key=[a.id,a.job?.type||'idle',a.job?.stage||'',sp.pose.kind].join(':');const row=__observed[key]||={frames:[],contacts:[],samples:0};row.samples++;if(!row.frames.includes(sp.frame))row.frames.push(sp.frame);if(sp.contact&&!row.contacts.includes(sp.contact.kind))row.contacts.push(sp.contact.kind)}},35);
 },{size,swap});
 const start=Date.now(),captured=new Set();
 while(Date.now()-start<SECONDS*1000){
  const keys=await p.evaluate(()=>__review.crew.staff.filter(a=>a.job&&a.job.stage!=='travel').map(a=>a.id+'-'+a.job.type+'-'+a.job.stage));
  for(const key of keys)if(!captured.has(key)){await p.screenshot({path:path.join(dir,key+'.png')});captured.add(key)}
  await p.waitForTimeout(100);
 }
 const result=await p.evaluate(()=>{clearInterval(__observeTimer);return{observed:__observed,sold:__review.sim.sold,minute:__review.sim.minute,saved:localStorage.getItem('bakery_web_v1')}});
 const video=p.video();await context.close();const raw=await video.path();
 execFileSync('ffmpeg',['-y','-loglevel','error','-i',raw,'-an','-c:v','libx264','-threads','2','-preset','fast','-crf','26','-pix_fmt','yuv420p','-movflags','+faststart',path.join(dir,'business.mp4')]);fs.unlinkSync(raw);
 assert.deepEqual(errors,[]);assert.equal(result.saved,'{"review":"untouched"}');assert(result.sold>0,name+' no sales');
 for(const type of ['produce','collect','stock','checkout','supply'])assert(Object.keys(result.observed).some(k=>k.includes(':'+type+':')),name+' missing '+type);
 return{name,size,swap,seconds:SECONDS,normalTimers:true,...result};
}
async function sheets(browser){
 const p=await browser.newPage({viewport:{width:390,height:844}});
 await p.addInitScript(()=>{window.setInterval=()=>0});await serve(p);
 const actions={knead:['prep',{type:'produce',stage:'knead',raw:true}],load:['oven',{type:'produce',stage:'load',raw:true,doughReady:true}],collect:['oven',{type:'collect',stage:'work'}],pickup:['oven',{type:'stock',stage:'pickup',carry:0}],deliver:['shelf',{type:'stock',stage:'deliver',carry:3}],checkout:['register',{type:'checkout',stage:'work'}]};
 let count=0;
 for(const size of [.7,1,1.3])for(const [action,[type,job]]of Object.entries(actions)){
  const cells=[];
  for(const id of ['owner','noah'])for(let rot=0;rot<4;rot++)for(let frame=0;frame<2;frame++){
   const clip=await p.evaluate(({size,type,job,id,rot,frame})=>{
    const t=__review,o={id:50,type,x:4,y:4,rot};t.state.objects=[o];t.state.zoom=1.55;const[w,h]=t.dims(o);
    for(const a of t.crew.staff){a.job=null;a.next=null;a.x=9;a.y=9;a.look={height:size,width:size,scale:size}}
    const a=t.crew.staff.find(a=>a.id===id);[a.x,a.y]=[[4,4+h],[4+w,4],[4,3],[3,4]][rot];a.cell={x:a.x,y:a.y};t.characterMotion.update([a],0);a.job={...job,targetId:50};t.characterMotion.update([a],0);if(frame)t.characterMotion.update([a],225);t.render();
    const p=t.point(4+w/2,4+h/2),r=document.querySelector('canvas').getBoundingClientRect();return{x:Math.max(0,Math.round(r.x+p.x-105)),y:Math.max(0,Math.round(r.y+p.y-155)),width:220,height:255};
   },{size,type,job,id,rot,frame});
   cells.push({label:`${id} / ${rot*90}° / ${frame?'B':'A'}`,src:'data:image/png;base64,'+(await p.screenshot({clip})).toString('base64')});count++;
  }
  const sheet=await browser.newPage({viewport:{width:960,height:1200}});
  await sheet.setContent('<style>body{background:#faf4e8;font:14px sans-serif;color:#473b2f}main{display:grid;grid-template-columns:repeat(4,220px);gap:12px}figure{margin:0}img{display:block;width:220px;height:255px}figcaption{height:22px}</style><h2>'+action+' / '+size*100+'%</h2><main>'+cells.map(x=>'<figure><figcaption>'+x.label+'</figcaption><img src="'+x.src+'"></figure>').join('')+'</main>');
  await sheet.screenshot({path:path.join(OUT,`${action}-${size}.png`),fullPage:true});await sheet.close();
 }
 await p.close();return count;
}
(async()=>{if(fs.existsSync(OUT)&&fs.readdirSync(OUT).length)throw Error('Choose a new, empty --out directory: '+OUT);fs.mkdirSync(OUT,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const recordings=[];
 if(!process.argv.includes('--sheets-only')){
  const sizes=[.7,1,1.3];
  if(process.argv.includes('--parallel'))recordings.push(...await Promise.all(sizes.flatMap(size=>[false,true].map(swap=>business(browser,size,swap)))));
  else for(const size of sizes)recordings.push(...await Promise.all([business(browser,size,false),business(browser,size,true)]));
 }
 const cells=await sheets(browser),report={source:REF||execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),workingTree:!REF,cells,recordings};
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(path.join(OUT,'index.html'),'<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>作業モーション表示レビュー</title><style>body{max-width:1000px;margin:auto;padding:20px;background:#faf4e8;color:#473b2f;font-family:sans-serif}video{width:100%;max-width:390px}img{max-width:100%}section{margin:24px 0}</style><h1>作業モーション表示レビュー</h1><p>2026-10-18。制作時点の確認記録。営業動画は通常タイマー、比較シートは固定したA/B表示。過去の公開動画とは別の記録です。</p>'+recordings.map(r=>`<section><h2>${r.size*100}% / ${r.swap?'担当入替':'標準担当'}</h2><video controls preload="metadata" src="${r.name}/business.mp4"></video></section>`).join('')+fs.readdirSync(OUT).filter(n=>n.endsWith('.png')).map(n=>`<details><summary>${n}</summary><img loading="lazy" src="${n}" alt="${n}"></details>`).join('')+'</html>');
 console.log(JSON.stringify({out:OUT,cells,recordings:recordings.map(r=>({name:r.name,sold:r.sold,observed:Object.keys(r.observed)}))}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
