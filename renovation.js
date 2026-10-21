/* A reversible working copy. Only commit changes the wallet and finance ledger. */
(function(root){'use strict';
const copy=v=>JSON.parse(JSON.stringify(v)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
root.createBakeryRenovation=function(api){
 let base=null,history=[],cursor=0,muted=false,comparing=false,saveWarning=false;
 const key=api.demo?'bakery_renovation_demo':'bakery_renovation_v1';
 const snapshot=()=>copy({room:api.state().room,objects:api.state().objects,actors:api.actors()});
 function apply(s){api.state().room=copy(s.room);api.state().objects=copy(s.objects);api.restoreActors(copy(s.actors));api.refreshEntry();api.state().selection=null}
 function geometry(s){return JSON.stringify({room:s.room,objects:s.objects})}
 function removeSaved(){if(api.demo)return;try{localStorage.removeItem(key)}catch{}}
 function persist(){if(!base||api.demo)return true;try{localStorage.setItem(key,JSON.stringify({version:1,base:geometry(base),room:api.state().room,objects:api.state().objects}));saveWarning=false;return true}catch{if(!saveWarning){saveWarning=true;api.notice('改装案を保存できません。画面を閉じる前に施工するか、変更を破棄してください')}return false}}
 function begin(){if(base)return;const s=api.state();base=snapshot();base.staff=copy(api.staffSave());base.customer=copy(api.customer());history=[snapshot()];cursor=0;
  if(!api.demo)try{const saved=JSON.parse(localStorage.getItem(key));if(saved?.version===1&&saved.base===geometry(base)&&api.validSaved(saved,base)){
   s.room=copy(saved.room);s.objects=copy(saved.objects);api.shift(0,s.room.height-base.room.height);api.refreshEntry();history.push(snapshot());cursor=1;api.notice('保存していた改装案を開きました。まだ支払いはありません');
  }else if(saved){removeSaved();api.notice('店舗が変わったため、新しい改装案を始めます');}}catch{}
 }
 function record(){if(!base||muted)return;if(!same(history[cursor],snapshot())){history=history.slice(0,cursor+1);history.push(snapshot());if(history.length>101)history.splice(1,1);cursor=history.length-1;persist()}}
 function travel(delta){if(!base||cursor+delta<0||cursor+delta>=history.length)return;api.cancel();cursor+=delta;apply(history[cursor]);persist();api.update()}
 function baseline(){const b=copy(base),dy=api.state().room.height-base.room.height,dw=api.state().room.width-base.room.width;
  b.room.floors=Object.fromEntries(Object.entries(base.room.floors).map(([k,v])=>{const [x,y]=k.split(',').map(Number);return[x+','+(y+dy),v]}));
  b.room.walls=base.room.walls.map(w=>({...w,x:w.axis==='x'&&w.x===base.room.width?w.x+dw:w.x,y:w.axis==='y'&&w.y===0?0:w.y+dy}));
  b.objects=base.objects.map(o=>({...o,y:o.y+dy}));return b;
 }
 function quote(){const q={floor:0,wall:0,equipment:0,expansion:0,refund:0,floors:0,walls:0,added:0,removed:0,moved:0,cost:0,payment:0,error:'',changed:false};if(!base)return q;
  const s=api.state(),b=baseline(),wallKey=BakeryInterior.key,oldWalls=new Map(b.room.walls.map(w=>[wallKey(w),w])),newWalls=new Map(s.room.walls.map(w=>[wallKey(w),w]));
  for(let x=0;x<s.room.width;x++)for(let y=0;y<s.room.height;y++){const k=x+','+y,m=s.room.floors[k]||'cream';if(m!==(b.room.floors[k]||'cream')){q.floor+=BakeryInterior.floors[m].cost;q.floors++}}
  for(const [k,w] of newWalls){const old=oldWalls.get(k);if(!old||old.type!==w.type||old.material!==w.material){q.wall+=BakeryInterior.materials[w.material].cost;q.walls++}}
  for(const [k,w] of oldWalls)if(!newWalls.has(k)){q.refund+=Math.floor(BakeryInterior.materials[w.material].cost/2);q.walls++}
  const oldObjects=new Map(b.objects.map(o=>[o.id,o])),newObjects=new Map(s.objects.map(o=>[o.id,o]));
  for(const o of s.objects){const old=oldObjects.get(o.id);if(!old){q.equipment+=api.furniture[o.type][4];q.added++}else if(!same(o,old))q.moved++}
  for(const o of b.objects)if(!newObjects.has(o.id)){q.refund+=Math.floor(api.furniture[o.type][4]/2);q.removed++}
  q.expansion=(s.room.width*s.room.height-base.room.width*base.room.height)*80;q.cost=q.floor+q.wall+q.equipment+q.expansion;q.payment=q.cost-q.refund;q.changed=q.floors+q.walls+q.added+q.removed+q.moved>0||q.expansion>0||s.room.lowWalls!==base.room.lowWalls;
  q.error=api.validate()||(q.expansion&&api.sim().phase!=='prep'?'増築は開店前に行ってください':'');
  if(!q.error&&q.payment>s.coins)q.error='あと'+(q.payment-s.coins).toLocaleString()+'円で施工できます';
  if(!q.error)q.error=api.budget(q,b);return q;
 }
 function finish(keep){if(!base)return true;if(keep&&!persist())return false;api.cancel();const b=base;apply(b);base=null;history=[];comparing=false;if(!keep)removeSaved();api.update();return true}
 function commit(){const q=quote();if(!base||!q.changed||q.error)return q;api.cancel();const s=api.state(),sim=api.sim();s.coins-=q.payment;sim.interiorCosts+=q.floor+q.wall;sim.equipmentCosts+=q.equipment;sim.expansionCosts+=q.expansion;sim.equipmentRefunds+=q.refund;base=null;history=[];comparing=false;removeSaved();api.save();api.update();return q}
 function withBefore(draw){if(!base||!comparing)return draw();const current=snapshot(),selection=api.state().selection;muted=true;try{apply(base);return draw()}finally{apply(current);api.state().selection=selection;muted=false}}
 return{clearSaved:removeSaved,begin,record,quote,commit,finish,persist,undo:()=>travel(-1),redo:()=>travel(1),canUndo:()=>cursor>0,canRedo:()=>cursor<history.length-1,active:()=>!!base,original:()=>base,compare:on=>{comparing=on;api.render()},comparing:()=>comparing,withBefore,nextId:()=>Math.max(0,...(base?.objects||[]).map(o=>o.id),...history.flatMap(s=>s.objects.map(o=>o.id)))+1};
};
})(window);
