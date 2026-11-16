import { render } from 'preact';
import { Zoom } from './components/Zoom';
import { usePath } from './lib/router';
import { Cards } from './pages/Cards';
import { Home } from './pages/Home';
import { Replay } from './pages/Replay';
import { Room } from './pages/Room';
import { Rules } from './pages/Rules';
import { Stats } from './pages/Stats';
import './styles/base.css';
import './styles/card.css';
import './styles/pages.css';
import './styles/table.css';

function App() {
  const path = usePath();
  const room = /^\/r\/([A-Za-z]{5})\/?$/.exec(path);
  const game = /^\/game\/([0-9a-f-]{36})\/?$/.exec(path);
  let page = <Home />;
  if (room) page = <Room code={room[1].toUpperCase()} />;
  else if (path.startsWith('/cards')) page = <Cards />;
  else if (path.startsWith('/rules')) page = <Rules />;
  else if (path.startsWith('/stats')) page = <Stats />;
  else if (game) page = <Replay id={game[1]} />;
  return (
    <>
      {page}
      <Zoom />
    </>
  );
}

render(<App />, document.getElementById('app')!);
