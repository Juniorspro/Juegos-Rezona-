# escena.py: arma en Blender el personaje estilo Roblox (R6), la espada "Eclipse Blade", la coreografía de 15 s con
# keyframes y easings (como en Eclipse / Moon Animator), los efectos (trails, chispas, ondas, aura, onda final que
# rompe una pared de ladrillos) y la cámara. Guarda escena.blend, escena.glb y claves.json (para el HTML).
import bpy, bmesh, math, json, random, os
from mathutils import Vector, Matrix, Euler

D = os.path.dirname(os.path.abspath(__file__))
FPS, END = 24, 360
random.seed(7)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = FPS; sc.frame_start = 0; sc.frame_end = END

def lin(c): return tuple(pow(v, 2.2) for v in c)
def hexc(h): return lin(tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)))

# ---------------- materiales ----------------
def mat(name, col, metal=0.0, rough=0.5, emis=None, es=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Metallic'].default_value = metal; b.inputs['Roughness'].default_value = rough
    if emis: b.inputs['Emission Color'].default_value = (*emis, 1); b.inputs['Emission Strength'].default_value = es
    return m

FADES = []
def glow_mat(name, col, strength=8.0, grad=False):
    """emisión con transparencia: 'fade' (0..1) se anima; con grad, se desvanece a lo largo de la U (los trails)"""
    m = bpy.data.materials.new(name); m.use_nodes = True; m.blend_method = 'BLEND'
    nt = m.node_tree; N = nt.nodes; L = nt.links
    for n in list(N): N.remove(n)
    out = N.new('ShaderNodeOutputMaterial'); mix = N.new('ShaderNodeMixShader'); tr = N.new('ShaderNodeBsdfTransparent'); em = N.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (*col, 1); em.inputs['Strength'].default_value = strength
    fade = N.new('ShaderNodeValue'); fade.name = 'fade'; fade.outputs[0].default_value = 1.0
    fac = fade.outputs[0]
    if grad:
        tc = N.new('ShaderNodeTexCoord'); sp = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['UV'], sp.inputs[0])
        pw = N.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = 1.6; L.new(sp.outputs['X'], pw.inputs[0])
        edge = N.new('ShaderNodeMath'); edge.operation = 'SINE'; L.new(sp.outputs['Y'], edge.inputs[0])
        e2 = N.new('ShaderNodeMath'); e2.operation = 'MULTIPLY'; e2.inputs[1].default_value = math.pi; L.new(sp.outputs['Y'], e2.inputs[0]); L.new(e2.outputs[0], edge.inputs[0])
        m1 = N.new('ShaderNodeMath'); m1.operation = 'MULTIPLY'; L.new(pw.outputs[0], m1.inputs[0]); L.new(edge.outputs[0], m1.inputs[1])
        m2 = N.new('ShaderNodeMath'); m2.operation = 'MULTIPLY'; L.new(m1.outputs[0], m2.inputs[0]); L.new(fade.outputs[0], m2.inputs[1])
        fac = m2.outputs[0]
    L.new(fac, mix.inputs[0]); L.new(tr.outputs[0], mix.inputs[1]); L.new(em.outputs[0], mix.inputs[2]); L.new(mix.outputs[0], out.inputs[0])
    return m

def fade_key(obj, m, f, a, ip='LINEAR'):
    """la transparencia en Blender (nodo fade) y, para el HTML, un vacío 'fade__X' cuya posición x es la misma"""
    v = m.node_tree.nodes['fade'].outputs[0]; v.default_value = a; v.keyframe_insert('default_value', frame=f)
    fe = bpy.data.objects.get('fade__' + obj.name)
    if fe is None:
        fe = bpy.data.objects.new('fade__' + obj.name, None); sc.collection.objects.link(fe)
    fe.location = (a, 0, 0); fe.keyframe_insert('location', frame=f, index=0)
    for fc in list(m.node_tree.animation_data.action.fcurves) + list(fe.animation_data.action.fcurves):
        for kp in fc.keyframe_points:
            if abs(kp.co.x - f) < 1e-3: kp.interpolation = ip

# ---------------- utilidades de objetos y keyframes ----------------
def link(o): sc.collection.objects.link(o); return o
def empty(name, loc=(0, 0, 0), parent=None):
    e = link(bpy.data.objects.new(name, None)); e.empty_display_size = 0.3; e.location = loc
    if parent: setp(e, parent)
    return e
def setp(child, parent):
    bpy.context.view_layer.update()
    mw = child.matrix_world.copy(); child.parent = parent; child.matrix_parent_inverse = Matrix(); child.matrix_world = mw
def box(name, size, loc, m, bevel=0.08, parent=None):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    if bevel: bmesh.ops.bevel(bm, geom=bm.edges[:] + bm.verts[:], offset=bevel, segments=3, affect='EDGES')
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    o = link(bpy.data.objects.new(name, me)); o.location = loc; o.data.materials.append(m)
    if parent: setp(o, parent)
    return o
def mesh_obj(name, verts, faces, m, loc=(0, 0, 0), parent=None, uvs=None, smooth=True):
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    if uvs:
        ul = me.uv_layers.new(name='UVMap')
        for poly in me.polygons:
            for li in poly.loop_indices: ul.data[li].uv = uvs[me.loops[li].vertex_index]
    for p in me.polygons: p.use_smooth = smooth
    o = link(bpy.data.objects.new(name, me)); o.location = loc; o.data.materials.append(m)
    if parent: setp(o, parent)
    return o
def sphere(name, r, loc, m, parent=None, seg=16, ring=8, scale=(1, 1, 1)):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * scale[0], v.co.y * scale[1], v.co.z * scale[2]))
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    o = link(bpy.data.objects.new(name, me)); o.location = loc; o.data.materials.append(m)
    if parent: setp(o, parent)
    return o
def cyl(name, r, h, loc, m, parent=None, seg=16, r2=None):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    o = link(bpy.data.objects.new(name, me)); o.location = loc; o.data.materials.append(m)
    if parent: setp(o, parent)
    return o

KEYS = []      # para la línea de tiempo del HTML: pista, cuadro, interpolación, easing
def key(o, f, loc=None, rot=None, scl=None, ip='BEZIER', ease='AUTO', log=True):
    paths = []
    if loc is not None: o.location = loc; o.keyframe_insert('location', frame=f); paths.append('location')
    if rot is not None: o.rotation_euler = tuple(math.radians(a) for a in rot); o.keyframe_insert('rotation_euler', frame=f); paths.append('rotation_euler')
    if scl is not None:
        o.scale = (scl, scl, scl) if isinstance(scl, (int, float)) else scl; o.keyframe_insert('scale', frame=f); paths.append('scale')
    for fc in o.animation_data.action.fcurves:
        if fc.data_path in paths:
            for kp in fc.keyframe_points:
                if abs(kp.co.x - f) < 1e-3: kp.interpolation = ip; kp.easing = ease
    if log: KEYS.append({'t': o.name, 'f': f, 'ip': ip, 'e': ease})

# ---------------- escenario ----------------
w = sc.world = bpy.data.worlds.new('noche'); w.use_nodes = True
bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (*hexc('0b0f24'), 1); bg.inputs[1].default_value = 0.6
img = bpy.data.images.load(os.path.join(D, 'baseplate.png'))
gm = bpy.data.materials.new('baseplate'); gm.use_nodes = True
gn = gm.node_tree.nodes; gb = gn['Principled BSDF']; gb.inputs['Roughness'].default_value = 0.75
tx = gn.new('ShaderNodeTexImage'); tx.image = img; mp = gn.new('ShaderNodeMapping'); tc = gn.new('ShaderNodeTexCoord')
mp.inputs['Scale'].default_value = (60, 60, 1)
gm.node_tree.links.new(tc.outputs['UV'], mp.inputs[0]); gm.node_tree.links.new(mp.outputs[0], tx.inputs[0]); gm.node_tree.links.new(tx.outputs[0], gb.inputs['Base Color'])
mesh_obj('baseplate', [(-60, -60, 0), (60, -60, 0), (60, 60, 0), (-60, 60, 0)], [(0, 1, 2, 3)], gm, uvs=[(0, 0), (1, 0), (1, 1), (0, 1)], smooth=False)
# columnas y bloques del fondo (parallax), en colores apagados de Roblox
for i in range(16):
    a = random.uniform(0, math.tau); r = random.uniform(18, 34)
    h = random.uniform(4, 14); x, y = math.cos(a) * r, math.sin(a) * r - 6
    box('pilar%d' % i, (random.choice([2, 3, 4]), random.choice([2, 3, 4]), h), (x, y, h / 2), mat('pil%d' % i, hexc(random.choice(['3a3f55', '2c3048', '4b3a5a', '2e4552'])), rough=0.8), bevel=0.06)

# luces
sun = bpy.data.lights.new('luna', 'SUN'); sun.energy = 1.4; sun.color = hexc('9fb4ff'); so = link(bpy.data.objects.new('luna', sun)); so.rotation_euler = (math.radians(55), 0, math.radians(-30))
for nm, col, loc, en in [('rim_cian', '45e4ff', (6, 4, 6), 900), ('rim_violeta', 'b05bff', (-7, -2, 5), 900), ('relleno', 'ffd9a8', (2, -12, 7), 500)]:
    L = bpy.data.lights.new(nm, 'AREA'); L.energy = en; L.color = hexc(col); L.size = 5
    lo = link(bpy.data.objects.new(nm, L)); lo.location = loc
    lo.rotation_euler = (Vector((0, -5, 2.5)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()

# ---------------- personaje R6 ----------------
SKIN, BLUE, GREEN, BLACK = hexc('f5cd30'), hexc('0d69ac'), hexc('a4bd47'), hexc('111111')
m_skin = mat('piel', SKIN, rough=0.45); m_tor = mat('torso', BLUE, rough=0.5); m_leg = mat('piernas', GREEN, rough=0.5); m_face = mat('cara', BLACK, rough=0.3)
m_scarf = mat('bufanda', hexc('d62a2a'), rough=0.6)
root = empty('Root')
torso_j = empty('Torso', (0, 0, 2), root)
box('torso_mesh', (2, 1, 2), (0, 0, 3), m_tor, parent=torso_j)
head_j = empty('Head', (0, 0, 4), torso_j)
box('head_mesh', (1.25, 1.25, 1.2), (0, 0, 4.62), m_skin, bevel=0.32, parent=head_j)
for sx in (-1, 1): sphere('ojo%d' % (sx + 1), 0.09, (0.24 * sx, -0.63, 4.78), m_face, head_j, scale=(0.8, 0.4, 1.5))
# la sonrisa clásica: un arco de cilindros
pts = [(0.28 * math.sin(t), -0.635, 4.48 - 0.12 * math.cos(t)) for t in [-1.0 + 0.25 * i for i in range(9)]]
for i in range(len(pts) - 1):
    a, b = Vector(pts[i]), Vector(pts[i + 1]); c = cyl('boca%d' % i, 0.025, (b - a).length + 0.02, (a + b) / 2, m_face, head_j, seg=6)
    c.rotation_euler = (b - a).to_track_quat('Z', 'Y').to_euler()
rsh = empty('RightArm', (-1.5, 0, 3.5), torso_j); box('rarm_mesh', (1, 1, 2), (-1.5, 0, 3), m_skin, parent=rsh)
lsh = empty('LeftArm', (1.5, 0, 3.5), torso_j); box('larm_mesh', (1, 1, 2), (1.5, 0, 3), m_skin, parent=lsh)
rhip = empty('RightLeg', (-0.5, 0, 2), root); box('rleg_mesh', (1, 1, 2), (-0.5, 0, 1), m_leg, parent=rhip)
lhip = empty('LeftLeg', (0.5, 0, 2), root); box('lleg_mesh', (1, 1, 2), (0.5, 0, 1), m_leg, parent=lhip)
sock = empty('RightGrip', (-1.5, 0, 1.75), rsh); sock.rotation_euler = (math.radians(90), 0, 0)
# bufanda: anillo al cuello y dos tiras que flamean
box('bufanda_cuello', (1.45, 1.2, 0.32), (0, 0, 4.05), m_scarf, bevel=0.1, parent=torso_j)
SCARF = []
for i, sx in enumerate((-0.25, 0.3)):
    j = empty('Scarf%d' % i, (sx, 0.55, 4.0), torso_j)
    box('tira%d' % i, (0.38, 0.08, 1.7), (sx, 0.6, 3.15), m_scarf, bevel=0.03, parent=j)
    SCARF.append(j)

# ---------------- la espada: Eclipse Blade ----------------
m_steel = mat('acero', hexc('2a2f3a'), metal=1.0, rough=0.18)
m_gold = mat('oro', hexc('d9a441'), metal=1.0, rough=0.28)
m_grip = mat('cuero', hexc('2b1a2e'), rough=0.7)
m_edge = bpy.data.materials.new('filo'); m_edge.use_nodes = True
eb = m_edge.node_tree.nodes['Principled BSDF']; eb.inputs['Base Color'].default_value = (*lin((0.6, 0.95, 1.0)), 1)
eb.inputs['Emission Color'].default_value = (*lin((0.35, 0.92, 1.0)), 1); eb.inputs['Emission Strength'].default_value = 4.0
m_gem = mat('gema', lin((0.55, 0.2, 1.0)), rough=0.05, emis=lin((0.6, 0.25, 1.0)), es=6)
def make_sword(name):
    rt = empty(name)
    # hoja: sección de rombo que se afina hacia la punta
    L0, L1, n = 0.65, 4.3, 14
    verts, faces = [], []
    for i in range(n + 1):
        t = i / n; z = L0 + (L1 - L0) * t * 0.93
        wd = 0.2 * (1 - 0.35 * t) * (1 - max(0, t - 0.82) * 3.2); th = 0.045 * (1 - 0.5 * t)
        verts += [(-wd, 0, z), (0, th, z), (wd, 0, z), (0, -th, z)]
    tip = len(verts); verts.append((0, 0, L1))
    for i in range(n):
        a = i * 4
        for k in range(4): faces.append((a + k, a + (k + 1) % 4, a + 4 + (k + 1) % 4, a + 4 + k))
    a = n * 4
    for k in range(4): faces.append((a + k, a + (k + 1) % 4, tip))
    faces.append((3, 2, 1, 0))
    mesh_obj(name + '_hoja', verts, faces, m_steel, parent=rt, smooth=False)
    # filos que brillan: tiras finas a los dos lados
    for sgn in (-1, 1):
        ev = []
        for i in range(n + 1):
            t = i / n; z = L0 + (L1 - L0) * t * 0.93; wd = 0.2 * (1 - 0.35 * t) * (1 - max(0, t - 0.82) * 3.2)
            ev += [(sgn * (wd + 0.012), -0.012, z), (sgn * (wd + 0.012), 0.012, z)]
        ev.append((0, 0, L1 + 0.02))
        ef = [(2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1) for i in range(n)] + [(2 * n, len(ev) - 1, 2 * n + 1)]
        mesh_obj(name + '_filo%d' % (sgn + 1), ev, ef, m_edge, parent=rt, smooth=False)
    # runas en el canal
    for i in range(6):
        box(name + '_runa%d' % i, (0.05, 0.1, 0.16), (0, 0, 1.0 + i * 0.42), m_edge, bevel=0.01, parent=rt)
    # guarda curva con alas, gema al centro
    gv, gf = [], []
    for i in range(13):
        x = -1.0 + i / 6; z = 0.58 + 0.16 * x * x
        gv += [(x, -0.12, z - 0.07), (x, 0.12, z - 0.07), (x, 0.12, z + 0.07), (x, -0.12, z + 0.07)]
    for i in range(12):
        a = i * 4
        for k in range(4): gf.append((a + k, a + (k + 1) % 4, a + 4 + (k + 1) % 4, a + 4 + k))
    gf += [(3, 2, 1, 0), (48, 49, 50, 51)]
    mesh_obj(name + '_guarda', gv, gf, m_gold, parent=rt)
    for sx in (-1, 1): sphere(name + '_punta%d' % (sx + 1), 0.11, (sx * 1.02, 0, 0.75), m_gold, rt)
    box(name + '_centro', (0.34, 0.26, 0.3), (0, 0, 0.58), m_gold, bevel=0.06, parent=rt)
    for sy in (-1, 1): sphere(name + '_gema%d' % (sy + 1), 0.1, (0, sy * 0.14, 0.58), m_gem, rt, scale=(1, 0.45, 1.2))
    # empuñadura con vendas, pomo dorado con gema
    cyl(name + '_mango', 0.085, 0.95, (0, 0, 0), m_grip, rt)
    for i in range(6): cyl(name + '_venda%d' % i, 0.1, 0.05, (0, 0, -0.38 + i * 0.15), m_gold if i in (0, 5) else m_grip, rt)
    sphere(name + '_pomo', 0.15, (0, 0, -0.6), m_gold, rt, scale=(1, 1, 1.15)); sphere(name + '_pomogema', 0.07, (0, -0.12, -0.6), m_gem, rt)
    return rt

sw_ground = make_sword('SwordGround'); sw_ground.location = (-1.5, -0.24, 2.26); sw_ground.rotation_euler = (math.radians(180), 0, 0)
sw_hand = make_sword('Sword'); sw_hand.location = sock.matrix_world.translation
bpy.context.view_layer.update(); sw_hand.matrix_world = sock.matrix_world.copy(); setp(sw_hand, sock)
glow = bpy.data.lights.new('brillo_espada', 'POINT'); glow.color = lin((0.4, 0.9, 1.0)); glow.shadow_soft_size = 0.4
gl_o = link(bpy.data.objects.new('brillo_espada', glow)); gl_o.location = sw_hand.matrix_world @ Vector((0, 0, 2.4)); setp(gl_o, sw_hand)

# ---------------- coreografía (como en un animador: poses en cuadros clave con easing) ----------------
J = {'torso': torso_j, 'head': head_j, 'rsh': rsh, 'lsh': lsh, 'rhip': rhip, 'lhip': lhip}
def pose(f, ip='BEZIER', ease='AUTO', sock_rx=None, **kw):
    for k, o in J.items():
        key(o, f, rot=kw.get(k, (0, 0, 0)), ip=ip, ease=ease)
    if sock_rx is not None: key(sock, f, rot=(sock_rx, 0, 0), ip=ip, ease=ease)
def rootk(f, loc, rz=0, ip='BEZIER', ease='AUTO'): key(root, f, loc=loc, rot=(0, 0, rz), ip=ip, ease=ease)

# 0–2.3 s: entra caminando hacia la espada clavada
for i, f in enumerate(range(0, 57, 8)):
    s = 1 if i % 2 == 0 else -1
    if f == 56: s = 0
    pose(f, 'SINE', 'EASE_IN_OUT', sock_rx=90 if f == 0 else None, rhip=(28 * s, 0, 0), lhip=(-28 * s, 0, 0), rsh=(-24 * s, 0, 0), lsh=(24 * s, 0, 0), torso=(4, 0, 0), head=(0, 0, 0))
rootk(0, (0, 7, 0)); rootk(56, (0, 1.0, 0), ip='SINE', ease='EASE_OUT')
# la agarra (2.75 s), la arranca y la hace girar
pose(66, 'CUBIC', 'EASE_OUT', sock_rx=90, rsh=(-45, 0, 0), lsh=(-10, -10, 0), torso=(8, 0, 0), head=(18, 0, 0))
pose(70, 'BACK', 'EASE_OUT', sock_rx=-135, rsh=(-45, 0, 0), lsh=(-10, -10, 0), torso=(8, 0, 0), head=(18, 0, 0))
pose(84, 'BACK', 'EASE_OUT', sock_rx=180, rsh=(-172, 0, 0), lsh=(-20, -25, 0), torso=(-8, 0, 0), head=(-14, 0, 0), rhip=(-6, 8, 0), lhip=(6, -8, 0))
rootk(84, (0, 1.0, 0))
# 3.5–4.2 s: dash y primer corte horizontal
pose(90, 'EXPO', 'EASE_OUT', sock_rx=180, torso=(22, 0, -70), rsh=(-90, 25, 0), lsh=(-30, -20, 0), rhip=(-35, 0, 0), lhip=(30, 0, 0), head=(-10, 0, 40))
rootk(94, (0, -3.0, 0), ip='EXPO', ease='EASE_OUT')
pose(95, 'EXPO', 'EASE_OUT', sock_rx=180, torso=(22, 0, -72), rsh=(-90, 25, 0), lsh=(-30, -20, 0), rhip=(-35, 0, 0), lhip=(30, 0, 0), head=(-10, 0, 40))
pose(100, 'EXPO', 'EASE_OUT', sock_rx=180, torso=(18, 0, 75), rsh=(-90, -12, 0), lsh=(-15, -35, 0), rhip=(-25, 0, 0), lhip=(25, 0, 0), head=(-6, 0, -30))
rootk(100, (0, -3.3, 0))
# segundo corte en diagonal
pose(108, 'BACK', 'EASE_OUT', sock_rx=180, torso=(-6, 0, 40), rsh=(-175, -35, 0), lsh=(-30, -10, 0), rhip=(-10, 0, 0), lhip=(15, 0, 0), head=(-12, 0, -15))
rootk(110, (0, -3.6, 0)); rootk(118, (0, -4.6, 0), ip='EXPO', ease='EASE_OUT')
pose(116, 'EXPO', 'EASE_OUT', sock_rx=180, torso=(28, 0, -40), rsh=(-38, 42, 0), lsh=(-10, -30, 0), rhip=(-30, 0, 0), lhip=(35, 0, 0), head=(5, 0, 20))
# 5.5–8.3 s: agachada, salto con doble giro y caída con golpe al piso
pose(132, 'CUBIC', 'EASE_IN_OUT', sock_rx=180, torso=(30, 0, 0), rsh=(-60, 30, 0), lsh=(-20, -20, 0), rhip=(-45, 0, 0), lhip=(-45, 0, 0), head=(-20, 0, 0))
rootk(132, (0, -4.6, 0)); rootk(140, (0, -4.8, 0))
pose(140, 'EXPO', 'EASE_OUT', sock_rx=180, torso=(-10, 0, 0), rsh=(-90, 75, 0), lsh=(-80, -75, 0), rhip=(10, 0, 0), lhip=(-15, 0, 0), head=(0, 0, 0))
key(root, 140, rot=(0, 0, 0), ip='CUBIC', ease='EASE_IN_OUT')
rootk(160, (0, -6.2, 5.2), rz=360, ip='CUBIC', ease='EASE_OUT')
pose(176, 'SINE', 'EASE_IN_OUT', sock_rx=180, torso=(-10, 0, 0), rsh=(-90, 75, 0), lsh=(-80, -75, 0), rhip=(-40, 0, 0), lhip=(-20, 0, 0), head=(0, 0, 0))
rootk(180, (0, -6.8, 4.6), rz=720, ip='EXPO', ease='EASE_IN')
pose(186, 'BACK', 'EASE_OUT', sock_rx=180, torso=(-18, 0, 0), rsh=(-182, 0, 0), lsh=(-150, 0, 0), rhip=(-50, 0, 0), lhip=(-25, 0, 0), head=(-20, 0, 0))
rootk(198, (0, -7.0, 0), rz=720, ip='CONSTANT')
pose(198, 'EXPO', 'EASE_IN', sock_rx=180, torso=(45, 0, 0), rsh=(-38, 0, 0), lsh=(-30, -40, 0), rhip=(-40, 12, 0), lhip=(30, -12, 0), head=(-25, 0, 0))
# 8.5–12 s: carga de energía, postura firme, la espada arriba
pose(214, 'ELASTIC', 'EASE_OUT', sock_rx=180, torso=(6, 0, 0), rsh=(-105, 0, -8), lsh=(-98, 0, 18), rhip=(0, 18, 0), lhip=(0, -18, 0), head=(-12, 0, 0))
pose(250, 'SINE', 'EASE_IN_OUT', sock_rx=180, torso=(2, 0, 0), rsh=(-112, 0, -8), lsh=(-104, 0, 18), rhip=(0, 20, 0), lhip=(0, -20, 0), head=(-16, 0, 0))
pose(278, 'BACK', 'EASE_OUT', sock_rx=180, torso=(12, 0, -82), rsh=(-92, 45, 0), lsh=(-20, -30, 0), rhip=(-15, 20, 0), lhip=(20, -20, 0), head=(-8, 0, 50))
# 12–12.6 s: el corte final
pose(290, 'EXPO', 'EASE_OUT', sock_rx=180, torso=(20, 0, 88), rsh=(-90, -22, 0), lsh=(-10, -40, 0), rhip=(-30, 15, 0), lhip=(30, -15, 0), head=(-5, 0, -40))
# 13–15 s: pose final, la espada al hombro
pose(312, 'CUBIC', 'EASE_IN_OUT', sock_rx=180, torso=(8, 0, 20), rsh=(-30, 0, 0), lsh=(-10, -15, 0), rhip=(-8, 10, 0), lhip=(8, -10, 0), head=(0, 0, -10))
pose(330, 'BACK', 'EASE_OUT', sock_rx=125, torso=(-4, 0, 14), rsh=(-158, 14, 0), lsh=(-12, -28, 0), rhip=(0, 12, 0), lhip=(0, -10, 0), head=(-8, 0, -14))
pose(360, 'SINE', 'EASE_IN_OUT', sock_rx=125, torso=(-6, 0, 16), rsh=(-160, 14, 0), lsh=(-12, -30, 0), rhip=(0, 12, 0), lhip=(0, -10, 0), head=(-10, 0, -16))
rootk(360, (0, -7.0, 0), rz=720)

# las dos espadas: la clavada se va y aparece la de la mano (en el destello)
key(sw_ground, 0, scl=1, ip='CONSTANT', log=False); key(sw_ground, 70, scl=0.001, ip='CONSTANT', log=False)
key(sw_hand, 0, scl=0.001, ip='CONSTANT', log=False); key(sw_hand, 70, scl=1, ip='CONSTANT', log=False)
# brillo del filo y de la luz
eg = eb.inputs['Emission Strength']
for f, v in [(0, 4), (66, 6), (72, 40), (86, 10), (96, 22), (104, 10), (114, 22), (130, 10), (200, 30), (210, 10), (276, 70), (294, 120), (312, 14), (360, 8)]:
    eg.default_value = v; eg.keyframe_insert('default_value', frame=f)
    glow.energy = v * 6; glow.keyframe_insert('energy', frame=f)
# la bufanda flamea (más rápido cuando se mueve)
for f in range(0, END + 1, 3):
    sp = 1.0 + (2.0 if 84 <= f <= 200 or 286 <= f <= 300 else 0.0)
    for i, j in enumerate(SCARF):
        key(j, f, rot=(55 + 12 * sp + 10 * math.sin(f * 0.35 * sp + i * 1.7), 6 * math.sin(f * 0.21 + i), 8 * math.sin(f * 0.17 + i * 2)), ip='LINEAR', log=False)

# ---------------- efectos ----------------
CYAN, VIOL, WHITE = lin((0.35, 0.92, 1.0)), lin((0.62, 0.3, 1.0)), (1, 1, 1)
def arc_mesh(name, r0, r1, a0, a1, m, n=32):
    """medialuna: anillo entre r0 y r1 de a0 a a1 (grados), más fina en las puntas; U va de la cola (0) al frente (1)"""
    v, uv, f = [], [], []
    for i in range(n + 1):
        t = i / n; a = math.radians(a0 + (a1 - a0) * t); th = math.sin(t * math.pi) ** 0.6
        rm = (r0 + r1) / 2; hw = (r1 - r0) / 2 * (0.15 + 0.85 * th)
        for k, rr in enumerate((rm - hw, rm + hw)):
            v.append((math.cos(a) * rr, math.sin(a) * rr, 0)); uv.append((t, k))
    for i in range(n): f.append((2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1))
    o = mesh_obj(name, v, f, m, uvs=uv, smooth=False); o.visible_shadow = False
    return o
def vfx_life(o, m, f0, grow=3, hold=3, fade=10, s0=0.6, s1=1.0, s2=1.15, a_peak=1.0):
    key(o, f0 - 1, scl=0, ip='CONSTANT', log=False); key(o, f0, scl=s0, ip='EXPO', ease='EASE_OUT', log=False)
    key(o, f0 + grow, scl=s1, ip='LINEAR', log=False); key(o, f0 + grow + hold + fade, scl=s2, ip='CONSTANT', log=False)
    key(o, f0 + grow + hold + fade + 1, scl=0, ip='CONSTANT', log=False)
    fade_key(o, m, f0 - 1, 0, 'CONSTANT'); fade_key(o, m, f0, a_peak); fade_key(o, m, f0 + grow + hold, a_peak); fade_key(o, m, f0 + grow + hold + fade, 0, 'CONSTANT')
    o.scale = (0, 0, 0)
VFX_EVENTS = []
def slash(name, f0, center, rot, r=(2.4, 3.3), span=(-70, 80), col=CYAN, spin=40):
    m = glow_mat('m_' + name, col, 14, grad=True)
    o = arc_mesh(name, r[0], r[1], span[0], span[1], m); o.location = center; o.rotation_euler = tuple(math.radians(a) for a in rot)
    vfx_life(o, m, f0)
    key(o, f0, rot=rot, ip='EXPO', ease='EASE_OUT', log=False); key(o, f0 + 8, rot=(rot[0], rot[1], rot[2] + spin), ip='LINEAR', log=False)
    VFX_EVENTS.append({'f': f0, 'tipo': 'slash', 'nombre': name})
    # el borde blanco más fino adelante
    m2 = glow_mat('m_' + name + 'b', WHITE, 22, grad=True)
    o2 = arc_mesh(name + '_b', r[1] - 0.12, r[1] + 0.05, span[0] + 30, span[1], m2); o2.location = center; o2.rotation_euler = o.rotation_euler
    vfx_life(o2, m2, f0, fade=6)
    key(o2, f0, rot=rot, ip='EXPO', ease='EASE_OUT', log=False); key(o2, f0 + 8, rot=(rot[0], rot[1], rot[2] + spin), ip='LINEAR', log=False)
def ring(name, f0, center, rot=(0, 0, 0), s1=6.0, col=CYAN, life=14, thick=0.07):
    m = glow_mat('m_' + name, col, 16)
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=False, segments=64, radius=1.0)
    ring_v = list(bm.verts); bm.free()
    v, f = [], []
    for i in range(64):
        a = i / 64 * math.tau
        v += [(math.cos(a) * (1 - thick), math.sin(a) * (1 - thick), 0), (math.cos(a), math.sin(a), 0)]
    for i in range(64): j = (i + 1) % 64; f.append((2 * i, 2 * j, 2 * j + 1, 2 * i + 1))
    o = mesh_obj(name, v, f, m, smooth=False); o.location = center; o.rotation_euler = tuple(math.radians(a) for a in rot); o.visible_shadow = False
    key(o, f0 - 1, scl=0, ip='CONSTANT', log=False); key(o, f0, scl=0.4, ip='EXPO', ease='EASE_OUT', log=False); key(o, f0 + life, scl=s1, ip='CONSTANT', log=False); key(o, f0 + life + 1, scl=0, ip='CONSTANT', log=False)
    fade_key(o, m, f0 - 1, 0, 'CONSTANT'); fade_key(o, m, f0, 1, 'CUBIC'); fade_key(o, m, f0 + life, 0, 'CONSTANT')
    o.scale = (0, 0, 0)
    VFX_EVENTS.append({'f': f0, 'tipo': 'onda', 'nombre': name})
m_spark = glow_mat('m_chispa', lin((0.75, 0.97, 1.0)), 30)
NSP = [0]
def sparks(f0, center, n=20, speed=(6, 12), up=4.0, col=None, life=14):
    for i in range(n):
        NSP[0] += 1
        o = sphere('chispa%03d' % NSP[0], 0.05, center, m_spark, seg=6, ring=4, scale=(1, 1, 4)); o.visible_shadow = False
        d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-0.2, 1))).normalized()
        v = d * random.uniform(*speed) + Vector((0, 0, up))
        key(o, f0 - 1, loc=center, scl=0, ip='CONSTANT', log=False)
        for k in range(0, life + 1, 2):
            t = k / FPS; p = Vector(center) + v * t + Vector((0, 0, -9.8 * t * t))
            vel = v + Vector((0, 0, -19.6 * t))
            o.rotation_euler = vel.to_track_quat('Z', 'Y').to_euler(); o.keyframe_insert('rotation_euler', frame=f0 + k)
            key(o, f0 + k, loc=tuple(p), scl=max(0.0, 1.0 - k / life) * 1.4, ip='LINEAR', log=False)
        key(o, f0 + life + 1, scl=0, ip='CONSTANT', log=False)
        o.scale = (0, 0, 0)
FLASH = []

# la espada que se arranca (2.9 s): destello, onda y chispas
ring('onda_arranque', 72, (-1.5, -0.24, 0.05), s1=7, col=CYAN, life=16); sparks(72, (-1.5, -0.24, 0.6), 24); FLASH.append(72)
# los dos cortes
slash('corte1', 96, (0, -3.1, 3.3), (0, -32, 180), span=(-60, 90), spin=-35)
sparks(98, (0.6, -5.4, 3.2), 14, speed=(5, 9))
slash('corte2', 113, (0, -3.9, 3.4), (60, -35, 120), span=(-80, 70), col=VIOL, spin=40)
sparks(115, (-0.6, -6.0, 2.2), 14, speed=(5, 9))
# el salto: anillos al girar
for i, f0 in enumerate((148, 164)):
    slash('giro%d' % i, f0, (0, -6.2 - 0.3 * i, 4.9 + 0.2 * i), (0, 0, 0), r=(2.2, 3.4), span=(0, 300), col=CYAN if i == 0 else VIOL, spin=200)
# el golpe al piso (8.3 s)
ring('onda_golpe', 200, (0, -8.0, 0.06), s1=10, col=CYAN, life=18, thick=0.1); ring('onda_golpe2', 203, (0, -8.0, 0.08), s1=7, col=VIOL, life=16, thick=0.16)
sparks(200, (0, -8.6, 0.3), 30, speed=(6, 14), up=6); FLASH.append(200)
m_dec = glow_mat('m_marca', CYAN, 6, grad=False)
dec = sphere('marca_piso', 1.0, (0, -8.4, 0.02), m_dec, scale=(1, 1, 0.01), seg=32, ring=8); dec.visible_shadow = False
key(dec, 199, scl=0, ip='CONSTANT', log=False); key(dec, 200, scl=(0.5, 0.5, 1), ip='EXPO', ease='EASE_OUT', log=False); key(dec, 208, scl=(2.6, 2.6, 1), ip='LINEAR', log=False); key(dec, 236, scl=(2.8, 2.8, 1), ip='CONSTANT', log=False); key(dec, 237, scl=0, ip='CONSTANT', log=False)
fade_key(dec, m_dec, 199, 0, 'CONSTANT'); fade_key(dec, m_dec, 200, 1); fade_key(dec, m_dec, 236, 0, 'CONSTANT'); dec.scale = (0, 0, 0)
# el aura de la carga: llamas alrededor que titilan
m_aura = glow_mat('m_aura', VIOL, 10)
for i in range(12):
    a = i / 12 * math.tau; r = 1.6 + 0.3 * (i % 2)
    o = cyl('aura%d' % i, 0.28, 2.6, (math.cos(a) * r, -7 + math.sin(a) * r, 1.3), m_aura, seg=8, r2=0.0); o.visible_shadow = False
    key(o, 205, scl=0, ip='CONSTANT', log=False)
    for f in range(206, 296, 4):
        h = 0.6 + 0.6 * ((f - 206) / 90) + 0.35 * math.sin(f * 0.9 + i * 2.1)
        key(o, f, scl=(0.7, 0.7, max(0.1, h)), ip='SINE', ease='EASE_IN_OUT', log=False)
    key(o, 300, scl=0, ip='CONSTANT', log=False)
    o.scale = (0, 0, 0)
fade_key(bpy.data.objects['aura0'], m_aura, 205, 0, 'CONSTANT'); fade_key(bpy.data.objects['aura0'], m_aura, 214, 0.55); fade_key(bpy.data.objects['aura0'], m_aura, 286, 0.9); fade_key(bpy.data.objects['aura0'], m_aura, 300, 0, 'CONSTANT')
VFX_EVENTS.append({'f': 206, 'tipo': 'aura', 'nombre': 'aura'})
# partículas que convergen a la hoja durante la carga
bpy.context.view_layer.update()
def blade_pos(f):
    sc.frame_set(f); return sw_hand.matrix_world @ Vector((0, 0, 2.6))
m_dot = glow_mat('m_energia', lin((0.75, 0.55, 1.0)), 20)
targets = {f: blade_pos(f) for f in range(206, 292, 4)}
for i in range(26):
    f0 = 206 + (i * 3) % 60
    o = sphere('energia%02d' % i, 0.07, (0, 0, 0), m_dot, seg=8, ring=4); o.visible_shadow = False
    a = random.uniform(0, math.tau); r = random.uniform(4, 7); st = Vector((math.cos(a) * r, -7 + math.sin(a) * r, random.uniform(0.3, 6)))
    key(o, f0 - 1, loc=tuple(st), scl=0, ip='CONSTANT', log=False)
    for k in range(0, 21, 4):
        f = f0 + k; tg = targets.get(min(288, f - f % 4 if f % 4 == 2 else f - (f - 206) % 4), blade_pos(f))
        t = (k / 20) ** 2
        key(o, f, loc=tuple(st.lerp(tg, t)), scl=1.0 - 0.6 * t, ip='LINEAR', log=False)
    key(o, f0 + 21, scl=0, ip='CONSTANT', log=False); o.scale = (0, 0, 0)
sc.frame_set(0)
# la onda final: una medialuna enorme que vuela hasta la pared
for i, (col, rr, dl) in enumerate([(CYAN, (3.0, 4.6), 0), (VIOL, (2.4, 3.6), 2), (WHITE, (3.9, 4.3), 0)]):
    m = glow_mat('m_ola%d' % i, col, 18 if i < 2 else 26, grad=True)
    o = arc_mesh('ola%d' % i, rr[0], rr[1], 20, 160, m, n=40); o.visible_shadow = False
    f0 = 292 + dl
    key(o, f0 - 1, loc=(0, -8.6, 3.0), rot=(90, 0, 180), scl=0, ip='CONSTANT', log=False)
    key(o, f0, loc=(0, -8.6, 3.0), rot=(90, 0, 180), scl=0.6, ip='CUBIC', ease='EASE_IN', log=False)
    key(o, 303, loc=(0, -13.4, 3.2), rot=(90, 0, 180), scl=1.25, ip='CONSTANT', log=False)
    key(o, 304, scl=0, ip='CONSTANT', log=False)
    fade_key(o, m, f0 - 1, 0, 'CONSTANT'); fade_key(o, m, f0, 1, 'CONSTANT'); fade_key(o, m, 304, 0, 'CONSTANT')
    o.scale = (0, 0, 0)
VFX_EVENTS.append({'f': 292, 'tipo': 'ola', 'nombre': 'ola'})
# la pared de ladrillos de Roblox que vuela en pedazos
COLS = ['c4281c', '0d69ac', 'f5cd30', '4b974b', 'a3a2a5', 'da8541']
bm_mats = [mat('lad_' + c, hexc(c), rough=0.55) for c in COLS]
HIT = 303; impact = Vector((0, -14, 3.2))
for row in range(7):
    for col in range(7):
        x = (col - 3) * 2.05 + (1.0 if row % 2 else 0); z = 0.5 + row * 1.02
        if abs(x) > 7: continue
        o = box('ladrillo_%d_%d' % (row, col), (2, 1, 1), (x, -14, z), random.choice(bm_mats), bevel=0.05)
        p0 = Vector((x, -14, z)); key(o, 0, loc=tuple(p0), rot=(0, 0, 0), ip='CONSTANT', log=False); key(o, HIT, loc=tuple(p0), rot=(0, 0, 0), ip='LINEAR', log=False)
        d = (p0 - impact); d.y = -abs(d.y) - 1.5
        v = d.normalized() * random.uniform(9, 16) + Vector((0, 0, random.uniform(3, 8)))
        w_ = Vector((random.uniform(-9, 9), random.uniform(-9, 9), random.uniform(-9, 9)))
        p = p0.copy(); rot = Vector((0, 0, 0)); vel = v.copy()
        for f in range(HIT + 2, END + 1, 2):
            dt = 2 / FPS
            vel.z -= 19.6 * dt; p += vel * dt; rot += w_ * dt
            if p.z < 0.5: p.z = 0.5; vel.z = -vel.z * 0.3; vel.x *= 0.6; vel.y *= 0.6; w_ *= 0.5
            key(o, f, loc=tuple(p), rot=tuple(math.degrees(a) for a in rot), ip='LINEAR', log=False)
ring('onda_pared', HIT, (0, -13.6, 3.2), rot=(90, 0, 0), s1=9, col=WHITE, life=14, thick=0.12)
sparks(HIT, (0, -13.2, 3.2), 36, speed=(8, 16), up=4); FLASH += [HIT, HIT + 1]

# ---------------- cámara (planos con cortes, cada cuadro calculado y horneado) ----------------
cam_d = bpy.data.cameras.new('Camara'); cam = link(bpy.data.objects.new('Camara', cam_d)); sc.camera = cam
cam_d.clip_start = 0.1; cam_d.clip_end = 300
def ss(t): t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)
def rootpos(f): sc.frame_set(f); return root.matrix_world.translation.copy()
SHOTS = []
def shot(f):
    if f < 60:
        t = ss(f / 60); a = math.radians(-60 + 90 * t); r = 4.6 - 0.9 * t; c = Vector((-1.5, 0, 1.2))
        return c + Vector((math.sin(a) * r, -math.cos(a) * r, 0.9 + 0.7 * t)), Vector((-1.5, 0.4, 1.7 + 0.8 * t)), 40
    if f < 86:
        t = ss((f - 60) / 26); return Vector((-0.4, -5.6 + 0.8 * t, 3.0 + 0.6 * t)), Vector((-1.1, 0.4, 3.0)), 35
    if f < 132:
        rp = rootpos(f); return Vector((10.5, rp.y + 2.0, 3.2)), rp + Vector((0, -0.8, 2.6)), 30
    if f < 204:
        rp = rootpos(f); t = ss((f - 132) / 72); return Vector((7.5 - 1.5 * t, -2.0 - 2.5 * t, 0.7 + 0.6 * t)), rp + Vector((0, -0.5, 2.6)), 24
    if f < 288:
        t = ss((f - 204) / 84); a = math.radians(50 + 80 * t); r = 12.0 - 2.5 * t
        return Vector((math.sin(a) * r, -7 + math.cos(a) * r, 1.6 + 1.6 * t)), Vector((0, -7, 2.6)), 24 + 6 * t
    if f < 312:
        t = ss((f - 288) / 24); return Vector((6.0 - 0.8 * t, -2.2 - 1.0 * t, 6.2)), Vector((0, -11.0 - 1.0 * t, 2.4)), 24
    t = ss((f - 312) / 48); return Vector((6.8 - 1.6 * t, -13.2 + 0.6 * t, 2.0 + 0.9 * t)), Vector((0, -7, 2.9)), 30 + 4 * t
SHAKE = [(72, 0.10), (96, 0.06), (113, 0.06), (200, 0.28), (HIT, 0.4)]
for f in range(0, END + 1):
    pos, tgt, lens = shot(f)
    for f0, amp in SHAKE:
        if 0 <= f - f0 < 10:
            k = amp * (1 - (f - f0) / 10)
            pos += Vector((random.uniform(-k, k), random.uniform(-k, k), random.uniform(-k, k)))
    if 206 <= f < 288: k = 0.012 * (f - 206) / 82; pos += Vector((random.uniform(-k, k), 0, random.uniform(-k, k)))
    cam.location = pos; cam.rotation_euler = (tgt - pos).to_track_quat('-Z', 'Y').to_euler(); cam_d.lens = lens
    cam.keyframe_insert('location', frame=f); cam.keyframe_insert('rotation_euler', frame=f); cam_d.keyframe_insert('lens', frame=f)
for fc in list(cam.animation_data.action.fcurves) + list(cam_d.animation_data.action.fcurves):
    for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
sc.frame_set(0)

# ---------------- render: Cycles, brillo (glare) y los cuadros de impacto invertidos ----------------
r = sc.render; r.engine = 'CYCLES'; r.resolution_x, r.resolution_y = 960, 540; r.use_motion_blur = True; r.motion_blur_shutter = 0.18
sc.cycles.samples = 10; sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.05; sc.cycles.use_denoising = True; sc.cycles.max_bounces = 3; sc.cycles.diffuse_bounces = 2; sc.cycles.glossy_bounces = 1; sc.cycles.transparent_max_bounces = 16; sc.cycles.device = 'CPU'
r.use_persistent_data = True
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'
sc.use_nodes = True; nt = sc.node_tree
for n in list(nt.nodes): nt.nodes.remove(n)
rl = nt.nodes.new('CompositorNodeRLayers'); gl_ = nt.nodes.new('CompositorNodeGlare'); gl_.glare_type = 'FOG_GLOW'; gl_.threshold = 0.9; gl_.size = 8; gl_.quality = 'MEDIUM'
inv = nt.nodes.new('CompositorNodeInvert'); mix = nt.nodes.new('CompositorNodeMixRGB'); comp = nt.nodes.new('CompositorNodeComposite')
nt.links.new(rl.outputs['Image'], gl_.inputs['Image']); nt.links.new(gl_.outputs['Image'], inv.inputs['Color'])
nt.links.new(gl_.outputs['Image'], mix.inputs[1]); nt.links.new(inv.outputs['Color'], mix.inputs[2]); nt.links.new(mix.outputs['Image'], comp.inputs['Image'])
fac = mix.inputs['Fac']
for f in range(0, END + 1):
    fac.default_value = 1.0 if f in FLASH else 0.0; fac.keyframe_insert('default_value', frame=f)
for fc in nt.animation_data.action.fcurves:
    for kp in fc.keyframe_points: kp.interpolation = 'CONSTANT'
r.filepath = os.path.join(D, 'frames', '')
r.image_settings.file_format = 'PNG'

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(D, 'escena.blend'))
# los datos para el HTML: los keyframes del rig (pistas y easings), los eventos de efectos y los destellos
json.dump({'fps': FPS, 'end': END, 'keys': KEYS, 'vfx': VFX_EVENTS, 'flash': FLASH, 'shake': SHAKE}, open(os.path.join(D, 'claves.json'), 'w'))
# GLB para el HTML: toda la escena en una animación, sin los pilares lejanos ni el piso (los arma el HTML)
for o in bpy.data.objects: o.select_set(not (o.name.startswith('pilar') or o.name == 'baseplate' or o.type == 'LIGHT'))
bpy.ops.export_scene.gltf(filepath=os.path.join(D, 'escena.glb'), export_format='GLB', use_selection=True, export_animations=True,
                          export_animation_mode='ACTIONS', export_force_sampling=True, export_frame_range=True, export_cameras=True,
                          export_apply=False, export_yup=True, export_extras=False, export_lights=False)
print('LISTO objetos', len(bpy.data.objects), 'claves', len(KEYS))
