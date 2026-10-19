// Layout normalization only: source rectangles, measured foot anchors and common 256px cells.
const fs=require('fs'),path=require('path'),sharp=require('sharp');
const ROOT=path.resolve(__dirname,'../..'),DOC=path.join(ROOT,'docs/art/work-motions'),OUT=path.join(ROOT,'assets/characters/actions');
const specPath=path.join(DOC,'assembly.json');
async function pixels(file){return sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true})}
function bounds(data,info,rect){let l=Infinity,t=Infinity,r=-1,b=-1;for(let y=rect.top;y<rect.top+rect.height;y++)for(let x=rect.left;x<rect.left+rect.width;x++)if(data[(y*info.width+x)*4+3]>128){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y)}if(r<0)throw Error('Empty source');return[l,t,r+1,b+1]}
function foot(data,info,box){const [l,t,r,b]=box,top=Math.floor(b-(b-t)*.12),points=[];let sx=0,n=0;for(let y=top;y<b;y++)for(let x=l;x<r;x++)if(data[(y*info.width+x)*4+3]>128){sx+=x;n++;}return[sx/n,b-(b-t)*.025]}
async function initialize(){
 const sheets=[];
 for(const id of ['owner','noah']){
  const base=await pixels(path.join(ROOT,'docs/art/'+id+'-study/'+id+'.webp'));
  const heights=Array.from({length:4},(_,dir)=>{const b=bounds(base.data,base.info,{left:0,top:dir*256,width:256,height:256});return b[3]-b[1]});
  for(const kind of ['knead','carry','reach','checkout']){
   const source='sources/'+id+'-'+kind+'.png',src=await pixels(path.join(DOC,source)),cols=kind==='carry'?3:2,rows=[];
   // Pick the quietest row near each nominal boundary; a global equal split can cut feet/heads.
   for(let d=1;d<4;d++){let best=-1,min=Infinity,nominal=src.info.height*d/4;for(let y=Math.floor(nominal-src.info.height*.045);y<nominal+src.info.height*.045;y++){let n=0;for(let x=0;x<src.info.width;x++)if(src.data[(y*src.info.width+x)*4+3]>128)n++;if(n<min||n===min&&Math.abs(y-nominal)<Math.abs(best-nominal)){best=y;min=n}}rows.push(best)}
   const edges=[0,...rows,src.info.height],cells=[];
   for(let dir=0;dir<4;dir++){
    const raw=[];
    for(let frame=0;frame<cols;frame++){const rect={left:Math.floor(frame*src.info.width/cols),top:edges[dir],width:Math.floor((frame+1)*src.info.width/cols)-Math.floor(frame*src.info.width/cols),height:edges[dir+1]-edges[dir]},box=bounds(src.data,src.info,rect);raw.push({dir,frame,source,rect,box,contact:foot(src.data,src.info,box)})}
    const scale=heights[dir]/(raw.reduce((n,c)=>n+c.box[3]-c.box[1],0)/cols);
    for(const c of raw)cells.push({...c,scale});
   }
   sheets.push({id,kind,columns:cols,cells});
  }
 }
 fs.writeFileSync(specPath,JSON.stringify({frameSize:[256,256],anchor:[128.00010681152344,194.692138671875],sheets},null,2)+'\n');
}
async function pack(){
 const spec=JSON.parse(fs.readFileSync(specPath)),art={owner:{},noah:{}},report=[];
 fs.mkdirSync(OUT,{recursive:true});
 for(const sheet of spec.sheets){
  const layers=[],props=Array.from({length:4},()=>[]),cellReports=[];
  for(const cell of sheet.cells){
   const {rect,scale,contact}=cell,[l,t,r,b]=cell.box;
   // Crop to measured silhouette plus a 3px alpha margin, not all empty grid-cell padding.
   const left=Math.max(rect.left,l-3),top=Math.max(rect.top,t-3),width=Math.min(rect.left+rect.width,r+3)-left,height=Math.min(rect.top+rect.height,b+3)-top;
   const w=Math.round(width*scale),h=Math.round(height*scale),x=Math.round(spec.anchor[0]-(contact[0]-left)*scale),y=Math.round(spec.anchor[1]-(contact[1]-top)*scale);
   if(x<2||y<2||x+w>254||y+h>254)throw Error('Clipped cell '+sheet.id+' '+sheet.kind+' '+cell.dir+' '+cell.frame);
   const input=await sharp(path.join(DOC,cell.source)).extract({left,top,width,height}).resize(w,h,{kernel:'lanczos3',fit:'fill'}).png().toBuffer();
   layers.push({input,left:cell.frame*256+x,top:cell.dir*256+y});
   props[cell.dir][cell.frame]=cell.propPoint?[x+(cell.propPoint[0]-left)*scale,y+(cell.propPoint[1]-top)*scale]:cell.propAnchor||([[112,158],[144,158],[148,143],[108,143]][cell.dir]);
   cellReports.push({dir:cell.dir,frame:cell.frame,footResidual:[x+(contact[0]-left)*scale-spec.anchor[0],y+(contact[1]-top)*scale-spec.anchor[1]],bounds:[x,y,x+w,y+h]});
  }
  const name=sheet.id+'-'+sheet.kind+'.webp';
  await sharp({create:{width:sheet.columns*256,height:1024,channels:4,background:'#00000000'}}).composite(layers).webp({quality:94,effort:6}).toFile(path.join(OUT,name));
  art[sheet.id][sheet.kind]={file:'assets/characters/actions/'+name,columns:sheet.columns,propAnchors:props};report.push({id:sheet.id,kind:sheet.kind,cells:cellReports});
 }
 fs.writeFileSync(path.join(OUT,'art.js'),'window.BakeryWorkArt='+JSON.stringify(art)+';\n');
 fs.writeFileSync(path.join(OUT,'geometry.json'),JSON.stringify({frameSize:spec.frameSize,anchorPixels:spec.anchor,characters:art},null,2)+'\n');
 fs.writeFileSync(path.join(DOC,'assembly-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('Packed '+spec.sheets.length+' action sheets');
}
(async()=>{if(process.argv.includes('--init'))await initialize();await pack()})().catch(e=>{console.error(e);process.exit(1)});
