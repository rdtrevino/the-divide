// Core rule variants for core.ts and exploits.ts (engine rules.ts holds the switches and their defaults). Only the
// questions still open have switches; the rejected variants and the re-checked standing decisions were removed once
// decided (their results stay in results/core-r1..r3.jsonl; design/core-validation.md).
import type { CoreRules } from '@divide/engine';

export const VARIANTS: Record<string, Partial<CoreRules>> = {
  current: {},
  devotion1: { devotion: 1 }, devotion2: { devotion: 2 }, tokens8: { tokensEach: 8 }, dev1t8: { devotion: 1, tokensEach: 8 },
};
