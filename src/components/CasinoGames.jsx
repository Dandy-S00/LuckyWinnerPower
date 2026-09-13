import { useState } from 'react';
import {
  SLOT_SYMBOLS,
  WHEEL_NUMBERS,
  getRiverPayout,
  getRouletteColor,
  getRoulettePayout,
  getSlotPayout,
} from '../games/gameLogic';

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function formatCredits(value) {
  return `${value.toLocaleString()} demo credits`;
}

export default function CasinoGames() {
  const [activeGame, setActiveGame] = useState('slots');
  const [credits, setCredits] = useState(1000);

  function playGame(cost, payout) {
    if (credits < cost) return false;
    setCredits((current) => current - cost + payout);
    return true;
  }

  return (
    <div className="casino-games">
      <div className="game-tabs" role="tablist" aria-label="Choose a game">
        <button className={activeGame === 'slots' ? 'game-tab active' : 'game-tab'} onClick={() => setActiveGame('slots')} role="tab" aria-selected={activeGame === 'slots'}>
          <i className="fas fa-clover" /> Slots
        </button>
        <button className={activeGame === 'roulette' ? 'game-tab active' : 'game-tab'} onClick={() => setActiveGame('roulette')} role="tab" aria-selected={activeGame === 'roulette'}>
          <i className="fas fa-circle-dot" /> Roulette
        </button>
        <button className={activeGame === 'river' ? 'game-tab active' : 'game-tab'} onClick={() => setActiveGame('river')} role="tab" aria-selected={activeGame === 'river'}>
          <i className="fas fa-water" /> River Sweep
        </button>
      </div>
      <div className="credits-bar">
        <span><i className="fas fa-coins me-2" />Practice balance</span>
        <strong>{formatCredits(credits)}</strong>
        <button type="button" className="credits-reset" onClick={() => setCredits(1000)}>Reset</button>
      </div>
      {activeGame === 'slots' && <SlotGame credits={credits} playGame={playGame} />}
      {activeGame === 'roulette' && <RouletteGame credits={credits} playGame={playGame} />}
      {activeGame === 'river' && <RiverGame credits={credits} playGame={playGame} />}
    </div>
  );
}

function SlotGame({ credits, playGame }) {
  const [reels, setReels] = useState(['7', 'LONE STAR', 'CHILI']);
  const [bet, setBet] = useState(25);
  const [message, setMessage] = useState('Line up three symbols to win demo credits.');
  const [spinning, setSpinning] = useState(false);

  function spin() {
    if (spinning) return;
    const nextReels = [randomItem(SLOT_SYMBOLS), randomItem(SLOT_SYMBOLS), randomItem(SLOT_SYMBOLS)];
    const payout = getSlotPayout(nextReels, bet);
    if (credits < bet) {
      setMessage('You need more demo credits for that spin.');
      return;
    }
    setSpinning(true);
    setMessage('The reels are rolling...');
    window.setTimeout(() => {
      setReels(nextReels);
      playGame(bet, payout);
      setMessage(payout ? `Winner! You earned ${formatCredits(payout)}.` : 'No match this time. Try another spin.');
      setSpinning(false);
    }, 450);
  }

  return (
    <section className="game-stage" aria-label="Texas Gold slots">
      <div className="game-stage-heading"><span className="game-kicker">Texas Gold</span><h3>Lucky Reels</h3><p>Spin for fun with demo credits.</p></div>
      <div className="slot-machine">
        <div className="slot-reels">{reels.map((symbol, index) => <div className="slot-reel" key={`${symbol}-${index}`}>{symbol}</div>)}</div>
        <div className="payline" />
        <button type="button" className="btn-texas slot-spin" onClick={spin} disabled={spinning || credits < bet}><i className="fas fa-bolt me-2" />{spinning ? 'Rolling...' : 'Spin'}</button>
      </div>
      <div className="game-controls"><label htmlFor="slot-bet">Bet</label><select id="slot-bet" value={bet} onChange={(event) => setBet(Number(event.target.value))}>{[10, 25, 50, 100].map((amount) => <option key={amount} value={amount}>{amount} credits</option>)}</select><span className="game-message">{message}</span></div>
    </section>
  );
}

function RouletteGame({ credits, playGame }) {
  const [bet, setBet] = useState(25);
  const [choice, setChoice] = useState('red');
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('Choose red, black, or green, then spin.');

  function spin() {
    if (credits < bet) {
      setMessage('You need more demo credits for that spin.');
      return;
    }
    const number = randomItem(WHEEL_NUMBERS);
    const color = getRouletteColor(number);
    const payout = getRoulettePayout(choice, color, bet);
    setResult({ number, color });
    playGame(bet, payout);
    setMessage(payout ? `The ball landed on ${number} ${color}. You won ${formatCredits(payout)}.` : `The ball landed on ${number} ${color}. Better luck next spin.`);
  }

  return (
    <section className="game-stage" aria-label="Texas Roulette">
      <div className="game-stage-heading"><span className="game-kicker">Lone Star Table</span><h3>Texas Roulette</h3><p>Pick a color and test your luck.</p></div>
      <div className="roulette-layout"><div className="roulette-wheel"><div className="roulette-number">{result ? result.number : '?'}</div><span>{result ? result.color : 'place your bet'}</span></div><div className="roulette-options">{[['red', 'Red', 'roulette-red'], ['black', 'Black', 'roulette-black'], ['green', 'Green', 'roulette-green']].map(([value, label, className]) => <button type="button" key={value} className={`${className} ${choice === value ? 'selected' : ''}`} onClick={() => setChoice(value)}>{label}<small>{value === 'green' ? '14x' : '2x'}</small></button>)}<label htmlFor="roulette-bet">Wager</label><select id="roulette-bet" value={bet} onChange={(event) => setBet(Number(event.target.value))}>{[10, 25, 50, 100].map((amount) => <option key={amount} value={amount}>{amount} credits</option>)}</select><button type="button" className="btn-texas" onClick={spin} disabled={credits < bet}><i className="fas fa-sync me-2" />Spin wheel</button></div></div>
      <p className="game-message text-center">{message}</p>
    </section>
  );
}

function RiverGame({ credits, playGame }) {
  const [bet, setBet] = useState(25);
  const [cards, setCards] = useState([]);
  const [message, setMessage] = useState('Reveal three river cards. Matching icons pay out.');

  function sweep() {
    if (credits < bet) {
      setMessage('You need more demo credits for that sweep.');
      return;
    }
    const nextCards = [randomItem(SLOT_SYMBOLS), randomItem(SLOT_SYMBOLS), randomItem(SLOT_SYMBOLS)];
    const payout = getRiverPayout(nextCards, bet);
    setCards(nextCards);
    playGame(bet, payout);
    setMessage(payout ? `The river paid ${formatCredits(payout)}.` : 'The current ran cold. Sweep again when ready.');
  }

  return (
    <section className="game-stage river-stage" aria-label="River Sweep">
      <div className="game-stage-heading"><span className="game-kicker">Rio Grande Run</span><h3>River Sweep</h3><p>Draw three cards from the Texas current.</p></div>
      <div className="river-cards">{[0, 1, 2].map((index) => <div className={`river-card ${cards[index] ? 'revealed' : ''}`} key={index}>{cards[index] || <i className="fas fa-question" />}</div>)}</div>
      <div className="game-controls river-controls"><label htmlFor="river-bet">Sweep stake</label><select id="river-bet" value={bet} onChange={(event) => setBet(Number(event.target.value))}>{[10, 25, 50, 100].map((amount) => <option key={amount} value={amount}>{amount} credits</option>)}</select><button type="button" className="btn-texas" onClick={sweep} disabled={credits < bet}><i className="fas fa-water me-2" />Sweep the river</button></div>
      <p className="game-message text-center">{message}</p>
    </section>
  );
}
