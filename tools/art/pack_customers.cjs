// Pack four generated 4-direction / 3-pose sheets, then reuse fur palettes.
const fs=require('fs'),path=require('path'),sharp=require('sharp');
const root=path.resolve(__dirname,'../..'),doc=path.join(root,'docs/art/customers'),out=path.join(root,'assets/customers');
const species={rabbit:130,bird:105,cat:116,deer:132},variants={rabbit:['rabbit','rabbit-black'],bird:['bird-purple','bird-white'],cat:['cat-tabby','cat-white','cat-black'],deer:['deer']};
async function bounds(file,rect){const{data,info}=await sharp(file).extract(rect).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x0=info.width,y0=info.height,x1=0,y1=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>50){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}if(x1<=x0||y1<=y0)throw Error('Empty cell');let sum=0,weight=0;for(let y=Math.floor(y1-(y1-y0)*.12);y<=y1;y++)for(let x=x0;x<=x1;x++){const a=data[(y*info.width+x)*4+3];if(a>80){sum+=x*a;weight+=a}}return{data,info,x0,y0,x1,y1,footX:sum/weight,height:y1-y0+1}}
function palette(data,id){for(let i=0;i<data.length;i+=4){if(!data[i+3])continue;const r=data[i],g=data[i+1],b=data[i+2],l=.3*r+.59*g+.11*b;let mask=false,v;
 if(id==='rabbit-black'){mask=r>=g+2&&g>=b+6&&l>135;v=22+l*.18}
 if(id==='bird-white'){mask=r>g*1.08&&b>g*.65&&l>24;v=175+l*.32}
 if(id==='cat-white'||id==='cat-black'){mask=r>g*1.08&&g>b*1.12&&r-b>30&&l>48;v=id==='cat-white'?163+l*.34:17+l*.19}
 if(mask){data[i]=Math.min(250,v+3);data[i+1]=Math.min(250,v+2);data[i+2]=Math.min(250,v)}
 }return data}
(async()=>{fs.mkdirSync(out,{recursive:true});const report=[];for(const [id,targetHeight]of Object.entries(species)){
 const file=path.join(doc,id+'-source.png'),{width,height}=await sharp(file).metadata(),cells=[];
 const raw=await sharp(file).ensureAlpha().raw().toBuffer(),cuts=[0];for(let i=1;i<4;i++){const target=i*height/4;let best=Infinity,cut=Math.round(target);for(let y=Math.round(target-height/24);y<target+height/24;y++){let n=0;for(let x=0;x<width;x++)if(raw[(y*width+x)*4+3]>64)n++;const score=n*10000+Math.abs(y-target);if(score<best){best=score;cut=y}}cuts.push(cut)}cuts.push(height);
 for(let row=0;row<4;row++)for(let col=0;col<3;col++){const left=Math.round(col*width/3),top=cuts[row],rect={left,top,width:Math.round((col+1)*width/3)-left,height:cuts[row+1]-top};cells.push({...await bounds(file,rect),row,col})}
 const median=cells.map(c=>c.height).sort((a,b)=>a-b)[6],scale=targetHeight/median,layers=[];
 for(const c of cells){const cropped=await sharp(c.data,{raw:{width:c.info.width,height:c.info.height,channels:4}}).extract({left:c.x0,top:c.y0,width:c.x1-c.x0+1,height:c.height}).resize({height:Math.round(c.height*scale)}).png().toBuffer();const {width:w,height:h}=await sharp(cropped).metadata(),left=Math.round(128-(c.footX-c.x0)*scale),top=200-h;if(left<0||left+w>256||top<0)throw Error('Sprite exceeds cell: '+id);layers.push({input:cropped,left:c.col*256+left,top:c.row*256+top});}
 const {data,info}=await sharp({create:{width:768,height:1024,channels:4,background:'#00000000'}}).composite(layers).raw().toBuffer({resolveWithObject:true});
 for(const name of variants[id]){const pixels=palette(Buffer.from(data),name);await sharp(pixels,{raw:info}).webp({quality:92}).toFile(path.join(out,name+'.webp'));report.push({id:name,source:id+'-source.png',width:768,height:1024,frame:[256,256],anchor:[128,200],scale,frames:12})}
 }fs.writeFileSync(path.join(doc,'assembly.json'),JSON.stringify(report,null,2)+'\n');console.log('Packed 8 customers, 96 cells')})().catch(e=>{console.error(e);process.exit(1)});
