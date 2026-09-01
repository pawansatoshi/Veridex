#!/usr/bin/env python3
"""Track-2 release doctor v4 compatibility wrapper.

Keeps v3's vetted pipeline while replacing its semantic repair matcher with
correct regexes. No benchmark/checker changes.
"""
import re
from track2_release_doctor_v3 import *
import track2_release_doctor_v3 as d

def semantic_repair(reasons):
    text=RELEASE.read_text(encoding='utf-8')
    recipes=[]
    if 'numeric' in reasons:
        recipes.append((r'final_score=final_score\.min\(0\.74\);','final_score=final_score.min(0.65);','numeric completeness cap tightened'))
    if 'completeness' in reasons:
        recipes.append((r'g\*=0\.20;','g*=0.12;','binary fragment penalty tightened'))
    if 'polarity' in reasons:
        recipes.append((r'g\*=0\.06;','g*=0.04;','polarity conflict penalty tightened'))
    for pat,repl,note in recipes:
        new,n=re.subn(pat,repl,text,count=1)
        if n:
            RELEASE.write_text(new,encoding='utf-8'); return True,note
    return False,'no unused approved semantic repair recipe'

d.semantic_repair=semantic_repair
if __name__=='__main__':
    raise SystemExit(d.main())
