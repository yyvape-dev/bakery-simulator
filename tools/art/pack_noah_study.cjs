// Technical atlas assembly: explicit source rectangles and measured ground anchors.
// Artwork is generated/edited with imagegen; this script only crops, scales and packs.
const fs=require('fs'),path=require('path'),sharp=require('sharp');
const ROOT=path.resolve(__dirname,'../..');
async function main(){
 const manifestPath=process.argv[2]||path.join(ROOT,'docs/art/noah-study/assembly.json');
 const m=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 const character=m.character||'noah';
 if(!['noah','owner'].includes(character))throw Error('Unknown character');
 const layers=[],report=[];
 for(const item of m.cells){
  const source=path.resolve(path.dirname(manifestPath),item.source);
  const [left,top,width,height]=item.rect;
  const scale=item.sourceScale||m.sourceScale;
  const scaleX=item.sourceScaleX||scale;
  const w=Math.round(width*scaleX),h=Math.round(height*scale);
  const x=Math.round(m.anchor[0]-(item.contact[0]-left)*scaleX);
  const y=Math.round(m.anchor[1]-(item.contact[1]-top)*scale);
  if(x<0||y<0||x+w>256||y+h>256)throw Error('Cell exceeds 256px canvas');
  const input=await sharp(source).extract({left,top,width,height}).resize(w,h,{kernel:'lanczos3',fit:'fill'}).png().toBuffer();
  layers.push({input,left:item.frame*256+x,top:item.dir*256+y});
  const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let l=w,t=h,r=-1,b=-1;
  for(let iy=0;iy<h;iy++)for(let ix=0;ix<w;ix++)if(data[(iy*w+ix)*4+3]>=128){l=Math.min(l,ix);t=Math.min(t,iy);r=Math.max(r,ix);b=Math.max(b,iy)}
  report.push({dir:item.dir,frame:item.frame,sourceScale:[scaleX,scale],bounds:[l+x,t+y,r+x,b+y],anchorResidual:[x+(item.contact[0]-left)*scaleX-m.anchor[0],y+(item.contact[1]-top)*scale-m.anchor[1]]});
 }
 if(layers.length!==12||new Set(m.cells.map(x=>x.dir+','+x.frame)).size!==12)throw Error('Need all twelve unique cells');
 const out=path.dirname(manifestPath);
 await sharp({create:{width:768,height:1024,channels:4,background:'#00000000'}}).composite(layers).webp({quality:94,effort:6}).toFile(path.join(out,character+'.webp'));
 fs.writeFileSync(path.join(out,'assembly-report.json'),JSON.stringify({frameSize:[256,256],anchorPixels:m.anchor,sourceScale:m.sourceScale,cells:report},null,2)+'\n');
 console.log(JSON.stringify(report));
}
main().catch(e=>{console.error(e);process.exit(1)});
