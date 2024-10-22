const alphabet: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const base = alphabet.length;

export default (n: number) => {
  const digits: number[] = [];

  do {
    const v = n % base;
    digits.push(v);
    n = Math.floor(n / base);
  } while (n-- > 0);

  const chars: string[] = [];
  while (digits.length) {
    chars.push(alphabet[digits.pop()]);
  }

  return chars.join('');
};
