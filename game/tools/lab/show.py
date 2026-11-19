import json, sys
rows = [json.loads(l) for f in sys.argv[1:] for l in open(f)]
cols = [('days','days',1),('decisions','dec',0),('minutes','min',0),('tideShare','tide%',100),('offerShare','offr%',100),('reapShare','reap%',100),('abilityShare','abil%',100),
        ('reapPerPlayerDay','reap',2),('gainPct','gain%',100),('lossPct','loss%',100),('zeroDays','zero%',100),('closeTides','close%',100),
        ('lastFlip','last%',100),('crowded','crowd%',100),('switches','sw',1),('leaderD3','ldD3%',100),('margin','marg',1),('betShare','bet%',100),('crossBets','x-bet',100),('underdog','undr%',100),('neutralChoir','neuC%',100),('winRatio','WR',2),('altarSize','altar',1),('facedownAtReveal','fdown',1),('crownGain','crwG%',100),('othersGain','othG%',100),('leadChanges','ldChg',1),('lossDays','lossR%',100)]
print('variant'.ljust(26), 'mode'.ljust(12), ' '.join(h.rjust(6) for _,h,_ in cols))
for r in rows:
    cells = []
    for k,h,f in cols:
        v = r.get(k)
        if v is None: cells.append(''.rjust(6)); continue
        cells.append((f'{v*100:.0f}' if f==100 else f'{v:.{f}f}').rjust(6))
    sp = ' '.join(f"{k}:{v*100:.0f}" for k,v in list(r.get('split',{}).items())[:5])
    print(r['name'].ljust(26), r['mode'].ljust(12), ' '.join(cells), ' ', sp)
