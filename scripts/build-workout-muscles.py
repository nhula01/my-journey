"""Build original schematic muscle-focus illustrations; not an anatomical atlas."""
from pathlib import Path
from html import escape
OUT=Path(__file__).resolve().parents[1]/'site'/'workout-muscles'
OUT.mkdir(exist_ok=True)
# Original approximate surface regions, based on the source muscle lists in workout-data.js.
front={
 'delts':['M49 66 Q36 70 37 87 L46 92 56 70Z','M91 66 Q104 70 103 87 L94 92 84 70Z'],
 'pecs':['M54 68 L68 70 68 90 Q56 96 48 84Z','M86 68 L72 70 72 90 Q84 96 92 84Z'],
 'biceps':['M38 90 L46 94 41 117 32 114Z','M102 90 L94 94 99 117 108 114Z'],
 'abs':['M61 96 L79 96 79 136 Q70 144 61 136Z'],
 'obliques':['M51 95 L58 98 58 135 51 140 46 125Z','M89 95 L82 98 82 135 89 140 94 125Z'],
 'quads':['M50 153 Q58 147 67 152 L66 195 53 200 47 178Z','M90 153 Q82 147 73 152 L74 195 87 200 93 178Z'],
 'shins':['M54 210 L65 209 62 241 56 242Z','M86 210 L75 209 78 241 84 242Z']}
back={
 'rear-delts':['M49 66 Q36 70 37 87 L46 92 56 70Z','M91 66 Q104 70 103 87 L94 92 84 70Z'],
 'upperback':['M58 63 L70 73 82 63 88 80 70 101 52 80Z'],
 'lats':['M49 87 L66 103 66 132 54 140 46 112Z','M91 87 L74 103 74 132 86 140 94 112Z'],
 'triceps':['M38 91 L46 96 41 119 31 115Z','M102 91 L94 96 99 119 109 115Z'],
 'erectors':['M66 103 L69 104 69 142 65 140Z','M74 103 L71 104 71 142 75 140Z'],
 'glutes':['M51 141 Q61 133 69 143 L69 165 Q56 170 49 162Z','M89 141 Q79 133 71 143 L71 165 Q84 170 91 162Z'],
 'hamstrings':['M51 170 L67 173 66 198 53 202 47 183Z','M89 170 L73 173 74 198 87 202 93 183Z'],
 'calves':['M53 211 Q62 203 65 214 L63 233 56 242 50 225Z','M87 211 Q78 203 75 214 L77 233 84 242 90 225Z']}
body='M60 54 L60 62 Q51 64 43 67 Q34 72 31 90 L24 126 19 154 Q18 161 22 164 L28 162 32 141 39 117 43 98 47 119 49 137 43 154 Q43 178 48 201 L49 220 51 246 48 253 Q48 258 66 257 L66 243 69 213 68 184 70 168 72 184 71 213 74 243 74 257 Q92 258 92 253 L89 246 91 220 92 201 Q97 178 97 154 L91 137 93 119 97 98 101 117 108 141 112 162 118 164 Q122 161 121 154 L116 126 109 90 Q106 72 97 67 L80 62 80 54Z'
plans={
 'legpress':(['quads','glutes'],['hamstrings'], 'Quadriceps and glutes; hamstrings assist.'),
 'chestpress':(['pecs'],['triceps','delts'],'Chest focus; triceps and front shoulders assist.'),
 'rowmachine':(['lats','upperback'],['rear-delts','biceps'],'Lats and upper back; rear shoulders and biceps assist.'),
 'hamstring':(['hamstrings'],['calves'],'Hamstrings focus; calves assist.'),
 'shoulders':(['delts'],['triceps'],'Shoulders focus; triceps assist.'),
 'plank':(['abs','obliques'],['erectors','glutes','delts'],'Core region focus, including deeper muscles not visible at the surface.'),
 'warmup':([],['quads','glutes','hamstrings','calves'],'Easy movement to prepare for exercise.'),
 'walk':([],['quads','glutes','hamstrings','calves'],'Aerobic fitness focus; legs contribute to walking.'),
 'cooldown':([],['quads','glutes','hamstrings','calves'],'Gradually slow your walking pace.'),
 'easy':([],['quads','glutes','hamstrings','calves'],'Light walking; active recovery, not a muscle-building session.')}
for name,(primary,secondary,description) in plans.items():
 parts=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 330" role="img" aria-labelledby="title desc"><title id="title">{escape(description)}</title><desc id="desc">Original simplified front and back muscle regions. Coral shows main focus, green shows assisting regions. Regions are approximate, not an activation measurement.</desc><rect width="340" height="330" rx="12" fill="#f5f4ef"/>']
 for offset,regions,label in [(20,front,'FRONT'),(180,back,'BACK')]:
  parts.append(f'<g transform="translate({offset} 8)"><text x="70" y="18" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#68736a">{label}</text><ellipse cx="70" cy="40" rx="14" ry="17" fill="#e0e3db" stroke="#c1c7bc"/><path d="{body}" fill="#e0e3db" stroke="#c1c7bc"/>')
  for group,paths in regions.items():
   color='#bd6247' if group in primary else '#7b9274' if group in secondary else '#d5dacd'
   for path in paths:parts.append(f'<path d="{path}" fill="{color}" stroke="#f5f4ef" stroke-width="1.2"/>')
  if name in ('walk','warmup','cooldown','easy') and label=='FRONT':parts.append('<path d="M70 83 C59 75 54 88 70 98 C86 88 81 75 70 83Z" fill="#bd6247"/>')
  parts.append('</g>')
 legend='Aerobic focus' if name in ('walk','warmup','cooldown','easy') else 'Main focus'
 parts.append(f'<circle cx="36" cy="291" r="4" fill="#bd6247"/><text x="46" y="295" font-family="Arial,sans-serif" font-size="10" fill="#485246">{legend}</text><circle cx="181" cy="291" r="4" fill="#7b9274"/><text x="191" y="295" font-family="Arial,sans-serif" font-size="10" fill="#485246">Assisting regions</text><text x="170" y="315" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#758071">Simplified muscle map · approximate surface regions</text></svg>')
 (OUT/f'{name}.svg').write_text(''.join(parts))
print(f'Built {len(plans)} original muscle schematics.')
