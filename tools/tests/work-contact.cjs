// Real game projection, rendering and picking of hands on every side of the prep bench.
const {execFileSync}=require('child_process');
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'../..'),BEFORE='255432a79fc31f3374b757e0aa47f65e7aad2294';
assert.equal(require('../../character-motion.js').prepHeight,JSON.parse(fs.readFileSync(path.join(ROOT,'assets/furniture_geometry.json'))).furniture.prep.workSurfaceHeightTiles);
const OUT=path.join(ROOT,'docs/art/work-motions/contact-planar');
const HOOK='window.__contact={state,crew,workImages,furnitureViews,characterSprite,hitCharacter,masks,characterMotion,point,render,get g(){return g}};';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  let baseline=false;const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{window.setInterval=()=>0});
  await page.route('http://bakery.test/**',r=>{
   const n=new URL(r.request().url()).pathname.slice(1)||'index.html',f=path.join(ROOT,n);if(!fs.existsSync(f))return r.fulfill({status:404,body:''});
   let body=baseline&&['index.html','character-motion.js','assets/prep_r0.webp','assets/prep_r1.webp','assets/prep_r2.webp','assets/prep_r3.webp'].includes(n)?execFileSync('git',['show',BEFORE+':'+n],{cwd:ROOT,maxBuffer:2000000}):fs.readFileSync(f);
   if(n==='index.html')body=body.toString().replace('})();',HOOK+'})();');
   return r.fulfill({body,contentType:n.endsWith('.html')?'text/html':n.endsWith('.js')?'application/javascript':n.endsWith('.css')?'text/css':n.endsWith('.json')?'application/json':'image/webp'});
  });
  const ready=()=>page.waitForFunction(()=>Object.values(__contact.workImages).every(images=>Object.keys(images).length===4)&&Object.values(__contact.furnitureViews).every(images=>images.filter(Boolean).length===4));
  await page.goto('http://bakery.test/?demo=motion');await ready();
  const results=[];
  for(const viewport of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
   await page.setViewportSize(viewport);
   for(const zoom of [.65,1,1.55]){
    const group=await page.evaluate(zoom=>{
     const t=__contact,M=BakeryCharacterMotion,o=t.state.objects.find(o=>o.type==='prep'),results=[];
     const positions=[[1,3],[2,3],[0,4],[0,5],[1,6],[2,6],[3,4],[3,5]];
     const looks=[{name:'small',height:.7,width:.7,scale:.7},{name:'default',height:1,width:1,scale:1},{name:'large',height:1.3,width:1.3,scale:1.3},{name:'short-wide',height:.7,width:1.3,scale:1},{name:'tall-thin',height:1.3,width:.7,scale:1}];
     t.state.zoom=zoom;t.render();
     for(const a of t.crew.staff)for(let rot=0;rot<4;rot++)for(let station=0;station<8;station++)for(const look of looks){
      for(const other of t.crew.staff)if(other!==a){other.x=8;other.y=8;other.job=null}
      o.rot=rot;[a.x,a.y]=positions[station];a.next=null;a.look={height:look.height,width:look.width,scale:look.scale};
      a.job=null;t.characterMotion.update([a],0);a.job={type:'produce',stage:'knead',targetId:o.id};
      for(let frame=0;frame<2;frame++){
       t.characterMotion.update([a],frame?225:0);const before=JSON.stringify({a,objects:t.state.objects}),sp=t.characterSprite(a),fit=sp.contact;
       if(!fit||sp.dir!==Math.floor(station/2)||sp.frame!==frame)throw Error('Missing/wrong contact pose');
       if(JSON.stringify({a,objects:t.state.objects})!==before)throw Error('Contact changed state');
       for(const y of [0,fit.top,184,194.692138671875,256])if(M.contactY(y,fit)!==y||M.contactShift(y,fit)!==0)throw Error('Head/foot moved');
       for(let y=0;y<=256;y+=2){
        const dy=M.contactY(y,fit),shift=M.contactShift(y,fit),source=M.sourceY(dy,fit);
        if(Math.abs(source-y)>1e-8||Math.abs((128+shift)-M.contactShift(source,fit)-128)>1e-8)throw Error('Hit-test inverse mismatch');
        if(y&&dy<=M.contactY(y-2,fit))throw Error('Folded sprite');
       }
       if(look.name==='default'&&(Math.abs(fit.residual)>2||Math.abs(fit.residualX)>1e-8))throw Error('Default hands off board '+a.id+' '+station+' '+fit.residual+' '+fit.residualX);
       // The board's four floor-space corners remain on the top, clear of central tools.
       for(const dx of [-.14,.14])for(const dy of [-.14,.14]){
        const x=fit.world.x+dx,y=fit.world.y+dy;if(x<=o.x||x>=o.x+2||y<=o.y||y>=o.y+2)throw Error('Board hangs off bench');
        if(Math.abs(x-(o.x+1))<.44&&Math.abs(y-(o.y+1))<.44)throw Error('Board intersects tool area');
       }
       if(look.name==='default'){
        let hit=false;const alpha=t.masks(sp.im).alpha;
        for(let y=-6;y<=6&&!hit;y++)for(let x=-10;x<=10&&!hit;x++){
         const px=fit.hand[0]+x,py=fit.hand[1]+y;if(alpha[(sp.dir*256+py)*sp.im.naturalWidth+sp.frame*256+px]<128)continue;
         const p={x:sp.x+(px+M.contactShift(py,fit))*sp.w/256,y:sp.y+M.contactY(py,fit)*sp.h/256};
         if(t.hitCharacter(p)===a)hit=true;
        }
        if(!hit)throw Error('Visible hands cannot select worker');
       }
       results.push({id:a.id,rot,station,look:look.name,frame,residual:fit.residual,residualX:fit.residualX});
      }
     }
     o.rot=0;for(const a of t.crew.staff){
      a.look={height:1,width:1,scale:1};
      for(const job of [null,{type:'produce',stage:'travel',targetId:o.id},{type:'produce',stage:'knead',targetId:999}]){a.job=job;if(t.characterSprite(a).contact)throw Error('Stale contact')}
      a.x=8;a.y=8;a.job={type:'produce',stage:'knead',targetId:o.id};if(t.characterSprite(a).contact)throw Error('Distant contact');
     }
     return results;
    },zoom);
    results.push(...group.map(row=>({...row,viewport:viewport.width+'x'+viewport.height,zoom})));
   }
  }
  fs.mkdirSync(OUT,{recursive:true});await page.setViewportSize({width:390,height:844});
  for(const version of ['after','before']){
   if(version==='before'){baseline=true;await page.reload();await ready()}
   for(const id of ['owner','noah'])for(let dir=0;dir<4;dir++)for(let frame=0;frame<2;frame++){
    const clip=await page.evaluate(({id,dir,frame})=>{
     const t=__contact;t.state.zoom=1.55;for(const a of t.crew.staff){a.job=null;a.x=8;a.y=8;a.look={height:1,width:1,scale:1}}
     const a=t.crew.staff.find(a=>a.id===id);[a.x,a.y]=[[1,3],[0,4],[1,6],[3,4]][dir];t.characterMotion.update([a],0);a.job={type:'produce',stage:'knead',targetId:4};t.characterMotion.update([a],0);if(frame)t.characterMotion.update([a],225);t.render();
     const rect=document.querySelector('canvas').getBoundingClientRect(),p=t.point(2,5);return{x:Math.max(0,Math.round(rect.x+p.x-110)),y:Math.max(0,Math.round(rect.y+p.y-130)),width:220,height:230};
    },{id,dir,frame});
    await page.screenshot({path:path.join(OUT,`${id}-${dir}-${frame}-${version}.png`),clip});
   }
  }
  assert.deepEqual(errors,[]);
  const max=(rows,key)=>Math.max(...rows.map(r=>Math.abs(r[key]))),defaults=results.filter(r=>r.look==='default');
  const report={cases:results.length,baseline:BEFORE,maxDefaultResidual:max(defaults,'residual'),maxDefaultResidualX:max(defaults,'residualX'),maxLimitedResidual:max(results,'residual'),maxLimitedResidualX:max(results,'residualX'),groups:[]};
  for(const viewport of ['390x844','320x568','844x390'])for(const id of ['owner','noah'])for(const look of ['small','default','large','short-wide','tall-thin']){
   const rows=results.filter(r=>r.viewport===viewport&&r.id===id&&r.look===look);report.groups.push({viewport,id,look,cases:rows.length,maxResidual:max(rows,'residual'),maxResidualX:max(rows,'residualX')});
  }
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,groups:undefined}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
