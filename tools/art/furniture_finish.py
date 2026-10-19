"""Shared painterly material pass. Never changes mesh, camera or tile geometry."""
import bpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MATERIALS = ROOT / 'docs/art/furniture-finish/materials'
REVISION = 'painted-materials-v1'


def texture_for(name):
    if 'sage' in name.lower() or 'green linen' in name.lower():
        return 'sage'
    if 'leaf' in name.lower() or 'leaves' in name.lower():
        return 'leaf'
    if 'terracotta' in name.lower() or 'brick' in name.lower():
        return 'terracotta'
    if 'stone' in name.lower() or 'ceramic' in name.lower() or 'flour' in name.lower() or 'flower' in name.lower():
        return 'limestone'
    if 'linen' in name.lower():
        return 'linen'
    if 'soil' in name.lower():
        return None
    if 'recess' in name.lower():
        return 'walnut'
    if 'bread' in name.lower():
        return 'crust'
    if 'wood' in name.lower():
        return 'oak'
    return None


def apply(scene, metadata):
    assignments = {}
    for material in bpy.data.materials:
        tile = texture_for(material.name)
        if not tile or not material.use_nodes:
            continue
        nodes, links = material.node_tree.nodes, material.node_tree.links
        bsdf = nodes.get('Principled BSDF')
        if bsdf is None:
            continue
        # Preserve each material's role and palette; replace photographic noise
        # with shared authored albedo. Generated coordinates rotate with the mesh.
        base = material.diffuse_color[:]
        for link in list(bsdf.inputs['Base Color'].links):
            links.remove(link)
        for link in list(bsdf.inputs['Normal'].links):
            links.remove(link)
        coord = nodes.new('ShaderNodeTexCoord')
        tex = nodes.new('ShaderNodeTexImage')
        tex.name = 'Shared hand-painted ' + tile
        tex.image = bpy.data.images.load(str(MATERIALS / (tile + '.png')), check_existing=True)
        tex.image.pack()
        tex.projection = 'BOX'
        tex.projection_blend = .18
        tex.extension = 'REPEAT'
        links.new(coord.outputs['Generated'], tex.inputs['Vector'])
        mix = nodes.new('ShaderNodeMixRGB')
        mix.blend_type = 'MIX'
        mix.inputs[0].default_value = .78
        mix.inputs[1].default_value = base
        links.new(tex.outputs['Color'], mix.inputs[2])
        # Gentle warm edges give form at mobile scale without changing silhouette.
        facing = nodes.new('ShaderNodeLayerWeight')
        ramp = nodes.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].position = .05
        ramp.color_ramp.elements[0].color = (.57, .48, .40, 1)
        ramp.color_ramp.elements[1].position = .75
        ramp.color_ramp.elements[1].color = (1, 1, 1, 1)
        links.new(facing.outputs['Facing'], ramp.inputs[0])
        edge = nodes.new('ShaderNodeMixRGB')
        edge.blend_type = 'MULTIPLY'
        edge.inputs[0].default_value = .22
        links.new(mix.outputs[0], edge.inputs[1])
        links.new(ramp.outputs[0], edge.inputs[2])
        links.new(edge.outputs[0], bsdf.inputs['Base Color'])
        bump = nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = .055
        bump.inputs['Distance'].default_value = .012
        links.new(tex.outputs['Color'], bump.inputs['Height'])
        links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
        bsdf.inputs['Roughness'].default_value = .87
        bsdf.inputs['Specular IOR Level'].default_value = .18
        assignments[material.name] = tile
    scene.cycles.samples = 48
    scene.cycles.seed = 19
    scene.cycles.use_denoising = False
    metadata['finish'] = {'revision': REVISION, 'method': 'shared hand-painted albedo on unchanged Blender meshes', 'materials': assignments}
    scene['furniture_finish'] = REVISION
