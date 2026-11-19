"""Pack trained weights for the engine (learned.weights.json, format 2): the input scaling folded into the first layer,
each matrix as base64 float32 (row-major), so the engine loads them with one decode instead of parsing JSON numbers.
Usage: python3 pack.py <unpacked weights> <out.json> (train.py already writes packed weights)."""
import base64, json, sys
import numpy as np


def pack(mean, scale, Ws, Bs, **info):
    """The engine's format: scaling folded into layer 1, every matrix base64 float32 row-major."""
    enc = lambda a: base64.b64encode(np.ascontiguousarray(a, dtype=np.float32).tobytes()).decode()
    layers = []
    for k, (W, b) in enumerate(zip(Ws, Bs)):
        W, b = np.asarray(W, dtype=np.float64), np.asarray(b, dtype=np.float64)
        if k == 0:  # (x - mean) * scale, then W x + b  ==  (W * scale) x + (b - (W * scale) mean)
            W = W * np.asarray(scale)[None, :]
            b = b - W @ np.asarray(mean)
        layers.append({'rows': W.shape[0], 'cols': W.shape[1], 'w': enc(W), 'b': enc(b)})
    return {'format': 2, **info, 'layers': layers}

if __name__ == '__main__':
    src = json.load(open(sys.argv[1]))
    out = pack(src['mean'], src['scale'], [L['W'] for L in src['layers']], [L['b'] for L in src['layers']], hidden=src.get('hidden'), trainedOn=src.get('trainedOn'), validation=src.get('validation'))
    json.dump(out, open(sys.argv[2], 'w'), separators=(',', ':'))
    print(sys.argv[2], sum(len(l['w']) + len(l['b']) for l in out['layers']) // 1024, 'KB of weights')
