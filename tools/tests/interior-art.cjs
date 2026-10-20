// Rendering-only regression: materials, doorway cutouts, low walls, fallback and save isolation.
const {execFileSync}=require('child_process');
const fs=require('fs'),path=require('path'),assert=require('assert'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'),OUT=process.env.BAKERY_INTERIOR_ART_OUT||path.join(ROOT,'docs/art/interior-finish/review');
const hook='window.__interiorArt={state,sim,render,store,crew,characterImages,furnitureViews};';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 fs.mkdirSync(OUT,{recursive:true});const checks=[],contexts=[];
 async function page({before=false,fail=false}={}){
  const context=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await context.newPage(),errors=[],loaded=[];contexts.push(context);
  p.on('pageerror',e=>errors.push(e.message));await context.addInitScript(()=>window.setInterval=()=>0);
  await p.route('http://bakery.test/**',r=>{const n=new URL(r.request().url()).pathname.slice(1)||'index.html';if(fail&&n.startsWith('assets/interior/'))return r.fulfill({status:404,body:''});let body=fs.readFileSync(path.join(ROOT,n));if(before&&n==='interior.js')body=execFileSync('git',['show','e23516e:interior.js'],{cwd:ROOT,encoding:'utf8'})+'\nBakeryInterior.whenTexturesReady=fn=>fn();';if(n==='index.html')body=body.toString().replace('})();',hook+'})();');if(n.startsWith('assets/interior/'))loaded.push(n);return r.fulfill({body,contentType:n.endsWith('.html')?'text/html':n.endsWith('.js')?'application/javascript':n.endsWith('.css')?'text/css':n.endsWith('.json')?'application/json':'image/webp'})});
  await p.goto('http://bakery.test/');await p.waitForFunction(()=>Object.keys(__interiorArt.characterImages).length===2&&Object.values(__interiorArt.furnitureViews).flat().filter(Boolean).length===24);await p.evaluate(()=>new Promise(resolve=>BakeryInterior.whenTexturesReady(resolve)));return{p,errors,loaded};
 }
 const after=await page(),old=await page({before:true}),fallback=await page({fail:true});assert.equal(after.loaded.length,60);
 for(const run of [after,old])for(const size of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]){await run.p.setViewportSize(size);await run.p.evaluate(()=>__interiorArt.render());assert(await run.p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await run.p.screenshot({path:path.join(OUT,`shop-${size.width}x${size.height}-${run===old?'before':'after'}.png`)});}checks.push('all 60 packed textures load; 320px, 390px and landscape store comparisons render without overflow');
 const result=await after.p.evaluate(()=>{
  const api=BakeryInterior,t=__interiorArt,doorArt=window.BakeryDoorArt;window.BakeryDoorArt=null;t.store();const saved=localStorage.getItem('bakery_web_v1'),state=JSON.stringify(t.state),canvas=document.createElement('canvas');canvas.width=960;canvas.height=800;const c=canvas.getContext('2d');c.fillStyle='#f6eedb';c.fillRect(0,0,960,800);c.font='16px sans-serif';c.fillStyle='#503b29';let cases=0;
  for(const [i,mat] of ['cream','wood','stone'].entries()){
   c.fillStyle='#503b29';c.fillText(api.floors[mat].name,35+i*320,25);const point=(x,y)=>({x:150+i*320+(x-y)*29,y:55+(x+y)*16});for(let x=0;x<4;x++)for(let y=0;y<4;y++)api.drawFloor(c,point,x,y,mat);
  }
  for(const [i,mat] of ['plaster','wood','brick'].entries())for(const [j,axis] of ['x','y'].entries())for(const [k,low] of [false,true].entries()){
   const ox=i*320+160,oy=300+j*230+k*100,point=(x,y)=>({x:ox+(x-y)*48,y:oy+(x+y)*25});
   for(let x=0;x<3;x++){const w={axis,x:axis==='y'?x:0,y:axis==='x'?x:0,material:mat,type:x===1?'door':'wall'};const a=api.drawWall(c,point,w,48,{low});if(JSON.stringify(a)!==JSON.stringify(api.wallPoints(w,point,48*(w.type==='door'?2.15:low?1.15:2.15))))throw Error('Wall geometry changed');cases++;}
  }
  // Doorway aperture remains transparent for every material, direction and height.
  for(const mat of ['plaster','wood','brick'])for(const axis of ['x','y'])for(const low of [false,true]){
   const z=document.createElement('canvas');z.width=z.height=200;const cx=z.getContext('2d'),h=40*2.15,point=(x,y)=>({x:90+(x-y)*40,y:130+(x+y)*20});api.drawWall(cx,point,{axis,x:0,y:0,type:'door',material:mat},40,{low});
   const a=point(0,0),d=point(axis==='y'?1:0,axis==='x'?1:0),x=Math.round(a.x+(d.x-a.x)*.5),y=Math.round(a.y+(d.y-a.y)*.5-h*.4);if(cx.getImageData(x,y,1,1).data[3]!==0)throw Error('Filled doorway');cases++;
  }
  window.BakeryDoorArt=doorArt;
  if(JSON.stringify(t.state)!==state||localStorage.getItem('bakery_web_v1')!==saved)throw Error('Rendering changed save');
  return{cases,image:canvas.toDataURL('image/png')};
 });fs.writeFileSync(path.join(OUT,'materials.png'),Buffer.from(result.image.split(',')[1],'base64'));checks.push('48 material/direction/height cases retain wall geometry, transparent generic doorway fallback and unchanged save');
 const fb=await fallback.p.evaluate(()=>{const z=document.createElement('canvas');z.width=z.height=150;const c=z.getContext('2d'),pt=(x,y)=>({x:75+(x-y)*30,y:80+(x+y)*15});BakeryInterior.drawFloor(c,pt,0,0,'stone');return c.getImageData(75,90,1,1).data[3]});assert(fb>0);checks.push('missing texture files retain usable painted geometry without JavaScript errors');
 for(const run of [after,old,fallback])assert.deepEqual(run.errors,[]);for(const ctx of contexts)await ctx.close();const report={passed:true,checks,wallCases:result.cases,textureBytes:[...fs.readdirSync(ROOT+'/assets/interior').filter(f=>f.endsWith('.webp')).map(f=>'assets/interior/'+f),...fs.readdirSync(ROOT+'/assets/interior/catalog').filter(f=>f.endsWith('.webp')).map(f=>'assets/interior/catalog/'+f)].reduce((n,f)=>n+fs.statSync(path.join(ROOT,f)).size,0)};fs.writeFileSync(path.join(OUT,'validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
