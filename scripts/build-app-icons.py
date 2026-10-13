"""Original My Journey icon: a winding path and a forward progress marker.

Uses Pillow. Run from the project root; no downloaded artwork or fonts.
"""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1] / 'site' / 'icons'
root.mkdir(exist_ok=True)
canvas = Image.new('RGB', (1024, 1024), '#455b3e')
draw = ImageDraw.Draw(canvas)
draw.ellipse((174, 174, 850, 850), outline='#7d916f', width=5)
# Cubic curve traces a gentle uphill journey; all artwork stays inside maskable safe area.
points = []
for i in range(201):
    t = i / 200
    u = 1 - t
    x = u**3 * 350 + 3*u*u*t * 765 + 3*u*t*t * 325 + t**3 * 626
    y = u**3 * 707 + 3*u*u*t * 707 + 3*u*t*t * 400 + t**3 * 323
    points.append((x, y))
draw.line(points, fill='#fbfaf5', width=48, joint='curve')
draw.ellipse((326, 683, 374, 731), fill='#fbfaf5')
draw.ellipse((590, 287, 662, 359), fill='#e0a28b')
for name, size in [('apple-touch-icon',180),('icon-192',192),('icon-512',512),('icon-maskable-512',512)]:
    canvas.resize((size,size),Image.Resampling.LANCZOS).save(root / f'{name}.png',optimize=True)
print('Built four opaque home-screen icons.')
