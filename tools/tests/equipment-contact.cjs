const {chromium}=require('playwright'),{execFileSync}=require('child_process'),fs=require('fs'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'../..'),OUT=path.join(ROOT,'docs/art/work-motions/equipment-contact'),BEFORE='13b18cad8812b51e536b6f727f78362ac7705e82';
const HOOK='window.__equipment={state,get sim(){return sim},get crew(){return crew},characterSprite,hitCharacter,masks,point,dims,characterMotion,workImages,furnitureViews,render,drawWorkProp};';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 let baseline=false;const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{window.setInterval=()=>0});
 await p.route('http://bakery.test/**',r=>{const n=new URL(r.request().url()).pathname.slice(1)||'index.html',f=path.join(ROOT,n);if(!fs.existsSync(f))return r.fulfill({status:404,body:''});let body=baseline&&['index.html','character-motion.js'].includes(n)?execFileSync('git',['show',BEFORE+':'+n],{cwd:ROOT,maxBuffer:2000000}):fs.readFileSync(f);if(n==='index.html')body=body.toString().replace('})();',HOOK+'})();');return r.fulfill({body,contentType:n.endsWith('.html')?'text/html':n.endsWith('.js')?'application/javascript':n.endsWith('.css')?'text/css':n.endsWith('.json')?'application/json':'image/webp'})});
 const ready=()=>p.waitForFunction(()=>Object.values(__equipment.workImages).every(x=>Object.keys(x).length===4)&&Object.values(__equipment.furnitureViews).every(x=>x.filter(Boolean).length===4));await p.goto('http://bakery.test/?demo=motion');await ready();
 const groups=[];
 for(const viewport of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]){await p.setViewportSize(viewport);for(const zoom of [.65,1,1.55]){
  const result=await p.evaluate(zoom=>{
   const t=__equipment,M=BakeryCharacterMotion,summary={cases:0,maxGripX:0,maxGripY:0,minHeight:Infinity,maxHeight:0,frontTools:0,sideTransfers:0,picked:0};
   const fixtures=[{name:'load',type:'oven',job:{type:'produce',stage:'load',raw:true,doughReady:true}},{name:'collect',type:'oven',job:{type:'collect',stage:'work'}},{name:'pickup',type:'oven',job:{type:'stock',stage:'pickup',carry:0}},{name:'deliver',type:'shelf',job:{type:'stock',stage:'deliver',carry:3}},{name:'checkout',type:'register',job:{type:'checkout',stage:'work'}}];
   t.state.zoom=zoom;t.render();
   const original=JSON.parse(JSON.stringify(t.state.objects));
   // Isolate the equipment so other furniture cannot hide the test worker.
   for(const f of fixtures)for(let rot=0;rot<4;rot++){
    const o={id:50,type:f.type,x:4,y:4,rot};t.state.objects=[o];const [w,h]=t.dims(o),stations=[];
    for(let x=o.x;x<o.x+w;x++)stations.push([x,o.y-1],[x,o.y+h]);for(let y=o.y;y<o.y+h;y++)stations.push([o.x-1,y],[o.x+w,y]);
    for(const a of t.crew.staff)for(const [x,y]of stations)for(const height of [.7,1,1.3])for(const width of [.7,1,1.3])for(const scale of [.7,1,1.3]){
     for(const other of t.crew.staff)if(other!==a){other.job=null;other.x=9;other.y=9}
     a.x=x;a.y=y;a.cell={x,y};a.next=null;a.look={height,width,scale};a.job=null;t.characterMotion.update([a],0);a.job={...f.job,targetId:o.id};
     for(let frame=0;frame<2;frame++){
      t.characterMotion.update([a],frame?225:0);const before=JSON.stringify({staff:t.crew.save(),sim:t.sim,objects:t.state.objects,coins:t.state.coins}),sp=t.characterSprite(a),fit=sp.contact;
      if(!fit||fit.kind!==f.type||sp.frame!==frame)throw Error('Missing equipment contact '+f.name);
      if(JSON.stringify({staff:t.crew.save(),sim:t.sim,objects:t.state.objects,coins:t.state.coins})!==before)throw Error('Contact changed simulation');
      if(Math.abs(fit.residual)>1.1||Math.abs(fit.residualX)>1e-8)throw Error('Grip off tray '+JSON.stringify({f:f.name,id:a.id,rot,x,y,height,width,scale,yGap:fit.residual,xGap:fit.residualX}));
      for(const y of [0,fit.top,184,194.692138671875,256])if(M.contactY(y,fit)!==y||M.contactShift(y,fit)!==0)throw Error('Head/foot moved');
      for(let y=0;y<=256;y+=4){const moved=M.contactY(y,fit),back=M.sourceY(moved,fit);if(Math.abs(back-y)>1e-8||Math.abs(M.contactShift(back,fit)-M.contactShift(y,fit))>1e-8)throw Error('Bad pick inverse');if(y&&moved<=M.contactY(y-4,fit))throw Error('Folded art');}
      for(const dx of [-.14,.14])for(const dy of [-.14,.14]){const bx=fit.world.x+dx,by=fit.world.y+dy;if(!(bx>=o.x&&bx<=o.x+w&&by>=o.y&&by<=o.y+h)&&!(bx>=x&&bx<=x+1&&by>=y&&by<=y+1))throw Error('Tray blocks another cell')}
      if(f.type==='oven'){
       if(!!fit.tip!==fit.front)throw Error('Peel through back wall');
       if(fit.tip){if(Math.abs(fit.tip.height-1.085)>1e-8)throw Error('Wrong mouth height');const norm=[[0,1],[1,0],[0,-1],[-1,0]][rot],progress=f.name==='load'?frame:1-frame,offset=.96-.24*progress;if(Math.abs(fit.tip.world.x-(o.x+w/2+norm[0]*offset))>1e-8||Math.abs(fit.tip.world.y-(o.y+h/2+norm[1]*offset))>1e-8)throw Error('Mouth does not rotate');summary.frontTools++}else summary.sideTransfers++;
      }
      // Pixel picking only where the equipment does not occlude the hand.
      if(height===1&&width===1&&scale===1&&(fit.overTop||a.x+a.y+1>o.x+o.y+(w+h)/2)){
       let hit=false;const alpha=t.masks(sp.im).alpha;for(let yy=-5;yy<=5&&!hit;yy++)for(let xx=-8;xx<=8&&!hit;xx++){const px=fit.hand[0]+xx,py=fit.hand[1]+yy;if(alpha[(sp.dir*256+py)*sp.im.naturalWidth+sp.frame*256+px]<128)continue;if(t.hitCharacter({x:sp.x+(px+M.contactShift(py,fit))*sp.w/256,y:sp.y+M.contactY(py,fit)*sp.h/256})===a)hit=true}if(!hit)throw Error('Visible palm cannot select worker');summary.picked++;
      }
      summary.maxGripX=Math.max(summary.maxGripX,Math.abs(fit.residualX));summary.maxGripY=Math.max(summary.maxGripY,Math.abs(fit.residual));summary.minHeight=Math.min(summary.minHeight,fit.height);summary.maxHeight=Math.max(summary.maxHeight,fit.height);summary.cases++;
     }
    }
   }
   // No tools at stale targets, incompatible stages, bare hands or remote stations.
   const a=t.crew.staff[0];a.look={height:1,width:1,scale:1};a.x=3;a.y=4;a.next=null;t.state.objects=[{id:50,type:'shelf',x:4,y:4,rot:0}];
   for(const job of [null,{type:'supply',stage:'work',targetId:50},{type:'stock',stage:'travel',carry:3,targetId:50},{type:'stock',stage:'deliver',carry:0,targetId:50},{type:'stock',stage:'deliver',carry:3,targetId:999}]){a.job=job;if(t.characterSprite(a).contact)throw Error('Stale equipment contact')}
   a.job={type:'stock',stage:'deliver',carry:3,targetId:50};a.x=0;a.y=0;if(t.characterSprite(a).contact)throw Error('Long-distance hand stretch');
   // Restoring fixtures must not turn display helpers into persistent game data.
   t.state.objects=original;for(const a of t.crew.staff){a.job=null;a.look={height:1,width:1,scale:1}}
   return summary;
  },zoom);groups.push({...result,viewport:viewport.width+'x'+viewport.height,zoom});
 }}
 fs.mkdirSync(OUT,{recursive:true});await p.setViewportSize({width:390,height:844});
 // Use actual game screenshots in a labelled browser contact sheet; no generated art.
 for(const version of ['after','before']){
  if(version==='before'){baseline=true;await p.reload();await ready()}
  for(const action of ['load','collect','deliver','checkout']){
   const cells=[];
   for(const id of ['owner','noah'])for(let rot=0;rot<4;rot++)for(let frame=0;frame<2;frame++){
    const clip=await p.evaluate(({action,id,rot,frame})=>{
     const t=__equipment,type=action==='deliver'?'shelf':action==='checkout'?'register':'oven',o={id:50,type,x:4,y:4,rot};t.state.objects=[o];t.state.zoom=1.55;const [w,h]=t.dims(o);for(const a of t.crew.staff){a.job=null;a.x=9;a.y=9;a.look={height:1,width:1,scale:1}}
     const positions=[[4,4+h],[4+w,4],[4,3],[3,4]],a=t.crew.staff.find(a=>a.id===id);[a.x,a.y]=positions[rot];a.next=null;a.cell={x:a.x,y:a.y};t.characterMotion.update([a],0);a.job={...(action==='load'?{type:'produce',stage:'load',raw:true,doughReady:true}:action==='collect'?{type:'collect',stage:'work'}:action==='deliver'?{type:'stock',stage:'deliver',carry:3}:{type:'checkout',stage:'work'}),targetId:50};t.characterMotion.update([a],0);if(frame)t.characterMotion.update([a],225);t.render();
     const p=t.point(4+w/2,4+h/2),r=document.querySelector('canvas').getBoundingClientRect();return{x:Math.max(0,Math.round(r.x+p.x-100)),y:Math.max(0,Math.round(r.y+p.y-140)),width:210,height:235};
    },{action,id,rot,frame});
    const buffer=await p.screenshot({clip});cells.push({label:`${id} / rot ${rot*90}° / ${frame?'B':'A'}`,src:'data:image/png;base64,'+buffer.toString('base64')});
   }
   const sheet=await browser.newPage({viewport:{width:920,height:1100}});await sheet.setContent('<style>body{margin:12px;background:#faf4e8;font:14px sans-serif;color:#473b2f}main{display:grid;grid-template-columns:repeat(4,210px);gap:12px}figure{margin:0}img{display:block;width:210px;height:235px}figcaption{height:22px}</style><h2>'+action+' — '+version+'</h2><main>'+cells.map(x=>'<figure><figcaption>'+x.label+'</figcaption><img src="'+x.src+'"></figure>').join('')+'</main>');await sheet.screenshot({path:path.join(OUT,action+'-'+version+'.png'),fullPage:true});await sheet.close();
  }
 }
 assert.deepEqual(errors,[]);const report={baseline:BEFORE,cases:groups.reduce((n,g)=>n+g.cases,0),maxGripX:Math.max(...groups.map(g=>g.maxGripX)),maxGripY:Math.max(...groups.map(g=>g.maxGripY)),minHeight:Math.min(...groups.map(g=>g.minHeight)),maxHeight:Math.max(...groups.map(g=>g.maxHeight)),groups};fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,groups:undefined,passed:true}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
