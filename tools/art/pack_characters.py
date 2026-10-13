from pathlib import Path
from PIL import Image
import json
here=Path(__file__).resolve().parent
out=here.parents[1]/'assets'/'characters';out.mkdir(parents=True,exist_ok=True)
manifest={}
for kind in ['owner','noah']:
 src=here/'build'/'characters';metadata=json.loads((src/(kind+'.json')).read_text());w,h=metadata['frameSize'];sheet=Image.new('RGBA',(w*3,h*4))
 for d in range(4):
  for f in range(3):
   im=Image.open(src/f'{kind}_d{d}_f{f}.png').convert('RGBA');box=im.getchannel('A').getbbox();assert box and box[0]>0 and box[1]>0 and box[2]<w and box[3]<h
   sheet.paste(im,(f*w,d*h))
 sheet.save(out/(kind+'.webp'),quality=90,method=6)
 manifest[kind]={**metadata,'file':'assets/characters/'+kind+'.webp'}
(out/'geometry.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Packed owner and Noah: four directions, three frames, one tile each.')
