"""Rebuild adjustable 1-tile character models and 4-direction walking atlases.
blender -b -t 2 --python tools/art/build_characters.py
python tools/art/pack_characters.py
Dimensions can be changed in CHARACTER_SIZES without changing collision footprint.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
HERE=Path(__file__).resolve().parent
OUT=HERE/'build'/'characters';OUT.mkdir(parents=True,exist_ok=True)
CHARACTER_SIZES={'owner':(1.,1.,1.),'noah':(1.,1.,1.)} # width, depth, height
SIZE=256
for kind in ['owner','noah']:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=False
 scene.render.resolution_x=SIZE;scene.render.resolution_y=SIZE;scene.render.resolution_percentage=100
 scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True
 scene.view_settings.view_transform='Standard';scene.world.color=(.35,.31,.26)
 root=bpy.data.objects.new(kind+'_one_tile_root',None);scene.collection.objects.link(root);root.scale=CHARACTER_SIZES[kind]
 root['footprint_tiles']='1x1';root['contact_origin']='feet at world Z=0'
 def mat(name,color):
  m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=.82
  noise=m.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=28
  bump=m.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.10;bump.inputs['Distance'].default_value=.012
  m.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],bs.inputs['Normal']);return m
 cream=mat('cream apron',(.87,.81,.64));skin=mat('warm skin',(.84,.57,.37));hair=mat('brown hair',(.25,.105,.045));black=mat('black collie fur',(.055,.065,.075));white=mat('white collie fur',(.88,.87,.77));eye=mat('eyes',(.018,.015,.012));blue=mat('blue apron',(.23,.40,.56));shirt=mat('sage shirt',(.35,.46,.29));shoe=mat('brown shoes',(.22,.12,.065));pink=mat('cheeks',(.78,.31,.24))
 def ball(name,loc,scale,m,parent=None):
  bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(m);o.parent=parent or root
  for p in o.data.polygons:p.use_smooth=True
  return o
 def box(name,loc,size,m):
  bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);o.parent=root
  mod=o.modifiers.new('soft edges','BEVEL');mod.width=.035;mod.segments=3;o.modifiers.new('normals','WEIGHTED_NORMAL');return o
 bodymat=shirt if kind=='owner' else black
 ball('body',(0,0,.76),(.245,.19,.39),bodymat)
 legs=[];arms=[]
 for side in [-1,1]:
  leg=ball('leg',(side*.13,0,.25),(.10,.105,.25),shoe if kind=='owner' else black);legs.append(leg)
  foot=ball('foot',(side*.13,-.065,.075),(.12,.16,.075),shoe if kind=='owner' else white);legs.append(foot)
  arm=ball('arm',(side*.30,0,.78),(.095,.105,.27),skin if kind=='owner' else black);arms.append(arm)
  ball('hand',(side*.31,-.015,.55),(.10,.095,.10),skin if kind=='owner' else white)
 apron=cream if kind=='owner' else blue
 box('apron bib',(0,-.185,.87),(.29,.045,.31),apron)
 box('apron skirt',(0,-.175,.57),(.43,.055,.32),apron)
 box('apron pocket',(0,-.213,.63),(.16,.018,.105),cream)
 box('apron waist tie',(0,0,.72),(.49,.40,.04),apron)
 ball('head',(0,-.01,1.31),(.31,.27,.31),skin if kind=='owner' else black)
 if kind=='owner':
  ball('hair cap',(0,.055,1.40),(.32,.25,.27),hair)
  for side in [-1,1]:
   ball('hair side',(side*.275,.025,1.23),(.09,.20,.23),hair)
   ball('cheek',(side*.20,-.238,1.25),(.052,.022,.032),pink)
  ball('hair bun',(.02,.29,1.34),(.16,.14,.17),hair)
  for x in [-.15,-.045,.06,.17]:ball('soft fringe',(x,-.21,1.47),(.085,.085,.13),hair)
 else:
  for side in [-1,1]:
   bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=.15,radius2=.03,depth=.32,location=(side*.23,0,1.62));ear=bpy.context.object;ear.name='collie pointed ear';ear.parent=root;ear.data.materials.append(black);ear.rotation_euler.y=side*.18
   ball('white cheek',(side*.20,-.18,1.23),(.12,.12,.15),white)
  ball('white face blaze',(0,-.24,1.38),(.078,.043,.22),white)
  ball('collie muzzle',(0,-.29,1.23),(.17,.15,.10),white)
  ball('nose',(0,-.416,1.25),(.065,.035,.045),eye)
  tail=ball('tail',(0,.29,.53),(.075,.25,.075),black);tail.rotation_euler.x=.35
  ball('tail white tip',(0,.48,.59),(.07,.10,.065),white)
 for side in [-1,1]:
  ball('eye',(side*.12,-.252,1.36),(.033,.025,.043),eye)
  ball('eye glint',(side*.12+.007,-.277,1.375),(.011,.008,.013),white)
 elevation=math.asin(.54);target=Vector((0,0,1.30));distance=12
 position=target+Vector((math.cos(elevation)/math.sqrt(2),-math.cos(elevation)/math.sqrt(2),math.sin(elevation)))*distance
 bpy.ops.object.camera_add(location=position);cam=bpy.context.object;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=4.2;scene.camera=cam
 for loc,power,size in [((-3,-4,7),600,5),((4,1,5),250,4),((0,3,6),180,3)]:
  bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
 bpy.context.view_layer.update();origin=world_to_camera_view(scene,cam,Vector((0,0,0)));px=world_to_camera_view(scene,cam,Vector((1,0,0)))
 metadata={'footprint':[1,1],'frameSize':[SIZE,SIZE],'anchorPixels':[origin.x*SIZE,(1-origin.y)*SIZE],'tileXAxisPixels':[(px.x-origin.x)*SIZE,(origin.y-px.y)*SIZE],'columns':3,'rows':4,'frames':['idle','walkLeft','walkRight'],'modelSize':CHARACTER_SIZES[kind]}
 (OUT/(kind+'.json')).write_text(json.dumps(metadata,indent=2));bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(kind+'.blend')),compress=True)
 original=[o.location.copy() for o in legs+arms]
 for direction in range(4):
  root.rotation_euler.z=direction*math.pi/2
  for frame in range(3):
   for i,o in enumerate(legs+arms):
    o.location=original[i];phase=0 if frame==0 else (1 if frame==1 else -1)
    side=-1 if i//2==0 else 1
    if i<4:o.location.y+=side*phase*.095;o.location.z+=max(0,side*phase)*.035
    else:o.rotation_euler.x=(1 if i%2 else -1)*phase*.20
   scene.render.filepath=str(OUT/f'{kind}_d{direction}_f{frame}.png');bpy.ops.render.render(write_still=True)
 print('CHARACTER_DONE',kind)
