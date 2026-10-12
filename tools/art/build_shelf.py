import bpy, math, json, random
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
from pathlib import Path
OUT=Path(__file__).resolve().parent/'build'/'shelf'
OUT.mkdir(parents=True,exist_ok=True);(OUT/'renders').mkdir(exist_ok=True)
random.seed(19)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.device='CPU';scene.cycles.samples=64;scene.cycles.use_denoising=False
scene.render.resolution_x=768;scene.render.resolution_y=768;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True
scene.view_settings.view_transform='Standard';scene.view_settings.look='Medium High Contrast';scene.view_settings.exposure=0;scene.view_settings.gamma=1
scene.world.color=(.32,.28,.23)
root=bpy.data.objects.new('Shelf_Rotation_Root',None);scene.collection.objects.link(root)
def mat(name,base,grain=False,rough=.72):
 m=bpy.data.materials.new(name);m.diffuse_color=(*base,1);m.use_nodes=True
 n=m.node_tree.nodes;l=m.node_tree.links;bs=n.get('Principled BSDF');bs.inputs['Roughness'].default_value=rough
 tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=4;tex.inputs['Detail'].default_value=3;tex.inputs['Roughness'].default_value=.7
 coord=n.new('ShaderNodeTexCoord');mapping=n.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(2,32,3) if grain else (8,8,8)
 l.new(coord.outputs['Generated'],mapping.inputs[0]);l.new(mapping.outputs[0],tex.inputs['Vector'])
 ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.15;ramp.color_ramp.elements[0].color=(*(c*.62 for c in base),1);ramp.color_ramp.elements[1].position=.85;ramp.color_ramp.elements[1].color=(*(min(c*1.3,1) for c in base),1)
 l.new(tex.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs[0],bs.inputs['Base Color'])
 bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.16;bump.inputs['Distance'].default_value=.028;l.new(tex.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs[0],bs.inputs['Normal'])
 return m
wood=mat('Honey wood - painted grain',(.48,.235,.085),True)
edge=mat('Golden bevel wood',(.63,.33,.12),True)
dark=mat('Warm shelf recess',(.27,.115,.035),True)
bread=mat('Golden bread crust',(.79,.39,.09));crumb=mat('Pale flour scoring',(.96,.77,.42));brown=mat('Toasted bread',(.56,.235,.046))
cloth=mat('Cream linen',(.84,.79,.61));green=mat('Sage green linen',(.30,.43,.20));brass=mat('Warm brass handles',(.62,.37,.09),rough=.35)
def finish(o,m):
 o.data.materials.append(m);o.parent=root
 if o.type=='MESH':
  for face in o.data.polygons:face.use_smooth=True
 return o
def box(name,loc,size,m,bevel=.04):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Rounded hand crafted edges','BEVEL');mod.width=bevel;mod.segments=3
  o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL')
 return finish(o,m)
def ball(name,loc,size,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=loc);o=bpy.context.object;o.name=name;o.scale=size;return finish(o,m)
def curve(name,points,radius,m):
 data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=16;data.bevel_depth=radius;data.bevel_resolution=3
 sp=data.splines.new('BEZIER');sp.bezier_points.add(len(points)-1)
 for p,co in zip(sp.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);return finish(o,m)
# A 2 x 1 tile footprint, with the front at world -Y. All feet fit within it.
for x in [-.83,.83]:
 for y in [-.35,.35]:box('Rounded foot',(x,y,.105),(.18,.18,.21),dark,.035)
box('Base cabinet',(0,0,.41),(1.90,.90,.58),wood,.055)
for x in [-.46,.46]:
 box('Raised cabinet door',(x,-.466,.43),(.87,.055,.44),edge,.035)
 box('Inset door panel',(x,-.5,.43),(.71,.018,.30),wood,.025)
 ball('Brass knob',(x+(.22 if x<0 else -.22),-.535,.48),(.045,.035,.045),brass)
box('Cabinet top',(0,-.02,.73),(1.98,.96,.12),edge,.045)
box('Back panel',(0,.40,1.53),(1.84,.095,1.6),dark,.02)
for x in [-.91,.91]:
 box('Side upright',(x,.02,1.56),(.13,.87,1.68),wood,.035)
 box('Front rounded stile',(x,-.39,1.58),(.14,.12,1.76),edge,.04)
for z in [.82,1.32,1.82]:
 box('Bread shelf',(0,-.015,z),(1.77,.83,.065),wood,.025)
 box('Shelf rounded lip',(0,-.442,z+.02),(1.80,.07,.105),edge,.03)
# Curved crest, built as a shallow solid mesh, not a billboard.
profile=[(-.94,2.28),(-.94,2.40),(-.75,2.47),(-.56,2.54),(-.32,2.65),(0,2.71),(.32,2.65),(.56,2.54),(.75,2.47),(.94,2.40),(.94,2.28)]
verts=[(x,y,z) for y in [.33,.46] for x,z in profile];n=len(profile)
faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
mesh=bpy.data.meshes.new('Arched crown mesh');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('Arched crown',mesh);scene.collection.objects.link(o);finish(o,wood);bev=o.modifiers.new('Soft crest edges','BEVEL');bev.width=.03;bev.segments=3;o.modifiers.new('Crest normals','WEIGHTED_NORMAL')
curve('Crest rim',[(-.88,.305,2.41),(-.5,.305,2.52),(0,.305,2.67),(.5,.305,2.52),(.88,.305,2.41)],.025,edge)
# Decorative wheat emblem.
curve('Wheat stem',[(0,.28,2.36),(0,.28,2.54)],.014,crumb)
for i in range(3):
 for side in [-1,1]:
  o=ball('Wheat grain',(side*.045,.27,2.40+i*.05),(.026,.018,.046),crumb);o.rotation_euler.y=side*.6
# Three shelves, varied bread shapes, with real scoring geometry.
for row,z in enumerate([.855,1.355,1.855]):
 for col,x in enumerate([-.61,-.20,.21,.61]):
  y=-.15+random.uniform(-.025,.025)
  if row==1:
   box('Soft square loaf',(x,y,z+.15),(.31,.36,.27),bread,.09)
   for shift in [-.07,.07]:curve('Loaf flour score',[(x+shift-.025,y-.16,z+.24),(x+shift,y,z+.296),(x+shift+.025,y+.13,z+.26)],.012,crumb)
  elif row==0 and col<2:
   for j in range(4):ball('Croissant crescent segment',(x+(j-1.5)*.06,y+(abs(j-1.5)-.5)*.045,z+.105),(.07,.13-.022*abs(j-1.5),.09),bread if j%2 else brown)
  else:
   ball('Round rustic roll',(x,y,z+.125),(.165,.185,.14),bread)
   for shift in [-.07,.04]:curve('Bread slash',[(x+shift-.025,y-.13,z+.205),(x+shift,y,z+.267),(x+shift+.025,y+.11,z+.22)],.013,crumb)
# A folded linen hanging from the low shelf, with subtle sage stripes.
for i in range(8):
 x=-.75+i*.053
 curve('Linen fold',[(x,-.19,.88),(x,-.46,.875),(x+.025,-.51,.67+abs(i-3.5)*.008)],.03,green if i%3==0 else cloth)
# Camera is fixed for all directions. sin(elevation)=0.54, matching game tile axes.
elevation=math.asin(.54);target=Vector((0,0,1.30));distance=12
position=target+Vector((math.cos(elevation)/math.sqrt(2),-math.cos(elevation)/math.sqrt(2),math.sin(elevation)))*distance
bpy.ops.object.camera_add(location=position);cam=bpy.context.object;cam.name='Fixed orthographic tile camera';cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=4.2;scene.camera=cam
for name,loc,power,size in [('Warm window',(-3,-4,7),600,5),('Gentle fill',(4,1,5),250,4),('Top soft light',(0,3,6),180,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.name=name;light.data.energy=power;light.data.size=size;light.rotation_euler=(Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.context.view_layer.update()
origin=world_to_camera_view(scene,cam,Vector((0,0,0)));px=world_to_camera_view(scene,cam,Vector((1,0,0)))
metadata={'tileFootprint':[2,1],'cameraElevationDegrees':math.degrees(elevation),'screenFloorAngleDegrees':math.degrees(math.atan(.54)),'orthographicScale':cam.data.ortho_scale,'imageSize':[768,768],'anchorPixels':[origin.x*768,(1-origin.y)*768],'tileXAxisPixels':[(px.x-origin.x)*768,(origin.y-px.y)*768],'directions':{'0':'front +gameY / world -Y','1':'front +gameX / world +X','2':'front -gameY / world +Y','3':'front -gameX / world -X'}}
(OUT/'shelf_metadata.json').write_text(json.dumps(metadata,indent=2))
root['footprint_tiles']='2x1';root['tile_world_units']=1;root['front_axis']='-Y';scene['floor_screen_slope']=.54
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'shelf.blend'))
for rot in range(4):
 root.rotation_euler.z=rot*math.pi/2;scene.render.filepath=str(OUT/'renders'/f'shelf_r{rot}.png');bpy.ops.render.render(write_still=True)
