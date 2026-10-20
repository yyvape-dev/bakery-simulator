// Build the 54 new textures and embed the registry; original six finishes stay intact.
const fs=require('fs'),path=require('path'),sharp=require('sharp');
const root=path.resolve(__dirname,'../..'),doc=path.join(root,'docs/art/interior-catalog'),out=path.join(root,'assets/interior/catalog');
(async()=>{const source=JSON.parse(fs.readFileSync(path.join(doc,'catalog.json'))),registries={};fs.mkdirSync(out,{recursive:true});
 for(const [kind,prefix]of [['floors','floor'],['walls','wall']]){const registry={};for(const [i,[id,m]]of Object.entries(source[kind]).entries()){
  const {prompt,...entry}=m;registry[id]=entry;if(!m.catalog)continue;
  const file=`assets/interior/catalog/${prefix}-${id}.webp`;entry.file=file;
  const atlas=path.join(doc,`${prefix}-atlas-${Math.floor(i/15)}.png`);if(!fs.existsSync(atlas))throw Error('Missing retained atlas: '+atlas);
  const {width,height}=await sharp(atlas).metadata(),col=i%5,row=Math.floor(i%15/5),left=Math.round(col*width/5)+Math.round(width/5*.06),top=Math.round(row*height/3)+Math.round(height/3*.1);
  const cell=await sharp(atlas).extract({left,top,width:Math.round((col+1)*width/5)-left-Math.round(width/5*.06),height:Math.round((row+1)*height/3)-top-Math.round(height/3*.1)}).png().toBuffer();
  if(kind==='walls'){const tile=await sharp(cell).resize(256,256).png().toBuffer(),mirror=await sharp(tile).flop().toBuffer();await sharp({create:{width:512,height:256,channels:3,background:m.color}}).composite([{input:tile,left:0,top:0},{input:mirror,left:256,top:0}]).webp({quality:87}).toFile(path.join(root,file));continue}
  const tile=await sharp(cell).resize(128,128).png().toBuffer();
  // Mirror opposite quadrants so the material joins across cell boundaries.
  const tiles=await Promise.all([sharp(tile).flop().toBuffer(),sharp(tile).flip().toBuffer(),sharp(tile).flip().flop().toBuffer()]);
  await sharp({create:{width:256,height:256,channels:3,background:m.color}}).composite([{input:tile,left:0,top:0},{input:tiles[0],left:128,top:0},{input:tiles[1],left:0,top:128},{input:tiles[2],left:128,top:128}]).webp({quality:87}).toFile(path.join(root,file));
 }registries[kind]=registry;}
 Object.assign(registries.walls.plaster,{top:'#fff4dd',side:'#b7ad94'});Object.assign(registries.walls.wood,{top:'#e0bf8a',side:'#826647'});Object.assign(registries.walls.brick,{top:'#ddb08b',side:'#89583e'});
 let code=fs.readFileSync(path.join(root,'interior.js'),'utf8');const start=code.indexOf('const floors='),end=code.indexOf('const key=',start);
 code=code.slice(0,start)+'const floors='+JSON.stringify(registries.floors,null,1)+';\nconst materials='+JSON.stringify(registries.walls,null,1)+';\n'+code.slice(end);fs.writeFileSync(path.join(root,'interior.js'),code);
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(registries,null,2)+'\n');console.log('Registered 30 floors + 30 walls; packed available atlas cells');
})().catch(e=>{console.error(e);process.exit(1)});
