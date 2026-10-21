/* Independent floor tiles and boundary walls; topology uses edges, never a background image. */
(function(root){'use strict';
const floors={
 "wood": {
  "name": "木床",
  "group": "木目",
  "cost": 8,
  "color": "#cda573",
  "catalog": false
 },
 "oak-milk": {
  "name": "ミルクオーク",
  "group": "木目",
  "cost": 9,
  "color": "#e5d5b6",
  "catalog": true,
  "file": "assets/interior/catalog/floor-oak-milk.webp"
 },
 "walnut": {
  "name": "ウォルナット",
  "group": "木目",
  "cost": 10,
  "color": "#86634b",
  "catalog": true,
  "file": "assets/interior/catalog/floor-walnut.webp"
 },
 "chestnut": {
  "name": "栗の木床",
  "group": "木目",
  "cost": 9,
  "color": "#b78451",
  "catalog": true,
  "file": "assets/interior/catalog/floor-chestnut.webp"
 },
 "pine-white": {
  "name": "白いパイン",
  "group": "木目",
  "cost": 9,
  "color": "#e9dfca",
  "catalog": true,
  "file": "assets/interior/catalog/floor-pine-white.webp"
 },
 "herringbone-honey": {
  "name": "ヘリンボーン・蜜色",
  "group": "寄木",
  "cost": 12,
  "color": "#c99a60",
  "catalog": true,
  "layout": "herringbone",
  "file": "assets/interior/catalog/floor-herringbone-honey.webp"
 },
 "herringbone-milk": {
  "name": "ヘリンボーン・ミルク",
  "group": "寄木",
  "cost": 12,
  "color": "#ded1b8",
  "catalog": true,
  "layout": "herringbone",
  "file": "assets/interior/catalog/floor-herringbone-milk.webp"
 },
 "herringbone-walnut": {
  "name": "ヘリンボーン・胡桃",
  "group": "寄木",
  "cost": 13,
  "color": "#8f6750",
  "catalog": true,
  "layout": "herringbone",
  "file": "assets/interior/catalog/floor-herringbone-walnut.webp"
 },
 "chevron-oak": {
  "name": "フレンチ寄木",
  "group": "寄木",
  "cost": 14,
  "color": "#bc8d5b",
  "catalog": true,
  "file": "assets/interior/catalog/floor-chevron-oak.webp"
 },
 "parquet-walnut": {
  "name": "市松パーケット",
  "group": "寄木",
  "cost": 14,
  "color": "#a27b57",
  "catalog": true,
  "file": "assets/interior/catalog/floor-parquet-walnut.webp"
 },
 "stone": {
  "name": "石床",
  "group": "石目",
  "cost": 10,
  "color": "#b8c5bc",
  "catalog": false
 },
 "limestone": {
  "name": "クリーム石灰岩",
  "group": "石目",
  "cost": 11,
  "color": "#ded2b5",
  "catalog": true,
  "file": "assets/interior/catalog/floor-limestone.webp"
 },
 "travertine": {
  "name": "トラバーチン",
  "group": "石目",
  "cost": 12,
  "color": "#d3bc98",
  "catalog": true,
  "file": "assets/interior/catalog/floor-travertine.webp"
 },
 "marble": {
  "name": "白い大理石",
  "group": "石目",
  "cost": 15,
  "color": "#ece5d9",
  "catalog": true,
  "file": "assets/interior/catalog/floor-marble.webp"
 },
 "slate": {
  "name": "青灰のスレート",
  "group": "石目",
  "cost": 12,
  "color": "#81918e",
  "catalog": true,
  "file": "assets/interior/catalog/floor-slate.webp"
 },
 "cream": {
  "name": "クリームタイル",
  "group": "タイル",
  "cost": 6,
  "color": "#f4dcb6",
  "catalog": false
 },
 "terracotta": {
  "name": "テラコッタ",
  "group": "タイル",
  "cost": 10,
  "color": "#cf9069",
  "catalog": true,
  "file": "assets/interior/catalog/floor-terracotta.webp"
 },
 "hex-white": {
  "name": "白い六角タイル",
  "group": "タイル",
  "cost": 11,
  "color": "#e9e5d2",
  "catalog": true,
  "file": "assets/interior/catalog/floor-hex-white.webp"
 },
 "hex-sage": {
  "name": "セージの六角タイル",
  "group": "タイル",
  "cost": 12,
  "color": "#9db49c",
  "catalog": true,
  "file": "assets/interior/catalog/floor-hex-sage.webp"
 },
 "tile-blue": {
  "name": "青い陶器タイル",
  "group": "タイル",
  "cost": 12,
  "color": "#86a9b0",
  "catalog": true,
  "file": "assets/interior/catalog/floor-tile-blue.webp"
 },
 "checker-cream": {
  "name": "クリームの市松",
  "group": "柄タイル",
  "cost": 12,
  "color": "#dcc9a4",
  "catalog": true,
  "file": "assets/interior/catalog/floor-checker-cream.webp"
 },
 "checker-rose": {
  "name": "ローズの市松",
  "group": "柄タイル",
  "cost": 12,
  "color": "#d3b5a8",
  "catalog": true,
  "file": "assets/interior/catalog/floor-checker-rose.webp"
 },
 "encaustic-blue": {
  "name": "青いセメントタイル",
  "group": "柄タイル",
  "cost": 15,
  "color": "#9eafb2",
  "catalog": true,
  "file": "assets/interior/catalog/floor-encaustic-blue.webp"
 },
 "encaustic-coral": {
  "name": "珊瑚のセメントタイル",
  "group": "柄タイル",
  "cost": 15,
  "color": "#c99e8b",
  "catalog": true,
  "file": "assets/interior/catalog/floor-encaustic-coral.webp"
 },
 "flower-mosaic": {
  "name": "小花のモザイク",
  "group": "柄タイル",
  "cost": 16,
  "color": "#c9d2b9",
  "catalog": true,
  "file": "assets/interior/catalog/floor-flower-mosaic.webp"
 },
 "cork": {
  "name": "コルク",
  "group": "素材",
  "cost": 9,
  "color": "#bd9569",
  "catalog": true,
  "file": "assets/interior/catalog/floor-cork.webp"
 },
 "linen-beige": {
  "name": "リネン・生成り",
  "group": "素材",
  "cost": 10,
  "color": "#d4c4a7",
  "catalog": true,
  "file": "assets/interior/catalog/floor-linen-beige.webp"
 },
 "linen-sage": {
  "name": "リネン・セージ",
  "group": "素材",
  "cost": 10,
  "color": "#a7b69b",
  "catalog": true,
  "file": "assets/interior/catalog/floor-linen-sage.webp"
 },
 "terrazzo-cream": {
  "name": "クリームテラゾー",
  "group": "素材",
  "cost": 13,
  "color": "#e5d8be",
  "catalog": true,
  "file": "assets/interior/catalog/floor-terrazzo-cream.webp"
 },
 "terrazzo-rose": {
  "name": "ローズテラゾー",
  "group": "素材",
  "cost": 13,
  "color": "#dfc3b5",
  "catalog": true,
  "file": "assets/interior/catalog/floor-terrazzo-rose.webp"
 }
};
const materials={
 "plaster": {
  "name": "しっくい",
  "group": "塗り壁",
  "cost": 30,
  "color": "#e5dec7",
  "catalog": false,
  "face": "#e5dec7",
  "top": "#fff4dd",
  "side": "#b7ad94"
 },
 "ivory-paint": {
  "name": "バニラの塗り壁",
  "group": "塗り壁",
  "cost": 30,
  "color": "#f0e2c7",
  "catalog": true,
  "face": "#f0e2c7",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-ivory-paint.webp"
 },
 "peach-plaster": {
  "name": "ピーチの塗り壁",
  "group": "塗り壁",
  "cost": 32,
  "color": "#e9c8b3",
  "catalog": true,
  "face": "#e9c8b3",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-peach-plaster.webp"
 },
 "sage-paint": {
  "name": "セージの塗り壁",
  "group": "塗り壁",
  "cost": 32,
  "color": "#acc0a3",
  "catalog": true,
  "face": "#acc0a3",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-sage-paint.webp"
 },
 "blue-paint": {
  "name": "空色の塗り壁",
  "group": "塗り壁",
  "cost": 32,
  "color": "#b2c8cf",
  "catalog": true,
  "face": "#b2c8cf",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-blue-paint.webp"
 },
 "oat-weave": {
  "name": "オートミール織り",
  "group": "織物",
  "cost": 35,
  "color": "#d5c6ab",
  "catalog": true,
  "face": "#d5c6ab",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-oat-weave.webp"
 },
 "cream-linen": {
  "name": "クリームリネン",
  "group": "織物",
  "cost": 35,
  "color": "#eee1c9",
  "catalog": true,
  "face": "#eee1c9",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-cream-linen.webp"
 },
 "rose-fabric": {
  "name": "ローズの織物",
  "group": "織物",
  "cost": 37,
  "color": "#d6b6b3",
  "catalog": true,
  "face": "#d6b6b3",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-rose-fabric.webp"
 },
 "grasscloth": {
  "name": "草編みクロス",
  "group": "織物",
  "cost": 38,
  "color": "#b6ae87",
  "catalog": true,
  "face": "#b6ae87",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-grasscloth.webp"
 },
 "blue-linen": {
  "name": "青灰のリネン",
  "group": "織物",
  "cost": 37,
  "color": "#a7b9c1",
  "catalog": true,
  "face": "#a7b9c1",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-blue-linen.webp"
 },
 "wood": {
  "name": "木",
  "group": "木・レンガ",
  "cost": 40,
  "color": "#b89162",
  "catalog": false,
  "face": "#b89162",
  "top": "#e0bf8a",
  "side": "#826647"
 },
 "white-beadboard": {
  "name": "白い板壁",
  "group": "木・レンガ",
  "cost": 42,
  "color": "#e6dfca",
  "catalog": true,
  "face": "#e6dfca",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-white-beadboard.webp"
 },
 "honey-wainscot": {
  "name": "蜂蜜色の腰壁",
  "group": "木・レンガ",
  "cost": 45,
  "color": "#d8c5a3",
  "catalog": true,
  "face": "#d8c5a3",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-honey-wainscot.webp"
 },
 "brick": {
  "name": "レンガ",
  "group": "木・レンガ",
  "cost": 50,
  "color": "#bc805f",
  "catalog": false,
  "face": "#bc805f",
  "top": "#ddb08b",
  "side": "#89583e"
 },
 "cream-brick": {
  "name": "白いレンガ",
  "group": "木・レンガ",
  "cost": 48,
  "color": "#e5d8bf",
  "catalog": true,
  "face": "#e5d8bf",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-cream-brick.webp"
 },
 "tiny-flowers": {
  "name": "野の小花",
  "group": "花・葉",
  "cost": 45,
  "color": "#ece0c8",
  "catalog": true,
  "face": "#ece0c8",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-tiny-flowers.webp"
 },
 "rose-vine": {
  "name": "ローズのつる",
  "group": "花・葉",
  "cost": 50,
  "color": "#e3cec0",
  "catalog": true,
  "face": "#e3cec0",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-rose-vine.webp"
 },
 "lemon-leaf": {
  "name": "レモンの葉",
  "group": "花・葉",
  "cost": 48,
  "color": "#dce1bd",
  "catalog": true,
  "face": "#dce1bd",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-lemon-leaf.webp"
 },
 "daisy-field": {
  "name": "デイジー畑",
  "group": "花・葉",
  "cost": 48,
  "color": "#c5d5bd",
  "catalog": true,
  "face": "#c5d5bd",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-daisy-field.webp"
 },
 "olive-branch": {
  "name": "オリーブの枝",
  "group": "花・葉",
  "cost": 47,
  "color": "#e5e2ca",
  "catalog": true,
  "face": "#e5e2ca",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-olive-branch.webp"
 },
 "sage-stripe": {
  "name": "セージの縞",
  "group": "縞・幾何",
  "cost": 40,
  "color": "#cad6bb",
  "catalog": true,
  "face": "#cad6bb",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-sage-stripe.webp"
 },
 "rose-stripe": {
  "name": "ローズの縞",
  "group": "縞・幾何",
  "cost": 40,
  "color": "#e3c6bd",
  "catalog": true,
  "face": "#e3c6bd",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-rose-stripe.webp"
 },
 "gingham": {
  "name": "ミルクのギンガム",
  "group": "縞・幾何",
  "cost": 43,
  "color": "#dfd3b7",
  "catalog": true,
  "face": "#dfd3b7",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-gingham.webp"
 },
 "blue-diamond": {
  "name": "青いひし形",
  "group": "縞・幾何",
  "cost": 45,
  "color": "#b6c8cd",
  "catalog": true,
  "face": "#b6c8cd",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-blue-diamond.webp"
 },
 "peach-scallop": {
  "name": "ピーチのうろこ",
  "group": "縞・幾何",
  "cost": 45,
  "color": "#e4c5b1",
  "catalog": true,
  "face": "#e4c5b1",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-peach-scallop.webp"
 },
 "subway-cream": {
  "name": "白いサブウェイ",
  "group": "タイル・石",
  "cost": 45,
  "color": "#e9e2ce",
  "catalog": true,
  "face": "#e9e2ce",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-subway-cream.webp"
 },
 "subway-sage": {
  "name": "セージのタイル",
  "group": "タイル・石",
  "cost": 47,
  "color": "#abc0ab",
  "catalog": true,
  "face": "#abc0ab",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-subway-sage.webp"
 },
 "moroccan-blue": {
  "name": "青いモロッカン",
  "group": "タイル・石",
  "cost": 55,
  "color": "#a3bbc3",
  "catalog": true,
  "face": "#a3bbc3",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-moroccan-blue.webp"
 },
 "terrazzo-peach": {
  "name": "ピーチのテラゾー",
  "group": "タイル・石",
  "cost": 50,
  "color": "#e5d2bd",
  "catalog": true,
  "face": "#e5d2bd",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-terrazzo-peach.webp"
 },
 "stone-greige": {
  "name": "グレージュの石肌",
  "group": "タイル・石",
  "cost": 43,
  "color": "#c9c4b4",
  "catalog": true,
  "face": "#c9c4b4",
  "top": "#f4e8cd",
  "side": "#a99577",
  "file": "assets/interior/catalog/wall-stone-greige.webp"
 }
};
const key=e=>e.axis+','+e.x+','+e.y;
function edge(a,b){if(!a||!b||Math.abs(a.x-b.x)+Math.abs(a.y-b.y)!==1)return null;return a.x!==b.x?{axis:'x',x:Math.max(a.x,b.x),y:a.y}:{axis:'y',x:a.x,y:Math.max(a.y,b.y)}}
function validEdge(e,r){return e&&['x','y'].includes(e.axis)&&Number.isInteger(e.x)&&Number.isInteger(e.y)&&e.x>=0&&e.y>=0&&(e.axis==='x'?e.x<=r.width&&e.y<r.height:e.x<r.width&&e.y<=r.height)}
function restore(old){const dim=v=>[10,12,14,16].includes(v)?v:10,r={width:dim(old?.width),height:dim(old?.height),floors:{},walls:[],lowWalls:old?.lowWalls===true,entranceStyle:['timber','sage','arch'].includes(old?.entranceStyle)?old.entranceStyle:'timber'};
 if(old?.floors&&typeof old.floors==='object')for(const [k,v] of Object.entries(old.floors)){const m=/^(\d+),(\d+)$/.exec(k);if(m&&Number(m[1])<r.width&&Number(m[2])<r.height&&Object.hasOwn(floors,v)&&v!=='cream')r.floors[Number(m[1])+','+Number(m[2])]=v}
 const seen=new Set();if(Array.isArray(old?.walls))for(const e of old.walls){if(!validEdge(e,r)||seen.has(key(e))||!Object.hasOwn(materials,e.material)||!['wall','door'].includes(e.type))continue;seen.add(key(e));r.walls.push({axis:e.axis,x:e.x,y:e.y,material:e.material,type:e.type})}
 return r;
}
const wallCache=new WeakMap();
function blocked(a,b,walls){const e=edge(a,b);if(!e)return false;if(!wallCache.has(walls))wallCache.set(walls,new Set(walls.filter(w=>w.type==='wall').map(key)));return wallCache.get(walls).has(key(e))}
function crosses(e,o,dims){const [w,h]=dims(o);return e.axis==='x'?e.x>o.x&&e.x<o.x+w&&e.y>=o.y&&e.y<o.y+h:e.y>o.y&&e.y<o.y+h&&e.x>=o.x&&e.x<o.x+w}
function create(api){const room=()=>api.state().room,sim=()=>api.sim();
 function floorQuote(cells,material){if(!Object.hasOwn(floors,material))return{error:'床材を選んでください',cost:0,cells:[]};const unique=new Map();for(const p of cells){if(!p||!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.y<0||p.x>=room().width||p.y>=room().height)return{error:'店舗の外です',cost:0,cells:[]};unique.set(p.x+','+p.y,p)}const changed=[...unique.values()].filter(p=>(room().floors[p.x+','+p.y]||'cream')!==material);return{error:'',cost:changed.length*floors[material].cost,cells:changed}}
 function paint(cells,material){const q=floorQuote(cells,material);if(q.error)return q;if(!api.draft?.()&&api.state().coins<q.cost)return{...q,error:'資金不足です。床は変更していません'};const budget=api.spendingError?.(q.cost);if(budget)return{...q,error:budget};for(const p of q.cells){const k=p.x+','+p.y;if(material==='cream')delete room().floors[k];else room().floors[k]=material}if(!api.draft?.()){api.state().coins-=q.cost;sim().interiorCosts+=q.cost;}if(q.cells.length)api.changed();return q}
 function wallQuote(edges,material,type){if(!Object.hasOwn(materials,material)||!['wall','door','erase','recolor'].includes(type))return{error:'壁の種類を選んでください',cost:0,refund:0,walls:room().walls};const next=new Map(room().walls.map(w=>[key(w),{...w}])),seen=new Set();let cost=0,refund=0,changes=0;
  for(const e of edges){if(!validEdge(e,room()))return{error:'店舗の外です',cost:0,refund:0,walls:room().walls};const k=key(e);if(seen.has(k))continue;seen.add(k);const old=next.get(k);if(type==='erase'){if(old){refund+=Math.floor(materials[old.material].cost/2);next.delete(k);changes++}}else{const nextType=type==='recolor'?old?.type:type;if(nextType&&(!old||old.material!==material||old.type!==nextType)){cost+=materials[material].cost;next.set(k,{axis:e.axis,x:e.x,y:e.y,material,type:nextType});changes++}}}
  const walls=[...next.values()],error=type==='erase'?'':api.layoutError(walls);return{error,cost,refund,changes,walls};
 }
 function walls(edges,material,type){const q=wallQuote(edges,material,type);if(q.error)return q;if(!api.draft?.()&&api.state().coins<q.cost)return{...q,error:'資金不足です。壁は変更していません'};const budget=api.spendingError?.(q.cost);if(budget)return{...q,error:budget};if(q.changes){room().walls=q.walls;if(!api.draft?.()){api.state().coins+=q.refund-q.cost;sim().interiorCosts+=q.cost;sim().equipmentRefunds+=q.refund;}api.changed()}return q}
 function expansion(axis){if(!['width','height'].includes(axis))return{error:'増築方向を選んでください',cost:0};if(room()[axis]>=16)return{error:'この方向は最大16マスです',cost:0};const added=2*room()[axis==='width'?'height':'width'];return{error:'',added,cost:added*80,width:room().width+(axis==='width'?2:0),height:room().height+(axis==='height'?2:0)}}
 function expand(axis){const q=expansion(axis);if(q.error)return q;if(sim().phase!=='prep')return{...q,error:'増築は開店前に行ってください'};if(!api.draft?.()&&api.state().coins<q.cost)return{...q,error:'増築資金が足りません'};const budget=api.spendingError?.(q.cost);if(budget)return{...q,error:budget};
  // Width grows to the right; depth grows behind the store by shifting every existing layer together.
  if(axis==='height'){const next={};for(const [k,v] of Object.entries(room().floors)){const [x,y]=k.split(',').map(Number);next[x+','+(y+2)]=v}room().floors=next;room().walls=room().walls.map(w=>({...w,y:w.axis==='y'&&w.y===0?0:w.y+2}));api.shift(0,2)}
  if(axis==='width')room().walls=room().walls.map(w=>({...w,x:w.axis==='x'&&w.x===room().width?q.width:w.x}));room().width=q.width;room().height=q.height;api.refreshEntry();if(!api.draft?.()){api.state().coins-=q.cost;sim().expansionCosts+=q.cost;}api.changed();return q;
 }
 return{floorQuote,paint,wallQuote,walls,expansion,expand};
}
function polygon(ctx,points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
// Painterly surfaces share world coordinates; visual detail never changes wall topology.
const textures={},textureListeners=[];
const textureEntries=[...Object.entries(floors).map(([id,m])=>['floor-'+id,m]),...Object.entries(materials).map(([id,m])=>['wall-'+id,m])];
let pendingTextures=textureEntries.length;
const parquetTiles={};let parquetPatterns=new WeakMap();
if(typeof Image!=='undefined')for(const [name,m] of textureEntries){
 const im=new Image();im.onload=()=>{textures[name]=im;delete parquetTiles[name];parquetPatterns=new WeakMap();settled()};im.onerror=settled;im.src=(m.file||'assets/interior/'+name+'.webp')+'?v=1';
}
function settled(){if(--pendingTextures===0)for(const fn of textureListeners.splice(0))fn()}
function whenTexturesReady(fn){if(pendingTextures===0)fn();else textureListeners.push(fn)}
// Exact repeating L-pairs form real herringbone, independently of atlas edges.
function herringbone(ctx,name,x,y,m){
 if(!parquetTiles[name]){const tile=document.createElement('canvas');tile.width=tile.height=256;const c=tile.getContext('2d'),u=256/6,n=3,im=textures[name];
  c.fillStyle=m.color;c.fillRect(0,0,256,256);
  for(let a=-3;a<=3;a++)for(let b=-9;b<=9;b++){
   const ox=(a*n-b)*u,oy=(a*n+b)*u;
   for(const vertical of [false,true]){c.save();if(vertical){c.translate(ox+(n+1)*u,oy);c.rotate(Math.PI/2)}else c.translate(ox,oy);
    if(im)c.drawImage(im,0,0,n*u,u);else{c.fillStyle=m.color;c.fillRect(0,0,n*u,u)}
    c.fillStyle=(a+b)%2?'#57351d0c':'#fff3d51c';c.fillRect(0,0,n*u,u);c.strokeStyle='#71533688';c.lineWidth=1;c.strokeRect(.5,.5,n*u-1,u-1);c.restore();
   }
  }parquetTiles[name]=tile;
 }
 let patterns=parquetPatterns.get(ctx);if(!patterns){patterns={};parquetPatterns.set(ctx,patterns)}
 if(!patterns[name]){const pattern=ctx.createPattern(parquetTiles[name],'repeat');pattern.setTransform(new DOMMatrix().rotate(45).scale(Math.SQRT2/256));patterns[name]=pattern}
 ctx.save();ctx.translate(-x,-y);ctx.fillStyle=patterns[name];ctx.fillRect(x,y,1,1);ctx.restore();
}
function surface(ctx,name,x,y){const m=name.startsWith('floor-')?floors[name.slice(6)]:materials[name.slice(5)];
 if(m?.layout==='herringbone'){herringbone(ctx,name,x,y,m);return}
 const im=textures[name];if(!im)return;ctx.save();ctx.globalAlpha*=name==='floor-wood'?.66:1;
 const wall=m?.catalog&&name.startsWith('wall-'),repeat=wall?4:2,sw=im.width/repeat,sx=((x%repeat)+repeat)%repeat*sw,sy=wall?0:((y%2)+2)%2*im.height/2;
 ctx.drawImage(im,sx,sy,sw,wall?im.height:im.height/2,0,0,1,1);ctx.restore();
}
function line(ctx,ax,ay,bx,by,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke()}
function drawFloor(ctx,point,x,y,material){
 const m=floors[material]||floors.cream,a=point(x,y),b=point(x+1,y),d=point(x,y+1),corners=[a,b,point(x+1,y+1),d];
 ctx.save();ctx.transform(b.x-a.x,b.y-a.y,d.x-a.x,d.y-a.y,a.x,a.y);ctx.beginPath();ctx.rect(0,0,1,1);ctx.clip();ctx.fillStyle=m.color;ctx.fillRect(0,0,1,1);surface(ctx,'floor-'+material,x,y);if(m.catalog){ctx.restore();return}
 // Broad boards and staggered joints replace the small uniform wire grid.
 if(material==='wood'){
  line(ctx,0,0,1,0,'#65492d65',.018);line(ctx,0,.022,1,.022,'#ffedbd45',.01);
  if((x+y*2)%3===0)line(ctx,0,0,0,1,'#71503665',.015);
 }else{
  ctx.strokeStyle=material==='stone'?'#6d796650':'#b6997255';ctx.lineWidth=.035;ctx.strokeRect(.005,.005,.99,.99);
  line(ctx,.035,.965,.965,.965,'#fff9df8a',.02);line(ctx,.965,.035,.965,.965,'#fff9df70',.02);
 }
 ctx.restore();
}
function wallPoints(w,point,height){const a=point(w.x,w.y),b=point(w.x+(w.axis==='y'?1:0),w.y+(w.axis==='x'?1:0));return[a,b,{x:b.x,y:b.y-height},{x:a.x,y:a.y-height}]}
function drawWall(ctx,point,w,tx,{low=false,alpha=1,selected=false,doorStyle='timber'}={}){
 const m=materials[w.material],height=tx*(w.type==='door'?2.15:low?1.15:2.15),pts=wallPoints(w,point,height),[a,b]=pts,n=point(w.axis==='x'?.08:0,w.axis==='y'?.08:0),z=point(0,0),offset={x:n.x-z.x,y:n.y-z.y};ctx.save();ctx.globalAlpha=alpha;
 if(w.type==='door'&&root.BakeryDoorArt?.draw(ctx,point,w,tx,{style:doorStyle})){ctx.restore();if(selected)polygon(ctx,pts,null,'#ffdb4c');return pts}
 polygon(ctx,[pts[3],pts[2],{x:pts[2].x+offset.x,y:pts[2].y+offset.y},{x:pts[3].x+offset.x,y:pts[3].y+offset.y}],m.top,'#80664a45');
 polygon(ctx,[b,{x:b.x+offset.x,y:b.y+offset.y},{x:pts[2].x+offset.x,y:pts[2].y+offset.y},pts[2]],m.side);
 ctx.save();ctx.transform(b.x-a.x,b.y-a.y,0,-height,a.x,a.y);
 ctx.beginPath();if(w.type==='door'){ctx.rect(0,0,.13,1);ctx.rect(.87,0,.13,1);ctx.rect(.13,.82,.74,.18)}else ctx.rect(0,0,1,1);ctx.clip();ctx.fillStyle=m.face;ctx.fillRect(0,0,1,1);
 // Canvas wall coordinates run upwards; flip the albedo so it stays upright.
 ctx.save();ctx.translate(0,1);ctx.scale(1,-1);surface(ctx,'wall-'+w.material,m.catalog?(w.axis==='x'?w.y:w.x):w.x,m.catalog?0:w.y);ctx.restore();
 if(w.material==='plaster'){
  ctx.save();ctx.beginPath();ctx.rect(0,0,1,.28);ctx.clip();ctx.fillStyle='#b68c5b';ctx.fillRect(0,0,1,.28);surface(ctx,'wall-wood',w.x,w.y);ctx.restore();
  for(const u of [.05,.5,.95])line(ctx,u,.03,u,.25,'#72533770',.018);
  ctx.fillStyle='#d6b580';ctx.fillRect(0,.275,1,.035);line(ctx,0,.31,1,.31,'#ffebc29c',.014);line(ctx,0,.27,1,.27,'#79604465',.014);
 }else if(w.material==='wood'){
  for(const u of [0,.25,.5,.75]){line(ctx,u,0,u,1,'#60462f75',.015);line(ctx,u+.018,0,u+.018,1,'#f0d2a040',.01)}
  ctx.fillStyle='#967045';ctx.fillRect(0,.08,1,.025);ctx.fillRect(0,.84,1,.025);
 }else if(w.material==='brick'){
  for(let row=0;row<5;row++){
   const v=row/5;line(ctx,0,v,1,v,'#e2ceb0cc',.025);
   const u=((row+(w.axis==='x'?w.y:w.x))%2)*.5;
   for(let col=-1;col<2;col++)line(ctx,u+col*.9,v,u+col*.9,v+.2,'#e2ceb0cc',.025);
  }
 }
 const shade=ctx.createLinearGradient(0,0,0,1);shade.addColorStop(0,'#5d46332b');shade.addColorStop(.5,'#ffffff00');shade.addColorStop(1,'#fff7df22');ctx.fillStyle=shade;ctx.fillRect(0,0,1,1);
 if(w.axis==='y'){ctx.fillStyle='#5c513412';ctx.fillRect(0,0,1,1)}
 ctx.fillStyle='#7d6548';ctx.fillRect(0,0,1,.035);ctx.fillStyle=m.top;ctx.fillRect(0,.965,1,.035);
 if(w.type==='door'){ctx.fillStyle='#b08c5f';ctx.fillRect(.095,0,.035,.82);ctx.fillRect(.87,0,.035,.82);ctx.fillRect(.095,.8,.81,.035)}
 ctx.restore();if(selected)polygon(ctx,pts,null,'#ffdb4c');ctx.restore();return pts;
}
function inPolygon(p,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside}return inside}
root.BakeryInterior={floors,materials,key,edge,validEdge,restore,blocked,crosses,create,drawFloor,drawWall,wallPoints,inPolygon,whenTexturesReady};
if(typeof module!=='undefined')module.exports=root.BakeryInterior;
})(typeof window!=='undefined'?window:globalThis);
