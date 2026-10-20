/* Cosmetic world outside the playable room. All coordinates stay in shop tiles. */
(function(root){'use strict';
const styles={timber:{name:'木のガラス扉',frame:'#885a35',leaf:'#bd8b4c',awning:'#c78d50'},sage:{name:'セージの扉',frame:'#4d6959',leaf:'#83a08a',awning:'#718e76'},arch:{name:'アーチの扉',frame:'#b0754d',leaf:'#cd9c65',awning:'#b66f4f'}};
const textures={},listeners=[];const scenery=['apple-tree','blossom-tree','flowers','moss-stones'];let pending=10;
if(typeof Image!=='undefined')for(const name of ['meadow','sand','road','door-timber','door-sage','door-arch',...scenery]){const im=new Image();im.onload=()=>{textures[name]=im;done()};im.onerror=done;im.src='assets/exterior/'+name+'.webp?v=3'}
function done(){if(--pending===0)for(const fn of listeners.splice(0))fn()}
function ready(fn){if(pending===0)fn();else listeners.push(fn)}
function poly(c,pts,color,stroke){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();if(color){c.fillStyle=color;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=.7;c.stroke()}}
function quad(c,p,x,y,w,h,color,texture){const a=p(x,y),b=p(x+w,y),d=p(x,y+h);poly(c,[a,b,p(x+w,y+h),d],color);const im=textures[texture];if(im){c.save();c.transform((b.x-a.x)/w,(b.y-a.y)/w,(d.x-a.x)/h,(d.y-a.y)/h,a.x,a.y);c.globalAlpha=texture==='meadow'?.6:.94;const pattern=c.createPattern(im,'repeat');const density=texture==='meadow'?40:64;c.scale(1/density,1/density);c.fillStyle=pattern;c.fillRect(0,0,w*density,h*density);c.restore()}}
function stroke(c,pts,color,width){c.strokeStyle=color;c.lineWidth=width;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke()}
let terrainCache=null;
function background(c,p,w,h,entry,tx){
 const origin=p(0,0),unit=p(1,0),key=[c.canvas.width,c.canvas.height,origin.x,origin.y,unit.x,unit.y,w,h,entry.x,pending].join(',');
 if(terrainCache?.key!==key){const canvas=document.createElement('canvas');canvas.width=c.canvas.width;canvas.height=c.canvas.height;const layer=canvas.getContext('2d');layer.setTransform(c.getTransform());paintBackground(layer,p,w,h,entry,tx);terrainCache={key,canvas}}
 c.save();c.resetTransform();c.drawImage(terrainCache.canvas,0,0);c.restore();
}
// Stable brush dabs and sprite positions are scenery, never simulation state.
function dab(c,p,x,y,tx,i){
 const a=p(x,y);c.save();c.translate(a.x,a.y);c.rotate((i%7-3)*.19);
 c.fillStyle=['#8cc96f60','#f5dc7660','#50995745','#a2d97c55'][i%4];
 c.beginPath();c.ellipse(0,0,tx*(.18+i%3*.09),tx*.08,0,0,Math.PI*2);c.fill();c.restore();
}
function scenerySprite(c,p,name,x,y,width,tx){
 const im=textures[name];if(!im)return;const a=p(x,y),sw=width*tx,sh=sw*im.height/im.width;
 c.drawImage(im,a.x-sw/2,a.y-sh,sw,sh);
}
function paintBackground(c,p,w,h,entry,tx){
 quad(c,p,-100,-100,w+200,h+220,'#71bd58','meadow');
 // Broken brushwork softens the edge of the earth instead of a rectangular apron.
 for(let i=0;i<480;i++){const x=-26+(i*137%601)/10,y=-24+(i*193%631)/10;dab(c,p,x,y,tx,i)}
 quad(c,p,-.65,-.65,w+1.3,h+1.3,'#efd095','sand');
 const front=h+3.2;
 quad(c,p,-40,front-.35,w+80,4.15,'#efd4a3','sand');
 quad(c,p,-40,front,w+80,3.5,'#e8ca9b','road');
 quad(c,p,entry.x-.2,h+.05,1.4,front-h-.05,'#f3d296','sand');
 // Paint a soft, ragged verge along both sides of the old village lane.
 for(let i=0;i<180;i++){const x=-25+i*.38;for(const y of [front-.4,front+3.9])dab(c,p,x,y+(i%5)*.055,tx,i)}
 const plants=[];
 for(let i=0;i<15;i++){
  const x=-10+(i*73%293)/10,y=h+8+(i*47%107)/10;
  plants.push([i%4===0?'moss-stones':'flowers',x,y,2.8+i%3*.55]);
 }
 for(let i=0;i<8;i++)plants.push([i%3===0?'moss-stones':'flowers',i%2?-2.1:w+2.2,-1+i*1.7,2.2+i%3*.35]);
 plants.push(['flowers',entry.x-1.4,h+1.8,2.1],['flowers',entry.x+2.1,h+1.8,2.1]);
 plants.sort((a,b)=>(a[1]+a[2])-(b[1]+b[2]));
 for(const [name,x,y,width] of plants)scenerySprite(c,p,name,x,y,width,tx);
}
// Trees use fixed lot positions measured from the front of the original 12×12 shop.
// Depth expansion shifts the shop origin, so front-relative Y follows that shift.
const treeLot=[
 ['blossom-tree',-5.2,4.8,6.8],['apple-tree',-6.8,-1.5,6.4],
 ['blossom-tree',-3.6,-5.5,7.2],['apple-tree',2.5,-7.3,6.8],
 ['blossom-tree',8.2,-6.2,7.6],['apple-tree',13.8,-4.4,6.6],
 ['blossom-tree',16.2,1.2,7.1],['apple-tree',16.6,5.5,6.3]
];
function trees(w,h){return treeLot.map(([name,x,y,width],id)=>({id,name,x,y:y+h-12,width})).filter(t=>{
 const r=t.width*.35,margin=.8;
 // Clear the whole crown/root footprint before construction reaches it.
 return t.x+r< -margin||t.x-r>w+margin||t.y+r< -margin||t.y-r>h+margin;
})}
function drawTree(c,p,tree,tx){scenerySprite(c,p,tree.name,tree.x,tree.y,tree.width,tx)}
function roadside(c,p,w,h,entry,tx){const y=h+7.1;
 // Weathered cream wooden rails and warm lanterns belong to the painted village.
 c.save();c.lineCap='round';
 for(let x=-4;x<w+5;x+=2){if(Math.abs(x-entry.x)<2)continue;const a=p(x,y),b=p(x+1.7,y);
  for(const q of [a,b]){stroke(c,[q,{x:q.x,y:q.y-tx*.65}],'#82745b',tx*.13);stroke(c,[{x:q.x-tx*.025,y:q.y},{x:q.x-tx*.025,y:q.y-tx*.63}],'#fff0c9',tx*.065)}
  for(const z of [.3,.55])stroke(c,[{x:a.x,y:a.y-tx*z},{x:b.x,y:b.y-tx*z}],'#f6e4be',tx*.1);
 }
 for(const x of [-2.5,w+2.5]){const a=p(x,h+2.1),top={x:a.x,y:a.y-tx*3.6};
  stroke(c,[a,top],'#786549',tx*.2);stroke(c,[{x:a.x-tx*.035,y:a.y},{x:top.x-tx*.035,y:top.y}],'#baa078',tx*.07);
  const lx=top.x+tx*.38,ly=top.y+tx*.35;
  stroke(c,[top,{x:lx,y:top.y},{x:lx,y:ly}],'#786549',tx*.09);
  poly(c,[{x:lx-tx*.17,y:ly},{x:lx+tx*.17,y:ly},{x:lx+tx*.13,y:ly+tx*.43},{x:lx-tx*.13,y:ly+tx*.43}],'#f3d995','#75694d');
  stroke(c,[{x:lx-tx*.2,y:ly},{x:lx+tx*.2,y:ly}],'#75694d',tx*.09);
 }
 c.restore();
}
function entrance(c,p,w,h,entry,tx,style='timber'){
 for(let x=0;x<w;x++)if(x!==entry.x&&x!==entry.x+1)BakeryInterior.drawWall(c,p,{axis:'y',x,y:h,material:'plaster',type:'wall'},tx,{low:true});
 const s=styles[style]||styles.timber,x=entry.x-.15,y=h+.04,a=p(x,y),b=p(x+1.3,y),height=tx*2.9;
 const at=(u,v)=>({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u-height*v});
 const image=textures['door-'+style];
 const directional=root.BakeryDoorArt?.draw(c,p,{axis:'y',x:entry.x-.05,y},tx,{style,width:1.5,height:3.15});
 if(directional){}else if(image){const l=p(entry.x-.8,y),r=p(entry.x+1.5,y);c.save();c.transform(r.x-l.x,r.y-l.y,0,-tx*3.15,l.x,l.y);c.translate(0,1);c.scale(1,-1);c.drawImage(image,0,0,1,1);c.restore()}
 else{
 // Open leaf and clear central opening preserve the visible customer route.
 poly(c,[at(-.32,0),at(0,0),at(0,.94),at(-.32,.89)],s.leaf,s.frame);
 for(const u of [0,1])poly(c,[at(u-.065,0),at(u+.065,0),at(u+.065,1),at(u-.065,1)],s.frame);
 poly(c,[at(-.065,.92),at(1.065,.92),at(1.065,1.02),at(-.065,1.02)],s.frame);
 if(style==='arch'){c.strokeStyle=s.frame;c.lineWidth=tx*.12;c.beginPath();const l=at(0,.95),r=at(1,.95),t=at(.5,1.3);c.moveTo(l.x,l.y);c.quadraticCurveTo(t.x,t.y-tx*.15,r.x,r.y);c.stroke()}
 }
 const top=[at(-.3,1.08),at(1.3,1.08),at(1.3,.91),at(-.3,.91)];if(!directional)poly(c,top,s.awning,s.frame);
 c.save();const q=at(.5,1.26);c.translate(q.x,q.y);c.rotate(Math.atan2(b.y-a.y,b.x-a.x));c.fillStyle='#f8eacb';c.fillRect(-tx*.95,-tx*.19,tx*1.9,tx*.38);c.fillStyle='#60462e';c.font='bold '+Math.max(5,tx*.26)+'px sans-serif';c.textAlign='center';c.fillText('BAKERY',0,tx*.09);c.restore();
 const mat=[p(x-.15,y+.05),p(x+1.45,y+.05),p(x+1.45,y+.55),p(x-.15,y+.55)];poly(c,mat,'#8f9b70','#697751');
}
root.BakeryExterior={styles,ready,background,roadside,entrance,trees,drawTree};
})(window);
