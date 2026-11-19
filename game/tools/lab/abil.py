import json, sys
for f in sys.argv[1:]:
    for l in open(f):
        r = json.loads(l)
        if not r.get('abilities'): continue
        print(r['name'], r['mode'], 'abil%', round(r['abilityShare']*100), 'tide%', round(r['tideShare']*100))
        for a, v in sorted(r['abilities'].items(), key=lambda kv: -kv[1]['wr']):
            print('   ', a.ljust(12), 'WR', f"{v['wr']:.2f}", ' held/game', f"{v['held']:.2f}", ' glory/game', f"{v['glory']:.2f}")
