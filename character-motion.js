/* Visual state only. Jobs, inventories, positions and save data are never changed here. */
(function(root){'use strict';
const counts={idle:1,walk:2,knead:2,carry:3,reach:2,checkout:2};
function describe(a){
 const j=a.job;
 if(!j)return{kind:'idle',prop:null};
 if(j.stage==='travel'){
  if(j.type==='produce'&&j.raw&&j.doughReady)return{kind:'carry',prop:'dough'};
  if(j.type==='stock'&&j.carry>0)return{kind:'carry',prop:'bread'};
  return{kind:a.next?'walk':'idle',prop:null};
 }
 if(j.type==='produce')return{kind:j.stage==='knead'?'knead':'reach',prop:j.stage==='knead'?null:'dough'};
 if(j.type==='checkout')return{kind:'checkout',prop:null};
 if(j.type==='supply')return{kind:'reach',prop:'box'};
 return{kind:'reach',prop:'bread'};
}
function facing(a,objects,entry){
 if(!a.job||a.job.stage==='travel')return a.dir;
 const target=a.job.type==='supply'?{x:entry.x+.5,y:entry.y+.5}:objects.find(o=>o.id===a.job.targetId);
 if(!target)return a.dir;
 const tx=target.type?target.x+(target.width||1)/2:target.x,ty=target.type?target.y+(target.height||1)/2:target.y;
 const dx=tx-(a.x+.5),dy=ty-(a.y+.5);
 return Math.abs(dx)>Math.abs(dy)?dx>0?1:3:dy>0?0:2;
}
// Measured dough/hand contact in each kneading cell, in the shared 256px atlas.
const prepHeight=.85;
const kneadHands={owner:[[[105,160],[105,160]],[[155,158],[155,158]],[[154,139],[154,139]],[[104,139],[104,139]]],noah:[[[106,173],[106,173]],[[155,172],[155,172]],[[166,146],[166,146]],[[94,145],[94,145]]]};
function contact(a,sp,o,project,tx){
 if(!sp.workArt||sp.pose.kind!=='knead'||!o||o.type!=='prep')return null;
 const ax=a.x+.5,ay=a.y+.5;
 // Work only from an adjacent cell; stale jobs must not stretch across the shop.
 const edgeX=Math.max(o.x,Math.min(o.x+o.width,ax)),edgeY=Math.max(o.y,Math.min(o.y+o.height,ay));
 const inset=.18,x=Math.max(o.x+inset,Math.min(o.x+o.width-inset,ax)),y=Math.max(o.y+inset,Math.min(o.y+o.height-inset,ay));
 if(Math.abs(ax-edgeX)+Math.abs(ay-edgeY)>.501)return null;
 const hand=kneadHands[a.id]?.[sp.dir]?.[sp.frame];if(!hand)return null;
 const surface=project(x,y),sx=sp.w/256,sy=sp.h/256;
 // Height projection from the fixed Blender camera: Z pixels / X-floor pixels.
 surface.y-=prepHeight*tx*Math.sqrt(2)*Math.sqrt(1-.54*.54);
 const top=sp.dir<2?(a.id==='noah'?151:132):(a.id==='noah'?125:115),bottom=184;
 // Keep the head, boots and ground anchor fixed. Limit compression for tiny looks.
 const desired=(surface.y-sp.y)/sy-hand[1],limit=(hand[1]-top)*.45;
 const dy=Math.max(-limit,Math.min((bottom-hand[1])*.45,desired));
 const desiredX=(surface.x-sp.x)/sx-hand[0],dx=Math.max(-18,Math.min(18,desiredX));
 return{hand,top,bottom,dx,dy,surface,targetId:o.id,world:{x,y},residual:(desired-dy)*sy,residualX:(desiredX-dx)*sx};
}
function contactWeight(y,fit){
 if(!fit||y<=fit.top||y>=fit.bottom)return 0;
 return y<=fit.hand[1]?(y-fit.top)/(fit.hand[1]-fit.top):(fit.bottom-y)/(fit.bottom-fit.hand[1]);
}
function contactY(y,fit){return y+(fit?.dy||0)*contactWeight(y,fit)}
function contactShift(y,fit){return(fit?.dx||0)*contactWeight(y,fit)}
function sourceY(y,fit){
 if(!fit)return y;
 const edges=[0,fit.top,fit.hand[1],fit.bottom,256];
 for(let i=1;i<edges.length;i++){const a=edges[i-1],b=edges[i],da=contactY(a,fit),db=contactY(b,fit);if(y<=db)return a+(y-da)*(b-a)/(db-da)}
 return y;
}
function create(){
 const states=new WeakMap();
 function update(staff,dt=75){for(const a of staff){
  const before=states.get(a),distance=before?Math.abs(a.x-before.x)+Math.abs(a.y-before.y):(a.next ? .2 : 0);
  const moved=distance>1e-6&&distance<=.40001;
  const gait=(before?.gait||0)+(moved?distance:0),motion=describe(a);
  if(motion.kind==='walk'&&!moved)motion.kind='idle';
  if(motion.kind==='idle'&&moved)motion.kind='walk';
  const key=motion.kind+':'+(motion.prop||'')+':'+(a.job?.type||'')+':'+(a.job?.stage||'');
  const elapsed=before?.key===key?before.elapsed+dt:0;
  const frame=motion.kind==='walk'?1+Math.floor((gait+1e-8)/.5)%2:motion.kind==='carry'?moved?1+Math.floor((gait+1e-8)/.5)%2:0:motion.kind==='idle'?0:Math.floor(elapsed/225)%counts[motion.kind];
  states.set(a,{...motion,frame,gait,elapsed,key,x:a.x,y:a.y,moved});
 }}
 function get(a,objects=[],entry={x:5,y:9}){
  if(a.job&&a.job.stage!=='travel'&&a.job.type!=='supply'&&!objects.some(o=>o.id===a.job.targetId)){
   const prop=a.job.carry>0?'bread':a.job.raw&&a.job.doughReady?'dough':null;
   return{kind:prop?'carry':'idle',prop,frame:0,dir:a.dir};
  }
  const state=states.get(a),motion=describe(a);
  // Derive jobs immediately after simulation transitions, before the next visual tick.
  const key=motion.kind+':'+(motion.prop||'')+':'+(a.job?.type||'')+':'+(a.job?.stage||'');
  const current=state&&state.key===key?state:{...motion,frame:motion.kind==='walk'?a.frame:motion.kind==='idle'?a.frame:0};
  return{kind:current.kind,prop:current.prop,frame:current.frame,dir:facing(a,objects,entry)};
 }
 return{update,get};
}
const api={describe,facing,create,counts,prepHeight,contact,contactY,contactShift,sourceY};root.BakeryCharacterMotion=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
