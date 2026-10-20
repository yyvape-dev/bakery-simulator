/* Directional doorway artwork. Threshold registration preserves the wall edge. */
(function(root){'use strict';
const base=new URL('.',document.currentScript.src);
const frames=root.BakeryDoorGeometry?.frames||{},images={},listeners=[];
let pending=Object.values(frames).reduce((n,list)=>n+list.length,0);
for(const [style,list] of Object.entries(frames)){images[style]=[];for(const [dir,frame] of list.entries()){const im=new Image();im.onload=()=>{images[style][dir]=im;settled()};im.onerror=settled;im.src=new URL(frame.file+'?v=1',base).href}}
function settled(){if(--pending===0)for(const fn of listeners.splice(0))fn()}
function ready(fn){if(pending===0)fn();else listeners.push(fn)}
function direction(w){return w.axis==='x'?(w.x===0?3:1):(w.y===0?2:0)}
function draw(c,p,w,tx,{style='timber',dir=direction(w),width=1,height=2.15}={}){
 const frame=frames[style]?.[dir],im=images[style]?.[dir];if(!frame||!im||frame.axis!==w.axis)return false;
 const a=p(w.x,w.y),b=p(w.x+(w.axis==='y'?width:0),w.y+(w.axis==='x'?width:0));
 const sx=(b.x-a.x)/(frame.b[0]-frame.a[0]),sy=tx*height/frame.height,shear=(b.y-a.y-sy*(frame.b[1]-frame.a[1]))/(frame.b[0]-frame.a[0]);
 c.save();c.transform(sx,shear,0,sy,a.x-sx*frame.a[0],a.y-shear*frame.a[0]-sy*frame.a[1]);c.drawImage(im,0,0);c.restore();return true;
}
root.BakeryDoorArt={draw,ready,direction};
})(window);
