#!/usr/bin/env python3
"""Generate a large independent-style Track 2 corpus.

Inputs stay separated in the output by `source`: seed, independent-v2, and
official-benchmark. The generator creates deterministic semantic hard negatives
without modifying the official cases.
"""
from __future__ import annotations
import argparse, json, re
from pathlib import Path
HERE=Path(__file__).resolve().parent
REPO=HERE.parents[2]
OFFICIAL=REPO/'telegraph'/'evaluation'/'track2-benchmark-v2.json'
SEEDS=HERE/'shadow_corpus.json'
INDEPENDENT=HERE/'independent_seed_corpus_v2.json'
DEFAULT_OUT=HERE/'shadow_corpus.generated.json'

def mutate_number(text):
    def repl(m):
        x=float(m.group(0).replace(',',''))
        y=x+(max(1.0,abs(x)*0.1) if abs(x)>=1000 else 1.0)
        return str(int(y)) if y.is_integer() else f'{y:g}'
    out=re.sub(r'\b\d+(?:[.,]\d+)?\b',repl,text,count=1)
    return out if out!=text else text+' 1'

def mutate_direction(text):
    pairs=[('approved','rejected'),('authorized','unauthorized'),('allowed','blocked'),('confirmed','denied'),('safe','unsafe'),('legitimate','fraudulent'),('genuine','counterfeit'),('increased','decreased'),('increase','decrease'),('rose','fell'),('rising','falling'),('positive','negative'),('bullish','bearish'),('compromised','secure'),('trusted','malicious'),('yes','no'),('true','false'),('prevented','caused'),('succeeded','failed'),('success','failure')]
    for a,b in pairs:
        m=re.search(rf'\b{re.escape(a)}\b',text,re.I)
        if m:return text[:m.start()]+b+text[m.end():]
    return 'not '+text

def mutate_entity(text):
    pairs=[('Apple','Microsoft'),('Ethereum','Solana'),('Coinbase','Binance'),('Kraken','Coinbase'),('OpenAI','Google'),('Acme','Beta'),('Delta','Gamma'),('Arbitrum','Optimism'),('Visa','Mastercard'),('AWS','Azure'),('Northstar','Southstar'),('Protocol X','Protocol Y')]
    for a,b in pairs:
        m=re.search(rf'\b{re.escape(a)}\b',text,re.I)
        if m:return text[:m.start()]+b+text[m.end():]
    return text+' involving another entity'

def mutate_relation(text):
    pairs=[('issued','received'),('received','issued'),('processed','received'),('blocked','allowed'),('reported','denied'),('prevented','caused'),('caused','prevented'),('approved','requested'),('requested','approved'),('owns','uses'),('controls','owns'),('received','sent')]
    for a,b in pairs:
        m=re.search(rf'\b{re.escape(a)}\b',text,re.I)
        if m:return text[:m.start()]+b+text[m.end():]
    return text+' for a different relationship'

def incomplete(text):
    w=text.split(); return ' '.join(w[:max(2,len(w)//2)]) if len(w)>3 else text+' …'

def late_contradiction(text):return text.rstrip(' .!?;')+', but the final conclusion was the opposite.'
def distract(text):return text.rstrip(' .!?;')+'. Additional unrelated background follows.'
def hedged(text):return 'It may be that '+text
def wrong_qualifier(text):return text.rstrip(' .!?;')+', but only for a different entity and time period.'
def long_prefix(text,n):
    fillers=['The surrounding context contains historical details.','Several related observations were discussed during review.','Those observations are background only.','The report also discusses adjacent events.']
    return ' '.join(fillers[i%len(fillers)] for i in range(n))+' '+text

def wrap(text,i):
    ws=[lambda x:x,lambda x:'According to the available record, '+x,lambda x:'Based on the reported evidence, '+x,lambda x:'For the relevant event, '+x,lambda x:'The final documented finding was: '+x,lambda x:'After reviewing the evidence, '+x,lambda x:'In plain terms, '+x,lambda x:x+' as reported.',lambda x:long_prefix(x,2),lambda x:long_prefix(x,5)]
    return ws[i%len(ws)](text)

def add(out,seen,c,good,bad,kind,critical=False,source='independent-v2',round_id=0):
    q,gt=c['question'],c['ground_truth']; sq,sg, sgt=wrap(q,round_id),wrap(good,round_id),wrap(gt,round_id) if round_id%4==0 else gt; sb=wrap(bad,round_id)
    key=(sq,sg,sb,kind)
    if sb==sg or key in seen:return
    out.append({'question':sq,'ground_truth':sgt,'good':sg,'bad':sb,'kind':kind,'critical':critical,'source':source});seen.add(key)

def normalize_case(c,source):
    if 'good' in c and 'bad' in c:return {'question':c['question'],'ground_truth':c['ground_truth'],'good':c['good'],'bad':c['bad'],'critical':bool(c.get('critical')),'source':source}
    highs=[a for a in c.get('answers',[]) if a.get('tier')=='high']; lows=[a for a in c.get('answers',[]) if a.get('tier')=='low']
    return [{'question':c['question'],'ground_truth':c['ground_truth'],'good':h['text'],'bad':l['text'],'critical':False,'source':source} for h in highs for l in lows]

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--rounds',type=int,default=16);ap.add_argument('--out',type=Path,default=DEFAULT_OUT);args=ap.parse_args()
    raw=[]
    raw.extend(normalize_case(c,'seed') for c in json.loads(SEEDS.read_text())['cases'])
    raw.extend(normalize_case(c,'independent-v2') for c in json.loads(INDEPENDENT.read_text())['cases'])
    official=json.loads(OFFICIAL.read_text()) if OFFICIAL.exists() else {'cases':[]}
    for c in official.get('cases',[]):
        x=normalize_case(c,'official-benchmark')
        raw.extend(x if isinstance(x,list) else [x])
    base=[]
    for x in raw:
        if isinstance(x,list): base.extend(x)
        else: base.append(x)
    out=[];seen=set()
    for c in base:
        muts=[('number',mutate_number(c['good'])),('direction',mutate_direction(c['good'])),('entity',mutate_entity(c['good'])),('relation',mutate_relation(c['good'])),('incomplete',incomplete(c['good'])),('late-contradiction',late_contradiction(c['good'])),('distractor',distract(c['good'])),('hedged',hedged(c['good'])),('wrong-qualifier',wrong_qualifier(c['good'])),('double-number-contradiction',late_contradiction(mutate_number(c['good'])))])
        for r in range(max(1,args.rounds)):
            for k,b in muts:add(out,seen,c,c['good'],b,'generated-'+k,c['critical'],c['source'],r)
    payload={'version':3,'generator':'generate_shadow_corpus_v2.py','rounds':args.rounds,'base_cases':len(base),'output_pairs':len(out),'source_counts':{'seed':sum(c['source']=='seed' for c in base),'independent-v2':sum(c['source']=='independent-v2' for c in base),'official-benchmark':sum(c['source']=='official-benchmark' for c in base)},'cases':out}
    args.out.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({k:payload[k] for k in ('output_pairs','base_cases','source_counts')},indent=2))
if __name__=='__main__':main()
