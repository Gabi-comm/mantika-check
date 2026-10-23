import math
def glyphs(w):
    h=w/2
    G={}
    G['M']=(92,[f'<polyline points="{h},106 {h},0 46,70 {92-h},0 {92-h},106"/>'])
    G['A']=(84,[f'<polyline points="{3+h*0.6},106 42,-8 {81-h*0.6},106"/>'],'A')
    G['N']=(80,[f'<polyline points="{h},106 {h},0 {80-h},100 {80-h},-6"/>'])
    G['T']=(76,[f'<line x1="0" y1="{h}" x2="76" y2="{h}"/>',f'<line x1="38" y1="0" x2="38" y2="100"/>'])
    G['I']=(w,[f'<line x1="{h}" y1="0" x2="{h}" y2="100"/>'])
    G['K']=(78,[f'<line x1="{h}" y1="0" x2="{h}" y2="100"/>',f'<line x1="74" y1="-4" x2="{w+2}" y2="64"/>',f'<line x1="{w+20}" y1="44" x2="80" y2="106"/>'])
    rx,ry=44-h,50-h; a=math.radians(42)
    x0=44+rx*math.cos(a); y1=50-ry*math.sin(a); y2=50+ry*math.sin(a)
    G['C']=(86,[f'<path d="M{x0:.2f} {y1:.2f} A{rx} {ry} 0 1 0 {x0:.2f} {y2:.2f}"/>'])
    G['H']=(80,[f'<line x1="{h}" y1="0" x2="{h}" y2="100"/>',f'<line x1="{80-h}" y1="0" x2="{80-h}" y2="100"/>',f'<line x1="{h}" y1="50" x2="{80-h}" y2="50"/>'])
    G['E']=(70,[f'<line x1="{h}" y1="0" x2="{h}" y2="100"/>',f'<line x1="{h}" y1="{h}" x2="70" y2="{h}"/>',f'<line x1="{h}" y1="50" x2="62" y2="50"/>',f'<line x1="{h}" y1="{100-h}" x2="70" y2="{100-h}"/>'])
    return G
def word(text,w,x,color,accent,track,uid):
    G=glyphs(w); out=[];
    K={'MA':-7,'AN':-7,'KA':-1,'TI':-2,'IK':0,'CH':0,'EC':0,'HE':0,'CK':0,'NT':-4}
    prev=''
    for ch in text:
        x+=K.get(prev+ch,0); prev=ch
        g=G[ch]; adv=g[0]
        parts=''.join(g[1])
        out.append(f'<g transform="translate({x:.1f} 0)" clip-path="url(#cap{uid})">')
        if ch=='A':
            # gauge crossbar: detached from the left stroke, fused into the right
            out.append(f'<rect x="32" y="{70-w*0.36:.1f}" width="30" height="{w*0.72:.1f}" fill="{accent}"/>')
        out.append(f'<g fill="none" stroke="{color}" stroke-width="{w}" stroke-linejoin="miter" stroke-miterlimit="20">{parts}</g>')
        out.append('</g>'); x+=adv+track
    return ''.join(out),x
def lockup(ink,accent,bg=None,compact=False):
    a,x=word('MANTIKA',17,0,ink,accent,9,'m')
    if compact:
        b,x2=word('CHECK',10,0,ink,ink,8,'m');
        W=x; body=f'{a}<g transform="translate(0 128) scale(0.52)">{b}</g>'; H=180
        W=max(W,x2*0.5)
    else:
        b,x2=word('CHECK',10,x+30,ink,ink,8,'m'); body=a+b; W=x2-9; H=100
    pad=0
    bgr=f'<rect x="-40" y="-40" width="{W+80:.0f}" height="{H+80}" fill="{bg}"/>' if bg else ''
    vb=f'-40 -40 {W+80:.0f} {H+80}' if bg else f'0 0 {W:.0f} {H}'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="MANTIKA CHECK"><defs><clipPath id="capm"><rect x="-20" y="0" width="200" height="100"/></clipPath></defs>{bgr}{body}</svg>'
def icon(ink,accent,bg,r=22):
    G=glyphs(17); parts=''.join(G['A'][1])
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="MANTIKA CHECK"><defs><clipPath id="capi"><rect x="-20" y="0" width="200" height="100"/></clipPath></defs><rect width="120" height="120" rx="{r}" fill="{bg}"/><g transform="translate(25 30) scale(0.7)"><g clip-path="url(#capi)"><rect x="32" y="63.9" width="30" height="12.2" fill="{accent}"/><g fill="none" stroke="{ink}" stroke-width="17" stroke-miterlimit="20">{parts}</g></g></g></svg>'
import os
o='/mnt/user-data/outputs/design/refined/brand/'
INK,PAPER,GOLD='#14213D','#F6F3EC','#B07A2A'
files={'mantika-check-horizontal.svg':lockup(INK,GOLD),'mantika-check-horizontal-dark.svg':lockup(PAPER,'#D4A04C',INK),
'mantika-check-horizontal-mono.svg':lockup('#000000','#000000'),'mantika-check-compact.svg':lockup(INK,GOLD,compact=True),
'mantika-check-app-icon.svg':icon(PAPER,'#D4A04C',INK),'mantika-check-app-icon-light.svg':icon(INK,GOLD,PAPER)}
for k,v in files.items(): open(o+k,'w').write(v)
print(lockup(INK,GOLD)[:0])
open(o+'mantika-check-horizontal-reversed.svg','w').write(lockup(PAPER,'#D4A04C'))
G=glyphs(17); pa=''.join(G['A'][1])
open(o+'mantika-check-mark.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 100" role="img" aria-label="MANTIKA CHECK"><defs><clipPath id="capk"><rect x="-20" y="0" width="200" height="100"/></clipPath></defs><g clip-path="url(#capk)"><rect x="32" y="63.9" width="30" height="12.2" fill="{GOLD}"/><g fill="none" stroke="{INK}" stroke-width="17" stroke-miterlimit="20"><polyline points="8.1,106 42,-8 75.9,106"/></g></g></svg>')
# concept B (rejected): Plex-style wordmark + swatch symbol, drawn as shapes
open(o+'concept-b-symbol.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Concept B symbol"><rect x="4" y="4" width="92" height="92" rx="14" fill="none" stroke="{INK}" stroke-width="8"/><rect x="20" y="22" width="16" height="56" fill="{INK}" opacity="0.25"/><rect x="42" y="22" width="16" height="56" fill="{INK}" opacity="0.6"/><rect x="64" y="22" width="16" height="56" fill="{INK}"/></svg>')
