"""The reader: how well can a player work out everyone's side from what the table can see?

Reads results/rows-<variant>-<n>p.json (written by `tsx exp.ts <variant> rows3|rows4 N`). Each row is one player at one
Evening: [game, day, player, Choir Light cards, Choir Dark cards, 16 cumulative observations, the same 16 for today,
true allegiance (1 Light, -1 Dark, 0 Forsaken or none)]. Observations are only what a player at the table sees:
First Fruits, revealed Offers and who made them (unless the reveal is anonymous), Gathers and Exalts, Oaths seen or
taken, how many times they Offered.

Two readers, trained and tested on different games:
- "simple": a human-style tally of Light against Dark evidence (no training).
- "strong": gradient-boosted trees on every observation (an upper bound for a careful card-counter;
  real players are worse at counting but also read faces and talk, which no model here sees).
"""
import json, sys
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import GroupKFold

def load(path):
    a = np.array(json.load(open(path)), dtype=float)
    games, day, X, y = a[:, 0], a[:, 1], a[:, 3:-1], a[:, -1]
    X = np.column_stack([day, X])
    return games, day, X, y

def simple_reader(X):
    # columns: day, choirL, choirD, then cumulative obs (ffL ffD offL offD oathL oathD gathL gathD exL exD toHand lostOath offN tookL tookD drew)
    c = X[:, 1:3]; o = X[:, 3:19]
    score = (c[:, 0] - c[:, 1]) + (o[:, 0] - o[:, 1]) + (o[:, 2] - o[:, 3]) + 3 * (o[:, 4] - o[:, 5]) + (o[:, 13] - o[:, 14]) * 2
    return np.sign(score)

def evaluate(path):
    games, day, X, y = load(path)
    pred = np.zeros_like(y); conf = np.zeros_like(y)
    for tr, te in GroupKFold(n_splits=5).split(X, y, groups=games):
        m = HistGradientBoostingClassifier(max_iter=200, learning_rate=0.08)
        m.fit(X[tr], y[tr])
        pr = m.predict_proba(X[te])
        pred[te] = m.classes_[pr.argmax(1)]
        conf[te] = pr.max(1)
    simple = simple_reader(X)
    classes, counts = np.unique(y, return_counts=True)
    base = counts.max() / len(y)
    out = {
        'rows': len(y),
        'allegiance mix': {int(c): round(n / len(y), 2) for c, n in zip(classes, counts)},
        'guess the commonest side': round(base, 2),
        'simple reader': round(float((simple == y).mean()), 2),
        'strong reader': round(float((pred == y).mean()), 2),
        'strong, confident (80%+) and right': round(float(((conf >= 0.8) & (pred == y)).mean()), 2),
        'strong, confident and wrong': round(float(((conf >= 0.8) & (pred != y)).mean()), 2),
        'strong by Day': {int(d): round(float((pred[day == d] == y[day == d]).mean()), 2) for d in sorted(set(day))},
    }
    return out

if __name__ == '__main__':
    for path in sys.argv[1:]:
        print(path.split('/')[-1], json.dumps(evaluate(path)))
