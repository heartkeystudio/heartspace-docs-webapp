extends SceneTree

# Production asset build using Canvas Draw's real documents, layers, Save and exporter.
# Run from the Canvas Godot project; no editor scene or test harness is started.
const ProjectData = preload("res://core/pixel_painter/pixel_painter_project.gd")
const CanvasData = preload("res://core/pixel_painter/pixel_canvas_document.gd")
const FrameData = preload("res://core/pixel_painter/pixel_painter_frame.gd")
const Files = preload("res://core/pixel_painter/pixel_painter_file_service.gd")
const Exporter = preload("res://core/pixel_painter/pixel_painter_exporter.gd")

func _init() -> void:
	var args := OS.get_cmdline_user_args()
	if args.is_empty():
		push_error("Informe a pasta examples/heartspace como argumento.")
		quit(1)
		return
	var root: String = args[0].simplify_path()
	var source_dir := root.path_join("canvas")
	var assets_dir := root.path_join("assets")
	DirAccess.make_dir_recursive_absolute(source_dir)
	DirAccess.make_dir_recursive_absolute(assets_dir)
	var project = ProjectData.create(Vector2i(1280, 720), "HeartSpace — uma ideia ganha mundo")
	project.project_id = "heartspace_showcase_art_v1"
	project.author_name = "HeartSpace"
	project.notes = "Arte editorial original para a apresentação do Docs. Cada Canvas é uma camada exportada separadamente para composição/parallax. Sem trilha de áudio."
	project.canvases.clear()
	project.frames.clear()
	project.face_animation_clips.clear()
	project.active_face_animation_id = ""
	var art: Array[Dictionary] = [
		{"id":"backdrop", "name":"01 · Noite de criação", "svg":backdrop()},
		{"id":"paper-world", "name":"02 · Mundo de papel", "svg":paper_world()},
		{"id":"constellation", "name":"03 · Caminhos e encontros", "svg":constellation()}
	]
	var project_path := source_dir.path_join("heartspace-art.hcs")
	for item in art:
		var source_file := FileAccess.open(source_dir.path_join(item.id + ".svg"), FileAccess.WRITE)
		source_file.store_string(item.svg)
		source_file.close()
		var image := Image.new()
		if image.load_svg_from_string(item.svg) != OK:
			push_error("Falha ao rasterizar " + str(item.id)); quit(1); return
		var canvas = CanvasData.create_from_image(image, item.name)
		canvas.canvas_id = item.id
		canvas.layers[0].display_name = item.name
		if canvas.write_layer(canvas.layers[0], image, project_path) != OK:
			push_error("Falha ao gravar camada Canvas."); quit(1); return
		project.canvases.append(canvas)
		var frame = FrameData.new()
		frame.frame_id = "frame_" + str(item.id)
		frame.canvas_id = item.id
		project.frames.append(frame)
	project.active_canvas_id = "paper-world"
	project.assembly_size = Vector2i(1280, 720)
	project.create_face_animation("Artes da apresentação")
	var saved: Dictionary = Files.save_project(project, project_path)
	if not saved.get("ok", false):
		push_error(str(saved)); quit(1); return
	var exported: Dictionary = Exporter.export_png_frames(project, assets_dir, "heartspace")
	if not exported.get("ok", false):
		push_error(str(exported)); quit(1); return
	for index in range(art.size()):
		var from := assets_dir.path_join("heartspace_%03d.png" % index)
		var to := assets_dir.path_join(str(art[index].id) + ".png")
		if DirAccess.rename_absolute(from, to) != OK:
			push_error("Falha ao nomear arte exportada."); quit(1); return
	# Keep the Canvas export metadata consistent with the friendly asset names.
	var metadata_path := assets_dir.path_join("animation.json")
	var metadata: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(metadata_path))
	for index in range(art.size()): metadata.frames[index].file = str(art[index].id) + ".png"
	var metadata_file := FileAccess.open(metadata_path, FileAccess.WRITE)
	metadata_file.store_string(JSON.stringify(metadata, "\t")); metadata_file.close()
	print("Artes salvas pelo Canvas Draw e exportadas: " + project_path)
	quit(0)

func svg_document(content: String) -> String:
	return '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">' + content + '</svg>'

func backdrop() -> String:
	return svg_document('''<defs><radialGradient id="night" cx="78%" cy="24%" r="90%"><stop stop-color="#203d50"/><stop offset=".6" stop-color="#142532"/><stop offset="1" stop-color="#0b151e"/></radialGradient><pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#d0e4d8" stroke-opacity=".045"/></pattern></defs><rect width="1280" height="720" fill="url(#night)"/><rect width="1280" height="720" fill="url(#grid)"/><path d="M80 76H1200M80 644H1200" stroke="#b8d6ce" stroke-opacity=".16"/><circle cx="1197" cy="76" r="3" fill="#b8ddc8"/>''')

func paper_world() -> String:
	return svg_document('''<defs><linearGradient id="orb" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ebd3aa"/><stop offset="1" stop-color="#cc816c"/></linearGradient><linearGradient id="page" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5f0df"/><stop offset="1" stop-color="#bcd3c5"/></linearGradient></defs><circle cx="1000" cy="295" r="183" fill="url(#orb)"/><path d="M785 405L990 305 1198 407 993 510Z" fill="#182a34"/><path d="M785 387L990 287 1198 389 993 492Z" fill="#d4856d"/><path d="M817 351L992 266 1168 352 993 439Z" fill="#e6c5a1"/><path d="M844 315L994 242 1141 315 993 389Z" fill="url(#page)"/><path d="M993 389V439M993 492V510" stroke="#45605a" stroke-width="2"/><path d="M994 242V389" stroke="#9bbbab" stroke-width="2"/><path d="M884 315L968 274M900 327L979 289M1011 281L1098 324M1011 296L1071 326" stroke="#7c9b8d" stroke-width="3" stroke-linecap="round"/><path d="M1028 204L1064 147 1081 201 1120 218 1080 231 1064 283 1047 231 1011 217Z" fill="#d1ead9"/><path d="M1064 147V283M1011 217H1120" stroke="#547a6e" stroke-width="1.5"/><circle cx="828" cy="223" r="15" fill="#b6d9c7"/><circle cx="1175" cy="336" r="7" fill="#eedfc3"/>''')

func constellation() -> String:
	return svg_document('''<g fill="none" stroke="#a9cdbf" stroke-width="1.5"><path d="M717 364C727 196 844 108 1004 115S1221 259 1203 419" opacity=".38"/><path d="M765 474L879 427 978 476 1094 414 1191 465" opacity=".7"/><path d="M879 427L881 534 978 476 1087 542 1094 414" opacity=".35"/></g><g fill="#c2e3d1"><circle cx="765" cy="474" r="4"/><circle cx="879" cy="427" r="5"/><circle cx="978" cy="476" r="5"/><circle cx="1094" cy="414" r="5"/><circle cx="1191" cy="465" r="4"/><circle cx="881" cy="534" r="3"/><circle cx="1087" cy="542" r="3"/></g><g stroke="#ddbaa2" stroke-width="1.5"><path d="M775 163V181M766 172H784M1157 122V140M1148 131H1166M1221 526V540M1214 533H1228"/></g>''')
