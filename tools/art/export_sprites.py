"""Export fixed-camera Blender renders to game sprites; needs Pillow."""
from pathlib import Path
import json, math, re, sys
from PIL import Image

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[1]
TYPES={'shelf':[2,1],'oven':[2,2],'register':[2,1],'prep':[2,2],'table':[2,2],'plant':[1,1]}
SIZE=512
manifest={'version':1,'renderMethod':'Blender orthographic, model rotates about vertical Z axis','furniture':{}}
selected=sys.argv[1:] or list(TYPES)
if sys.argv[1:]:manifest=json.loads((REPO/'assets/furniture_geometry.json').read_text())
common=manifest.get('geometry')
for kind in selected:
    footprint=TYPES[kind]
    source=HERE/'build'/kind
    metadata=json.loads((source/(kind+'_metadata.json')).read_text())
    assert metadata['tileFootprint']==footprint,kind
    ratio=SIZE/metadata['imageSize'][0]
    geometry={'imageSize':[SIZE,SIZE],'anchorPixels':[v*ratio for v in metadata['anchorPixels']],
              'tileXAxisPixels':[v*ratio for v in metadata['tileXAxisPixels']]}
    assert abs(geometry['tileXAxisPixels'][1]/geometry['tileXAxisPixels'][0]-.54)<.00001
    if common is None:common=geometry
    else:assert all(abs(a-b)<.0001 for key in common for a,b in zip(common[key],geometry[key])),'Camera/anchor differs: '+kind
    geometry=common
    for rot in range(4):
        image=Image.open(source/'renders'/f'{kind}_r{rot}.png').convert('RGBA')
        bounds=image.getchannel('A').getbbox()
        assert bounds and min(bounds[0],bounds[1])>0 and bounds[2]<image.width and bounds[3]<image.height,kind
        image.resize((SIZE,SIZE),Image.Resampling.LANCZOS).save(REPO/'assets'/f'{kind}_r{rot}.webp',quality=90,method=6)
    manifest['furniture'][kind]={**metadata,**geometry,'files':[f'assets/{kind}_r{r}.webp' for r in range(4)]}
manifest['geometry']=common
(REPO/'assets/furniture_geometry.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
index=REPO/'index.html'
html=index.read_text()
html,count=re.subn(r'furnitureGeometry=\{.*?\};for',lambda m:'furnitureGeometry='+json.dumps(common,separators=(',',':'))+';for',html,count=1)
assert count==1,'Game geometry constant not found'
index.write_text(html)
print(f'Exported {len(selected)*4} directional sprites with matching geometry.')
