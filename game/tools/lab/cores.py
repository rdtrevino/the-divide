import json, sys
rows = [json.loads(l) for f in sys.argv[1:] for l in open(f)]
rows.sort(key=lambda r: (r['name'], r['mode']))
print(f"{'variant':<16}{'mode':<8}{'days':>5}{'min':>5}{'offer%':>7}{'gathSelf/Alt':>14}{'x-bet':>6}{'sw':>5}{'ldD3':>6}{'marg':>6}{'WR':>6}  fate: share  leanShows  offersFor(fate/choir)  whenSplit(fate,choir)  fateSideWins")
for r in rows:
    f = r.get('fate') or {}
    g = r.get('gathers', [0,0,0])
    wr = r.get('winRatio'); wr = '' if wr is None else f"{wr:.2f}"
    fs = f"{f.get('share',0)*100:5.0f}%  {f.get('leanShowsFate',0)*100:7.0f}%   {f.get('offersForFate',0)*100:5.0f}% / {f.get('offersForChoir',0)*100:3.0f}%        {str(f.get('whenSplit','')):<12}  {f.get('fateSideWins',0)*100:5.0f}%" if f else ''
    print(f"{r['name']:<16}{r['mode']:<8}{r['days']:>5.1f}{r['minutes']:>5.0f}{r['offerRate']*100:>6.0f}%{g[0]*100:>7.0f}/{g[1]*100:<5.0f}{r['crossBets']*100:>6.0f}{r['switches']:>5.1f}{r['leaderD3']*100:>6.0f}{r['margin']:>6.1f}{wr:>6}  {fs}")
