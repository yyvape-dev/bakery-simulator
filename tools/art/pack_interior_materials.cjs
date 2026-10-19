// Pack the generated six-swatch albedo atlas for the live canvas renderer.
const sharp=require('sharp'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),source=path.join(root,'docs/art/interior-finish/material-atlas.png');
const names=['floor-wood','floor-cream','floor-stone','wall-plaster','wall-wood','wall-brick'];
(async()=>{const {width,height}=await sharp(source).metadata(),out=path.join(root,'assets/interior');fs.mkdirSync(out,{recursive:true});const files=[];
 for(let i=0;i<6;i++){const x=i%3,y=Math.floor(i/3),left=Math.round(x*width/3)+6,top=Math.round(y*height/2)+6;
 const crop={left,top,width:Math.round((x+1)*width/3)-left-6,height:Math.round((y+1)*height/2)-top-6};
 await sharp(source).extract(crop).resize(256,256).webp({quality:84}).toFile(path.join(out,names[i]+'.webp'));files.push({name:names[i],crop});}
 fs.writeFileSync(path.join(root,'docs/art/interior-finish/materials.json'),JSON.stringify({source:'material-atlas.png',width,height,files},null,2)+'\n');console.log('Packed 6 interior materials');
})().catch(e=>{console.error(e);process.exit(1)});
