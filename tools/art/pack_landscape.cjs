// Pack generated oil-painted atlases. Mirrored terrain edges repeat without seams.
const sharp=require('sharp'),path=require('path');
const root=path.resolve(__dirname,'../..'),doc=path.resolve(root,process.argv[2]||'docs/art/landscape'),out=path.join(root,'assets/exterior');
(async()=>{
 const source=path.join(doc,'terrain-atlas.png'),{width,height}=await sharp(source).metadata();
 for(const [i,name] of ['meadow','sand','road'].entries()){
  const tile=await sharp(source).extract({left:Math.round(i*width/3)+8,top:8,width:Math.round(width/3)-16,height:height-16}).resize(256,256).png().toBuffer();
  const flopped=await sharp(tile).flop().toBuffer(),flipped=await sharp(tile).flip().toBuffer(),both=await sharp(tile).flip().flop().toBuffer();
  await sharp({create:{width:512,height:512,channels:3,background:'#a3a17e'}}).composite([{input:tile,left:0,top:0},{input:flopped,left:256,top:0},{input:flipped,left:0,top:256},{input:both,left:256,top:256}]).webp({quality:88}).toFile(path.join(out,name+'.webp'));
 }
 const sprites=path.join(doc,'scenery-atlas.png');
 const {width:sw,height:sh}=await sharp(sprites).metadata();
 for(const [name,x,y,w,h] of [['apple-tree',0,0,.5,.62],[process.argv[3]||'birch-tree',.5,0,.5,.62],['flowers',0,.62,.5,.38],['moss-stones',.5,.62,.5,.38]]){
  const cell=await sharp(sprites).extract({left:Math.round(x*sw),top:Math.round(y*sh),width:Math.round(w*sw),height:sh-Math.round(y*sh)<Math.round(h*sh)?sh-Math.round(y*sh):Math.round(h*sh)}).png().toBuffer();
  await sharp(cell).trim({threshold:12}).resize({width:512}).webp({quality:88,alphaQuality:100}).toFile(path.join(out,name+'.webp'));
 }
 console.log('Packed three seamless terrain tiles and four scenery sprites');
})().catch(e=>{console.error(e);process.exit(1)});
