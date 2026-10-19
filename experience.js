/* Presentation adapter. All purchasing, routing, jobs and saves stay in the game. */
(function(root){'use strict';root.createBakeryExperience=function(api){
 const $=id=>document.getElementById(id),state=api.state,sim=api.sim;
 let screen='normal',category='furniture',layoutKey='',expansionAxis=null,lastEdit=null;let wallTool={mode:'wall',kind:'wall'};
 const dialogs=['menuDialog','reportDialog','staffDialog','productDialog','settingsDialog'];
 const menuLaunch=(id,fn)=>{$(id).onclick=()=>{$('menuDialog').close();fn();api.update()}};
 function clearSelection(){api.cancelGesture();state().selection=null;state().mode='idle'}
 function building(){chooseCategory('furniture')}
 function openMenu(){clearSelection();screen='normal';$('menuDialog').showModal();api.update()}
 function chooseCategory(part){clearSelection();screen='build';category=part;lastEdit=null;expansionAxis=part==='expansion'?'width':null;if(part==='floor')api.setInteriorTool('floor');else if(part==='wall')api.setInteriorTool(wallTool.mode,wallTool.kind);else api.update()}
 function expansionPreview(){if(screen!=='build'||category!=='expansion'||!expansionAxis||sim().phase!=='prep')return null;const q=api.engine().expansion(expansionAxis);return q.error?null:{...q,axis:expansionAxis}}
 function recordEdit(result,tool){lastEdit={cost:result.cost||0,refund:result.refund||0,count:tool==='floor'?result.cells.length:result.changes||0,unit:tool==='floor'?'マス':'区画'}}

 $('openMenu').onclick=openMenu;$('closeMenu').onclick=()=>{$('menuDialog').close();api.update()};
 menuLaunch('build',building);menuLaunch('team',()=>{screen='normal';api.showStaff()});
 menuLaunch('menuReport',()=>{screen='normal';api.showReport()});
 menuLaunch('products',()=>{screen='normal';api.products().open()});menuLaunch('settings',()=>{screen='normal';$('settingsDialog').showModal()});
 for(const id of ['start','close']){const existing=$(id).onclick;$(id).onclick=()=>{$('menuDialog').close();screen='normal';existing()}};
 for(const [button,dialog] of [['closeProducts','productDialog'],['closeSettings','settingsDialog']])$(button).onclick=()=>{$(dialog).close();api.update()};
 for(const id of dialogs)$(id).addEventListener('close',()=>{api.update();$('openMenu').focus({preventScroll:true})});
 $('save').onclick=()=>{api.store();if(api.saved())api.flash('保存しました')};
 const oldCancel=$('cancel').onclick;$('cancel').onclick=()=>{screen='normal';oldCancel()};
 for(const id of ['plus','minus']){const handler=$(id).onclick;$(id).onclick=()=>{handler();api.store()}};
 const oldReset=$('reset').onclick;$('reset').onclick=()=>{if(oldReset()===true){screen='normal';expansionAxis=null;lastEdit=null;for(const id of dialogs)$(id).close();api.update()}};
 for(const b of document.querySelectorAll('[data-category]'))b.onclick=()=>chooseCategory(b.dataset.category);
 for(const [node,palette,kind] of [['floorMaterials',BakeryInterior.floors,'floor'],['wallMaterials',BakeryInterior.materials,'wall']])for(const b of $(node).querySelectorAll('button')){const id=kind==='floor'?b.dataset.floor:b.dataset.wallMaterial,m=palette[id],existing=b.onclick;b.replaceChildren();const preview=document.createElement('canvas');preview.width=100;preview.height=70;preview.setAttribute('aria-hidden','true');const c=preview.getContext('2d');if(kind==='floor')BakeryInterior.drawFloor(c,(x,y)=>({x:50+(x-y)*36,y:14+(x+y)*19.44}),0,0,id);else BakeryInterior.drawWall(c,(x,y)=>({x:25+(x-y)*32,y:58+(x+y)*17.28}),{x:0,y:0,axis:'y',material:id,type:'wall'},23);const name=document.createElement('span');name.textContent=m.name;const cost=document.createElement('small');cost.textContent=m.cost+'円 / '+(kind==='floor'?'マス':'区画');b.append(preview,name,cost);b.onclick=()=>{existing();lastEdit=null;if(kind==='floor')api.setInteriorTool('floor');else api.setInteriorTool(wallTool.mode,wallTool.kind)}};
 for(const [id,mode,kind] of [['paintWall','wall','wall'],['paintDoor','wall','door'],['recolorWall','wallMaterial','wall'],['eraseWall','wallErase','wall']])$(id).onclick=()=>{wallTool={mode,kind};lastEdit=null;api.setInteriorTool(mode,kind)};
 $('paintFloor').onclick=()=>{lastEdit=null;if(state().mode==='floor'){clearSelection();api.update()}else api.setInteriorTool('floor')};
 const oldAxis=$('wallAxis').onchange;$('wallAxis').onchange=e=>{oldAxis(e);api.update()};
 const oldLow=$('lowWalls').onchange;$('lowWalls').onchange=e=>{oldLow(e);api.update()};
 const purchases={width:$('expandWidth').onclick,height:$('expandHeight').onclick};
 for(const [axis,id] of [['width','expandWidth'],['height','expandHeight']])$(id).onclick=()=>{expansionAxis=axis;api.update()};
 $('applyExpansion').onclick=()=>{if(!expansionAxis)return;const axis=expansionAxis,q=api.engine().expansion(axis);if(q.error||sim().phase!=='prep'||state().coins<q.cost)return;if(!confirm('店舗を'+q.width+'×'+q.height+'マスに増築しますか？ 費用 '+q.cost.toLocaleString()+'円'))return;expansionAxis=null;purchases[axis]();api.update()};
 for(const b of $('items').querySelectorAll('[data-type]')){const type=b.dataset.type,t=api.furniture[type],existing=b.onclick;b.replaceChildren();const im=document.createElement('img');im.src='assets/'+type+'_r0.webp';im.alt='';const label=document.createElement('span');label.textContent=t[0];const cost=document.createElement('small');cost.textContent=t[4]+'円 · '+t[2]+'×'+t[3];b.append(im,label,cost);b.onclick=()=>{screen='build';category='furniture';existing()}};
 // Staff chosen for contextual instructions follows current assigned roles.
 function worker(type){const crew=api.crew(),work=type==='shelf'||type==='register'?'hall':'kitchen';return crew.staff.find(a=>a.role===work)||crew.staff.find(a=>a.role==='all')||crew.staff.find(a=>a.id===(work==='hall'?'noah':'owner'))}
 $('equipmentStaff').onclick=()=>{const o=state().objects.find(o=>o.id===state().selection);if(!o)return;screen='normal';api.showStaff(worker(o.type).id)};
 $('equipmentCommand').onclick=()=>{const o=state().objects.find(o=>o.id===state().selection);if(!o||sim().phase==='ended')return;const task=o.type==='shelf'?'stock':o.type==='register'?'checkout':'produce',a=worker(o.type);api.crew().command(a.id,task);api.flash(a.name+'に'+api.crew().labels[task]+'を指示しました');api.update()};
 const oldErase=$('erase').onclick;$('erase').onclick=()=>{const o=state().objects.find(o=>o.id===state().selection);if(!o)return oldErase();if(confirm(api.furniture[o.type][0]+'を撤去しますか？ '+Math.floor(api.furniture[o.type][4]/2)+'円返金します。'))api.removeFurniture(o)};
 function text(id,value){if($(id).textContent!==value)$(id).textContent=value}
 function paintProduct(){api.products().paint()}
 function paint(){const s=sim(),o=state().objects.find(o=>o.id===state().selection),tool=api.interiorMode();
  for(const b of $('items').querySelectorAll('[data-type]')){const type=b.dataset.type,t=api.furniture[type],reason=api.furniturePurchaseError?.(type)||'';b.disabled=!!reason;b.title=reason;b.querySelector('small').textContent=t[4]+'円 · '+t[2]+'×'+t[3]+(reason?' · '+(reason.startsWith('先に')?'必須設備を先に':reason==='資金不足'?reason:'営業資金を確保'):'')}
  for(const b of document.querySelectorAll('[data-job]'))b.disabled=s.phase==='ended';text('customerCount',s.customers+'人');text('businessStatus','Day '+s.day+' · '+(s.phase==='prep'?'開店前':s.phase==='ended'?'営業終了':s.open?'営業中':'営業停止中'));text('baking',s.bake?'焼き上がりまで '+s.bake+'分':'焼き上がり '+(s.ready+s.ovenReady)+'個');text('stock','棚在庫 '+s.stock+' / 12');
  if($('productDialog').open)paintProduct();
  if(o&&screen==='build'&&!tool&&state().mode==='idle')screen='normal';
  const selected=!!o&&screen!=='build',build=screen==='build'||tool;
  // Do not resize the scene under the finger. Selection is applied on release.
  const key=[selected,build,category,state().mode].join(':');if(!api.held()&&key!==layoutKey){layoutKey=key;$('equipmentPanel').hidden=!selected;$('buildPanel').hidden=!build;$('items').hidden=!build||category!=='furniture';$('buildToolInfo').hidden=!build||category==='furniture';for(const [id,cat]of [['floorPane','floor'],['wallPane','wall'],['expansionPane','expansion']])$(id).hidden=!build||category!==cat;$('wallMaterials').hidden=state().mode==='wallErase';for(const id of ['save','openMenu'])$(id).hidden=selected||build;$('move').hidden=!selected;$('cancel').hidden=!selected&&!build;$('rotate').hidden=!selected&&(!build||category!=='furniture'&&!api.wallMode());$('erase').hidden=!selected;$('paintFloor').hidden=!build||category!=='floor';$('applyExpansion').hidden=!build||category!=='expansion';
   (selected?$('equipmentActions'):$('primaryActions')).append($('rotate'));if(selected)$('equipmentActions').append($('erase'));else $('primaryActions').append($('erase'));
   if(build)$('primaryActions').prepend(category==='floor'?$('paintFloor'):category==='expansion'?$('applyExpansion'):$('rotate'));if(selected)$('primaryActions').prepend($('move'));if(!selected&&!build)$('primaryActions').prepend($('save'));$('primaryActions').append($('actionContext'),selected||build?$('cancel'):$('openMenu'));
  }
  for(const b of document.querySelectorAll('[data-category]')){b.classList.toggle('active',b.dataset.category===category);b.setAttribute('aria-pressed',String(b.dataset.category===category))}
  text('actionContext',selected?'設備の確認':build?'店づくり':s.phase==='prep'&&s.day===1?'焼く・売る・育てる':'こもれびベーカリー');text('rotate',api.wallMode()?(api.renovation.axis==='y'?'↘ 方向':'↙ 方向'):'回転');
  if(o&&selected){text('equipmentName',api.furniture[o.type][0]);text('equipmentSize',api.dims(o).join('×')+'マス');const a=worker(o.type),info={shelf:'棚全体の在庫 '+s.stock+' / 12個 · '+a.name+'：'+a.status,oven:s.bake?'焼成中 · 残り '+s.bake+'分':'焼き上がり '+s.ovenReady+'個 · '+a.name+'：'+a.status,prep:'材料 '+s.materials+'回分 · '+a.name+'：'+a.status,register:(api.visitor().stage==='waiting'?'会計待ち 1人':'会計待ちなし')+' · '+a.name+'：'+a.status,table:'テーブルを配置しています。通路を空けて店内を整えましょう。',plant:'植木を配置しています。家具の間の通路を空けましょう。'};text('equipmentStatus',info[o.type]);$('equipmentCommand').hidden=!['shelf','oven','prep','register'].includes(o.type);$('equipmentStaff').hidden=['table','plant'].includes(o.type);$('equipmentCommand').disabled=s.phase==='ended';text('equipmentCommand',o.type==='shelf'?'陳列を指示':o.type==='register'?'会計を指示':'製造を指示');}
  if(build){const mode=state().mode,edit=api.edit(),q=expansionAxis?api.engine().expansion(expansionAxis):null;const wallName=BakeryInterior.materials[api.renovation.wall].name;
   for(const [id,on]of [['paintWall',mode==='wall'&&api.renovation.kind==='wall'],['paintDoor',mode==='wall'&&api.renovation.kind==='door'],['recolorWall',mode==='wallMaterial'],['eraseWall',mode==='wallErase']]){$(id).classList.toggle('active',on);$(id).setAttribute('aria-pressed',String(on))}
   for(const b of $('floorMaterials').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.floor===api.renovation.floor));for(const b of $('wallMaterials').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.wallMaterial===api.renovation.wall));
   for(const [axis,id]of [['width','expandWidth'],['height','expandHeight']]){$(id).classList.toggle('active',axis===expansionAxis);$(id).setAttribute('aria-pressed',String(axis===expansionAxis))}
   text('paintFloor',mode==='floor'?'塗り解除':'床を塗る');
   text('buildToolText',category==='floor'?(mode==='floor'?'床をタップ・ドラッグで範囲指定。同じ床材は無料。':'床材を選ぶと塗り替えできます。'):category==='wall'?(mode==='wallErase'?'壁本体・床の線を選んで撤去。壁材の半額を返金。':mode==='wallMaterial'?'壁本体を選んで素材変更。出入口と方向は保持。':(api.renovation.kind==='door'?'出入口':'壁')+'を床の線に設置。ドラッグで連続指定。'):sim().phase!=='prep'?'増築は開店前に行えます。':q&&!q.error?'緑の範囲を追加：'+q.width+'×'+q.height+'マス。確認して増築。':'方向を選ぶと、広がる範囲を確認できます。');
   let quote='';if(edit)quote=edit.reason||('変更 '+(edit.cells?.length||edit.edges?.length||0)+(category==='floor'?'マス':'区画')+' · 支払い '+edit.cost+'円'+(edit.refund?' · 返金 '+edit.refund+'円':''));else if(lastEdit)quote='直前：'+lastEdit.count+lastEdit.unit+' · 支払い '+lastEdit.cost+'円'+(lastEdit.refund?' · 返金 '+lastEdit.refund+'円':'');else if(category==='floor')quote=BakeryInterior.floors[api.renovation.floor].name+' · '+BakeryInterior.floors[api.renovation.floor].cost+'円 / マス';else if(category==='wall')quote=mode==='wallErase'?'撤去前に返金予定額を表示します。':wallName+' · '+BakeryInterior.materials[api.renovation.wall].cost+'円 / 区画';else quote=q?(q.error||api.spendingError?.(q.cost)||('追加 '+q.added+'マス · '+q.cost.toLocaleString()+'円'+(state().coins<q.cost?' · 資金不足':''))):'1マス80円 · 最大16×16マス';
   if(!edit&&api.missingEquipment?.().length&&!(category==='wall'&&mode==='wallErase'))quote='先に'+api.missingEquipment().map(type=>api.furniture[type][0]).join('・')+'を設置してください';
   text('renovationQuote',quote);$('renovationQuote').classList.toggle('invalid',!!edit?.reason||category==='expansion'&&(!q||!!q.error||state().coins<q.cost||sim().phase!=='prep'));$('applyExpansion').disabled=!q||!!q.error||sim().phase!=='prep'||state().coins<q.cost||!!api.spendingError?.(q.cost);
   text('hint',category==='furniture'?(api.missingEquipment?.().length?'まず '+api.missingEquipment().map(type=>api.furniture[type][0]).join('・')+'を1台ずつ設置':state().mode==='place'?api.furniture[state().type][0]+' · '+api.furniture[state().type][4]+'円 · 空き床をタップ':'家具を選択 · 戻るで通常営業へ'):'戻るで通常営業へ');if(!api.held())text('modeBanner','店づくり｜営業・作業を一時停止中');
  }else if(!o){const missing=['oven','prep','shelf','register'].filter(t=>!state().objects.some(o=>o.type===t));text('modeBanner',s.phase==='prep'?(missing.length?'開店準備｜'+missing.map(t=>api.furniture[t][0]).join('・')+'を設置':s.stock>0?'開店前｜パンは準備済み。メニューから開店':'開店前｜仕込み中。メニューから開店できます'):s.phase==='ended'?'営業終了｜メニューから締めて翌日へ':s.open?'営業中｜店主とノアが働いています':'営業停止中｜メニューから再開');text('hint','');}
 }
 return{paint,openInterior:()=>chooseCategory('floor'),expansionPreview,recordEdit,paused:()=>screen==='build'||dialogs.some(id=>$(id).open)};
};})(window);
