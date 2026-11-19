"""Which observations give allegiance away? Re-run the strong reader with one kind of evidence removed at a time."""
import json, sys
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import GroupKFold
NAMES = ['ffL', 'ffD', 'offL', 'offD', 'oathL', 'oathD', 'gathL', 'gathD', 'exL', 'exD', 'toHand', 'lostOath', 'offN', 'tookL', 'tookD', 'drew', 'exHid']
GROUPS = {'First Fruits': ['ffL', 'ffD'], 'revealed Offers': ['offL', 'offD', 'oathL', 'oathD'], 'Gathers': ['gathL', 'gathD', 'toHand', 'tookL', 'tookD', 'lostOath'],
          'Exalts': ['exL', 'exD', 'exHid'], 'Choir': ['choir'], 'Offer count': ['offN', 'drew']}
def acc(X, y, g):
    pred = np.zeros_like(y)
    for tr, te in GroupKFold(n_splits=4).split(X, y, groups=g):
        m = HistGradientBoostingClassifier(max_iter=150, learning_rate=0.1).fit(X[tr], y[tr]); pred[te] = m.predict(X[te])
    return float((pred == y).mean())
for path in sys.argv[1:]:
    a = np.array(json.load(open(path)), dtype=float)
    g, day, y = a[:, 0], a[:, 1], a[:, -1]
    pub = (a.shape[1] - 6) // 2
    cols = {'day': [1], 'choir': [3, 4]}
    for i, nm in enumerate(NAMES[:pub]): cols[nm] = [5 + i, 5 + pub + i]
    allc = sorted({c for v in cols.values() for c in v})
    full = acc(a[:, allc], y, g)
    out = {'all evidence': round(full, 2)}
    for grp, names in GROUPS.items():
        drop = {c for nm in names if nm in cols for c in cols[nm]}
        keep = [c for c in allc if c not in drop]
        out['without ' + grp] = round(acc(a[:, keep], y, g), 2)
    print(path.split('/')[-1], json.dumps(out))
