const sharp=require('sharp'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),doc=path.join(root,'docs/art/doors'),out=path.join(root,'assets/doors');
// Threshold ends and vertical post height measured in the source cells.
// Order follows positive world X (0/2) or positive world Y (1/3).
const registration=[
 [{a:[188,259],b:[333,302],height:220},{a:[266,257],b:[134,302],height:220},{a:[146,249],b:[262,309],height:230},{a:[230,258],b:[106,302],height:220}],
 [{a:[189,254],b:[327,302],height:235},{a:[270,258],b:[132,301],height:235},{a:[145,248],b:[274,304],height:235},{a:[228,259],b:[101,299],height:235}],
 [{a:[180,233],b:[329,294],height:225},{a:[266,240],b:[137,292],height:225},{a:[138,229],b:[279,302],height:230},{a:[238,237],b:[104,296],height:225}]
];
(async()=>{fs.mkdirSync(out,{recursive:true});const source=path.join(doc,'directional-atlas.png'),{width,height}=await sharp(source).metadata(),frames={};
 for(const [row,style] of ['timber','sage','arch'].entries()){frames[style]=[];for(let dir=0;dir<4;dir++){
  const left=Math.round(dir*width/4),top=[0,330,655][row],w=Math.round((dir+1)*width/4)-left,h=[330,655,height][row]-top,offset=Math.round(row*height/3)-top;
  const file=`assets/doors/${style}-r${dir}.webp`;
  await sharp(source).extract({left,top,width:w,height:h}).webp({quality:90,alphaQuality:100}).toFile(path.join(root,file));
  const reg=registration[row][dir];frames[style].push({...reg,a:[reg.a[0],reg.a[1]+offset],b:[reg.b[0],reg.b[1]+offset],file,axis:dir%2?'x':'y',size:[w,h]});
 }}fs.writeFileSync(path.join(out,'geometry.json'),JSON.stringify({frames},null,2)+'\n');fs.writeFileSync(path.join(out,'geometry.js'),'window.BakeryDoorGeometry='+JSON.stringify({frames})+';\n');console.log('Packed 3 doorway styles × 4 directions');
})().catch(e=>{console.error(e);process.exit(1)});
