/* Eight generic bipedal customers; rendering never changes routing or transactions. */
(function(root){'use strict';
const catalog=[{id:'rabbit',name:'うさぎ'},{id:'rabbit-black',name:'黒うさぎ'},{id:'bird-purple',name:'暗い紫の鳥'},{id:'bird-white',name:'白い鳥'},{id:'cat-tabby',name:'茶とら猫'},{id:'cat-white',name:'白猫'},{id:'cat-black',name:'黒猫'},{id:'deer',name:'シカ'}];
const valid=id=>catalog.some(a=>a.id===id),pick=n=>catalog[Math.max(0,Math.floor(n))%catalog.length].id;
function create(changed){const images={};for(const {id}of catalog){const im=new Image();im.onload=()=>{images[id]=im;changed()};im.src='assets/customers/'+id+'.webp?v=1'}
 function sprite(p,who,tx){const im=images[who.appearance]||images.rabbit;if(!im)return null;const at=p(who.x+.5,who.y+.5),scale=tx/43.09983825683594,frame=who.next?[0,1,2,1][Math.floor((who.walk||0)/.16)%4]:1;return{im,frame,dir:who.direction||0,x:at.x-128*scale,y:at.y-200*scale,w:256*scale,h:256*scale}}
 function draw(c,p,who,tx){const sp=sprite(p,who,tx),at=p(who.x+.5,who.y+.5);
  c.save();c.fillStyle='#6348302b';c.beginPath();c.ellipse(at.x,at.y,tx*.28,tx*.54*.18,0,0,Math.PI*2);c.fill();if(sp)c.drawImage(sp.im,sp.frame*256,sp.dir*256,256,256,sp.x,sp.y,sp.w,sp.h);else{c.font=Math.max(17,tx*.95)+'px sans-serif';c.textAlign='center';c.fillStyle='#614b33';c.fillText('🐾',at.x,at.y)}c.restore();return{anchor:at,frame:sp?.frame||0,dir:sp?.dir||0};
 }

 return{images,draw,sprite};
}
root.BakeryCustomerArt={catalog,valid,pick,create};
})(window);
