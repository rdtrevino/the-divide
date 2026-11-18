import json, sys, os
c = json.load(open('calib.json')) if os.path.exists('calib.json') else {}
for line in open(sys.argv[1]):
    d = json.loads(line); c[d['name']] = {k: v for k, v in d.items() if k.startswith('target')}
json.dump(c, open('calib.json', 'w'), indent=1)
