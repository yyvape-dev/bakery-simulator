const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert');
const {click}=require('./ui-navigation.cjs');
const ROOT=process.env.BAKERY_TEST_ROOT||path.resolve(__dirname,'../..');
const fixture=[{id:1,type:'shelf',x:1,y:1,rot:0},{id:2,type:'oven',x:5,y:1,rot:0},{id:3,type:'register',x:7,y:2,rot:0},{id:4,type:'prep',x:1,y:4,rot:0}];
const hook='window.__startup={state,get sim(){return sim},get crew(){return crew},get visitor(){return visitor},products:productSystem,interior:interiorEngine,characterImages,missingEquipment,operatingReserve,spendingError,furniturePurchaseError,selectCell,removeFurniture,step,walk,store,update};';
let browser;const runs=[];
async function setup(save,url='http://bakery.test/'){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await context.addInitScript(save=>{window.setInterval=()=>0;if(!sessionStorage.getItem('fixture')){if(save)localStorage.setItem('bakery_web_v1',JSON.stringify(save));sessionStorage.setItem('fixture','1')}},save);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('http://bakery.test/**',r=>{const n=new URL(r.request().url()).pathname.slice(1)||'index.html',p=path.join(ROOT,n);if(!fs.existsSync(p))return r.fulfill({status:404,body:''});let body=fs.readFileSync(p);if(n==='index.html')body=body.toString().replace('})();',hook+'})();');return r.fulfill({body,contentType:n.endsWith('.html')?'text/html':n.endsWith('.js')?'application/javascript':n.endsWith('.css')?'text/css':n.endsWith('.json')?'application/json':'image/webp'})});
 await page.goto(url);await page.waitForFunction(()=>window.__startup&&Object.keys(__startup.characterImages).length===2);runs.push({context,page,errors});return page;
}
const buy=(p,type,x,y)=>p.evaluate(({type,x,y})=>{__startup.state.type=type;__startup.selectCell({x,y});return __startup.state.objects.length},{type,x,y});
async function main(){
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const cases=[];
 const fresh=await setup({coins:5000,objects:[]});await click(fresh,'#build');
 assert(await fresh.locator('[data-type=plant]').isDisabled());assert(await fresh.locator('[data-type=table]').isDisabled());assert(await fresh.locator('[data-type=oven]').isEnabled());
 await fresh.setViewportSize({width:320,height:568});assert(await fresh.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await fresh.screenshot({path:'/tmp/bakery-startup-320.png'});
 assert.equal(await buy(fresh,'plant',8,8),0);assert.equal(await buy(fresh,'shelf',1,1),1);assert(await fresh.locator('[data-type=shelf]').isDisabled());assert.equal(await buy(fresh,'shelf',7,4),1);
 assert.equal(await fresh.evaluate(()=>__startup.interior.paint([{x:0,y:0}],'wood').cost),8);assert.equal(await fresh.evaluate(()=>Object.keys(__startup.state.room.floors).length),0);
 assert(await fresh.evaluate(()=>!!__startup.interior.expand('width').error));assert.equal(await fresh.evaluate(()=>__startup.products.develop('milk-choco')),false);
 for(const [type,x,y]of [['oven',5,1],['register',7,2],['prep',1,4]])await buy(fresh,type,x,y);
 assert(await fresh.locator('[data-type=plant]').isEnabled());assert.equal(await fresh.evaluate(()=>__startup.state.coins),3270);cases.push('missing essentials block optional/repeated furniture, interior, expansion and development; each essential unlocks progression');
 const poor=await setup({coins:110,objects:fixture});assert.equal(await buy(poor,'plant',8,8),5);assert.equal(await poor.evaluate(()=>__startup.state.coins),30);
 assert(await poor.evaluate(()=>!!__startup.interior.paint([{x:0,y:0}],'wood').error));assert(await poor.evaluate(()=>!!__startup.interior.walls([{axis:'x',x:0,y:0}],'plaster','wall').error));
 await poor.evaluate(()=>__startup.removeFurniture(__startup.state.objects.find(o=>o.type==='oven')));assert.equal(await poor.evaluate(()=>__startup.state.objects.length),5);
 await poor.evaluate(()=>__startup.removeFurniture(__startup.state.objects.find(o=>o.type==='plant')));assert.equal(await poor.evaluate(()=>__startup.state.coins),70);cases.push('last material budget is protected across purchases and last-essential removal; optional furniture can still be refunded');
 const trial=await setup({coins:260,objects:fixture});assert.equal(await trial.evaluate(()=>__startup.products.develop('milk-choco')),false);assert.equal(await trial.evaluate(()=>__startup.state.coins),260);cases.push('a trial cannot spend the final material budget');
 const legacy=await setup({coins:250,objects:[]});assert.equal(await buy(legacy,'shelf',1,1),1);assert.equal(await legacy.evaluate(()=>__startup.state.coins),0);cases.push('already underfunded saves can still acquire an affordable missing essential');
 const original={coins:0,objects:[{id:9,type:'plant',x:0,y:0,rot:0}],marker:'must survive demo'};
 const demo=await setup(original,'http://bakery.test/?demo=motion'),serialized=JSON.stringify(original);
 assert(await demo.locator('#motionDemoBanner').isVisible());assert(await demo.locator('#save').isDisabled());
 assert.deepEqual(await demo.evaluate(()=>__startup.missingEquipment()),[]);assert(await demo.evaluate(()=>__startup.sim.open));
 assert(await demo.evaluate(()=>Object.entries(__startup.characterImages).every(([id,im])=>im.src.endsWith('/docs/art/'+id+'-study/'+id+'.webp'))));
 const result=await demo.evaluate(()=>{const t=__startup,before=t.crew.staff.map(a=>[a.x,a.y]);for(let i=0;i<220;i++){t.step();for(let f=0;f<5;f++)t.walk()}t.store();return{sold:t.sim.sold,moved:t.crew.staff.some((a,i)=>a.x!==before[i][0]||a.y!==before[i][1]),coins:t.state.coins,expected:t.sim.openingCoins+t.sim.sales-t.sim.materialCosts-t.sim.equipmentCosts+t.sim.equipmentRefunds,saved:localStorage.getItem('bakery_web_v1')}});
 assert(result.sold>0);assert(result.moved);assert.equal(result.coins,result.expected);assert.equal(result.saved,serialized);
 await demo.setViewportSize({width:320,height:568});assert(await demo.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await demo.screenshot({path:'/tmp/bakery-motion-demo.png'});
 await demo.reload();assert.equal(await demo.evaluate(()=>__startup.state.coins),3180);assert.equal(await demo.evaluate(()=>localStorage.getItem('bakery_web_v1')),serialized);
 await demo.locator('#exitMotionDemo').click();await demo.waitForFunction(()=>window.__startup&&!location.search.includes('demo='));assert.equal(await demo.evaluate(()=>__startup.state.coins),0);assert.equal(await demo.evaluate(()=>__startup.state.objects[0].id),9);
 cases.push('motion demo starts equipped and open, moves both new characters through real sales, reloads safely and preserves the normal save byte-for-byte');
 for(const r of runs){assert.deepEqual(r.errors,[]);await r.context.close()}await browser.close();console.log(JSON.stringify({passed:true,cases}));
}
main().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1)});
