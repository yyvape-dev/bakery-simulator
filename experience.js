/* Presentation adapter. All purchasing, routing, jobs and saves stay in the game. */
(function(root){'use strict';root.createBakeryExperience=function(api){
 const $=id=>document.getElementById(id),state=api.state,sim=api.sim;
 let screen='normal',category='furniture',layoutKey='';
 const dialogs=['menuDialog','reportDialog','staffDialog','interiorDialog','productDialog','settingsDialog'];
 const menuLaunch=(id,fn)=>{$(id).onclick=()=>{$('menuDialog').close();fn();api.update()}};
 function clearSelection(){api.cancelGesture();state().selection=null;state().mode='idle'}
 function building(){clearSelection();screen='build';category='furniture';api.update()}
 function openMenu(){clearSelection();screen='normal';$('menuDialog').showModal();api.update()}
 function interior(part){category=part||category;screen='build';$('interiorDialog').dataset.section=part||'all';api.showInterior()}
 $('openMenu').onclick=openMenu;$('closeMenu').onclick=()=>{$('menuDialog').close();api.update()};
 menuLaunch('build',building);menuLaunch('team',()=>{screen='normal';api.showStaff()});
 menuLaunch('interior',()=>interior('all'));menuLaunch('menuReport',()=>{screen='normal';api.showReport()});
 menuLaunch('products',()=>{screen='normal';$('productDialog').showModal()});menuLaunch('settings',()=>{screen='normal';$('settingsDialog').showModal()});
 for(const id of ['start','close']){const existing=$(id).onclick;$(id).onclick=()=>{$('menuDialog').close();screen='normal';existing()}};
 for(const [button,dialog] of [['closeProducts','productDialog'],['closeSettings','settingsDialog']])$(button).onclick=()=>{$(dialog).close();api.update()};
 for(const id of dialogs)$(id).addEventListener('close',()=>{api.update();$('openMenu').focus({preventScroll:true})});
 $('save').onclick=()=>{api.store();if(api.saved())api.flash('保存しました')};
 const oldCancel=$('cancel').onclick;$('cancel').onclick=()=>{screen='normal';oldCancel()};
 const oldReset=$('reset').onclick;$('reset').onclick=()=>{oldReset();if(state().objects.length===0){screen='normal';api.update()}};
 $('closeInterior').onclick=()=>{$('interiorDialog').close();screen='normal';state().mode='idle';api.update()};
 for(const b of document.querySelectorAll('[data-category]'))b.onclick=()=>{clearSelection();category=b.dataset.category;screen='build';if(category==='furniture')api.update();else interior(category)};
 $('buildDetails').onclick=()=>interior(category==='all'?'all':category);
 for(const b of $('items').querySelectorAll('[data-type]')){const type=b.dataset.type,t=api.furniture[type],existing=b.onclick;b.replaceChildren();const im=document.createElement('img');im.src='assets/'+type+'_r0.webp';im.alt='';const label=document.createElement('span');label.textContent=t[0];const cost=document.createElement('small');cost.textContent=t[4]+'円 · '+t[2]+'×'+t[3];b.append(im,label,cost);b.onclick=()=>{screen='build';category='furniture';existing()}};
 // Staff chosen for contextual instructions follows current assigned roles.
 function worker(type){const crew=api.crew(),work=type==='shelf'||type==='register'?'hall':'kitchen';return crew.staff.find(a=>a.role===work)||crew.staff.find(a=>a.role==='all')||crew.staff.find(a=>a.id===(work==='hall'?'noah':'owner'))}
 $('equipmentStaff').onclick=()=>{const o=state().objects.find(o=>o.id===state().selection);if(!o)return;screen='normal';api.showStaff(worker(o.type).id)};
 $('equipmentCommand').onclick=()=>{const o=state().objects.find(o=>o.id===state().selection);if(!o||sim().phase==='ended')return;const task=o.type==='shelf'?'stock':o.type==='register'?'checkout':'produce',a=worker(o.type);api.crew().command(a.id,task);api.flash(a.name+'に'+api.crew().labels[task]+'を指示しました');api.update()};
 const oldErase=$('erase').onclick;$('erase').onclick=()=>{const o=state().objects.find(o=>o.id===state().selection);if(!o)return oldErase();if(confirm(api.furniture[o.type][0]+'を撤去しますか？ '+Math.floor(api.furniture[o.type][4]/2)+'円返金します。'))api.removeFurniture(o)};
 function text(id,value){if($(id).textContent!==value)$(id).textContent=value}
 function paintProduct(){const s=sim(),a=api.crew().staff.find(a=>a.id===api.crew().selected);text('productStaff','指示するスタッフ：'+a.name+'（スタッフ画面で変更できます）');const values=[['単価','120円'],['棚全体の在庫',s.stock+' / 12個'],['焼き上がり',s.ready+s.ovenReady+'個'],['今日の販売',s.sold+'個'],['今日の売上',s.sales.toLocaleString()+'円']];$('productInfo').replaceChildren(...values.map(([title,value])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=title;dd.textContent=value;row.append(dt,dd);return row}))}
 function paint(){const s=sim(),o=state().objects.find(o=>o.id===state().selection),tool=api.interiorMode();
  text('customerCount',s.customers+'人');text('businessStatus','Day '+s.day+' · '+(s.phase==='prep'?'開店前':s.phase==='ended'?'営業終了':s.open?'営業中':'営業停止中'));text('baking',s.bake?'焼き上がりまで '+s.bake+'分':'焼き上がり '+(s.ready+s.ovenReady)+'個');text('stock','棚在庫 '+s.stock+' / 12');
  if($('productDialog').open)paintProduct();
  if(o&&screen==='build'&&!tool&&state().mode==='idle')screen='normal';
  const selected=!!o&&screen!=='build',build=screen==='build'||tool;
  // Do not resize the scene under the finger. Selection is applied on release.
  const key=[selected,build,category].join(':');if(!api.held()&&key!==layoutKey){layoutKey=key;$('equipmentPanel').hidden=!selected;$('buildPanel').hidden=!build;$('items').hidden=!build||category!=='furniture';$('buildToolInfo').hidden=!build||category==='furniture';for(const id of ['save','openMenu'])$(id).hidden=selected||build;$('move').hidden=!selected;$('cancel').hidden=!selected&&!build;$('rotate').hidden=!selected&&(!build||category!=='furniture'&&!api.wallMode());$('erase').hidden=!selected;
   (selected?$('equipmentActions'):$('primaryActions')).append($('rotate'));if(selected)$('equipmentActions').append($('erase'));else $('primaryActions').append($('erase'));
   if(build)$('primaryActions').prepend($('rotate'));if(selected)$('primaryActions').prepend($('move'));if(!selected&&!build)$('primaryActions').prepend($('save'));$('primaryActions').append($('actionContext'),selected||build?$('cancel'):$('openMenu'));
  }
  for(const b of document.querySelectorAll('[data-category]'))b.classList.toggle('active',b.dataset.category===category);
  text('actionContext',selected?'設備の確認':build?'店づくり':'こもれびベーカリー');
  if(o&&selected){text('equipmentName',api.furniture[o.type][0]);text('equipmentSize',api.dims(o).join('×')+'マス');const a=worker(o.type),info={shelf:'棚全体の在庫 '+s.stock+' / 12個 · '+a.name+'：'+a.status,oven:s.bake?'焼成中 · 残り '+s.bake+'分':'焼き上がり '+s.ovenReady+'個 · '+a.name+'：'+a.status,prep:'材料 '+s.materials+'回分 · '+a.name+'：'+a.status,register:(api.visitor().stage==='waiting'?'会計待ち 1人':'会計待ちなし')+' · '+a.name+'：'+a.status,table:'テーブルを配置しています。通路を空けて店内を整えましょう。',plant:'植木を配置しています。家具の間の通路を空けましょう。'};text('equipmentStatus',info[o.type]);$('equipmentCommand').hidden=!['shelf','oven','prep','register'].includes(o.type);$('equipmentStaff').hidden=['table','plant'].includes(o.type);$('equipmentCommand').disabled=s.phase==='ended';text('equipmentCommand',o.type==='shelf'?'陳列を指示':o.type==='register'?'会計を指示':'製造を指示');}
  if(build){text('buildToolText',tool?(state().mode==='floor'?'床材：'+BakeryInterior.floors[api.renovation.floor].name+' · タップまたは範囲指定':state().mode==='wallErase'?'壁・出入口を選んで撤去':state().mode==='wallMaterial'?'壁を選んで素材変更':'仕切り：'+(api.renovation.kind==='door'?'出入口':'壁')+' · '+BakeryInterior.materials[api.renovation.wall].name):category==='expansion'?'店舗 '+state().room.width+'×'+state().room.height+'マス · 開店前に増築できます':'素材と変更する内容を選んでください');
   text('hint',tool?$('hint').textContent:state().mode==='place'?api.furniture[state().type][0]+' · '+api.furniture[state().type][4]+'円 · 空き床をタップ':'家具を選択 · 戻るで通常営業へ');if(!api.held())text('modeBanner','店づくり｜営業・作業を一時停止中');
  }else if(!o){const missing=['oven','prep','shelf','register'].filter(t=>!state().objects.some(o=>o.type===t));text('modeBanner',s.phase==='prep'?(missing.length?'開店準備｜'+missing.map(t=>api.furniture[t][0]).join('・')+'を設置':'開店前｜仕込み中。メニューから開店できます'):s.phase==='ended'?'営業終了｜メニューから締めて翌日へ':s.open?'営業中｜店主とノアが働いています':'営業停止中｜メニューから再開');text('hint','');}
 }
 return{paint,paused:()=>screen==='build'||dialogs.some(id=>$(id).open)};
};})(window);
