export const SLOT_SYMBOLS = ['LONE STAR', 'CHILI', 'HAT', 'HORSE', 'DIAMOND', '7'];
export const WHEEL_NUMBERS = [0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, 0, 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2];
export const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export function getSlotPayout(reels, bet) {
  if (!Array.isArray(reels) || reels.length !== 3 || bet <= 0) return 0;
  if (reels.every((symbol) => symbol === reels[0])) return bet * 12;
  if (reels[0] === reels[1] || reels[1] === reels[2]) return bet * 2;
  return 0;
}

export function getRouletteColor(number) {
  if (number === 0) return 'green';
  return RED_NUMBERS.has(number) ? 'red' : 'black';
}

export function getRoulettePayout(choice, color, bet) {
  if (bet <= 0 || choice !== color) return 0;
  return choice === 'green' ? bet * 14 : bet * 2;
}

export function getRiverPayout(cards, bet) {
  if (!Array.isArray(cards) || cards.length !== 3 || bet <= 0) return 0;
  const matches = cards.filter((card, index) => cards.indexOf(card) === index && cards.filter((item) => item === card).length > 1).length;
  return matches === 1 ? bet * 2 : matches > 1 ? bet * 6 : 0;
}

export function applyBet(credits, bet, payout) {
  if (credits < bet || bet <= 0) return credits;
  return credits - bet + payout;
}
