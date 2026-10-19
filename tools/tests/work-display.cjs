// Verify actual canvas calls: one prop pass, shop scale, palm position and depth.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'../..');
const HOOK=`
const displayCalls=[];let drawingProp=false;
const originalProp=drawWorkProp,originalHands=drawContactHands,originalSurface=drawWorkSurface;
drawWorkProp=function(a,sp,position){displayCalls.push({kind:'prop',id:a.id,sp,position});drawingProp=true;try{return originalProp(a,sp,position)}finally{drawingProp=false}};
drawContactHands=function(sp){displayCalls.push({kind:'hands'});return originalHands(sp)};
drawWorkSurface=function(sp){displayCalls.push({kind:'surface'});return originalSurface(sp)};
for(const method of ['scale','translate']){const original=c[method].bind(c);c[method]=function(...args){if(drawingProp)displayCalls.push({kind:method,args});return original(...args)}}
window.__display={state,get crew(){return crew},characterMotion,characterSprite,drawCharacterArt,c,render,workImages,get tx(){return g.tx},displayCalls};
`;
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.setInterval=()=>0});
 await p.route('http://bakery.test/**',r=>{const n=new URL(r.request().url()).pathname.slice(1)||'index.html',f=path.join(ROOT,n);if(!fs.existsSync(f))return r.fulfill({status:404,body:''});let body=fs.readFileSync(f);if(n==='index.html')body=body.toString().replace('})();',HOOK+'})();');return r.fulfill({body,contentType:n.endsWith('.html')?'text/html':n.endsWith('.js')?'application/javascript':n.endsWith('.css')?'text/css':n.endsWith('.json')?'application/json':'image/webp'})});
 await p.goto('http://bakery.test/?demo=motion');await p.waitForFunction(()=>Object.values(__display.workImages).every(x=>Object.keys(x).length===4));
 const result=await p.evaluate(()=>{
  const t=__display,M=BakeryCharacterMotion;let cases=0,behind=0;
  for(const size of [.7,1,1.3])for(const a of t.crew.staff)for(let rot=0;rot<4;rot++)for(const action of ['carry','supply','load','collect','deliver','checkout'])for(let frame=0;frame<2;frame++){
   const type=action==='checkout'?'register':action==='deliver'?'shelf':'oven',o={id:50,type,x:4,y:4,rot};t.state.objects=[o];
   for(const other of t.crew.staff){other.job=null;other.x=9;other.y=9;other.next=null}
   a.look={width:size,height:size,scale:size};[a.x,a.y]=[[4,6],[6,4],[4,3],[3,4]][rot];a.cell={x:a.x,y:a.y};a.dir=rot;a.job=null;t.characterMotion.update([a],0);
   a.job=action==='carry'?{type:'stock',stage:'travel',carry:3}:action==='supply'?{type:'supply',stage:'work'}:action==='load'?{type:'produce',stage:'load',raw:true,doughReady:true,targetId:50}:action==='collect'?{type:'collect',stage:'work',targetId:50}:action==='deliver'?{type:'stock',stage:'deliver',carry:3,targetId:50}:{type:'checkout',stage:'work',targetId:50};
   t.characterMotion.update([a],0);if(frame)t.characterMotion.update([a],225);
   const before=JSON.stringify({staff:t.crew.save(),objects:t.state.objects});t.displayCalls.length=0;t.render();
   if(before!==JSON.stringify({staff:t.crew.save(),objects:t.state.objects}))throw Error('Drawing changed state');
   const props=t.displayCalls.filter(x=>x.kind==='prop'&&x.id===a.id);if(props.length!==1)throw Error('Prop drawn '+props.length+' times');
   const scales=t.displayCalls.filter(x=>x.kind==='scale');
   if(action==='checkout'&&!frame){if(scales.length)throw Error('Coin on A')}else{
    if(scales.length!==1||scales[0].args.some(x=>Math.abs(x-t.tx/43.09983825683594)>1e-9))throw Error('Goods change scale');
    const call=props[0],sp=call.sp,anchor=sp.contact?.hand||M.propAnchor(a,sp.pose)||sp.workArt.propAnchors[sp.dir][sp.frame];
    const at=call.position||{x:sp.x+(anchor[0]+M.contactShift(anchor[1],sp.contact))*sp.w/256,y:sp.y+M.contactY(anchor[1],sp.contact)*sp.h/256};
    const translate=t.displayCalls.find(x=>x.kind==='translate');if(Math.abs(translate.args[0]-at.x)>1e-9||Math.abs(translate.args[1]-at.y)>1e-9)throw Error('Prop detached from palm');
   }
   if(t.displayCalls.some(x=>x.kind==='hands')){const order=t.displayCalls.map(x=>x.kind);if(order.indexOf('prop')<order.indexOf('hands')||order.indexOf('hands')<order.indexOf('surface'))throw Error('Prop hidden below work surface');behind++}
   cases++;
  }
  if(!behind)throw Error('No behind-counter cases');
  // Identity deformation must render exactly like one full source cell. This
  // catches transparent seams introduced by independently filtered source strips.
  t.c.canvas.width=1024;t.c.canvas.height=1024;let seamCases=0;
  for(const id of ['owner','noah'])for(const kind of ['knead','reach','checkout'])for(let dir=0;dir<4;dir++)for(let frame=0;frame<2;frame++)for(const dpr of [1,2]){
   const c=t.c,im=t.workImages[id][kind],sp={im,x:30.25,y:40.4,w:220*.7,h:220*1.3,dir,frame,contact:null};
   c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,c.canvas.width,c.canvas.height);t.drawCharacterArt(sp);
   const reference=c.getImageData(0,0,c.canvas.width,c.canvas.height).data;
   sp.contact={top:dir<2?151:125,hand:[128,dir<2?168:145],bottom:184,dx:0,dy:0};
   c.clearRect(0,0,c.canvas.width,c.canvas.height);t.drawCharacterArt(sp);const actual=c.getImageData(0,0,c.canvas.width,c.canvas.height).data;
   for(let i=0;i<reference.length;i++)if(reference[i]!==actual[i])throw Error('Identity warp has a raster seam '+id+' '+kind+' '+dir+' '+frame+' DPR '+dpr);
   seamCases++;
  }
  // An opaque source must stay opaque inside every deformed band. Unlike
  // identity alone, this detects the partially covered pixels at stretched joins.
  const solid=document.createElement('canvas');solid.width=solid.height=256;const ink=solid.getContext('2d');ink.fillStyle='#425262';ink.fillRect(0,0,256,256);let opaqueCases=0;
  for(const zoom of [.65,1,1.55])for(const dpr of [1,2])for(const dx of [-18,0,18])for(const dy of [-8,0,8]){
   const c=t.c,fit={top:125,hand:[128,145],bottom:184,dx,dy},sp={im:solid,x:45.25,y:42.4,w:200*zoom,h:220*zoom,dir:0,frame:0,contact:fit};
   c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,c.canvas.width,c.canvas.height);t.drawCharacterArt(sp);
   const top=Math.ceil((sp.y+fit.top*sp.h/256)*dpr)+1,bottom=Math.floor((sp.y+fit.bottom*sp.h/256)*dpr)-1;
   const data=c.getImageData(Math.round((sp.x+sp.w/2)*dpr),top,1,bottom-top).data;
   for(let i=3;i<data.length;i+=4)if(data[i]!==255)throw Error('Transparent seam inside opaque warped cell '+JSON.stringify({zoom,dpr,dx,dy,alpha:data[i]}));
   opaqueCases++;
  }
  return{passed:true,cases,behind,seamCases,opaqueCases};
 });assert.deepEqual(errors,[]);console.log(JSON.stringify(result));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
