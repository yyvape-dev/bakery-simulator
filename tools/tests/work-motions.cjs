const {chromium}=require('playwright'),sharp=require('sharp'),fs=require('fs'),path=require('path'),assert=require('assert');
const Motion=require('../../character-motion.js');
const ROOT=process.env.BAKERY_TEST_ROOT||path.resolve(__dirname,'../..');
const hook='window.__motion={state,get sim(){return sim},get crew(){return crew},get visitor(){return visitor},characterMotion,workImages,characterImages,characterSprite,hitCharacter,masks,drawWorkProp,render,step,walk,update,store};';
let browser;
async function pageAt({fail=false}={}){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await context.addInitScript(()=>{window.setInterval=()=>0;localStorage.setItem('bakery_web_v1','{"coins":17,"objects":[],"untouched":true}')});
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('http://bakery.test/**',r=>{const n=new URL(r.request().url()).pathname.slice(1)||'index.html';if(fail&&n.endsWith('owner-knead.webp'))return r.abort();const file=path.join(ROOT,n);if(!fs.existsSync(file))return r.fulfill({status:404,body:''});let body=fs.readFileSync(file);if(n==='index.html')body=body.toString().replace('})();',hook+'})();');return r.fulfill({body,contentType:n.endsWith('.html')?'text/html':n.endsWith('.js')?'application/javascript':n.endsWith('.css')?'text/css':n.endsWith('.json')?'application/json':'image/webp'})});
 await p.goto('http://bakery.test/?demo=motion');await p.waitForFunction(fail=>Object.keys(__motion.characterImages).length===2&&Object.values(__motion.workImages).reduce((n,x)=>n+Object.keys(x).length,0)===(fail?7:8),fail);
 return{context,p,errors};
}
async function main(){
 const a={id:'owner',x:0,y:0,dir:0,frame:0,job:null},ctrl=Motion.create();ctrl.update([a]);a.job={type:'stock',stage:'travel',carry:3};a.next={x:1,y:0};a.x=.2;ctrl.update([a]);const before=JSON.stringify(a),first=ctrl.get(a);a.x=.4;ctrl.update([a]);a.x=.6;ctrl.update([a]);assert.notEqual(ctrl.get(a).frame,first.frame);assert.equal(JSON.stringify({...a,x:.2}),before);a.next=null;ctrl.update([a]);assert.equal(ctrl.get(a).kind,'carry');assert.equal(ctrl.get(a).frame,0);assert.equal(ctrl.get(a).prop,'bread');
 a.job={type:'produce',stage:'travel',raw:true,doughReady:false};assert.notEqual(Motion.describe(a).kind,'carry');a.job.doughReady=true;assert.equal(Motion.describe(a).prop,'dough');a.job=null;assert.equal(Motion.describe(a).kind,'idle');
 const geometry=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/characters/actions/geometry.json')));let cells=0;
 for(const id of ['owner','noah'])for(const [kind,art]of Object.entries(geometry.characters[id])){
  const m=await sharp(path.join(ROOT,art.file)).metadata();assert.deepEqual([m.width,m.height,m.hasAlpha],[art.columns*256,1024,true]);
  for(let d=0;d<4;d++)for(let f=0;f<art.columns;f++){
   const {data}=await sharp(path.join(ROOT,art.file)).extract({left:f*256,top:d*256,width:256,height:256}).ensureAlpha().raw().toBuffer({resolveWithObject:true});let visible=0;
   for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(data[(y*256+x)*4+3]>128){visible++;assert(x>3&&x<252&&y>3&&y<252,id+' '+kind+' clipped');}assert(visible>2000);cells++;
  }
 }
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const run=await pageAt();
 const result=await run.p.evaluate(()=>{
  const t=__motion,seen={owner:new Set(),noah:new Set()},jobs=new Set(),frames=new Set();
  for(let tick=0;tick<440;tick++){
   if(tick===220){t.crew.setRole('owner','hall');t.crew.setRole('noah','kitchen')}
   t.step();
   for(let f=0;f<5;f++){
    t.walk();
    for(const a of t.crew.staff){const sp=t.characterSprite(a);if(!sp)throw Error('Missing sprite');
     const pose=sp.pose;seen[a.id].add(pose.kind);frames.add(a.id+':'+pose.kind+':'+sp.frame);if(a.job)jobs.add(a.job.type+':'+a.job.stage);
     if(['knead','carry','reach','checkout'].includes(pose.kind)&&!sp.workArt)throw Error('Unexpected art fallback');
     if(sp.workArt&&sp.frame>=sp.workArt.columns)throw Error('Wrong atlas column');
     if(a.job&&a.job.stage!=='travel'&&pose.kind==='walk')throw Error('Walking at workstation');
     if(pose.kind==='carry'&&pose.prop==='bread'&&!(a.job.type==='stock'&&a.job.carry>0))throw Error('Phantom bread');
     if(pose.kind==='carry'&&pose.prop==='dough'&&!(a.job.raw&&a.job.doughReady))throw Error('Dough carried before kneading');
    }
   }
  }
  const before=JSON.stringify({staff:t.crew.save(),sim:t.sim,coins:t.state.coins});for(let i=0;i<100;i++){for(const a of t.crew.staff)t.characterSprite(a);t.render()}if(before!==JSON.stringify({staff:t.crew.save(),sim:t.sim,coins:t.state.coins}))throw Error('Visuals changed game state');
  return{seen:Object.fromEntries(Object.entries(seen).map(([id,s])=>[id,[...s]])),frames:[...frames],jobs:[...jobs],sold:t.sim.sold,saved:localStorage.getItem('bakery_web_v1'),cash:t.state.coins,expected:t.sim.openingCoins+t.sim.sales-t.sim.materialCosts-t.sim.equipmentCosts+t.sim.equipmentRefunds};
 });
 for(const id of ['owner','noah'])for(const kind of ['knead','carry','reach','checkout']){assert(result.seen[id].includes(kind),id+' never '+kind);assert(result.frames.includes(id+':'+kind+':0')||kind==='carry');assert(result.frames.includes(id+':'+kind+':1'),id+' missing animated '+kind);}
 assert(result.sold>0);assert.equal(result.cash,result.expected);assert.equal(result.saved,'{"coins":17,"objects":[],"untouched":true}');
 const pause=await run.p.evaluate(()=>{const t=__motion;document.querySelector('#openMenu').click();const before=t.crew.staff.map(a=>t.characterSprite(a).frame);for(let i=0;i<10;i++)t.walk();return{before,after:t.crew.staff.map(a=>t.characterSprite(a).frame)}});assert.deepEqual(pause.before,pause.after);await run.p.locator('#closeMenu').click();await run.p.screenshot({path:'/tmp/bakery-work-motions-game.png'});
 const failed=await pageAt({fail:true});await failed.p.evaluate(()=>{const t=__motion,a=t.crew.staff[0];a.job={type:'produce',stage:'knead',raw:true,targetId:4,remaining:4};t.characterMotion.update(t.crew.staff);const sp=t.characterSprite(a);if(sp.workArt||sp.frame!==0)throw Error('Invalid fallback');t.render();a.job={type:'produce',stage:'load',raw:true,doughReady:true,targetId:2};t.state.objects=t.state.objects.filter(o=>o.id!==2);const held=t.characterSprite(a).pose;if(held.kind!=='carry'||held.prop!=='dough'||held.frame!==0)throw Error('Removed workstation lost held dough');a.job=null;if(t.characterSprite(a).pose.prop!==null)throw Error('Stale held item')});assert.deepEqual(failed.errors,[]);assert.deepEqual(run.errors,[]);
 await failed.context.close();await run.context.close();await browser.close();console.log(JSON.stringify({passed:true,cells,seen:result.seen,jobs:result.jobs,sold:result.sold}));
}
main().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1)});
