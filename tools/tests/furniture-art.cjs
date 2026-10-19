// Asset contract: painted surfaces may change; silhouette, anchor and footprint may not.
const sharp=require('sharp'),{chromium}=require('playwright'),{execFileSync}=require('child_process');
const fs=require('fs'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'../..'),BEFORE='bc02309';
const oldFile=n=>execFileSync('git',['show',BEFORE+':'+n],{cwd:ROOT,maxBuffer:4*1024*1024});
const types=['shelf','oven','register','prep','table','plant'];
const hook='window.__finish={state,point,sprite,hitTest,render,masks,furnitureViews,furnitureImages};';
const geometry=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/furniture_geometry.json')));
function bounds(data,w){let l=w,t=w,r=0,b=0;for(let y=0;y<w;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>128){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x+1);b=Math.max(b,y+1)}return[l,t,r,b]}
async function assets(){
 const oldGeometry=JSON.parse(oldFile('assets/furniture_geometry.json'));assert.deepEqual(geometry.geometry,oldGeometry.geometry);
 const result=[];let bytes=0;
 for(const type of types){
  const {finish,...base}=geometry.furniture[type];assert.deepEqual(base,oldGeometry.furniture[type]);assert.equal(finish.revision,'painted-materials-v1');
  assert(fs.readFileSync(path.join(ROOT,'assets/'+type+'.webp')).equals(fs.readFileSync(path.join(ROOT,'assets/'+type+'_r0.webp'))),'Stale loading fallback '+type);
  const buffers=[];
  for(let rot=0;rot<4;rot++){
   const file=`assets/${type}_r${rot}.webp`,current=fs.readFileSync(path.join(ROOT,file));bytes+=current.length;buffers.push(current);
   const meta=await sharp(current).metadata();assert.deepEqual([meta.width,meta.height,meta.hasAlpha],[512,512,true]);
   const a=await sharp(oldFile(file)).ensureAlpha().raw().toBuffer(),b=await sharp(current).ensureAlpha().raw().toBuffer();
   const oldBounds=bounds(a,512),newBounds=bounds(b,512);for(let i=0;i<4;i++)assert(Math.abs(oldBounds[i]-newBounds[i])<=2,'Moved outline '+file);
   assert(newBounds[0]>0&&newBounds[1]>0&&newBounds[2]<512&&newBounds[3]<512,'Clipped '+file);
   let union=0,intersection=0,delta=0;
   for(let i=0;i<a.length;i+=4){const aa=a[i+3]>128,bb=b[i+3]>128;if(aa||bb)union++;if(aa&&bb){intersection++;for(let c=0;c<3;c++)delta+=Math.abs(a[i+c]-b[i+c])}}
   const iou=intersection/union,meanRGBChange=delta/(intersection*3);assert(iou>.985,'Changed silhouette '+file+' '+iou);assert(meanRGBChange>3,'Surface not updated '+file);
   result.push({type,rot,bytes:current.length,iou,meanRGBChange,oldBounds,newBounds});
  }
  for(let i=0;i<4;i++)for(let j=0;j<i;j++)assert(!buffers[i].equals(buffers[j]),type+' reused direction');
 }
 assert(bytes<2*1024*1024,'Furniture runtime art over 2 MiB');return{bytes,cases:result};
}
async function browserChecks(browser,fail){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{window.setInterval=()=>0});
 await p.route('http://bakery.test/**',r=>{
  const n=new URL(r.request().url()).pathname.slice(1)||'index.html';if(fail&&/assets\/\w+_r[0-3]\.webp$/.test(n))return r.abort();
  const file=path.join(ROOT,n);if(!fs.existsSync(file))return r.fulfill({status:404,body:''});let body=fs.readFileSync(file);if(n==='index.html')body=body.toString().replace('})();',hook+'})();');
  return r.fulfill({body,contentType:n.endsWith('.html')?'text/html':n.endsWith('.js')?'application/javascript':n.endsWith('.css')?'text/css':n.endsWith('.json')?'application/json':'image/webp'});
 });
 await p.goto('http://bakery.test/?demo=motion');await p.waitForFunction(fail=>Object.keys(__finish.furnitureImages).length===6&&(fail||Object.values(__finish.furnitureViews).flat().filter(Boolean).length===24),fail);
 const cases=await p.evaluate(({types,fail,geometry})=>{
  const t=__finish,rows=[];for(const type of types)for(let rot=0;rot<4;rot++){
   const o={id:50,type,x:4,y:4,rot};t.state.objects=[o];const before=JSON.stringify(t.state);t.render();if(JSON.stringify(t.state)!==before)throw Error('Rendering changed save state');const sp=t.sprite(o),k=geometry.geometry,p=t.point(4+geometry.furniture[type].tileFootprint[rot%2?1:0]/2,4+geometry.furniture[type].tileFootprint[rot%2?0:1]/2),scale=sp.w/512;
   if(sp.mirror||Math.abs(sp.x+k.anchorPixels[0]*scale-p.x)>1e-8||Math.abs(sp.y+k.anchorPixels[1]*scale-p.y)>1e-8)throw Error('Wrong fallback/rotation anchor');
   const suffix=fail?'/'+type+'.webp':'/'+type+'_r'+rot+'.webp';if(!sp.im.src.endsWith(suffix))throw Error('Wrong image '+sp.im.src);
   const alpha=t.masks(sp.im).alpha;let picked=false;
   for(let y=0;y<512&&!picked;y+=7)for(let x=0;x<512&&!picked;x+=7)if(alpha[y*512+x]>200){const q={x:sp.x+(x+.5)*scale,y:sp.y+(y+.5)*scale};if(t.hitTest(q)?.id===50)picked=true}
   if(!picked||t.hitTest({x:sp.x+1,y:sp.y+1})?.id===50)throw Error('Fallback/rotation alpha picking failed');
   rows.push({type,rot,fallback:fail});
  }return rows;
 },{types,fail,geometry});
 assert.deepEqual(errors,[]);await context.close();return cases.length;
}
(async()=>{const art=await assets(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const normal=await browserChecks(browser,false),fallback=await browserChecks(browser,true),report={passed:true,baseline:BEFORE,bytes:art.bytes,minSilhouetteIoU:Math.min(...art.cases.map(x=>x.iou)),normal,fallback,cases:art.cases};
 const out=path.join(ROOT,'docs/art/furniture-finish/validation.json');fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,cases:art.cases.length}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
