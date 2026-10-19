/* Scene-only gestures. DOM controls and their hit areas never scale. */
(function(root){'use strict';root.createBakeryViewport=function(api){
 const canvas=api.canvas,contacts=new Map();let multi=false,panning=false,candidate=null,last=null,timer;
 const local=e=>{const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),center=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 const stop=e=>{e.preventDefault();e.stopImmediatePropagation()};
 function label(){document.querySelector('#viewScale').textContent=Math.round(api.zoom()*100)+'%';for(const id of ['viewOut','minus'])document.querySelector('#'+id).disabled=api.zoom()<=.45;for(const id of ['viewIn','plus'])document.querySelector('#'+id).disabled=api.zoom()>=3}
 function zoom(value,anchor){const before=api.zoom(),next=Math.max(.45,Math.min(3,value));if(next===before)return;api.cancel();const origin=api.origin();api.setZoom(next);api.render();if(anchor){const now=api.origin(),ratio=next/before;api.pan(anchor.x-(anchor.x-origin.x)*ratio-now.x,anchor.y-(anchor.y-origin.y)*ratio-now.y)}api.render();label();clearTimeout(timer);timer=setTimeout(api.store,180)}
 function fit(){api.cancel();api.reset();api.setZoom(1);api.render();label();api.store()}
 function place(){const r=canvas.getBoundingClientRect(),el=document.querySelector('#viewControls');el.style.top=(r.top+8)+'px';el.hidden=r.height<145;label()}
 canvas.addEventListener('wheel',e=>{stop(e);zoom(api.zoom()*Math.exp(-Math.max(-160,Math.min(160,e.deltaY))*.0025),local(e))},{passive:false});
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==1)return;const p=local(e);contacts.set(e.pointerId,p);if(contacts.size>=2){multi=true;panning=false;candidate=null;api.cancel();for(const id of contacts.keys())canvas.setPointerCapture(id);const[a,b]=[...contacts.values()];last={distance:distance(a,b),center:center(a,b)};stop(e)}else if(e.button===1){api.cancel();panning=true;last=p;canvas.setPointerCapture(e.pointerId);stop(e)}else candidate=api.canPan(p)?p:null},true);
 canvas.addEventListener('pointermove',e=>{if(!contacts.has(e.pointerId))return;const p=local(e);contacts.set(e.pointerId,p);if(multi){stop(e);if(contacts.size>=2){const[a,b]=[...contacts.values()],mid=center(a,b),d=distance(a,b);if(last.distance>4)zoom(api.zoom()*d/last.distance,last.center);api.pan(mid.x-last.center.x,mid.y-last.center.y);api.render();last={distance:d,center:mid}}return}if(candidate&&!panning&&distance(candidate,p)>=10){api.cancel();panning=true;last=candidate;canvas.setPointerCapture(e.pointerId)}if(panning){stop(e);api.pan(p.x-last.x,p.y-last.y);last=p;api.render()}},true);
 function end(e){contacts.delete(e.pointerId);if(multi||panning){stop(e);if(!contacts.size){multi=false;panning=false;last=null;candidate=null;api.store()}}else candidate=null}
 canvas.addEventListener('pointerup',end,true);canvas.addEventListener('pointercancel',end,true);
 document.addEventListener('click',e=>{if(multi||panning){e.preventDefault();e.stopImmediatePropagation()}},true);
 window.addEventListener('blur',()=>{contacts.clear();multi=false;panning=false;candidate=null;last=null});
 for(const [id,factor]of [['viewIn',1.2],['viewOut',1/1.2],['plus',1.2],['minus',1/1.2]])document.querySelector('#'+id).onclick=()=>{zoom(api.zoom()*factor);api.store()};
 document.querySelector('#viewFit').onclick=fit;document.querySelector('#viewReset').onclick=fit;new ResizeObserver(place).observe(canvas);window.addEventListener('resize',place);place();return{zoom,fit,refresh:label};
};})(window);
