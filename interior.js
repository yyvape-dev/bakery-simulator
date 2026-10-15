/* Independent floor tiles and boundary walls; topology uses edges, never a background image. */
(function(root){'use strict';
const floors={cream:{name:'クリームタイル',cost:6,color:'#f4dcb6'},wood:{name:'木床',cost:8,color:'#cda573'},stone:{name:'石床',cost:10,color:'#b8c5bc'}};
const materials={plaster:{name:'しっくい',cost:30,face:'#e5dec7',top:'#fff4dd',side:'#b7ad94'},wood:{name:'木',cost:40,face:'#b89162',top:'#e0bf8a',side:'#826647'},brick:{name:'レンガ',cost:50,face:'#bc805f',top:'#ddb08b',side:'#89583e'}};
const key=e=>e.axis+','+e.x+','+e.y;
function edge(a,b){if(!a||!b||Math.abs(a.x-b.x)+Math.abs(a.y-b.y)!==1)return null;return a.x!==b.x?{axis:'x',x:Math.max(a.x,b.x),y:a.y}:{axis:'y',x:a.x,y:Math.max(a.y,b.y)}}
function validEdge(e,r){return e&&['x','y'].includes(e.axis)&&Number.isInteger(e.x)&&Number.isInteger(e.y)&&e.x>=0&&e.y>=0&&(e.axis==='x'?e.x<=r.width&&e.y<r.height:e.x<r.width&&e.y<=r.height)}
function restore(old){const dim=v=>[10,12,14,16].includes(v)?v:10,r={width:dim(old?.width),height:dim(old?.height),floors:{},walls:[],lowWalls:old?.lowWalls===true};
 if(old?.floors&&typeof old.floors==='object')for(const [k,v] of Object.entries(old.floors)){const m=/^(\d+),(\d+)$/.exec(k);if(m&&Number(m[1])<r.width&&Number(m[2])<r.height&&Object.hasOwn(floors,v)&&v!=='cream')r.floors[Number(m[1])+','+Number(m[2])]=v}
 const seen=new Set();if(Array.isArray(old?.walls))for(const e of old.walls){if(!validEdge(e,r)||seen.has(key(e))||!Object.hasOwn(materials,e.material)||!['wall','door'].includes(e.type))continue;seen.add(key(e));r.walls.push({axis:e.axis,x:e.x,y:e.y,material:e.material,type:e.type})}
 return r;
}
const wallCache=new WeakMap();
function blocked(a,b,walls){const e=edge(a,b);if(!e)return false;if(!wallCache.has(walls))wallCache.set(walls,new Set(walls.filter(w=>w.type==='wall').map(key)));return wallCache.get(walls).has(key(e))}
function crosses(e,o,dims){const [w,h]=dims(o);return e.axis==='x'?e.x>o.x&&e.x<o.x+w&&e.y>=o.y&&e.y<o.y+h:e.y>o.y&&e.y<o.y+h&&e.x>=o.x&&e.x<o.x+w}
function create(api){const room=()=>api.state().room,sim=()=>api.sim();
 function floorQuote(cells,material){if(!Object.hasOwn(floors,material))return{error:'床材を選んでください',cost:0,cells:[]};const unique=new Map();for(const p of cells){if(!p||!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.y<0||p.x>=room().width||p.y>=room().height)return{error:'店舗の外です',cost:0,cells:[]};unique.set(p.x+','+p.y,p)}const changed=[...unique.values()].filter(p=>(room().floors[p.x+','+p.y]||'cream')!==material);return{error:'',cost:changed.length*floors[material].cost,cells:changed}}
 function paint(cells,material){const q=floorQuote(cells,material);if(q.error)return q;if(api.state().coins<q.cost)return{...q,error:'資金不足です。床は変更していません'};const budget=api.spendingError?.(q.cost);if(budget)return{...q,error:budget};for(const p of q.cells){const k=p.x+','+p.y;if(material==='cream')delete room().floors[k];else room().floors[k]=material}api.state().coins-=q.cost;sim().interiorCosts+=q.cost;if(q.cells.length)api.changed();return q}
 function wallQuote(edges,material,type){if(!Object.hasOwn(materials,material)||!['wall','door','erase','recolor'].includes(type))return{error:'壁の種類を選んでください',cost:0,refund:0,walls:room().walls};const next=new Map(room().walls.map(w=>[key(w),{...w}])),seen=new Set();let cost=0,refund=0,changes=0;
  for(const e of edges){if(!validEdge(e,room()))return{error:'店舗の外です',cost:0,refund:0,walls:room().walls};const k=key(e);if(seen.has(k))continue;seen.add(k);const old=next.get(k);if(type==='erase'){if(old){refund+=Math.floor(materials[old.material].cost/2);next.delete(k);changes++}}else{const nextType=type==='recolor'?old?.type:type;if(nextType&&(!old||old.material!==material||old.type!==nextType)){cost+=materials[material].cost;next.set(k,{axis:e.axis,x:e.x,y:e.y,material,type:nextType});changes++}}}
  const walls=[...next.values()],error=type==='erase'?'':api.layoutError(walls);return{error,cost,refund,changes,walls};
 }
 function walls(edges,material,type){const q=wallQuote(edges,material,type);if(q.error)return q;if(api.state().coins<q.cost)return{...q,error:'資金不足です。壁は変更していません'};const budget=api.spendingError?.(q.cost);if(budget)return{...q,error:budget};if(q.changes){room().walls=q.walls;api.state().coins+=q.refund-q.cost;sim().interiorCosts+=q.cost;sim().equipmentRefunds+=q.refund;api.changed()}return q}
 function expansion(axis){if(!['width','height'].includes(axis))return{error:'増築方向を選んでください',cost:0};if(room()[axis]>=16)return{error:'この方向は最大16マスです',cost:0};const added=2*room()[axis==='width'?'height':'width'];return{error:'',added,cost:added*80,width:room().width+(axis==='width'?2:0),height:room().height+(axis==='height'?2:0)}}
 function expand(axis){const q=expansion(axis);if(q.error)return q;if(sim().phase!=='prep')return{...q,error:'増築は開店前に行ってください'};if(api.state().coins<q.cost)return{...q,error:'増築資金が足りません'};const budget=api.spendingError?.(q.cost);if(budget)return{...q,error:budget};
  // Width grows to the right; depth grows behind the store by shifting every existing layer together.
  if(axis==='height'){const next={};for(const [k,v] of Object.entries(room().floors)){const [x,y]=k.split(',').map(Number);next[x+','+(y+2)]=v}room().floors=next;room().walls=room().walls.map(w=>({...w,y:w.axis==='y'&&w.y===0?0:w.y+2}));api.shift(0,2)}
  if(axis==='width')room().walls=room().walls.map(w=>({...w,x:w.axis==='x'&&w.x===room().width?q.width:w.x}));room().width=q.width;room().height=q.height;api.refreshEntry();api.state().coins-=q.cost;sim().expansionCosts+=q.cost;api.changed();return q;
 }
 return{floorQuote,paint,wallQuote,walls,expansion,expand};
}
function polygon(ctx,points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
function drawFloor(ctx,point,x,y,material){const a=point(x,y),b=point(x+1,y),d=point(x,y+1),corners=[a,b,point(x+1,y+1),d];polygon(ctx,corners,material==='wood'?'#cda573':material==='stone'?((x+y)%2?'#b8c5bc':'#c5cfc3'):((x+y)%2?'#f4dcb6':'#f9e5c2'));
 ctx.save();ctx.transform(b.x-a.x,b.y-a.y,d.x-a.x,d.y-a.y,a.x,a.y);ctx.beginPath();ctx.rect(0,0,1,1);ctx.clip();ctx.lineWidth=.018;
 if(material==='wood'){ctx.strokeStyle='#916d4470';for(let i=1;i<4;i++){const v=i/4;ctx.beginPath();ctx.moveTo(0,v);ctx.lineTo(1,v);ctx.stroke()}for(let i=0;i<4;i++){const u=(x+i+y)%2?.32:.68;ctx.beginPath();ctx.moveTo(u,i/4);ctx.lineTo(u,(i+1)/4);ctx.stroke()}ctx.strokeStyle='#f2d7a244';ctx.lineWidth=.008;for(let i=0;i<12;i++){const v=(i+.5)/12;ctx.beginPath();ctx.moveTo(.06,v);ctx.bezierCurveTo(.3,v+.025,.65,v-.018,.95,v);ctx.stroke()}}
 if(material==='stone'){ctx.strokeStyle='#f2f0df60';ctx.lineWidth=.009;for(let i=0;i<8;i++){const seed=((x*37+y*19+i*23)%97)/97;ctx.beginPath();ctx.moveTo(seed*.7,.1+i*.11);ctx.lineTo(Math.min(.94,seed*.7+.18),.12+i*.11);ctx.stroke()}ctx.strokeStyle='#78918566';ctx.lineWidth=.015;ctx.strokeRect(.025,.025,.95,.95)}
 if(material==='cream'){ctx.fillStyle='#fff9e519';ctx.fillRect(.05,.05,.9,.22)}ctx.restore();polygon(ctx,corners,null,material==='wood'?'#b38c5d':material==='stone'?'#91a297':'#dfc095');
}
function wallPoints(w,point,height){const a=point(w.x,w.y),b=point(w.x+(w.axis==='y'?1:0),w.y+(w.axis==='x'?1:0));return[a,b,{x:b.x,y:b.y-height},{x:a.x,y:a.y-height}]}
function drawWall(ctx,point,w,tx,{low=false,alpha=1,selected=false}={}){const m=materials[w.material],height=tx*(low?1.15:2.15),pts=wallPoints(w,point,height),[a,b]=pts,n=point(w.axis==='x'?.08:0,w.axis==='y'?.08:0),z=point(0,0),offset={x:n.x-z.x,y:n.y-z.y};ctx.save();ctx.globalAlpha=alpha;
 polygon(ctx,[pts[3],pts[2],{x:pts[2].x+offset.x,y:pts[2].y+offset.y},{x:pts[3].x+offset.x,y:pts[3].y+offset.y}],m.top,'#826c4950');
 polygon(ctx,[b,{x:b.x+offset.x,y:b.y+offset.y},{x:pts[2].x+offset.x,y:pts[2].y+offset.y},pts[2]],m.side);
 ctx.save();ctx.transform(b.x-a.x,b.y-a.y,0,-height,a.x,a.y);
 ctx.beginPath();if(w.type==='door'){ctx.rect(0,0,.13,1);ctx.rect(.87,0,.13,1);ctx.rect(.13,.82,.74,.18)}else ctx.rect(0,0,1,1);ctx.clip();ctx.fillStyle=m.face;ctx.fillRect(0,0,1,1);
 const gradient=ctx.createLinearGradient(0,0,1,1);gradient.addColorStop(0,'#60422e22');gradient.addColorStop(1,'#fff9e430');ctx.fillStyle=gradient;ctx.fillRect(0,0,1,1);
 if(w.material==='brick'){ctx.strokeStyle='#edcaa780';ctx.lineWidth=.022;for(let row=0;row<8;row++){const v=row/8;ctx.beginPath();ctx.moveTo(0,v);ctx.lineTo(1,v);ctx.stroke();for(let col=0;col<4;col++){const u=(col+(row%2)*.5)/3;ctx.beginPath();ctx.moveTo(u,v);ctx.lineTo(u,v+.125);ctx.stroke()}}}
 else if(w.material==='wood'){ctx.strokeStyle='#78593f80';ctx.lineWidth=.014;for(let i=1;i<5;i++){ctx.beginPath();ctx.moveTo(i/5,0);ctx.lineTo(i/5,1);ctx.stroke()}ctx.strokeStyle='#eccb9433';ctx.lineWidth=.008;for(let i=0;i<12;i++){const u=(i+.3)/12;ctx.beginPath();ctx.moveTo(u,.07);ctx.bezierCurveTo(u+.012,.3,u-.018,.55,u,.97);ctx.stroke()}}
 else{ctx.fillStyle='#f4eddb30';for(let i=0;i<10;i++)ctx.fillRect(((w.x*13+w.y*7+i*11)%31)/40,i/10,.3,.027)}
 ctx.fillStyle=m.side;ctx.fillRect(0,0,1,.055);ctx.restore();if(selected)polygon(ctx,pts,null,'#ffdb4c');else if(w.type==='wall')polygon(ctx,pts,null,'#89725470');ctx.restore();return pts;
}
function inPolygon(p,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside}return inside}
root.BakeryInterior={floors,materials,key,edge,validEdge,restore,blocked,crosses,create,drawFloor,drawWall,wallPoints,inPolygon};
if(typeof module!=='undefined')module.exports=root.BakeryInterior;
})(typeof window!=='undefined'?window:globalThis);
