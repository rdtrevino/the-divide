import json, sys
print('variant'.ljust(22), 'mode'.ljust(8), 'days  min  dom%  offer%  freeRide(r1,r2)  gathers(self,alt,neu)  x-bet  sw   crowd  2v2  ldD3  skill  tide%')
for f in sys.argv[1:]:
    for l in open(f):
        r = json.loads(l)
        if 'dominance' not in r: continue
        sp = r.get('split', {})
        print(r['name'].ljust(22), r['mode'].ljust(8), f"{r['days']:4.1f} {r['minutes']:4.0f}  {r['dominance']*100:4.0f}  {r['offerRate']*100:5.0f}   {str(r['freeRide']):<16} {str(r['gathers']):<22} {r['crossBets']*100:4.0f}  {r['switches']:3.1f}  {r['crowded']*100:4.0f}  {sp.get('2v2',0)*100:3.0f}  {r['leaderD3']*100:4.0f}  {('' if r.get('winRatio') is None else round(r['winRatio'],2))!s:>5}  {r['tideShare']*100:4.0f}")
