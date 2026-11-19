"""Table of core.ts results: one row per variant, 4-player / 3-player where both exist.
Usage: python3 core_table.py results/core-r1.jsonl [more files...]"""
import json, sys
rows = {}
for f in sys.argv[1:]:
    for line in open(f):
        r = json.loads(line)
        if r.get('error'): continue
        rows.setdefault(r['variant'], {})[r['mode']] = r
def pair(v, k, fmt='{:.2f}'):
    a, b = v.get('main4', {}).get(k), v.get('main3', {}).get(k)
    f = lambda x: '-' if x is None else (fmt.format(x) if not isinstance(x, list) else '{:.2f}–{:.2f}'.format(*x))
    return f'{f(a)} / {f(b)}'
def mixr(v, m):
    x = v.get(m, {}).get('mixes')
    return '-' if not x else '{:.2f}–{:.2f}'.format(min(x.values()), max(x.values()))
cols = ['variant', 'reader 4p/3p', 'align', 'skill', 'seats 4p / 3p', 'mixes 4p', 'with/against 4p', 'offer', 'gath', 'exalt', 'tok/pl', 'close', 'neutral', 'flips', 'tokens%/choir%']
print('| ' + ' | '.join(cols) + ' |'); print('|' + '---|' * len(cols))
for name, v in rows.items():
    m4 = v.get('main4', {}); sk = v.get('skill4', {})
    print('| ' + ' | '.join([name, pair(v, 'reader'), pair(v, 'alignment'), f"{sk.get('skill', float('nan')):.2f}±{sk.get('skillSe', 0):.2f}" if sk else '-',
        pair(v, 'seatRange'), mixr(v, 'main4'), f"{m4.get('withWorld', 0):.2f}/{m4.get('againstWorld', 0):.2f}" if m4 else '-',
        pair(v, 'offers'), pair(v, 'gathers'), pair(v, 'exalts'), pair(v, 'tokenOffersPerPlayer'), pair(v, 'closeDays'), pair(v, 'neutralDays'), pair(v, 'revealFlips'),
        f"{m4.get('winnerGloryFromTokens', 0):.2f}/{m4.get('winnerGloryFromChoir', 0):.2f}" if m4 else '-']) + ' |')
