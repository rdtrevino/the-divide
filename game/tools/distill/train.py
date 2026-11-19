"""Train the learned bot (engine learned.ts) on the strong bot's estimates written by gen.ts.

A small network (inputs, two hidden layers with ReLU, one output) scores each option. Only the order of a decision's
options matters, so the loss compares scores within a decision. The default (rank) is a listwise cross-entropy: the
network's softmax over a decision's options should match the teacher's preferences, softmax(estimate / temp). Every
decision then weighs about the same, whatever its scale (Judgment Day estimates swing by 100 where others swing by 1).
--loss mse compares centered scores with centered estimates instead. Games whose number ends in 0 are held out.

Usage: python3 train.py <data dir> [<data dir> ...] [--out weights.json] [--hidden 128,64] [--epochs 40] [--seed 1]
Prints, on held-out games: how often each player picks the teacher's best option, and the mean regret (the teacher's
estimate of its best option minus that of the option picked, in its utility units, about 1 Glory each).
"""
import argparse, json, os, sys, time
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('dirs', nargs='+')
ap.add_argument('--out', default=None)
ap.add_argument('--hidden', default='128,64')
ap.add_argument('--epochs', type=int, default=40)
ap.add_argument('--lr', type=float, default=1e-3)
ap.add_argument('--batch', type=int, default=256)
ap.add_argument('--wd', type=float, default=1e-5)
ap.add_argument('--seed', type=int, default=1)
ap.add_argument('--loss', default='rank', choices=['rank', 'mse'])
ap.add_argument('--temp', type=float, default=1.0, help='rank loss: the teacher\'s preferences are softmax(estimate / temp)')
ap.add_argument('--every', type=int, default=1)
a = ap.parse_args()
rng = np.random.default_rng(a.seed)

# ---- load and join several runs
Ds, Os, idxs, ys, metas = [], [], [], [], []
dec_off, game_off = 0, 0
for d in a.dirs:
    info = json.load(open(os.path.join(d, 'info.json')))
    nd, no = info['decisionFeatures'], info['optionFeatures']
    D = np.fromfile(os.path.join(d, 'D.bin'), np.float32).reshape(-1, nd)
    O = np.fromfile(os.path.join(d, 'O.bin'), np.float32).reshape(-1, no)
    idx = np.fromfile(os.path.join(d, 'idx.bin'), np.int32)
    y = np.fromfile(os.path.join(d, 'y.bin'), np.float32)
    meta = np.fromfile(os.path.join(d, 'meta.bin'), np.int32).reshape(-1, 6).copy()
    meta[:, 0] += game_off
    Ds.append(D); Os.append(O); idxs.append(idx + dec_off); ys.append(y); metas.append(meta)
    dec_off += len(D); game_off += info['games']
D = np.concatenate(Ds); O = np.concatenate(Os); idx = np.concatenate(idxs); y = np.concatenate(ys).astype(np.float64); meta = np.concatenate(metas)
nD = len(D)
counts = np.bincount(idx, minlength=nD)
starts = np.concatenate([[0], np.cumsum(counts)[:-1]])
assert np.all(np.diff(idx) >= 0), 'rows must be grouped by decision'

# Targets: the teacher's estimate relative to the decision's mean.
gmean = np.bincount(idx, weights=y, minlength=nD) / np.maximum(counts, 1)
t = y - gmean[idx]
OPT_COL = D.shape[1]  # option features start here
HEUR = OPT_COL + 12 + 8  # option feature: "is the heuristic's pick" (learned.ts optionFeatures)

val_dec = (meta[:, 0] % 10 == 0)
tr_dec = ~val_dec
print(f'{len(a.dirs)} runs, {nD} decisions, {len(y)} option rows; training {tr_dec.sum()} / validation {val_dec.sum()} decisions', file=sys.stderr)

def rows_of(decs):
    c = counts[decs]
    r = np.repeat(starts[decs] - np.cumsum(np.concatenate([[0], c[:-1]])), c) + np.arange(c.sum())
    return r, np.repeat(np.arange(len(decs)), c)

def X_of(rows):
    return np.concatenate([D[idx[rows]], O[rows]], axis=1).astype(np.float64)

tr_rows, _ = rows_of(np.nonzero(tr_dec)[0])
Xs = X_of(tr_rows[rng.choice(len(tr_rows), min(200000, len(tr_rows)), replace=False)])
mu = Xs.mean(0); sd = Xs.std(0); sd[sd < 1e-6] = 1.0; sc = 1.0 / sd
del Xs

# ---- network
sizes = [D.shape[1] + O.shape[1]] + [int(h) for h in a.hidden.split(',')] + [1]
W = [rng.normal(0, np.sqrt(2.0 / sizes[k]), (sizes[k + 1], sizes[k])) for k in range(len(sizes) - 1)]
B = [np.zeros(sizes[k + 1]) for k in range(len(sizes) - 1)]
mW = [np.zeros_like(w) for w in W]; vW = [np.zeros_like(w) for w in W]
mB = [np.zeros_like(b) for b in B]; vB = [np.zeros_like(b) for b in B]

def softmax_g(z, g):
    """Softmax of z within each group g."""
    m = np.full(g.max() + 1, -np.inf); np.maximum.at(m, g, z)
    e = np.exp(z - m[g])
    return e / np.bincount(g, weights=e)[g]

def forward(X):
    hs = [X]
    h = X
    for k in range(len(W)):
        z = h @ W[k].T + B[k]
        h = np.maximum(z, 0) if k < len(W) - 1 else z
        hs.append(h)
    return hs

def predict(rows):
    out = np.empty(len(rows))
    for s in range(0, len(rows), 50000):
        r = rows[s:s + 50000]
        out[s:s + 50000] = forward((X_of(r) - mu) * sc)[-1][:, 0]
    return out

def evaluate(mask):
    decs = np.nonzero(mask)[0]
    rows, g = rows_of(decs)
    p = predict(rows)
    yy = y[rows]
    res = {}
    # per-decision argmax helpers
    order_end = np.cumsum(counts[decs]); order_start = order_end - counts[decs]
    def pick(score):
        return np.array([order_start[k] + int(np.argmax(score[order_start[k]:order_end[k]])) for k in range(len(decs))])
    tbest = pick(yy)
    for name, chosen in [('learned', pick(p)), ('heuristic', pick(O[rows, HEUR - OPT_COL].astype(float))), ('random', order_start + (rng.random(len(decs)) * counts[decs]).astype(int))]:
        res[name] = {'agree': float(np.mean(chosen == tbest)), 'regret': float(np.mean(yy[tbest] - yy[chosen]))}
    loss = float(np.mean((p - np.bincount(g, weights=p)[g] / counts[decs][g] - t[rows]) ** 2))
    res['loss'] = loss
    return res

step = 0
tr = np.nonzero(tr_dec)[0]
best_val, best_params = 1e9, None
t0 = time.time()
for ep in range(a.epochs):
    lr = a.lr * (0.5 * (1 + np.cos(np.pi * ep / a.epochs)))
    rng.shuffle(tr)
    for s in range(0, len(tr), a.batch):
        decs = tr[s:s + a.batch]
        rows, g = rows_of(decs)
        X = (X_of(rows) - mu) * sc
        hs = forward(X)
        p = hs[-1][:, 0]
        if a.loss == 'mse':
            r = p - np.bincount(g, weights=p)[g] / counts[decs][g] - t[rows]
            grad = (2.0 / len(rows)) * r[:, None]
        else:
            grad = ((softmax_g(p, g) - softmax_g(t[rows] / a.temp, g)) / len(decs))[:, None]
        step += 1
        for k in range(len(W) - 1, -1, -1):
            gW = grad.T @ hs[k] + a.wd * W[k]; gB = grad.sum(0)
            if k > 0:
                grad = (grad @ W[k]) * (hs[k] > 0)
            for P, G, M, V in ((W, gW, mW, vW), (B, gB, mB, vB)):
                M[k] = 0.9 * M[k] + 0.1 * G; V[k] = 0.999 * V[k] + 0.001 * G * G
                P[k] = P[k] - lr * (M[k] / (1 - 0.9 ** step)) / (np.sqrt(V[k] / (1 - 0.999 ** step)) + 1e-8)
    if ep % a.every == a.every - 1 or ep == a.epochs - 1:
        ev = evaluate(val_dec)
        print(f"epoch {ep + 1}: val loss {ev['loss']:.3f}  learned agree {ev['learned']['agree']:.3f} regret {ev['learned']['regret']:.3f}  ({time.time() - t0:.0f} s)", file=sys.stderr)
        if ev['learned']['regret'] < best_val:
            best_val = ev['learned']['regret']; best_params = ([w.copy() for w in W], [b.copy() for b in B])

W, B = best_params
ev = evaluate(val_dec)
tags = ['action', 'offer.card', 'gather.source', 'exalt.card', 'firstFruits', 'judgment']
by_tag = {tg: evaluate(val_dec & (meta[:, 1] == k)) for k, tg in enumerate(tags) if (val_dec & (meta[:, 1] == k)).any()}
print(json.dumps({'validation': ev, 'byTag': {k: {n: v[n] for n in ('learned', 'heuristic')} for k, v in by_tag.items()}}, indent=1))
if a.out:
    r5 = lambda x: [float(f'{v:.5g}') for v in x]
    json.dump({'trainedOn': [os.path.basename(d.rstrip('/')) for d in a.dirs], 'hidden': a.hidden, 'validation': {k: ev[k] for k in ('learned', 'heuristic', 'random')},
               'mean': r5(mu), 'scale': r5(sc), 'layers': [{'W': [r5(row) for row in w], 'b': r5(b)} for w, b in zip(W, B)]}, open(a.out, 'w'), separators=(',', ':'))
    print('wrote', a.out, os.path.getsize(a.out) // 1024, 'KB', file=sys.stderr)
