// The end of the game: who won, and how the Glory came out.
import type { GameView } from '@divide/engine';
import type { RoomPublic } from '@divide/protocol';
import { Card } from '../components/Card';
import { Link } from '../lib/router';
import { listNames, seatColor } from './bits';

export function Results(p: { view: GameView; room: RoomPublic; isHost: boolean; onAgain: () => void; onClose: () => void }) {
  const res = p.view.result!;
  const rows = [...res.standings].sort((a, b) => b.glory - a.glory);
  const advanced = p.view.players.some((x) => x.celestial);
  const winners = res.winners.map((s) => p.view.players[s].name);
  return (
    <div class="overlay results">
      <div class="modal panel">
        <div class="eyebrow">{p.view.tides.length} Days · Light won {res.daysWon.light}, Dark won {res.daysWon.dark}</div>
        <h2 class="result-title">{winners.length === 1 ? `${winners[0]} wins` : `${listNames(winners)} share the win`}</h2>
        <table class="result-table">
          <thead><tr><th /><th>Player</th>{advanced && <th>Celestial</th>}<th class="r" title="Glory from the Choir and abilities during the game">Choir</th><th class="r" title="Light and Dark tokens: each scored 1 for every Day its color won">Tokens</th><th class="r">Glory</th></tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const pl = p.view.players[r.seat];
              const won = res.winners.includes(r.seat);
              return (
                <tr class={won ? 'won' : ''}>
                  <td class="num">{won ? '★' : i + 1}</td>
                  <td><span class="pp-dot" style={{ '--seat': seatColor(r.seat) } as any} />{pl.name}{pl.isBot && <span class="pp-badge">bot</span>}</td>
                  {advanced && <td><Card id={pl.celestial} w={34} compact /></td>}
                  <td class="r num">{r.before}</td>
                  <td class="r num" title={`${r.tokens.light} Light × ${res.daysWon.light} + ${r.tokens.dark} Dark × ${res.daysWon.dark}`}><span class="light">☀{r.tokens.light}</span> <span class="dark">☾{r.tokens.dark}</span> +{r.fromTokens}</td>
                  <td class="r num big">{r.glory}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p class="muted saved">{p.room.saved ? 'This game is saved in the stats.' : 'Saving this game to the stats…'}</p>
        <div class="result-actions">
          {p.isHost ? <button class="btn primary" onClick={p.onAgain}>Play again</button> : <span class="muted">The host can start another game.</span>}
          <button class="btn" onClick={p.onClose}>Look at the table</button>
          {p.room.gameId && p.room.saved && <Link class="btn quiet" href={`/game/${p.room.gameId}`}>Full game log</Link>}
          <Link class="btn quiet" href="/stats">Stats</Link>
        </div>
      </div>
    </div>
  );
}
