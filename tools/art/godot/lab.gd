extends Node2D

# Same cell, projection, anchor and depth order as index.html. No game state here.
const ANCHOR = Vector2(128.00010681152344, 194.692138671875)
const TILE_X = 43.09983825683594
var atlas: Texture2D
var baseline: Texture2D
var companion: Texture2D
var character := "noah"
var shelf: Texture2D
var elapsed := 0.0
var walking := true
var show_guides := true
var use_candidate := true
var silhouette := false
var forced_frame := -1
var flat_shading := false
var preview_material: ShaderMaterial
var width_scale := 1.0
var height_scale := 1.0
var overall_scale := 1.0
var status: Label
var capture_path := ""
var count := 0

func texture(relative: String) -> Texture2D:
	var file := ProjectSettings.globalize_path("res://../../../" + relative)
	var im := Image.new()
	if im.load(file) != OK:
		push_error("Cannot load " + file)
		return null
	return ImageTexture.create_from_image(im)

func _ready() -> void:
	for arg in OS.get_cmdline_user_args():
		if arg == "--owner": character = "owner"
	preview_material = ShaderMaterial.new()
	preview_material.shader = load("res://flat_preview.gdshader")
	material = preview_material
	select_character(character)
	companion = texture("docs/art/noah-study/noah.webp")
	shelf = texture("assets/shelf_r0.webp")
	var panel := VBoxContainer.new()
	panel.position = Vector2(24, 16)
	panel.size.x = 1050
	add_child(panel)
	var heading := Label.new()
	heading.text = "CHARACTER / 4 directions / idle + two contact poses / WEB projection"
	heading.add_theme_color_override("font_color", Color("40352d"))
	panel.add_child(heading)
	var actions := HBoxContainer.new()
	panel.add_child(actions)
	for text in ["Owner / Noah", "Candidate / baseline", "Walk / idle", "Ground guides", "Silhouette / paint", "Flat shading"]:
		var button := Button.new()
		button.text = text
		actions.add_child(button)
		button.pressed.connect(func():
			match text:
				"Owner / Noah": select_character("owner" if character == "noah" else "noah")
				"Candidate / baseline": use_candidate = not use_candidate
				"Walk / idle": walking = not walking
				"Ground guides": show_guides = not show_guides
				"Silhouette / paint": silhouette = not silhouette
				"Flat shading": flat_shading = not flat_shading
		)
	var scales := HBoxContainer.new()
	panel.add_child(scales)
	for key in ["width", "height", "overall"]:
		var label := Label.new()
		label.text = key
		label.add_theme_color_override("font_color", Color("40352d"))
		scales.add_child(label)
		var slider := HSlider.new()
		slider.min_value = 0.7
		slider.max_value = 1.3
		slider.step = 0.01
		slider.value = 1.0
		slider.custom_minimum_size.x = 180
		scales.add_child(slider)
		slider.value_changed.connect(func(value: float):
			match key:
				"width": width_scale = value
				"height": height_scale = value
				"overall": overall_scale = value
		)
	status = Label.new()
	status.add_theme_color_override("font_color", Color("40352d"))
	panel.add_child(status)
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--capture="): capture_path = arg.trim_prefix("--capture=")
		if arg == "--idle": walking = false
		if arg == "--baseline": use_candidate = false
		if arg == "--small": overall_scale = 0.7
		if arg == "--large": overall_scale = 1.3
		if arg == "--silhouette": silhouette = true
		if arg == "--flat": flat_shading = true
		if arg.begins_with("--frame="): forced_frame = int(arg.trim_prefix("--frame="))

func ground(origin: Vector2, x: float, y: float, tx: float) -> Vector2:
	return origin + Vector2((x-y)*tx, (x+y)*tx*0.54)

func tile(p: Vector2, tx: float) -> void:
	var points := PackedVector2Array([p+Vector2(0,-tx*.54), p+Vector2(tx,0), p+Vector2(0,tx*.54), p+Vector2(-tx,0)])
	draw_colored_polygon(points, Color("d8c4a2"))
	points.append(points[0])
	draw_polyline(points, Color("b3a083"), 1.0)

func select_character(id: String) -> void:
	character = id
	baseline = texture("assets/characters/" + id + ".webp")
	atlas = texture("docs/art/" + id + "-study/" + id + ".webp")

func actor(p: Vector2, dir: int, frame: int, tx: float, source: Texture2D, adjustable := true) -> void:
	if source == null: return
	var scale := Vector2(width_scale, height_scale)*overall_scale*tx/TILE_X
	if not adjustable: scale = Vector2.ONE*tx/TILE_X
	draw_set_transform(p, 0, scale)
	draw_texture_rect_region(source, Rect2(-ANCHOR, Vector2(256,256)), Rect2(frame*256,dir*256,256,256), Color.BLACK if silhouette else Color.WHITE)
	draw_set_transform(Vector2.ZERO)
	if show_guides:
		draw_line(p-Vector2(5,0),p+Vector2(5,0),Color("cf5a40"),1.0)
		draw_line(p-Vector2(0,5),p+Vector2(0,5),Color("cf5a40"),1.0)

func furniture(p: Vector2, tx: float) -> void:
	if shelf == null: return
	var scale := tx/86.19967651367188
	draw_texture_rect(shelf, Rect2(p-Vector2(256.0002136230469,389.38427734375)*scale,Vector2(512,512)*scale), false)

func _draw() -> void:
	var source := atlas if use_candidate else baseline
	var frame := 1+int(elapsed*6.0)%2 if walking else 0
	if forced_frame >= 0: frame = clampi(forced_frame,0,2)
	# Large inspection row: all four true directions on independent footprints.
	for dir in range(4):
		var p := Vector2(180+dir*245,385)
		if character == "owner":
			tile(p-Vector2(60,0),40)
			actor(p-Vector2(60,0),dir,frame,40,companion,false)
			tile(p+Vector2(40,0),40)
			actor(p+Vector2(40,0),dir,frame,40,source)
		else:
			tile(p,50)
			actor(p,dir,frame,50,source)
	# Small/game-scale row: walk around a 2x1 shelf with game-space depth sorting.
	for dir in range(4):
		var origin := Vector2(150+dir*245,530)
		for x in range(4):
			for y in range(4): tile(ground(origin,x,y,18),18)
		var corners := [Vector2(.5,.5),Vector2(3.5,.5),Vector2(3.5,3.5),Vector2(.5,3.5)]
		var progress := fmod(elapsed*.6+dir,4.0) if walking else float(dir)
		var segment := int(progress)
		var pos: Vector2 = corners[segment].lerp(corners[(segment+1)%4],progress-segment)
		var facing: int = [1,0,3,2][segment] if walking else dir
		var p := ground(origin,pos.x,pos.y,18)
		var shelf_p := ground(origin,2,1.5,18)
		if pos.x+pos.y < 3.5:
			actor(p,facing,frame,18,source)
			furniture(shelf_p,18)
		else:
			furniture(shelf_p,18)
			actor(p,facing,frame,18,source)
	# Twelve-frame inspection strip. Changes to scale keep anchor stationary.
	for dir in range(4):
		for f in range(3): actor(Vector2(78+(dir*3+f)*86,765),dir,f,18,source)

func _process(delta: float) -> void:
	elapsed += delta
	preview_material.set_shader_parameter("strength", 0.85 if flat_shading else 0.0)
	status.text = "%s %s | width %.0f%%  height %.0f%%  scale %.0f%% | %s | red cross = fixed ground anchor" % [character.to_upper(),"CANDIDATE" if use_candidate else "BASELINE",width_scale*100,height_scale*100,overall_scale*100,"5-value shading" if flat_shading else "paint",]
	queue_redraw()
	count += 1
	if capture_path != "" and count == 8:
		await RenderingServer.frame_post_draw
		var err := get_viewport().get_texture().get_image().save_png(capture_path)
		print("CAPTURE ",capture_path," result=",err)
		get_tree().quit(err)
