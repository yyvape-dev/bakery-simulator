/* One-tile staff, saved jobs and inventory transfers. Art scale never affects routing. */
(function(root){'use strict';
function createBakeryCrew(api,saved){
 const roles={kitchen:['collect','produce','supply'],hall:['checkout','stock','supply'],all:['checkout','collect','stock','produce','supply'],supply:['supply'],idle:[]};
 const names={owner:'店主',noah:'ノア'},labels={supply:'仕入れ',produce:'製造',collect:'焼き上がり回収',stock:'陳列',checkout:'会計'};
 const clone=o=>JSON.parse(JSON.stringify(o)),s=()=>api.sim(),world=()=>api.state(),cellOK=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<10&&p.y<10;
 const clamp=(v,d,lo,hi)=>Number.isFinite(v)?Math.min(hi,Math.max(lo,v)):d;
 const staff=['owner','noah'].map((id,i)=>{
  const old=saved?.staff?.find(a=>a.id===id),cell=cellOK(old?.cell)?clone(old.cell):{x:i?6:3,y:7};
  const a={id,name:names[id],role:i?'hall':'kitchen',command:null,cell,x:cell.x,y:cell.y,next:null,dir:0,frame:0,job:null,status:'待機',look:{width:1,height:1,scale:1}};
  if(old){if(Object.hasOwn(roles,old.role))a.role=old.role;if(Object.hasOwn(labels,old.command))a.command=old.command;a.dir=Math.round(clamp(old.dir,0,0,3));
   for(const k of ['width','height','scale'])a.look[k]=clamp(old.look?.[k],1,.7,1.3);
   if(cellOK(old.next)&&Math.abs(old.next.x-cell.x)+Math.abs(old.next.y-cell.y)===1&&Number.isFinite(old.x)&&Number.isFinite(old.y)&&Math.abs((old.x-cell.x)*(old.next.y-cell.y)-(old.y-cell.y)*(old.next.x-cell.x))<.001&&old.x>=Math.min(cell.x,old.next.x)&&old.x<=Math.max(cell.x,old.next.x)&&old.y>=Math.min(cell.y,old.next.y)&&old.y<=Math.max(cell.y,old.next.y)){a.next=clone(old.next);a.x=old.x;a.y=old.y}
   if(old.job&&Object.hasOwn(labels,old.job.type)&&['travel','work','pickup','deliver','knead','load'].includes(old.job.stage))a.job={type:old.job.type,stage:old.job.stage,targetId:Number.isInteger(old.job.targetId)?old.job.targetId:null,remaining:Math.floor(clamp(old.job.remaining,0,0,25)),carry:Math.floor(clamp(old.job.carry,0,0,5)),raw:old.job.raw===true,doughReady:old.job.doughReady===true};
  }
  return a;
 });
 let selected='owner',frames=0;
 function active(){return !api.hidden()&&(s().phase==='prep'||s().phase==='trading'&&s().open)}
 function blocked(a){return staff.filter(b=>b!==a).flatMap(b=>[b.cell,b.next].filter(Boolean))}
 function breadTotal(){return s().stock+s().ready+s().ovenReady+(s().bake?5:0)+staff.reduce((n,a)=>n+(a.job?.carry||0)+(a.job?.raw?5:0),0)+(api.customer().reserved?1:0)}
 function target(a){const j=a.job;if(!j)return null;let type;
  if(j.type==='supply')return{kind:'entry'};
  if(j.type==='produce')type=j.stage==='load'||j.stage==='travel'&&j.doughReady?'oven':'prep';
  if(j.type==='collect')type='oven';
  if(j.type==='stock')type=j.carry?'shelf':'oven';
  if(j.type==='checkout'){const v=api.customer();if(!v.active||v.paid||!v.reserved||!['checkout','waiting'].includes(v.stage))return null;return world().objects.find(o=>o.id===v.registerId&&o.type==='register')||null}
  const existing=world().objects.find(o=>o.id===j.targetId&&o.type===type);
  if(existing&&api.route(existing,a.cell)!==null)return existing;
  let best=null,len=Infinity;for(const o of world().objects.filter(o=>o.type===type)){const p=api.route(o,a.cell);if(p!==null&&p.length<len){best=o;len=p.length}}return best;
 }
 function goals(t,a){if(t.kind==='entry')return[{x:4,y:9},{x:6,y:9}].filter(p=>!api.occupied().has(p.x+','+p.y));let cells=api.interactions(t);if(a.job.type==='checkout'){const v=api.customer();cells=cells.filter(p=>!api.same(p,v.cell)&&!api.same(p,v.next))}return cells}
 function near(t,a){return goals(t,a).some(p=>api.same(p,a.cell))}
 function can(a,type){const sim=s(),v=api.customer();if(staff.some(b=>b!==a&&b.job?.type===type))return false;
  if(type==='supply')return sim.materials<6&&world().coins>=30;
  if(type==='collect')return sim.ovenReady>0&&api.service('oven');
  if(type==='produce')return sim.materials>0&&!sim.bake&&!sim.ovenReady&&breadTotal()+5<=(sim.phase==='prep'?15:20)&&(sim.phase!=='trading'||sim.minute+34<=1080)&&api.service('prep')&&api.service('oven');
  if(type==='stock')return sim.ready>0&&sim.stock<12&&api.service('oven')&&api.service('shelf');
  if(type==='checkout')return v.active&&v.reserved&&!v.paid&&['checkout','waiting'].includes(v.stage)&&api.service('register');
  return false;
 }
 function begin(a,type){a.job={type,stage:'travel',targetId:null,remaining:0,carry:0,raw:false,doughReady:false};a.status=labels[type]+'へ移動';if(a.command===type)a.command=null;api.changed()}
 function dispatch(a){if(a.job)return;
  if(a.command){if(can(a,a.command))return begin(a,a.command);if(a.command==='produce'&&s().materials===0&&can(a,'supply'))return begin(a,'supply');if(a.command==='stock'&&s().ovenReady>0&&can(a,'collect'))return begin(a,'collect');a.status=labels[a.command]+'待ち（材料・設備・対象を確認）';return}
  for(const task of roles[a.role]){if(task==='supply'&&s().materials>=1)continue;if(task==='produce'&&s().ready+s().stock>=12)continue;if(can(a,task))return begin(a,task)}
  a.status=a.role==='idle'?'指示待ち':s().materials===0&&world().coins<30?'材料の仕入れ資金不足':'待機';
 }
 function finish(a){a.job=null;a.next=null;a.status='待機';api.changed()}
 function arrive(a,t){const j=a.job;if(!j)return;
  j.targetId=t.id||null;
  if(j.type==='checkout'&&api.customer().stage!=='waiting'){a.status='お客さんの到着待ち';return}
  j.stage=j.type==='produce'?(j.doughReady?'load':'knead'):j.type==='stock'?(j.carry?'deliver':'pickup'):'work';j.remaining=j.type==='produce'?(j.doughReady?2:4):j.type==='checkout'?3:2;
  if(j.type==='produce'&&!j.raw){if(!s().materials||s().bake||s().ovenReady)return finish(a);s().materials--;j.raw=true}
  a.status=labels[j.type]+'中';api.changed();
 }
 function move(a){if(!active())return;dispatch(a);if(!a.job)return;
  if(!a.next){const t=target(a);if(!t){a.status='設備・対象待ち';return}const busy=api.occupied();if(busy.has(a.cell.x+','+a.cell.y)){relocate(a);return}
   if(near(t,a)){if(a.job.stage==='travel')arrive(a,t);return}
   a.job.stage='travel';a.job.remaining=0;const path=api.path(a.cell,goals(t,a),blocked(a));if(path===null){a.status='通路待ち';return}if(!path.length)return arrive(a,t);a.next=path[0];a.job.targetId=t.id||null;
  }
  if(api.occupied().has(a.next.x+','+a.next.y)||blocked(a).some(p=>api.same(p,a.next))){a.x=a.cell.x;a.y=a.cell.y;a.next=null;a.status='通路待ち';return}
  const dx=a.next.x-a.x,dy=a.next.y-a.y,d=Math.abs(dx)+Math.abs(dy),speed=Math.min(.20,d);a.dir=dx>0?1:dx<0?3:dy>0?0:2;
  if(d>0){a.x+=dx/d*speed;a.y+=dy/d*speed}a.frame=1+(Math.floor(frames/4)%2);
  if(d<=.20001){a.cell=clone(a.next);a.x=a.cell.x;a.y=a.cell.y;a.next=null;api.changed()}
 }
 function tick(){if(!active())return;for(const a of staff){dispatch(a);const j=a.job;if(!j||j.stage==='travel')continue;const t=target(a);if(!t||!near(t,a)){j.stage='travel';j.remaining=0;a.status='設備を再確認';continue}
   if(j.type==='checkout'&&api.customer().stage!=='waiting'){j.stage='travel';continue}
   if(j.remaining>0)j.remaining--;if(j.remaining>0)continue;
   if(j.type==='supply'){if(world().coins<30){finish(a);a.status='仕入れ資金不足';continue}if(s().materials>=6){finish(a);continue}world().coins-=30;s().materialCosts+=30;s().materials++;api.notice(a.name+'が材料を仕入れました（30円／5個分）');finish(a)}
   else if(j.type==='collect'){s().ready+=s().ovenReady;s().ovenReady=0;finish(a)}
   else if(j.type==='produce'){if(j.stage==='knead'){j.doughReady=true;j.stage='travel';j.targetId=null;a.status='オーブンへ運搬';api.changed()}else if(j.stage==='load'){if(s().bake||s().ovenReady){a.status='オーブン待ち';continue}s().bake=25;j.raw=false;finish(a)}}
   else if(j.type==='stock'){if(j.stage==='pickup'){const n=Math.min(5,12-s().stock,s().ready);if(!n){finish(a);continue}s().ready-=n;j.carry=n;j.stage='travel';j.targetId=null;a.status='パンを陳列へ運搬';api.changed()}else if(j.stage==='deliver'){const n=Math.min(j.carry,12-s().stock);s().stock+=n;j.carry-=n;if(j.carry){a.status='棚の空き待ち';api.changed()}else finish(a)}}
   else if(j.type==='checkout'){api.checkout(a,t);finish(a)}
  }
 }
 function relocate(a){const free=api.path(api.entry(),Array.from({length:100},(_,i)=>({x:i%10,y:Math.floor(i/10)})).filter(p=>!api.occupied().has(p.x+','+p.y)&&!blocked(a).some(q=>api.same(p,q))));a.cell=free?.length?clone(free[free.length-1]):{x:5,y:9};a.x=a.cell.x;a.y=a.cell.y;a.next=null;if(a.job)a.job.stage='travel'}
 function cancelAll(){for(const a of staff){if(a.job?.raw)s().materials++;if(a.job?.carry)s().ready+=a.job.carry;a.job=null;a.command=null;a.next=null;a.x=a.cell.x;a.y=a.cell.y;a.status='待機'}api.changed()}
 function command(id,task){const a=staff.find(a=>a.id===id);if(!a||!Object.hasOwn(labels,task))return;a.command=task;a.status=a.job?'現在の仕事後に'+labels[task]:labels[task]+'を優先';api.changed()}
 function setRole(id,role){const a=staff.find(a=>a.id===id);if(!a||!Object.hasOwn(roles,role))return;a.role=role;a.command=null;api.changed()}
 function setLook(id,key,value){const a=staff.find(a=>a.id===id);if(!a||!['width','height','scale'].includes(key))return;a.look[key]=clamp(Number(value),1,.7,1.3);api.changed()}
 function reconcile(){for(const a of staff){if(api.occupied().has(a.cell.x+','+a.cell.y))relocate(a);if(a.next&&api.occupied().has(a.next.x+','+a.next.y)){a.next=null;a.x=a.cell.x;a.y=a.cell.y}if(a.job?.type==='checkout'&&!api.customer().reserved)a.job=null}}
 return{staff,roles,labels,command,setRole,setLook,cancelAll,reconcile,breadTotal,tick,walk(){frames++;for(const a of staff){a.frame=0;move(a);if(a.job&&a.job.stage!=='travel')a.frame=1+(Math.floor(frames/6)%2)}},save(){return{version:1,staff:clone(staff)}},get selected(){return selected},set selected(id){if(names[id])selected=id}};
}
root.createBakeryCrew=createBakeryCrew;
if(typeof module!=='undefined')module.exports=createBakeryCrew;
})(typeof window!=='undefined'?window:globalThis);
