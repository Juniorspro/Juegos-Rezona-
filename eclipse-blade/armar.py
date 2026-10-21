# armar.py: junta plantilla.html + claves.json + lens.json + escena.glb (base64) en eclipse-blade.html
# lens.json: la lente de la cámara por cuadro (blender -b escena.blend -P con un frame_set por cuadro)
import base64, os
D = os.path.dirname(os.path.abspath(__file__)); r = lambda n: open(os.path.join(D, n)).read()
h = r('plantilla.html').replace('__CLAVES__', r('claves.json')).replace('__LENS__', r('lens.json'))
h = h.replace('__GLB__', base64.b64encode(open(os.path.join(D, 'escena.glb'), 'rb').read()).decode())
open(os.path.join(D, 'eclipse-blade.html'), 'w').write(h)
