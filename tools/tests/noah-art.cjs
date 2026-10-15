const {chromium}=require('playwright'),sharp=require('sharp'),assert=require('assert'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..'),CHARACTER=process.argv.includes('--owner-study')?'owner':'noah',OUT=path.join(ROOT,'docs/art/'+CHARACTER+'-study');
const hook='window.__noah={get crew(){return crew},state,render,point,characterImages,characterSprite,hitCharacter,masks,hitTest,store,walk};';
let browser;
async function main(){
 const file=path.join(OUT,CHARACTER+'.webp'),meta=await sharp(file).metadata();
 assert.deepEqual([meta.width,meta.height,meta.hasAlpha],[768,1024,true]);
 const cells=[];
 for(let d=0;d<4;d++)for(let f=0;f<3;f++){
  const {data}=await sharp(file).extract({left:f*256,top:d*256,width:256,height:256}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let visible=0;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(data[(y*256+x)*4+3]>128){visible++;assert(x>4&&x<251&&y>4&&y<251,'clipped cell');}
  assert(visible>2000);cells.push(data);
 }
 assert.equal(new Set(cells.map(x=>require('crypto').createHash('sha256').update(x).digest('hex'))).size,12,'duplicated poses');
 browser=await chromium.launch({executablePath:process.env.BAKERY_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 const records=[];
 for(const [width,height] of [[320,568],[390,844],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>{
   window.setInterval=()=>0;
   if(!sessionStorage.getItem('noah-fixture')){
    localStorage.setItem('bakery_web_v1',JSON.stringify({coins:3270,objects:[{id:1,type:'shelf',x:1,y:1,rot:0},{id:2,type:'oven',x:5,y:1,rot:0},{id:3,type:'register',x:7,y:2,rot:0},{id:4,type:'prep',x:1,y:4,rot:0}],type:'shelf',rot:0,zoom:1}));
    sessionStorage.setItem('noah-fixture','1');
   }
  });
  await page.route('http://bakery.test/**',route=>{
   const name=new URL(route.request().url()).pathname.slice(1)||'index.html',p=path.join(ROOT,name);
   if(!fs.existsSync(p))return route.fulfill({status:404,body:''});
   let body=fs.readFileSync(p);if(name==='index.html')body=body.toString().replace('})();',hook+'})();');
   return route.fulfill({body,contentType:name.endsWith('.html')?'text/html':name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':'image/webp'});
  });
  await page.goto('http://bakery.test/?noah=study'+(CHARACTER==='owner'?'&owner=study':''));
  await page.waitForFunction(()=>__noah.characterImages.noah&&__noah.characterImages.owner);
  const record=await page.evaluate(id=>{
   const t=__noah,a=t.crew.staff.find(a=>a.id===id),original={x:a.x,y:a.y,cell:{...a.cell}},samples=[];
   t.state.mode='idle';
   for(let dir=0;dir<4;dir++)for(let frame=0;frame<3;frame++)for(const size of [.7,1,1.3]){
    a.dir=dir;a.frame=frame;a.look={width:size,height:size,scale:size};t.render();
    const sp=t.characterSprite(a),p=t.point(a.x+.5,a.y+.5);
    if(Math.abs(sp.x+sp.w*128.00010681152344/256-p.x)>1e-7||Math.abs(sp.y+sp.h*194.692138671875/256-p.y)>1e-7)throw Error('Anchor shifted');
    const alpha=t.masks(sp.im).alpha;let clicked=false;
    for(let y=90;y<200&&!clicked;y+=2)for(let x=80;x<175;x+=2)if(alpha[(dir*256+y)*768+frame*256+x]>200){
     const q={x:sp.x+(x+.5)*sp.w/256,y:sp.y+(y+.5)*sp.h/256};if(t.hitCharacter(q)?.id===id){clicked=true;break;}
    }
    if(!clicked)throw Error('Cannot select pose '+dir+','+frame+','+size);
    samples.push({dir,frame,size});
   }
   if(JSON.stringify(original)!==JSON.stringify({x:a.x,y:a.y,cell:{...a.cell}}))throw Error('Sizing changed position');
   a.look={width:1,height:1,scale:1};a.dir=0;a.frame=0;t.render();t.store();
   return {src:t.characterImages[id].src,other:t.characterImages[id==='owner'?'noah':'owner'].src,save:JSON.parse(localStorage.getItem('bakery_web_v1')),samples:samples.length};
  },CHARACTER);
  assert(record.src.endsWith('/docs/art/'+CHARACTER+'-study/'+CHARACTER+'.webp'));assert(record.other.endsWith(CHARACTER==='owner'?'/docs/art/noah-study/noah.webp':'/assets/characters/owner.webp'));assert.equal(record.save.saveVersion,7);
  await page.screenshot({path:path.join(OUT,`web-${width}x${height}.png`)});
  await page.goto('http://bakery.test/'+(CHARACTER==='owner'?'?noah=study':''));await page.waitForFunction(()=>__noah.characterImages.owner&&__noah.characterImages.noah);
  assert((await page.evaluate(id=>__noah.characterImages[id].src,CHARACTER)).endsWith('/assets/characters/'+CHARACTER+'.webp'));
  assert.equal(await page.evaluate(()=>__noah.state.coins),record.save.coins);
  assert.deepEqual(await page.evaluate(id=>__noah.crew.staff.find(x=>x.id===id).look,CHARACTER),{width:1,height:1,scale:1});
  assert.deepEqual(errors,[]);records.push({width,height,poseAndSizeChecks:record.samples});await context.close();
 }
 console.log(JSON.stringify({passed:true,cells:12,records,notes:'Visual gait and identity quality require inspection; unique pixels do not prove opposite leg phases.'}));
 await browser.close();
}
main().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1)});
