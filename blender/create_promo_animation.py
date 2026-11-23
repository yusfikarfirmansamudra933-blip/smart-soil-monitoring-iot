import bpy
import json
import os
import math

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = os.path.join(BASE_DIR, "textures_v3")
AUDIO_DIR = os.path.join(BASE_DIR, "audio")
OUT_DIR = os.path.join(BASE_DIR, "output")
os.makedirs(OUT_DIR, exist_ok=True)

BLEND_OUT = os.path.join(BASE_DIR, "smart_soil_promo.blend")
MP4_SILENT_OUT = os.path.join(OUT_DIR, "smart_soil_promo_silent.mp4")

def load_timings():
    tpath = os.path.join(AUDIO_DIR, "timings.json")
    with open(tpath, "r", encoding="utf-8") as f:
        return json.load(f)

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def setup_render(scene, total_frames, fps=30):
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 720
    scene.render.resolution_y = 1280
    scene.render.resolution_percentage = 100
    scene.render.fps = fps
    scene.frame_start = 1
    scene.frame_end = total_frames

    if hasattr(scene.eevee, "taa_render_samples"):
        scene.eevee.taa_render_samples = 8

    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'

    scene.render.filepath = MP4_SILENT_OUT
    if hasattr(scene.render.image_settings, "media_type"):
        scene.render.image_settings.media_type = 'VIDEO'
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MPEG4'
    scene.render.ffmpeg.codec = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.ffmpeg.ffmpeg_preset = 'REALTIME'

def setup_world(scene):
    world = bpy.data.worlds.new("CleanDarkWorld")
    scene.world = world
    nt = world.node_tree
    nt.nodes.clear()
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = (0.005, 0.010, 0.022, 1.0)
    bg.inputs["Strength"].default_value = 1.0
    out = nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])

def create_radial_orb(name, color=(0.04, 0.78, 0.52, 1.0), radius=3.8, strength=1.15, alpha_max=0.52):
    bpy.ops.mesh.primitive_plane_add(size=radius * 2, location=(0, 2.2, 0), rotation=(math.radians(90), 0, 0))
    obj = bpy.context.active_object
    obj.name = name

    mat = bpy.data.materials.new(name + "_Mat")
    if hasattr(mat, "surface_render_method"):
        mat.surface_render_method = 'BLENDED'
    mat.use_backface_culling = False
    nt = mat.node_tree
    nt.nodes.clear()

    tex_coord = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.inputs["Location"].default_value = (-1.0, -1.0, 0.0)
    mapping.inputs["Scale"].default_value = (2.0, 2.0, 1.0)

    grad = nt.nodes.new("ShaderNodeTexGradient")
    grad.gradient_type = 'QUADRATIC_SPHERE'

    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    ramp.color_ramp.elements[1].position = 1.0
    ramp.color_ramp.elements[1].color = (alpha_max, alpha_max, alpha_max, 1.0)

    emission = nt.nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = color
    emission.inputs["Strength"].default_value = strength

    transp = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    out = nt.nodes.new("ShaderNodeOutputMaterial")

    nt.links.new(tex_coord.outputs["UV"], mapping.inputs["Vector"])
    nt.links.new(mapping.outputs["Vector"], grad.inputs["Vector"])
    nt.links.new(grad.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], mix.inputs["Fac"])
    nt.links.new(transp.outputs["BSDF"], mix.inputs[1])
    nt.links.new(emission.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])

    obj.data.materials.append(mat)
    return obj

def create_glow_ring(name, color=(0.06, 0.85, 0.56, 1.0), radius=2.6, thickness=0.04, strength=1.4):
    """Thin luminous 3D ring floating behind frosted glass for bold depth & motion feel."""
    bpy.ops.mesh.primitive_torus_add(
        major_radius=radius,
        minor_radius=thickness,
        major_segments=72,
        minor_segments=12,
        location=(0, 1.4, 0),
        rotation=(math.radians(90), 0, 0),
    )
    obj = bpy.context.active_object
    obj.name = name
    mat = bpy.data.materials.new(name + "_Mat")
    if hasattr(mat, "surface_render_method"):
        mat.surface_render_method = 'BLENDED'
    nt = mat.node_tree
    nt.nodes.clear()
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = color
    em.inputs["Strength"].default_value = strength
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.24
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(tr.outputs["BSDF"], mix.inputs[1])
    nt.links.new(em.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    obj.data.materials.append(mat)
    return obj

def create_ui_card(name, filename, width=3.5):
    path = os.path.join(TEX_DIR, filename)
    img = bpy.data.images.load(path, check_existing=True)
    w_px, h_px = img.size
    aspect = h_px / max(1, w_px)
    height = width * aspect

    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0, 0), rotation=(math.radians(90), 0, 0))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (width, height, 1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    mat = bpy.data.materials.new(name + "_Mat")
    if hasattr(mat, "surface_render_method"):
        mat.surface_render_method = 'BLENDED'
    mat.use_backface_culling = False
    nt = mat.node_tree
    nt.nodes.clear()

    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.extension = 'CLIP'

    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = 1.05

    transp = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    out = nt.nodes.new("ShaderNodeOutputMaterial")

    nt.links.new(tex.outputs["Color"], em.inputs["Color"])
    nt.links.new(tex.outputs["Alpha"], mix.inputs["Fac"])
    nt.links.new(transp.outputs["BSDF"], mix.inputs[1])
    nt.links.new(em.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])

    obj.data.materials.append(mat)
    return obj

def key(obj, frame, loc=None, rot_deg=None, scale=None):
    if loc is not None:
        obj.location = loc
        obj.keyframe_insert(data_path="location", frame=frame)
    if rot_deg is not None:
        obj.rotation_euler = (
            math.radians(90 + rot_deg[0]),
            math.radians(rot_deg[1]),
            math.radians(rot_deg[2]),
        )
        obj.keyframe_insert(data_path="rotation_euler", frame=frame)
    if scale is not None:
        if isinstance(scale, (int, float)):
            obj.scale = (scale, scale, scale)
        else:
            obj.scale = scale
        obj.keyframe_insert(data_path="scale", frame=frame)

def spring_in(obj, f_start, target_loc, start_offset=(0, 2.8, -1.6), start_rot=(-26, 0, 0), dur=14):
    """Punchy spring overshoot entrance: flies in boldly, overshoots 1.08x, snaps cleanly to 1.0x centered."""
    f_over = f_start + int(dur * 0.65)
    f_settle = f_start + dur
    start_loc = (
        target_loc[0] + start_offset[0],
        target_loc[1] + start_offset[1],
        target_loc[2] + start_offset[2],
    )
    key(obj, 1, loc=(0, 6.0, 0), rot_deg=start_rot, scale=0.001)
    key(obj, f_start, loc=start_loc, rot_deg=start_rot, scale=0.001)
    key(obj, f_over, loc=(target_loc[0], target_loc[1] - 0.18, target_loc[2] + 0.06), rot_deg=(3.0, 0, 0), scale=1.08)
    key(obj, f_settle, loc=target_loc, rot_deg=(0, 0, 0), scale=1.0)

def set_snappy_easing():
    for action in bpy.data.actions:
        if hasattr(action, "fcurves"):
            for fc in action.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = 'BEZIER'
                    kp.handle_left_type = 'AUTO_CLAMPED'
                    kp.handle_right_type = 'AUTO_CLAMPED'

def build_scene():
    meta = load_timings()
    sc = meta["scenes"]
    total_frames = meta["total_frames"]
    fps = meta["fps"]

    clear_scene()
    scene = bpy.context.scene
    setup_render(scene, total_frames, fps=fps)
    setup_world(scene)

    # Camera strictly dead-center on X = 0.0, bold dynamic Z/Y punches!
    bpy.ops.object.camera_add(location=(0, -10.0, 0), rotation=(math.radians(90), 0, 0))
    cam = bpy.context.active_object
    cam.data.lens = 48
    scene.camera = cam

    s1_s, s1_e = sc["s1"]["start_frame"], sc["s1"]["end_frame"]
    s2_s, s2_e = sc["s2"]["start_frame"], sc["s2"]["end_frame"]
    s3_s, s3_e = sc["s3"]["start_frame"], sc["s3"]["end_frame"]
    s4_s, s4_e = sc["s4"]["start_frame"], sc["s4"]["end_frame"]
    s5_s, s5_e = sc["s5"]["start_frame"], sc["s5"]["end_frame"]
    s6_s, s6_e = sc["s6"]["start_frame"], sc["s6"]["end_frame"]

    # ========================================================================
    # DYNAMIC MOVING LIGHT ORBS & 3D RING (Shining through Frosted Glass!)
    # ========================================================================
    orb_amber = create_radial_orb("Orb_Amber", color=(0.98, 0.48, 0.08, 1.0), radius=3.8, strength=1.25, alpha_max=0.55)
    key(orb_amber, 1, loc=(-1.2, 2.2, 1.6), scale=1.0)
    key(orb_amber, int((s1_s + s1_e) / 2), loc=(1.1, 2.2, -0.4), scale=1.25)
    key(orb_amber, s1_e - 6, loc=(0.0, 2.2, 0.2), scale=1.35)
    key(orb_amber, s2_s + 8, loc=(0.0, 2.2, 0.0), scale=0.001)

    orb_rose = create_radial_orb("Orb_Rose", color=(0.95, 0.18, 0.38, 1.0), radius=3.2, strength=1.1, alpha_max=0.45)
    key(orb_rose, 1, loc=(1.4, 2.4, -1.6), scale=0.95)
    key(orb_rose, s1_e - 8, loc=(-1.0, 2.4, -0.9), scale=1.15)
    key(orb_rose, s2_s + 6, loc=(0.0, 2.4, -1.0), scale=0.001)

    orb_em = create_radial_orb("Orb_Emerald", color=(0.04, 0.85, 0.54, 1.0), radius=4.2, strength=1.25, alpha_max=0.56)
    key(orb_em, 1, loc=(0, 2.0, 0), scale=0.001)
    key(orb_em, s2_s - 4, loc=(0, 2.0, 0), scale=0.001)
    key(orb_em, s2_s + 18, loc=(-0.9, 2.0, 0.9), scale=1.25)
    key(orb_em, s3_e, loc=(1.1, 2.0, -0.6), scale=1.18)
    key(orb_em, s4_e, loc=(-1.0, 2.0, 0.8), scale=1.32)
    key(orb_em, s5_e, loc=(0.8, 2.0, -0.2), scale=1.25)
    key(orb_em, total_frames, loc=(0.0, 2.0, 0.3), scale=1.35)

    orb_cyan = create_radial_orb("Orb_Cyan", color=(0.06, 0.62, 0.98, 1.0), radius=3.6, strength=1.15, alpha_max=0.48)
    key(orb_cyan, 1, loc=(1.2, 2.3, -1.5), scale=0.001)
    key(orb_cyan, s2_s + 10, loc=(1.3, 2.3, -1.4), scale=0.95)
    key(orb_cyan, s3_e, loc=(-1.2, 2.3, 1.2), scale=1.15)
    key(orb_cyan, s4_e, loc=(1.2, 2.3, -1.1), scale=1.22)
    key(orb_cyan, total_frames, loc=(-0.9, 2.3, -1.4), scale=1.10)

    # Dynamic glowing 3D energy ring framing behind hero glass cards (always camera-facing!)
    ring = create_glow_ring("EnergyRing", color=(0.06, 0.92, 0.60, 1.0), radius=2.45, thickness=0.028, strength=1.35)
    key(ring, 1, loc=(0, 1.8, 0), rot_deg=(0, 0, 0), scale=0.001)
    key(ring, s2_s - 2, loc=(0, 1.8, 0), rot_deg=(0, 0, 0), scale=0.001)
    key(ring, s2_s + 22, loc=(0, 1.8, 0), rot_deg=(0, 0, 45), scale=1.08)
    key(ring, s3_e, loc=(0, 1.9, 0), rot_deg=(0, 0, 140), scale=1.24)
    key(ring, s4_e, loc=(0, 1.8, 0), rot_deg=(0, 0, 240), scale=1.16)
    key(ring, total_frames, loc=(0, 1.7, 0), rot_deg=(0, 0, 360), scale=1.10)

    # ========================================================================
    # SCENE 1: HOOK ("Masih cek pH tanah secara manual?") — Dead-Center + Bold Motion
    # ========================================================================
    h1 = create_ui_card("S1_Headline", "s1_headline.png", width=3.85)
    spring_in(h1, 2, target_loc=(0.0, -0.1, 1.82), start_offset=(0, 3.0, 1.4), start_rot=(24, 0, 0), dur=14)
    key(h1, s1_e - 12, loc=(0.0, -0.25, 1.86), rot_deg=(0, 0, 0), scale=1.03)
    key(h1, s1_e, loc=(0.0, -3.5, 3.2), rot_deg=(-35, 0, 0), scale=0.001)

    # 3 Frosted Problem Cards — strictly centered X=0.0 with bold staggered slam-in & swirl-out
    prob_specs = [
        ("S1_Prob_pH", "s1_prob_ph.png", 3.45, 0.28, (-2.6, 2.2, -0.4), (0, -24, 10), 12),
        ("S1_Prob_DMS", "s1_prob_dms.png", 3.45, -0.88, (2.6, 2.2, -0.4), (0, 24, -10), 22),
        ("S1_Prob_Manual", "s1_prob_manual.png", 3.45, -1.96, (0.0, 2.6, -1.6), (-28, 0, 0), 32),
    ]
    for name, fname, w, z_pos, offset, rot, f_in in prob_specs:
        c = create_ui_card(name, fname, width=w)
        spring_in(c, f_in, target_loc=(0.0, 0.0, z_pos), start_offset=offset, start_rot=rot, dur=14)
        key(c, s1_e - 12, loc=(0.0, -0.15, z_pos + 0.04), rot_deg=(0, 0, 0), scale=1.02)
        # Dramatic vortex implosion to center
        key(c, s1_e, loc=(0.0, -0.5, 0.0), rot_deg=(0, 0, 145), scale=0.001)

    # ========================================================================
    # SCENE 2: SOLUTION REVEAL ("Tenang, kini ada..." -> Frosted Glass Hero Logo)
    # ========================================================================
    s2_mid = s2_s + 28
    tenang = create_ui_card("S2_Tenang", "s2_tenang.png", width=3.65)
    spring_in(tenang, s2_s - 4, target_loc=(0.0, -0.2, 0.0), start_offset=(0, 3.2, -0.8), start_rot=(-22, 0, 0), dur=12)
    key(tenang, s2_mid - 4, loc=(0.0, -0.35, 0.05), rot_deg=(0, 0, 0), scale=1.06)
    key(tenang, s2_mid + 6, loc=(0.0, -3.2, 2.4), rot_deg=(28, 0, 0), scale=0.001)

    logo = create_ui_card("S2_Logo", "s2_logo.png", width=3.75)
    spring_in(logo, s2_mid - 2, target_loc=(0.0, -0.2, 0.0), start_offset=(0, 3.8, -1.2), start_rot=(-32, 0, 0), dur=15)
    key(logo, s2_e - 10, loc=(0.0, -0.55, 0.0), rot_deg=(0, 0, 0), scale=1.06)
    key(logo, s2_e + 2, loc=(0.0, -4.2, 1.8), rot_deg=(30, 0, 0), scale=0.001)

    # ========================================================================
    # SCENE 3: 3 FROSTED SENSOR CARDS (pH, DMS, DS18B20) — Bold 3D Flip-In, Dead-Center!
    # ========================================================================
    s3_t = create_ui_card("S3_Title", "s3_title.png", width=3.85)
    spring_in(s3_t, s3_s - 4, target_loc=(0.0, -0.1, 2.32), start_offset=(0, 2.8, 1.2), start_rot=(22, 0, 0), dur=13)
    key(s3_t, s3_e - 10, loc=(0.0, -0.22, 2.32), rot_deg=(0, 0, 0), scale=1.02)
    key(s3_t, s3_e + 2, loc=(0.0, 1.8, 4.2), rot_deg=(28, 0, 0), scale=0.001)

    s3_cards = [
        ("S3_pH", "s3_card_ph.png", 3.65, 1.05, (-2.8, 2.4, -0.5), (0, -26, 0), s3_s + 4),
        ("S3_DMS", "s3_card_dms.png", 3.65, -0.22, (2.8, 2.4, -0.5), (0, 26, 0), s3_s + 24),
        ("S3_Temp", "s3_card_temp.png", 3.65, -1.49, (-2.8, 2.4, -0.5), (0, -26, 0), s3_s + 46),
    ]
    for name, fname, w, z_pos, offset, rot, f_in in s3_cards:
        c = create_ui_card(name, fname, width=w)
        spring_in(c, f_in, target_loc=(0.0, 0.0, z_pos), start_offset=offset, start_rot=rot, dur=15)
        key(c, s3_e - 10, loc=(0.0, -0.28, z_pos), rot_deg=(0, 0, 0), scale=1.03)
        key(c, s3_e + 2, loc=(0.0, -2.5, z_pos + 3.6), rot_deg=(32, 0, 0), scale=0.001)

    # ========================================================================
    # SCENE 4: SOLAR 10Wp + BATERAI 12V 7Ah + MODEM 4G FROSTED SPOTLIGHT
    # ========================================================================
    spot = create_ui_card("S4_Spotlight", "s4_spotlight.png", width=3.65)
    spring_in(spot, s4_s - 4, target_loc=(0.0, -0.15, 0.0), start_offset=(0, 3.8, -2.6), start_rot=(-34, 0, 0), dur=16)
    # Gentle floating breath while centered
    s4_mid = int((s4_s + s4_e) / 2)
    key(spot, s4_mid, loc=(0.0, -0.35, 0.04), rot_deg=(0, -3.5, 0), scale=1.02)
    key(spot, s4_e - 10, loc=(0.0, -0.55, 0.0), rot_deg=(0, 3.5, 0), scale=1.05)
    key(spot, s4_e + 2, loc=(0.0, 2.6, 0.0), rot_deg=(0, 42, 0), scale=0.001)

    # ========================================================================
    # SCENE 5: KINETIC TRANSFORMATION ("Dari ribet." -> "Jadi otomatis.") — High Energy Whip!
    # ========================================================================
    s5_mid = s5_s + int((s5_e - s5_s) * 0.44)

    ribet = create_ui_card("S5_Ribet", "s5_ribet.png", width=3.85)
    spring_in(ribet, s5_s - 3, target_loc=(0.0, -0.2, 0.1), start_offset=(-3.2, 2.0, 0), start_rot=(0, -25, -8), dur=11)
    key(ribet, s5_mid - 4, loc=(0.0, -0.3, 0.1), rot_deg=(0, 0, 0), scale=1.04)
    key(ribet, s5_mid + 5, loc=(-4.5, -0.2, 0.1), rot_deg=(0, -30, -14), scale=0.001)

    otomatis = create_ui_card("S5_Otomatis", "s5_otomatis.png", width=3.85)
    spring_in(otomatis, s5_mid - 2, target_loc=(0.0, -0.25, 0.05), start_offset=(3.6, 2.2, 0), start_rot=(0, 28, 10), dur=12)
    key(otomatis, s5_e - 8, loc=(0.0, -0.55, 0.05), rot_deg=(0, 0, 0), scale=1.08)
    key(otomatis, s5_e + 4, loc=(0.0, -3.6, 2.4), rot_deg=(28, 0, 0), scale=0.001)

    # ========================================================================
    # SCENE 6: FINAL FROSTED GLASS OUTRO CTA (Dead-Center)
    # ========================================================================
    outro = create_ui_card("S6_Outro", "s6_outro.png", width=3.75)
    spring_in(outro, s6_s - 4, target_loc=(0.0, -0.2, 0.0), start_offset=(0, 4.0, -1.8), start_rot=(-32, 0, 0), dur=16)
    key(outro, total_frames, loc=(0.0, -0.65, 0.0), rot_deg=(0, 0, 0), scale=1.06)

    # Punchy camera zoom pulses on every scene beat — ALWAYS X = 0.0 (100% centered!)
    cam_keys = [
        (1, -10.5),
        (18, -9.8),
        (s1_e - 4, -10.4),
        (s2_mid + 12, -9.5),
        (s3_s + 14, -10.0),
        (s3_e - 8, -9.5),
        (s4_s + 16, -9.85),
        (s4_e - 10, -9.4),
        (s5_mid + 10, -9.35),
        (s6_s + 18, -9.8),
        (total_frames, -9.45),
    ]
    for f, y_cam in cam_keys:
        cam.location = (0.0, y_cam, 0.0)
        cam.keyframe_insert(data_path="location", frame=min(total_frames, f))

    set_snappy_easing()

    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)
    print("SAVED BLEND:", BLEND_OUT)

    if os.environ.get("PREVIEW_ONLY") == "1":
        if hasattr(scene.render.image_settings, "media_type"):
            scene.render.image_settings.media_type = 'IMAGE'
        scene.render.image_settings.file_format = 'PNG'
        preview_frames = [
            s1_s + 48,
            s2_mid + 24,
            s3_s + 72,
            s4_s + 35,
            s5_mid + 18,
            s6_s + 30,
        ]
        for idx, f in enumerate(preview_frames, start=1):
            scene.frame_set(min(total_frames, f))
            scene.render.filepath = os.path.join(OUT_DIR, f"v3_preview_{idx}.png")
            bpy.ops.render.render(write_still=True)
        print("RENDERED V3 PREVIEW FRAMES:", preview_frames)
    else:
        bpy.ops.render.render(animation=True)
        print("RENDERED SILENT MP4:", MP4_SILENT_OUT)

if __name__ == "__main__":
    build_scene()
