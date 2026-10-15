// Capture the actual Web game at normal timer speed, not an accelerated simulation.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..'),BUILD=path.join(__dirname,'build/work-demo'),DOC=path.join(ROOT,'docs/art/work-motions');
(async()=>{fs.mkdirSync(BUILD,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const context=await browser.newContext({viewport:{width:390,height:844},recordVideo:{dir:BUILD,size:{width:390,height:844}}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('http://bakery.test/**',r=>{const n=new URL(r.request().url()).pathname.slice(1)||'index.html',f=path.join(ROOT,n);if(!fs.existsSync(f))return r.fulfill({status:404,body:''});let body=fs.readFileSync(f);if(n==='index.html')body=body.toString().replace('})();','window.__record={crew,characterSprite};})();');return r.fulfill({body,contentType:n.endsWith('.html')?'text/html':n.endsWith('.js')?'application/javascript':n.endsWith('.css')?'text/css':n.endsWith('.json')?'application/json':'image/webp'})});
 const start=Date.now(),captured=[];await p.goto('http://bakery.test/?demo=motion');
 for(const kind of ['knead','carry','checkout','reach']){
  await p.waitForFunction(kind=>window.__record&&__record.crew.staff.some(a=>__record.characterSprite(a)?.pose.kind===kind),kind,{timeout:30000});
  await p.screenshot({path:path.join(DOC,'game-'+kind+'.png')});captured.push(kind);
 }
 const remaining=30000-(Date.now()-start);if(remaining>0)await p.waitForTimeout(remaining);
 const video=p.video();await context.close();await video.saveAs(path.join(BUILD,'game.webm'));
 if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({captured,video:path.join(BUILD,'game.webm'),normalTimers:true}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
