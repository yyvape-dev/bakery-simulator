// Compare all 24 actual game sprites using the same fixed scene and characters.
const {chromium}=require('playwright'),{execFileSync}=require('child_process'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..'),OUT=path.join(ROOT,'docs/art/furniture-finish/review'),BEFORE='bc02309';
const types=['shelf','oven','register','prep','table','plant'];
const hook='window.__finishReview={state,get crew(){return crew},render,point,dims,characterMotion,furnitureViews,characterImages,workImages,characterSprite};';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const version of ['before','after']){
  const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{window.setInterval=()=>0});
  await p.route('http://bakery.test/**',r=>{
   const n=new URL(r.request().url()).pathname.slice(1)||'index.html',file=path.join(ROOT,n);if(!fs.existsSync(file))return r.fulfill({status:404,body:''});
   let body=version==='before'&&(n==='index.html'||/^assets\/\w+(?:_r[0-3])?\.webp$/.test(n))?execFileSync('git',['show',BEFORE+':'+n],{cwd:ROOT,maxBuffer:4*1024*1024}):fs.readFileSync(file);
   if(n==='index.html')body=body.toString().replace('})();',hook+'})();');return r.fulfill({body,contentType:n.endsWith('.html')?'text/html':n.endsWith('.js')?'application/javascript':n.endsWith('.css')?'text/css':n.endsWith('.json')?'application/json':'image/webp'});
  });
  await p.goto('http://bakery.test/?demo=motion');await p.waitForFunction(()=>Object.values(__finishReview.furnitureViews).flat().filter(Boolean).length===24&&Object.keys(__finishReview.characterImages).length===2&&Object.values(__finishReview.workImages).every(x=>Object.keys(x).length===4));
  const cells=[];
  for(const type of types)for(let rot=0;rot<4;rot++){
   const clip=await p.evaluate(({type,rot})=>{
    const t=__finishReview,o={id:50,type,x:4,y:4,rot};t.state.objects=[o];t.state.zoom=1.55;t.state.selection=null;
    for(const [i,a]of t.crew.staff.entries()){a.job=null;a.next=null;a.look={height:1,width:1,scale:1};a.x=i?7:3;a.y=i?4:6;a.dir=i?3:1;a.cell={x:a.x,y:a.y}}
    t.characterMotion.update(t.crew.staff,0);t.render();const[w,h]=t.dims(o),q=t.point(4+w/2,4+h/2),r=document.querySelector('canvas').getBoundingClientRect();
    return{x:Math.max(0,Math.round(r.x+q.x-125)),y:Math.max(0,Math.round(r.y+q.y-155)),width:260,height:270};
   },{type,rot});
   const name=`${type}-r${rot}-${version}.png`;await p.screenshot({path:path.join(OUT,name),clip});cells.push({name,type,rot});
  }
  const sheet=await browser.newPage({viewport:{width:1120,height:1900}});await sheet.setContent('<style>body{background:#faf4e8;color:#473b2f;font:14px sans-serif}main{display:grid;grid-template-columns:repeat(4,260px);gap:12px}figure{margin:0}img{display:block;width:260px;height:270px}figcaption{height:22px}</style><h1>家具6種・4方向 / '+version+'</h1><main>'+cells.map(x=>'<figure><figcaption>'+x.type+' / '+x.rot*90+'°</figcaption><img src="data:image/png;base64,'+fs.readFileSync(path.join(OUT,x.name)).toString('base64')+'"></figure>').join('')+'</main>');await sheet.screenshot({path:path.join(OUT,version+'-sheet.png'),fullPage:true});await sheet.close();
  // Mobile overview includes table/plant, which the motion demo does not place.
  for(const width of [320,390]){await p.setViewportSize({width,height:844});await p.evaluate(()=>{
   const t=__finishReview;t.state.zoom=1;t.state.objects=[{id:1,type:'shelf',x:1,y:1,rot:0},{id:2,type:'oven',x:5,y:1,rot:0},{id:3,type:'register',x:7,y:3,rot:0},{id:4,type:'prep',x:1,y:4,rot:0},{id:5,type:'table',x:4,y:5,rot:0},{id:6,type:'plant',x:7,y:6,rot:0}];for(const a of t.crew.staff){a.job=null;a.x=a.id==='owner'?3:7;a.y=8}t.render();
  });await p.screenshot({path:path.join(OUT,`shop-${width}-${version}.png`)});}
  if(errors.length)throw Error(errors.join('\n'));await p.close();
 }
 fs.writeFileSync(path.join(OUT,'index.html'),'<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>設置物の画像更新比較</title><style>body{max-width:1120px;margin:auto;padding:16px;background:#faf4e8;color:#473b2f;font:16px sans-serif}img{max-width:100%}.shops{display:flex;flex-wrap:wrap;gap:12px}.shops img{width:390px}</style><h1>設置物6種の画像更新</h1><p>2026-10-19。既存形状・正投影・接地を維持して共通手描き調素材を適用。制作時点の比較記録。</p><h2>ゲーム内・変更前後</h2><div class="shops"><img src="shop-390-before.png" alt="変更前"><img src="shop-390-after.png" alt="変更後"></div><h2>24方向・変更後</h2><img src="after-sheet.png" alt="変更後の6種24方向"><details><summary>変更前の24方向</summary><img src="before-sheet.png" alt="変更前の6種24方向"></details></html>');
 const index=path.join(OUT,'index.html'),work=['load','collect','deliver','checkout'];
 const details=work.filter(n=>fs.existsSync(path.join(OUT,'work-'+n+'.png'))).map(n=>'<details><summary>作業中 / '+n+'</summary><img src="work-'+n+'.png" alt="更新後の設備での'+n+'"></details>').join('');
 fs.writeFileSync(index,fs.readFileSync(index,'utf8').replace('</html>',details+'</html>'));
 console.log(JSON.stringify({out:OUT,baseline:BEFORE,cases:48,mobileOverviews:4}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
