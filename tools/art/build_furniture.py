import bpy, math, json, random
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
from pathlib import Path
import sys
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
TYPE=args[0] if args else 'oven'
OUT=Path(__file__).resolve().parent/'build'/TYPE
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
 data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=16;data.bevel_depth=radius;data.bevel_resolution=3;data.use_fill_caps=True
 sp=data.splines.new('BEZIER');sp.bezier_points.add(len(points)-1)
 for p,co in zip(sp.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);return finish(o,m)
# Shared modelling helpers. One Blender unit is one floor tile.
cream=mat('Warm ceramic',(.85,.78,.57));sage=mat('Sage painted wood',(.25,.38,.23),True)
brick=mat('Warm terracotta brick',(.51,.23,.10));stone=mat('Cream stone mortar',(.66,.55,.40));soil=mat('Dark potting soil',(.11,.065,.025));leaf=mat('Fresh green leaves',(.19,.35,.075));leaf2=mat('Light leaves',(.34,.48,.12));petal=mat('Cream flowers',(.98,.86,.59))
def cylinder(name,loc,radius,depth,m,vertices=48,bevel=.02):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc);o=bpy.context.object;o.name=name
 if bevel:
  mod=o.modifiers.new('Rounded rims','BEVEL');mod.width=bevel;mod.segments=3;o.modifiers.new('Cylinder normals','WEIGHTED_NORMAL')
 return finish(o,m)
def cone(name,loc,r1,r2,depth,m):
 bpy.ops.mesh.primitive_cone_add(vertices=48,radius1=r1,radius2=r2,depth=depth,location=loc);o=bpy.context.object;o.name=name;mod=o.modifiers.new('Soft pot rim','BEVEL');mod.width=.025;mod.segments=3;o.modifiers.new('Pot normals','WEIGHTED_NORMAL');return finish(o,m)
def orient(o,a,b):
 o.rotation_euler=(Vector(b)-Vector(a)).to_track_quat('Z','Y').to_euler();return o

def flower(loc,scale=.12):
 x,y,z=loc
 ball('Flower center',(x,y,z),(scale*.35,scale*.35,scale*.25),bread)
 for i in range(6):
  a=i*math.tau/6;ball('Cream flower petal',(x+math.cos(a)*scale*.6,y+math.sin(a)*scale*.6,z),(scale*.47,scale*.47,scale*.18),petal)

def bouquet(x,y,z,scale=1):
 for i in range(5):
  a=i*math.tau/5;tx=x+math.cos(a)*.15*scale;ty=y+math.sin(a)*.15*scale;tz=z+(.25+random.random()*.16)*scale
  curve('Flower stem',[(x,y,z),(tx,ty,tz)],.01*scale,leaf);flower((tx,ty,tz),.075*scale)

def bowl(name,x,y,z,radius,m):
 # Hollow rounded ceramic: a lathed wall with an interior surface.
 profile=[(radius*.50,0),(radius*.75,radius*.13),(radius*.90,radius*.42),(radius,radius*.75),(radius*.88,radius*.77),(radius*.78,radius*.39),(radius*.60,radius*.17),(0,radius*.15)]
 vertices=[];n=48
 for r,h in profile:
  for i in range(n):a=i*math.tau/n;vertices.append((x+r*math.cos(a),y+r*math.sin(a),z+h))
 faces=[]
 for j in range(len(profile)-1):
  for i in range(n):faces.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);scene.collection.objects.link(o);return finish(o,m)

def make_register():
 for x in [-.82,.82]:
  for y in [-.34,.34]:box('Counter foot',(x,y,.10),(.18,.18,.20),dark)
 box('Counter body',(0,0,.64),(1.84,.84,1.10),sage,.05)
 for x in [-.78,0,.78]:box('Counter molding',(x,-.44,.62),(.065,.055,.90),edge,.02)
 box('Front panel bottom',(0,-.455,.18),(1.85,.08,.10),wood)
 box('Counter worktop',(0,0,1.25),(1.98,.98,.15),edge,.05)
 box('Cash register base',(.30,.04,1.40),(.66,.48,.17),wood)
 box('Cash drawer',(.30,-.218,1.40),(.53,.045,.11),brass,.015)
 box('Register housing',(.30,.105,1.58),(.57,.25,.25),cream,.05)
 o=box('Register display',(.30,-.03,1.64),(.40,.035,.12),dark,.015);o.rotation_euler.x=.15
 for x in [.09,.23,.37,.51]:
  for y in [-.09,-.19]:cylinder('Round register key',(x,y,1.52),.041,.036,brass,24,.007)
 cylinder('Counter flower pot',(-.62,.07,1.43),.14,.24,cream);bouquet(-.62,.07,1.55,.75)

def make_prep():
 for x in [-.78,.78]:
  for y in [-.78,.78]:box('Workbench rounded leg',(x,y,.66),(.18,.18,1.32),wood,.04)
 box('Lower storage shelf',(0,0,.31),(1.80,1.80,.12),dark,.035)
 box('Thick prep top',(0,0,1.43),(1.98,1.98,.19),edge,.06)
 for y in [-.79,.79]:box('Workbench apron',(0,y,1.24),(1.72,.12,.25),wood)
 # Leave a clear perimeter for either adjacent cell on all four sides.
 bowl('Mixing bowl',0,.20,1.53,.24,cream)
 curve('Green bowl rim',[(-.20,.17,1.67),(0,-.03,1.67),(.21,.17,1.67),(0,.40,1.67),(-.20,.17,1.67)],.022,green)
 curve('Wood mixing spoon',[(.02,.20,1.65),(.12,.22,1.91)],.03,wood);ball('Spoon head',(.14,.22,1.94),(.06,.035,.08),edge)
 # Dough is supplied by the actual worker's kneading art; no permanent extra dough.
 o=cylinder('Rolling pin',(0,-.26,1.64),.08,.54,wood);o.rotation_euler.y=math.pi/2
 for x in [-.35,.35]:o=cylinder('Rolling pin handle',(x,-.26,1.64),.037,.16,edge);o.rotation_euler.y=math.pi/2
 # Flour is stored under the worktop, clear of both the tray stack and bowl.
 box('Flour bag',(.40,-.43,.65),(.40,.35,.52),cloth,.10)
 cylinder('Flour bag mouth',(.40,-.43,.92),.19,.06,cloth)
 cylinder('Flour surface',(.40,-.43,.957),.15,.015,crumb)
 for i in range(10):
  x=-.20+i*.045;curve('Hanging towel',[(x,-.65,1.54),(x,-.99,1.54),(x,-1.01,1.10)],.026,green if i%3==0 else cloth)
 for i in range(3):box('Stored baking tray',(.34,.20,.43+i*.08),(.62,.65,.06),stone,.02)
 bowl('Stored mixing bowl',-.43,-.12,.38,.24,cream)

def make_table():
 cylinder('Round wood tabletop',(0,0,1.35),.98,.16,edge,64,.035)
 cylinder('Table pedestal',(0,0,.72),.16,1.15,wood)
 for a in [0,math.pi/2,math.pi,math.pi*1.5]:
  x,y=math.cos(a)*.63,math.sin(a)*.63
  curve('Curved pedestal leg',[(0,0,.43),(x*.55,y*.55,.16),(x,y,.075)],.105,wood)
 # A diamond linen square, lying flat rather than a painted billboard.
 o=box('Green linen table mat',(0,0,1.441),(.60,.60,.018),green,.01);o.rotation_euler.z=math.pi/4
 for i in [-1,0,1]:
  box('Linen cream thread',(i*.14,0,1.454),(.018,.54,.006),cloth,.001)
 cylinder('Table flower vase',(0,0,1.59),.105,.28,cream);bouquet(0,0,1.75,1.0)

def make_plant():
 cone('Rounded clay pot',(0,0,.33),.24,.36,.61,brick)
 cylinder('Pot lip',(0,0,.65),.38,.12,edge)
 cylinder('Visible soil',(0,0,.71),.32,.025,soil)
 curve('Main plant stem',[(0,0,.70),(.03,.02,1.40),(-.04,.01,1.81)],.022,leaf)
 for i in range(16):
  a=i*2.40;z=.85+i*.052;r=.22+(i%3)*.045
  center=(math.cos(a)*r,math.sin(a)*r,z)
  curve('Leaf branch',[(0,0,z-.06),center],.01,leaf)
  o=ball('Pointed soft leaf',center,(.105,.045,.20),leaf if i%2 else leaf2);o.rotation_euler=(.35*math.cos(a),.7*math.sin(a),a)
 for i in range(4):
  a=i*1.57;loc=(math.cos(a)*.21,math.sin(a)*.21,1.62+(i%2)*.13);curve('Flower stem',[(0,0,1.25),loc],.012,leaf);flower(loc,.11)

def make_oven():
 # Base structure with an actual wood-storage gap between front supports.
 box('Oven bottom plinth',(0,0,.12),(1.94,1.90,.22),stone,.06)
 box('Oven base back',(0,.65,.55),(1.83,.52,.75),brick,.04)
 for x in [-.72,.72]:box('Oven front support',(x,-.40,.56),(.38,1.03,.80),brick,.04)
 box('Oven hearth slab',(0,0,1.00),(1.98,1.94,.17),stone,.05)
 # Brick seams on load-bearing base, following the same floor axes.
 for z in [.39,.66]:
  for x in [-.72,.72]:box('Base mortar band',(x,-.93,z),(.39,.02,.025),stone,.005)
 for i in range(7):
  x=(i%3-1)*.22;z=.28+(i//3)*.16;y=-.22+random.random()*.12
  o=cylinder('Stored firewood',(x,y,z),.078,.63,dark,16,.015);o.rotation_euler.x=math.pi/2
  cylinder_end=ball('Firewood end',(x,y-.32,z),(.067,.012,.067),edge)
 # Closed dome geometry, with a boolean-cut baking opening.
 vertices=[(0,0,2.14)];n=64;rings=12
 for j in range(1,rings+1):
  t=j*(math.pi/2)/rings
  for i in range(n):
   a=i*math.tau/n;vertices.append((.93*math.sin(t)*math.cos(a),.90*math.sin(t)*math.sin(a),1.08+1.06*math.cos(t)))
 faces=[(0,1+i,1+(i+1)%n) for i in range(n)]
 for j in range(rings-1):
  for i in range(n):faces.append((1+j*n+i,1+j*n+(i+1)%n,1+(j+1)*n+(i+1)%n,1+(j+1)*n+i))
 faces.append(tuple(1+(rings-1)*n+i for i in range(n-1,-1,-1)))
 mesh=bpy.data.meshes.new('Dome solid mesh');mesh.from_pydata(vertices,[],faces);mesh.update();dome=bpy.data.objects.new('Brick oven dome',mesh);scene.collection.objects.link(dome);finish(dome,brick)
 for shape in ['cube','arch']:
  if shape=='cube':
   bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-.62,1.22));cut=bpy.context.object;cut.dimensions=(.77,1.14,.38)
  else:
   bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.385,depth=1.14,location=(0,-.62,1.40),rotation=(math.pi/2,0,0));cut=bpy.context.object
  bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  mod=dome.modifiers.new('Baking opening '+shape,'BOOLEAN');mod.operation='DIFFERENCE';mod.object=cut
  bpy.context.view_layer.objects.active=dome;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
 # A dark interior wall and orange bread-hearth glow, recessed into the opening.
 box('Dark baking chamber',(0,.00,1.42),(.78,.04,.64),dark,.02)
 for i in range(5):
  x=-.28+i*.14;ball('Hearth embers',(x,-.49,1.15),(.10,.19,.065),brown)
 flame=mat('Amber flame',(.95,.29,.025));bs=flame.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(1,.24,.01,1);bs.inputs['Emission Strength'].default_value=.7
 for i in range(5):ball('Flame tongue',(-.25+i*.12,-.38,1.25+random.random()*.05),(.07,.035,.14+random.random()*.05),flame)
 # Separate arched bricks give the front real depth.
 for i in range(9):
  a=i*math.pi/8;brick_o=box('Opening arch brick',(.49*math.cos(a),-.72,1.40+.49*math.sin(a)),(.16,.22,.25),edge if i%3==0 else brick,.025);brick_o.rotation_euler.y=-a
 for x in [-.49,.49]:box('Opening jamb',(x,-.78,1.22),(.18,.19,.28),brick,.025)
 # Horizontal mortar rings and shorter seams on the outside of the dome.
 for j,z in enumerate([1.31,1.57,1.82]):
  t=math.acos((z-1.08)/1.06);radx=.938*math.sin(t);rady=.908*math.sin(t)
  points=[]
  for k in range(129):
   a=math.tau*k/128
   if math.sin(a)<-.55 and abs(radx*math.cos(a))<.59:
    if len(points)>2:curve('Dome mortar',points,.009,stone)
    points=[];continue
   points.append((radx*math.cos(a),rady*math.sin(a),z))
  if len(points)>2:curve('Dome mortar',points,.009,stone)
 for z in [2.10,2.28,2.46,2.64]:
  box('Chimney brick course',(.37,.35,z),(.39,.38,.16),brick,.023)
  box('Chimney mortar',(.37,.35,z+.085),(.40,.39,.02),stone,.005)
 box('Chimney cap',(.37,.35,2.77),(.49,.47,.11),dark,.025)

builders={'oven':make_oven,'register':make_register,'prep':make_prep,'table':make_table,'plant':make_plant}
if TYPE not in builders:raise ValueError(TYPE)
builders[TYPE]()
# Keep the fixed camera and XY footprint; lower only prep model geometry in Z.
# The top surface was 1.525 tiles, above the study characters' working hands.
if TYPE=='prep':
 for obj in root.children:
  obj.location.z *= .85/1.525
  obj.scale.z *= .85/1.525
# Fixed camera, lighting, scale and image anchor for every furniture type.
elevation=math.asin(.54);target=Vector((0,0,1.30));distance=12
position=target+Vector((math.cos(elevation)/math.sqrt(2),-math.cos(elevation)/math.sqrt(2),math.sin(elevation)))*distance
bpy.ops.object.camera_add(location=position);cam=bpy.context.object;cam.name='Fixed orthographic tile camera';cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=4.2;scene.camera=cam
for name,loc,power,size in [('Warm window',(-3,-4,7),600,5),('Gentle fill',(4,1,5),250,4),('Top soft light',(0,3,6),180,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.name=name;light.data.energy=power;light.data.size=size;light.rotation_euler=(Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.context.view_layer.update();origin=world_to_camera_view(scene,cam,Vector((0,0,0)));px=world_to_camera_view(scene,cam,Vector((1,0,0)))
footprint=[2,1] if TYPE=='register' else [1,1] if TYPE=='plant' else [2,2]
metadata={'tileFootprint':footprint,'cameraElevationDegrees':math.degrees(elevation),'screenFloorAngleDegrees':math.degrees(math.atan(.54)),'orthographicScale':cam.data.ortho_scale,'imageSize':[768,768],'anchorPixels':[origin.x*768,(1-origin.y)*768],'tileXAxisPixels':[(px.x-origin.x)*768,(origin.y-px.y)*768],'directions':{'0':'front +gameY / world -Y','1':'front +gameX / world +X','2':'front -gameY / world +Y','3':'front -gameX / world -X'}}
if TYPE=='prep':metadata['workSurfaceHeightTiles']=.85
(OUT/(TYPE+'_metadata.json')).write_text(json.dumps(metadata,indent=2))
root.name=TYPE.title()+'_Rotation_Root';root['footprint_tiles']=str(footprint);root['tile_world_units']=1;root['front_axis']='-Y';scene['floor_screen_slope']=.54
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(TYPE+'.blend')))
for rot in range(4):
 root.rotation_euler.z=rot*math.pi/2;scene.render.filepath=str(OUT/'renders'/f'{TYPE}_r{rot}.png');bpy.ops.render.render(write_still=True)
