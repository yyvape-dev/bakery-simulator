/* Read-only shop observations. Labels never affect stock, tasks, money or hit tests. */
(function(root){'use strict';
function staffStatus(a){const j=a.job,s=a.status||'';
 if(s==='通路待ち'||s==='設備・対象待ち'||s==='棚の空き待ち'||s.includes('資金不足'))return{text:s.includes('資金不足')?'仕入れ資金不足':s,tone:'warning'};
 if(!j)return{text:a.command?(s.split('（')[0]||'作業待ち'):a.role==='idle'?'指示待ち':'待機',tone:a.command?'warning':'quiet'};
 const work=j.stage!=='travel';let text;
 if(j.type==='produce')text=j.stage==='knead'?'仕込み中':j.stage==='load'?'窯入れ中':j.doughReady?'生地を運搬':'調理台へ';
 else if(j.type==='stock')text=j.carry?(j.stage==='deliver'?'補充中':'パンを運搬'):(j.stage==='pickup'?'パンを回収':'パンを取りに');
 else if(j.type==='collect')text=work?'焼き上がり回収':'回収へ移動';
 else if(j.type==='checkout')text=work?'会計中':'レジへ';
 else if(j.type==='supply')text=work?'仕入れ中':'仕入れへ';
 return{text:text||'作業中',tone:'working'};
}
function observe(state,sim,staff,customer){const result=[],paused=sim.phase==='ended'||sim.phase==='trading'&&!sim.open;
 for(const a of staff){const status=staffStatus(a);if(paused&&a.job&&status.tone==='working'){status.text+='（停止）';status.tone='quiet'}result.push({id:'staff:'+a.id,target:a,kind:'staff',text:a.name+' · '+status.text,tone:status.tone,priority:status.tone==='warning'?90:status.tone==='quiet'?35:70})}
 if(customer.active){const status=customer.paid?['購入済み','success']:({entering:['来店','quiet'],shopping:['パンを選ぶ','working'],checkout:['レジへ','working'],waiting:['会計待ち','warning'],leaving:['退店','quiet']}[customer.stage]||['来店','quiet']);result.push({id:'customer',target:customer,kind:'customer',text:status[0]+(sim.phase==='trading'&&!sim.open&&['entering','shopping','checkout'].includes(customer.stage)?'（停止）':''),tone:status[1],priority:customer.stage==='waiting'?100:80})}
 const shelf=state.objects.filter(o=>o.type==='shelf');for(const o of shelf){const empty=sim.stock===0,open=sim.phase==='trading'&&sim.open;result.push({id:'shelf:'+o.id,target:o,kind:'furniture',text:empty?(open?'品切れ（共有）':'棚は空（共有）'):'パン '+sim.stock+'/12（共有）',tone:empty&&open?'warning':'quiet',priority:empty&&open?85:40})}
 const oven=state.objects.find(o=>o.type==='oven');if(oven){const text=sim.bake>0?(paused?'焼成停止 ':'焼成 ')+sim.bake+'分（全体）':sim.ovenReady>0?'回収待ち '+sim.ovenReady+'個（全体）':sim.ready>0?'陳列待ち '+sim.ready+'個（全体）':null;if(text)result.push({id:'production',target:oven,kind:'furniture',text,tone:sim.bake?'working':'warning',priority:65})}
 return result.sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));
}
function create(api){const layer=document.createElement('section');layer.id='shopStatus';layer.setAttribute('aria-label','店内の状態');layer.hidden=true;document.body.append(layer);const nodes=new Map(),boundsCache=new WeakMap();
 function visibleBounds(sp,character){const im=sp.im,key=character?sp.dir+':'+sp.frame:'full';if(!boundsCache.has(im))boundsCache.set(im,new Map());const cache=boundsCache.get(im);if(cache.has(key))return cache.get(key);const fw=character?256:im.naturalWidth,fh=character?256:im.naturalHeight,ox=character?sp.frame*256:0,oy=character?sp.dir*256:0,alpha=api.alpha(im);let left=fw,right=0,top=fh;for(let y=0;y<fh;y++)for(let x=0;x<fw;x++)if(alpha[(y+oy)*im.naturalWidth+x+ox]>=24){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y)}const value=top===fh?{x:sp.x+sp.w/2,y:sp.y+sp.h*.3}:{x:(left+right)/2/fw,y:top/fh};if(top!==fh){cache.set(key,value);return value}return null;
 }
 function anchor(item){if(item.kind==='customer'){const p=api.point(item.target.x+.5,item.target.y+.5);return{x:p.x,y:p.y-Math.max(17,api.scale()*.95)}}const sp=item.kind==='staff'?api.characterSprite(item.target):api.sprite(item.target);if(sp){const b=visibleBounds(sp,item.kind==='staff');if(b)return{x:sp.x+b.x*sp.w,y:sp.y+b.y*sp.h}}const o=item.target,[w,h]=item.kind==='furniture'?api.dims(o):[1,1],p=api.point(o.x+w/2,o.y+h/2);return{x:p.x,y:p.y-api.scale()*1.5}}
 const overlap=(a,b)=>a.x<b.x+b.w+4&&a.x+a.w+4>b.x&&a.y<b.y+b.h+4&&a.y+a.h+4>b.y;
 function paint(){if(api.hidden()){layer.hidden=true;return}const r=api.canvas.getBoundingClientRect();if(r.width<100||r.height<90){layer.hidden=true;return}layer.hidden=false;layer.style.left=r.left+'px';layer.style.top=r.top+'px';layer.style.width=r.width+'px';layer.style.height=r.height+'px';
  const items=observe(api.state(),api.sim(),api.staff(),api.customer()),used=[],active=new Set(),limit=r.height<200?4:6;let visible=0;
  for(const item of items){if(visible>=limit)break;const p=anchor(item);if(p.x<0||p.x>r.width||p.y<0||p.y>r.height)continue;let node=nodes.get(item.id);if(!node){const label=document.createElement('div'),line=document.createElement('i');label.className='shop-status-label';label.dataset.statusId=item.id;line.className='shop-status-line';line.setAttribute('aria-hidden','true');layer.append(line,label);node={label,line};nodes.set(item.id,node)}const {label,line}=node;label.hidden=false;label.dataset.tone=item.tone;if(label.textContent!==item.text)label.textContent=item.text;label.title=item.text;const w=label.offsetWidth,h=label.offsetHeight;let place=null;
   for(let row=0;row<5&&!place;row++)for(const shift of [0,-.65,.65]){const a={x:Math.max(4,Math.min(r.width-w-4,p.x-w/2+shift*w)),y:Math.max(4,p.y-h-7-row*(h+5)),w,h};if(a.y+h>r.height-4||used.some(b=>overlap(a,b)))continue;place=a;break}
   if(!place){label.hidden=true;line.hidden=true;continue}used.push(place);active.add(item.id);visible++;label.style.transform='translate('+place.x+'px,'+place.y+'px)';const from={x:Math.max(place.x+5,Math.min(place.x+w-5,p.x)),y:place.y+h},dx=p.x-from.x,dy=p.y-from.y,length=Math.hypot(dx,dy);line.hidden=length<9;line.style.width=length+'px';line.style.transform='translate('+from.x+'px,'+from.y+'px) rotate('+Math.atan2(dy,dx)+'rad)';
  }
  for(const [id,node]of nodes)if(!active.has(id)){node.label.hidden=true;node.line.hidden=true;if(!items.some(item=>item.id===id)){node.label.remove();node.line.remove();nodes.delete(id)}}
 }
 return{paint};
}
root.BakeryShopStatus={observe,staffStatus,create};
})(typeof window!=='undefined'?window:globalThis);
