// Crop the generated 4x2 albedo atlas into reusable, packed Blender textures.
const sharp=require('sharp'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..'),DOC=path.join(ROOT,'docs/art/furniture-finish');
const names=['oak','terracotta','limestone','sage','linen','walnut','leaf','crust'];
(async()=>{
 const input=path.join(DOC,'sources/material-atlas.png'),{width,height}=await sharp(input).metadata(),tiles=[];
 fs.mkdirSync(path.join(DOC,'materials'),{recursive:true});
 for(let i=0;i<names.length;i++){
  const col=i%4,row=Math.floor(i/4),left=Math.round(col*width/4)+8,top=Math.round(row*height/2)+8;
  const rect={left,top,width:Math.round((col+1)*width/4)-8-left,height:Math.round((row+1)*height/2)-8-top};
  await sharp(input).extract(rect).resize(512,512).png().toFile(path.join(DOC,'materials',names[i]+'.png'));
  tiles.push({name:names[i],rect,file:'materials/'+names[i]+'.png'});
 }
 fs.writeFileSync(path.join(DOC,'materials.json'),JSON.stringify({source:'sources/material-atlas.png',width,height,tiles},null,2)+'\n');
 console.log('Packed '+tiles.length+' shared albedo materials');
})().catch(e=>{console.error(e);process.exit(1)});
