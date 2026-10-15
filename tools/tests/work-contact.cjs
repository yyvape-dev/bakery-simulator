// Real game projection: rotated benches, both kneading frames and body controls.
const {execFileSync}=require('child_process');
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'../..');
assert.equal(require('../../character-motion.js').prepHeight,JSON.parse(fs.readFileSync(path.join(ROOT,'assets/furniture_geometry.json'))).furniture.prep.workSurfaceHeightTiles);
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 let baseline=false;const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.setInterval=()=>0});
 await page.route('http://bakery.test/**',r=>{const n=new URL(r.request().url()).pathname.slice(1)||'index.html',f=path.join(ROOT,n);if(!fs.existsSync(f))return r.fulfill({status:404,body:''});let body=baseline&&['index.html','character-motion.js','assets/prep_r0.webp','assets/prep_r1.webp','assets/prep_r2.webp','assets/prep_r3.webp'].includes(n)?execFileSync('git',['show','0f17d244bb937f791fe8d8903354a3ff981e2de0:'+n],{cwd:ROOT,maxBuffer:2000000}):fs.readFileSync(f);if(n==='index.html')body=body.toString().replace('})();','window.__contact={state,crew,workImages,characterSprite,hitCharacter,masks,characterMotion,point,render,get g(){return g}};})();');return r.fulfill({body,contentType:n.endsWith('.html')?'text/html':n.endsWith('.js')?'application/javascript':n.endsWith('.css')?'text/css':n.endsWith('.json')?'application/json':'image/webp'})});
 await page.goto('http://bakery.test/?demo=motion');await page.waitForFunction(()=>Object.values(__contact.workImages).every(images=>Object.keys(images).length===4));await page.waitForTimeout(200);
 const report=await page.evaluate(()=>{const t=__contact,Motion=BakeryCharacterMotion,o=t.state.objects.find(o=>o.type==='prep'),cases=[],positions=[[1,3],[0,4],[1,6],[3,4]];t.state.zoom=1.55;t.render();
 for(const a of t.crew.staff)for(let rot=0;rot<4;rot++)for(let dir=0;dir<4;dir++)for(const size of [.7,1,1.3]){
  for(const other of t.crew.staff)if(other!==a){other.x=8;other.y=8;other.job=null}o.rot=rot;[a.x,a.y]=positions[dir];a.next=null;a.look={height:size,width:size,scale:size};a.job={type:'produce',stage:'knead',targetId:o.id};
  for(let frame=0;frame<2;frame++){t.characterMotion.update([a],225);const before=JSON.stringify({a,objects:t.state.objects}),sp=t.characterSprite(a),fit=sp.contact; if(!fit)throw Error('Missing contact');if(sp.dir!==dir)throw Error('Wrong direction');
   if(JSON.stringify({a,objects:t.state.objects})!==before)throw Error('Contact changed state');
   for(const y of [0,fit.top,184,194.692138671875,256])if(Motion.contactY(y,fit)!==y)throw Error('Head/foot moved');
   for(let y=0;y<=256;y+=.5){const dy=Motion.contactY(y,fit);if(Math.abs(Motion.sourceY(dy,fit)-y)>1e-8)throw Error('Hit-test inverse mismatch');if(y&&dy<=Motion.contactY(y-.5,fit))throw Error('Folded sprite');}
   if(size===1&&Math.abs(fit.residual)>2)throw Error('Default hand is off the worktop '+a.id+' '+dir+' '+fit.residual);
   if(size===1){let hit=false;const alpha=t.masks(sp.im).alpha;for(let y=-6;y<=6&&!hit;y++)for(let x=-10;x<=10&&!hit;x++){const px=fit.hand[0]+x,py=fit.hand[1]+y;if(alpha[(sp.dir*256+py)*sp.im.naturalWidth+sp.frame*256+px]<128)continue;const point={x:sp.x+px*sp.w/256,y:sp.y+Motion.contactY(py,fit)*sp.h/256};if(t.hitCharacter(point)===a)hit=true}if(!hit)throw Error('Visible hands cannot select worker');}
   cases.push({id:a.id,rot,dir,size,frame:sp.frame,residual:fit.residual});
  }
 }
 o.rot=0;for(const a of t.crew.staff){a.job=null;a.look={height:1,width:1,scale:1};if(t.characterSprite(a).contact)throw Error('Idle contact');a.job={type:'produce',stage:'travel',targetId:o.id};if(t.characterSprite(a).contact)throw Error('Travel contact');a.job={type:'produce',stage:'knead',targetId:999};if(t.characterSprite(a).contact)throw Error('Removed target contact');}
 return cases;});
 const out=path.join(ROOT,'docs/art/work-motions/contact');fs.mkdirSync(out,{recursive:true});
 for(const version of ['after','before']){
 if(version==='before'){baseline=true;await page.reload();await page.waitForFunction(()=>Object.values(__contact.workImages).every(images=>Object.keys(images).length===4));await page.waitForTimeout(200)}
 for(const id of ['owner','noah'])for(let dir=0;dir<4;dir++){
  await page.evaluate(({id,dir})=>{const t=__contact;t.state.zoom=1.55;for(const a of t.crew.staff){a.job=null;a.x=8;a.y=8}const a=t.crew.staff.find(a=>a.id===id);[a.x,a.y]=[[1,3],[0,4],[1,6],[3,4]][dir];a.job={type:'produce',stage:'knead',targetId:4};t.characterMotion.update(t.crew.staff);t.render()}, {id,dir});
  await page.screenshot({path:path.join(out,`${id}-${dir}-${version}.png`)});
 }}
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({cases:report.length,maxDefaultResidual:Math.max(...report.filter(c=>c.size===1).map(c=>Math.abs(c.residual))),maxLimitedResidual:Math.max(...report.map(c=>Math.abs(c.residual))),results:report},null,2)+'\n');console.log(JSON.stringify({passed:true,cases:report.length,maxDefaultResidual:Math.max(...report.filter(c=>c.size===1).map(c=>Math.abs(c.residual)))}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
