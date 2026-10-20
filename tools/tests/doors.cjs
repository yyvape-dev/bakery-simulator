const fs=require('fs'),path=require('path'),assert=require('assert'),sharp=require('sharp'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'),OUT=path.join(ROOT,'docs/art/doors/review');
(async()=>{
 const geometry=require('../../assets/doors/geometry.json');let frames=0;
 for(const list of Object.values(geometry.frames))for(const frame of list){
  const {data,info}=await sharp(path.join(ROOT,frame.file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert(info.width===frame.size[0]&&info.height===frame.size[1]);let empty=0,paint=0;for(let i=3;i<data.length;i+=4){if(data[i]===0)empty++;if(data[i]>200)paint++}assert(empty>info.width*info.height*.3);assert(paint>info.width*info.height*.1);
  // An open passage must remain visible beside the projected open leaf.
  const opening=[.25,.35,.45,.55,.65,.75].filter(u=>{const x=Math.round(frame.a[0]+(frame.b[0]-frame.a[0])*u),y=Math.round(frame.a[1]+(frame.b[1]-frame.a[1])*u-frame.height*.4);return data[(y*info.width+x)*4+3]<20});assert(opening.length>=1,frame.file+' opening');frames++;
 }
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await ctx.addInitScript(()=>window.setInterval=()=>0);
  await p.route('http://bakery.test/**',r=>{const n=new URL(r.request().url()).pathname.slice(1)||'index.html',f=path.join(ROOT,n);if(!fs.existsSync(f))return r.fulfill({status:404,body:''});let body=fs.readFileSync(f);if(n==='index.html')body=body.toString().replace('})();','window.__doors={state,get sim(){return sim},render,step,walk,store,wallHit,point,get g(){return g}};})();');return r.fulfill({body,contentType:n.endsWith('.html')?'text/html':n.endsWith('.js')?'application/javascript':n.endsWith('.css')?'text/css':n.endsWith('.json')?'application/json':'image/webp'})});
  await p.goto('http://bakery.test/');await p.evaluate(()=>Promise.all([new Promise(r=>BakeryDoorArt.ready(r)),new Promise(r=>BakeryExterior.ready(r)),new Promise(r=>BakeryInterior.whenTexturesReady(r))]));fs.mkdirSync(OUT,{recursive:true});
  const before=await p.evaluate(()=>JSON.stringify(__doors.state));
  const registration=await p.evaluate(()=>{const p=(x,y)=>({x:200+(x-y)*32,y:120+(x+y)*17.28}),results=[];
   for(const [style,list]of Object.entries(BakeryDoorGeometry.frames))for(const [dir,frame]of list.entries()){
    let matrix,image;const c={save(){},restore(){},transform(...m){matrix=m},drawImage(im){image=im.src}};
    const w={axis:frame.axis,x:3,y:4};if(!BakeryDoorArt.draw(c,p,w,32,{style,dir,width:1.5,height:3.15}))throw Error('no image');
    const apply=([x,y])=>({x:matrix[0]*x+matrix[2]*y+matrix[4],y:matrix[1]*x+matrix[3]*y+matrix[5]});
    const a=apply(frame.a),b=apply(frame.b),wa=p(3,4),wb=p(3+(frame.axis==='y'?1.5:0),4+(frame.axis==='x'?1.5:0));
    if(Math.hypot(a.x-wa.x,a.y-wa.y)>1e-8||Math.hypot(b.x-wb.x,b.y-wb.y)>1e-8)throw Error('threshold misaligned');if(!image.includes(`${style}-r${dir}.webp`))throw Error('wrong direction');results.push({style,dir,aligned:true});
   }
   const draws=[],draw=BakeryDoorArt.draw;BakeryDoorArt.draw=(c,p,w,tx,options)=>{draws.push({dir:BakeryDoorArt.direction(w),style:options.style,height:options.height});return draw(c,p,w,tx,options)};
   const c=document.createElement('canvas').getContext('2d');for(const wall of [{axis:'y',x:2,y:5},{axis:'x',x:5,y:2},{axis:'y',x:2,y:0},{axis:'x',x:0,y:2}])BakeryInterior.drawWall(c,p,{...wall,type:'door',material:'plaster'},32,{doorStyle:'sage',low:true});BakeryDoorArt.draw=draw;if(draws.map(d=>d.dir).join()!=='0,1,2,3'||draws.some(d=>d.style!=='sage'))throw Error('wall direction/style');return results;
  });
  assert(await p.evaluate(()=>{const t=__doors,walls=t.state.room.walls,low=t.state.room.lowWalls;try{t.state.room.walls=[{axis:'y',x:4,y:4,type:'door',material:'plaster'}];t.state.room.lowWalls=true;t.render();const a=t.point(4.5,4),hit=t.wallHit({x:a.x,y:a.y-t.g.tx*1.8});return hit?.axis==='y'&&hit.x===4&&hit.y===4}finally{t.state.room.walls=walls;t.state.room.lowWalls=low;t.render()}}));
  assert.equal(registration.length,12);assert.equal(await p.evaluate(()=>JSON.stringify(__doors.state)),before);
  for(const style of ['timber','sage','arch']){await p.evaluate(style=>{__doors.state.room.entranceStyle=style;__doors.state.zoom=2;__doors.render()},style);await p.screenshot({path:path.join(OUT,'shop-'+style+'.png')})}
  await p.evaluate(()=>{__doors.store()});await p.reload();await p.evaluate(()=>new Promise(r=>BakeryDoorArt.ready(r)));assert.equal(await p.evaluate(()=>__doors.state.room.entranceStyle),'arch');
  // Both wall axes and rear boundary views in an isolated, large drawing.
  await p.goto('http://bakery.test/docs/art/doors/review/index.html');await p.evaluate(()=>new Promise(r=>BakeryDoorArt.ready(r)));await p.screenshot({path:path.join(OUT,'directions.png'),fullPage:true});
  await p.route('**/assets/doors/sage-r1.webp*',r=>r.abort());await p.goto('http://bakery.test/');await p.evaluate(()=>new Promise(r=>BakeryDoorArt.ready(r)));assert(await p.evaluate(()=>{const c=document.createElement('canvas').getContext('2d'),p=(x,y)=>({x:150+(x-y)*32,y:150+(x+y)*17.28}),w={axis:'x',x:3,y:3,type:'door',material:'plaster'};return BakeryDoorArt.draw(c,p,w,32,{style:'sage',dir:1})===false&&BakeryInterior.drawWall(c,p,w,32,{doorStyle:'sage'}).length===4}));
  assert.deepEqual(errors,[]);const report={passed:true,frames,registration,checks:['12 non-empty alpha sprites and transparent passages','12 registered thresholds exactly match wall endpoints with distinct directional images','both wall axes and rear boundaries select 0/1/2/3 automatically','interior door style follows shop style; drawing does not change state','full-height doorway remains selectable while walls are shown low','three exterior styles render and selected style persists','missing directional image settles readiness and uses the existing open wall fallback']};fs.writeFileSync(path.join(OUT,'validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));await ctx.close();
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exit(1)});
