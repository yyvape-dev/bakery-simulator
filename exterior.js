/* Cosmetic world outside the playable room. All coordinates stay in shop tiles. */
(function(root){'use strict';
const styles={timber:{name:'木のガラス扉',frame:'#885a35',leaf:'#bd8b4c',awning:'#c78d50'},sage:{name:'セージの扉',frame:'#4d6959',leaf:'#83a08a',awning:'#718e76'},arch:{name:'アーチの扉',frame:'#b0754d',leaf:'#cd9c65',awning:'#b66f4f'}};
const textures={},listeners=[];let pending=6;
if(typeof Image!=='undefined')for(const name of ['meadow','sand','road','door-timber','door-sage','door-arch']){const im=new Image();im.onload=()=>{textures[name]=im;done()};im.onerror=done;im.src='assets/exterior/'+name+'.webp?v=1'}
function done(){if(--pending===0)for(const fn of listeners.splice(0))fn()}
function ready(fn){if(pending===0)fn();else listeners.push(fn)}
function poly(c,pts,color,stroke){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();if(color){c.fillStyle=color;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=.7;c.stroke()}}
function quad(c,p,x,y,w,h,color,texture){const a=p(x,y),b=p(x+w,y),d=p(x,y+h);poly(c,[a,b,p(x+w,y+h),d],color);const im=textures[texture];if(im){c.save();c.transform((b.x-a.x)/w,(b.y-a.y)/w,(d.x-a.x)/h,(d.y-a.y)/h,a.x,a.y);c.globalAlpha=.72;const pattern=c.createPattern(im,'repeat');c.scale(1/64,1/64);c.fillStyle=pattern;c.fillRect(0,0,w*64,h*64);c.restore()}}
function stroke(c,pts,color,width){c.strokeStyle=color;c.lineWidth=width;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke()}
let terrainCache=null;
function background(c,p,w,h,entry,tx){
 const origin=p(0,0),unit=p(1,0),key=[c.canvas.width,c.canvas.height,origin.x,origin.y,unit.x,unit.y,w,h,entry.x,pending].join(',');
 if(terrainCache?.key!==key){const canvas=document.createElement('canvas');canvas.width=c.canvas.width;canvas.height=c.canvas.height;const layer=canvas.getContext('2d');layer.setTransform(c.getTransform());paintBackground(layer,p,w,h,entry,tx);terrainCache={key,canvas}}
 c.save();c.resetTransform();c.drawImage(terrainCache.canvas,0,0);c.restore();
}
function paintBackground(c,p,w,h,entry,tx){
 quad(c,p,-100,-100,w+200,h+220,'#b5b58b','meadow');
 // Packed sandy ground gives the shop breathing space on all four sides.
 quad(c,p,-1,-1,w+2,h+2,'#cab793','sand');
 const front=h+3.2;quad(c,p,-18,front,w+36,3.5,'#777e79','road');
 quad(c,p,-18,front-.7,w+36,.7,'#c6c1ac','sand');quad(c,p,-18,front+3.5,w+36,.45,'#c6c1ac','sand');
 for(let x=-17;x<w+18;x+=3)quad(c,p,x,front+1.7,1.4,.06,'#efe4bd');
 for(let x=-18;x<w+18;x+=1.2){const a=p(x,front),b=p(x+1.2,front);stroke(c,[a,b],'#ece3cb',Math.max(1,tx*.06))}
 quad(c,p,entry.x-.2,h+.05,1.4,front-h-.75,'#d2b98d','sand');
 // Sparse deterministic tufts and stones; no animated random noise.
 for(let i=0;i<170;i++){const x=-9+(i*37%311)/10,y=-8+(i*53%251)/10;if(x>-1.5&&x<w+1.5&&y>-1.5&&y<h+1.7||y>front-.9&&y<front+4.4)continue;const a=p(x,y);stroke(c,[{x:a.x-tx*.13,y:a.y},{x:a.x,y:a.y-tx*.22},{x:a.x+tx*.09,y:a.y-tx*.04}],'#738b526b',Math.max(.6,tx*.045));}
}
function roadside(c,p,w,h,entry,tx){const y=h+6.95;
 // Rail is interrupted at the approach to the bakery.
 for(let x=-4;x<w+5;x+=2){if(Math.abs(x-entry.x)<2)continue;const a=p(x,y),b=p(x+1.75,y);for(const q of [a,b])stroke(c,[q,{x:q.x,y:q.y-tx*.65}],'#687c70',tx*.11);stroke(c,[{x:a.x,y:a.y-tx*.55},{x:b.x,y:b.y-tx*.55}],'#d3dacf',tx*.15);}
 for(const x of [-2.5,w+2.5]){const a=p(x,h+2.1),top={x:a.x,y:a.y-tx*4.7};stroke(c,[a,top],'#766b55',tx*.19);stroke(c,[{x:top.x-tx*.5,y:top.y+tx*.35},{x:top.x+tx*.65,y:top.y+tx*.35}],'#82735a',tx*.13);c.fillStyle='#d8ded2';c.fillRect(top.x-tx*.35,top.y+tx*.1,tx*.16,tx*.3);}
 const a=p(-2.5,h+2.1),b=p(w+2.5,h+2.1);c.strokeStyle='#5b615277';c.lineWidth=Math.max(.6,tx*.035);c.beginPath();c.moveTo(a.x,a.y-tx*4.4);c.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2-tx*3.3,b.x,b.y-tx*4.4);c.stroke();
}
function entrance(c,p,w,h,entry,tx,style='timber'){
 for(let x=0;x<w;x++)if(x!==entry.x&&x!==entry.x+1)BakeryInterior.drawWall(c,p,{axis:'y',x,y:h,material:'plaster',type:'wall'},tx,{low:true});
 const s=styles[style]||styles.timber,x=entry.x-.15,y=h+.04,a=p(x,y),b=p(x+1.3,y),height=tx*2.9;
 const at=(u,v)=>({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u-height*v});
 const image=textures['door-'+style];
 if(image){const l=p(entry.x-.8,y),r=p(entry.x+1.5,y);c.save();c.transform(r.x-l.x,r.y-l.y,0,-tx*3.15,l.x,l.y);c.translate(0,1);c.scale(1,-1);c.drawImage(image,0,0,1,1);c.restore()}
 else{
 // Open leaf and clear central opening preserve the visible customer route.
 poly(c,[at(-.32,0),at(0,0),at(0,.94),at(-.32,.89)],s.leaf,s.frame);
 for(const u of [0,1])poly(c,[at(u-.065,0),at(u+.065,0),at(u+.065,1),at(u-.065,1)],s.frame);
 poly(c,[at(-.065,.92),at(1.065,.92),at(1.065,1.02),at(-.065,1.02)],s.frame);
 if(style==='arch'){c.strokeStyle=s.frame;c.lineWidth=tx*.12;c.beginPath();const l=at(0,.95),r=at(1,.95),t=at(.5,1.3);c.moveTo(l.x,l.y);c.quadraticCurveTo(t.x,t.y-tx*.15,r.x,r.y);c.stroke()}
 }
 const top=[at(-.3,1.08),at(1.3,1.08),at(1.3,.91),at(-.3,.91)];poly(c,top,s.awning,s.frame);
 c.save();const q=at(.5,1.26);c.translate(q.x,q.y);c.rotate(Math.atan2(b.y-a.y,b.x-a.x));c.fillStyle='#f8eacb';c.fillRect(-tx*.95,-tx*.19,tx*1.9,tx*.38);c.fillStyle='#60462e';c.font='bold '+Math.max(5,tx*.26)+'px sans-serif';c.textAlign='center';c.fillText('BAKERY',0,tx*.09);c.restore();
 const mat=[p(x-.15,y+.05),p(x+1.45,y+.05),p(x+1.45,y+.55),p(x-.15,y+.55)];poly(c,mat,'#8f9b70','#697751');
}
root.BakeryExterior={styles,ready,background,roadside,entrance};
})(window);
