from PIL import Image, ImageDraw
from pathlib import Path

ROOT = Path('/Users/moey/.openclaw/workspace/friends-ai-pilot-assets/quality-rebuild/shot-03-group-notices-sign')
SRC = ROOT / 'outputs/2026-03-25/shot-03-group-notices-2026-03-25-direct-pass-2-cleanref.png'
OUT = ROOT / 'fal-input/03-group-notices-upload-ref-shared-eyeline-v1-bound.jpg'
AUDIT = ROOT / 'fal-input/03-group-notices-upload-ref-shared-eyeline-v1-bound-audit.png'

img = Image.open(SRC).convert('RGBA')
overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
d = ImageDraw.Draw(overlay)

# Shared notice direction target: screen-left / slightly upward.
# Each tuple: (eye_center_x, eye_center_y, eye_radius_x, eye_radius_y, iris_color, pupil_color)
eyes = [
    # Mon
    (33, 390, 8, 5, (170, 150, 130, 135), (24, 20, 18, 210)),
    (83, 392, 8, 5, (170, 150, 130, 135), (24, 20, 18, 210)),
    # Chance
    (213, 318, 10, 6, (156, 108, 56, 130), (28, 22, 18, 205)),
    (278, 334, 10, 6, (156, 108, 56, 130), (28, 22, 18, 205)),
    # Russ
    (486, 53, 8, 6, (212, 206, 198, 120), (42, 32, 26, 195)),
    (549, 72, 8, 6, (212, 206, 198, 120), (42, 32, 26, 195)),
    # Rachelle
    (647, 317, 10, 6, (110, 81, 42, 130), (28, 22, 18, 205)),
    (712, 314, 10, 6, (110, 81, 42, 130), (28, 22, 18, 205)),
    # Jojo
    (879, 253, 9, 6, (190, 176, 162, 110), (42, 32, 26, 190)),
    (952, 239, 9, 6, (190, 176, 162, 110), (42, 32, 26, 190)),
    # Fufu
    (1013, 370, 10, 6, (64, 82, 118, 130), (18, 20, 28, 205)),
    (1064, 358, 10, 6, (64, 82, 118, 130), (18, 20, 28, 205)),
]

for cx, cy, rx, ry, iris, pupil in eyes:
    iris_cx = cx - rx * 0.32
    iris_cy = cy - ry * 0.18
    d.ellipse((iris_cx-rx*0.58, iris_cy-ry*0.58, iris_cx+rx*0.58, iris_cy+ry*0.58), fill=iris)
    d.ellipse((iris_cx-rx*0.28, iris_cy-ry*0.28, iris_cx+rx*0.28, iris_cy+ry*0.28), fill=pupil)
    d.ellipse((iris_cx-rx*0.48, iris_cy-ry*0.48, iris_cx-rx*0.18, iris_cy-ry*0.14), fill=(255, 255, 255, 35))

lid_lines = [
    (24, 386, 43, 385, (44, 32, 30, 80)), (75, 388, 94, 387, (44, 32, 30, 80)),
    (204, 314, 223, 312, (68, 42, 28, 70)), (269, 329, 288, 327, (68, 42, 28, 70)),
    (478, 49, 494, 47, (88, 65, 55, 60)), (541, 68, 557, 66, (88, 65, 55, 60)),
    (638, 313, 657, 311, (70, 46, 25, 70)), (703, 310, 722, 308, (70, 46, 25, 70)),
    (871, 250, 888, 248, (95, 70, 55, 60)), (944, 236, 961, 234, (95, 70, 55, 60)),
    (1004, 366, 1023, 364, (95, 70, 70, 60)), (1055, 354, 1074, 352, (95, 70, 70, 60)),
]
for x1, y1, x2, y2, color in lid_lines:
    d.line((x1, y1, x2, y2), fill=color, width=1)

result = Image.alpha_composite(img, overlay)
result.save(AUDIT)
result.convert('RGB').save(OUT, quality=95)
print(OUT)
print(AUDIT)
