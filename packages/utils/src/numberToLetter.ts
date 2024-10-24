const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const base = alphabet.length;

export default (n: number) => {
  const digits = [];

  do {
    const v = n % base;
    digits.push(v);
    n = Math.floor(n / base);
  } while (n-- > 0);

  const chars = [];
  while (digits.length) {
    chars.push(alphabet[digits.pop()]);
  }

  return chars.join('');
};
