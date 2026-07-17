/**
 * Boot banner - a 24-bit ANSI wordmark (coloured via chalk) printed once the
 * server is up: a gradient "TAILOR X" logo with a status line. Falls back to
 * a single plain line when NO_COLOR is set, under CI, or the terminal is too
 * narrow - so machine-read logs stay clean.
 */
import { Chalk } from 'chalk';

type Rgb = [number, number, number];

interface BannerContext {
  version: string | undefined;
  port: string | number;
  env: string;
}

const GLYPHS: Record<string, string[]> = {
  T: ['███████', '   █   ', '   █   ', '   █   ', '   █   '],
  A: ['  ███  ', ' █   █ ', '███████', '█     █', '█     █'],
  I: ['███████', '   █   ', '   █   ', '   █   ', '███████'],
  L: ['█      ', '█      ', '█      ', '█      ', '███████'],
  O: [' █████ ', '█     █', '█     █', '█     █', ' █████ '],
  R: ['██████ ', '█     █', '██████ ', '█   ██ ', '█    ██'],
  X: ['██   ██', ' ██ ██ ', '  ███  ', ' ██ ██ ', '██   ██'],
};
const GLYPH_ROWS = 5;

// Cool violet -> blue -> cyan for the wordmark, warm pink -> amber for the
// accent X, and a muted violet -> teal for the divider rule.
const COOL: Rgb[] = [
  [124, 92, 255],
  [56, 132, 246],
  [34, 211, 238],
];
const WARM: Rgb[] = [
  [255, 77, 141],
  [255, 159, 77],
];
const RULE: Rgb[] = [
  [76, 52, 148],
  [24, 90, 120],
];

// Linear interpolation between a and b at fraction t (0..1).
const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

// Sample an RGB colour from a multi-stop gradient at fraction t (0..1).
const mix = (stops: Rgb[], t: number): Rgb => {
  if (t <= 0) return stops[0]!;
  if (t >= 1) return stops[stops.length - 1]!;
  const seg = (stops.length - 1) * t;
  const i = Math.floor(seg);
  const f = seg - i;
  const [ar, ag, ab] = stops[i]!;
  const [br, bg, bb] = stops[i + 1]!;
  return [lerp(ar, br, f), lerp(ag, bg, f), lerp(ab, bb, f)];
};

// Force truecolour so the banner still renders when stdout is piped (e.g.
// `pnpm dev` via concurrently), where chalk would otherwise disable colour.
const chalk = new Chalk({ level: 3 });

// Wrap a string in a 24-bit (truecolour) foreground colour.
const fg = ([r, g, b]: Rgb, s: string) => chalk.rgb(r, g, b)(s);
// Wrap a string in the ANSI dim style.
const dim = (s: string) => chalk.dim(s);

// Render a word into GLYPH_ROWS rows of block-letter art.
const renderWord = (word: string): string[] => {
  const rows = Array.from({ length: GLYPH_ROWS }, () => '');
  [...word].forEach((ch, idx) => {
    const glyph = GLYPHS[ch] ?? Array(GLYPH_ROWS).fill('     ');
    for (let r = 0; r < GLYPH_ROWS; r++) rows[r] += (idx ? ' ' : '') + glyph[r];
  });
  return rows;
};

// Render a word as block art, colouring each cell by its column.
const gradientWord = (word: string, stops: Rgb[]): string[] => {
  const rows = renderWord(word);
  const width = rows[0]!.length;
  return rows.map((row) =>
    [...row]
      .map((ch, c) =>
        ch === ' ' ? ' ' : fg(mix(stops, width > 1 ? c / (width - 1) : 0), ch),
      )
      .join(''),
  );
};

// Build a horizontal rule of `width` cells, colour-graded across it.
const gradientRule = (width: number, stops: Rgb[]) =>
  Array.from({ length: width }, (_, c) =>
    fg(mix(stops, c / (width - 1)), '─'),
  ).join('');

// One-line fallback banner for non-colour / CI / narrow terminals.
const plainLine = ({ version, port, env }: BannerContext, readyMs: number) =>
  `Tailor X v${version}  ·  http://localhost:${port}  ·  ${env}  ·  ` +
  `ready in ${readyMs}ms`;

// Print the boot banner, or the plain fallback when colour is unavailable.
export const printBanner = (ctx: BannerContext): void => {
  const readyMs = Math.round(process.uptime() * 1000);

  // Render the art whenever colour isn't disabled. `pnpm dev` pipes the
  // backend through `concurrently`, so stdout isn't a TTY yet colour still
  // reaches the terminal - fall back to a plain line only for NO_COLOR / CI /
  // very narrow logs.
  const columns = process.stdout.columns ?? 80;
  const noColor = !!process.env.NO_COLOR || process.env.TERM === 'dumb';
  const canRender = !noColor && !process.env.CI && columns >= 64;
  if (!canRender) return console.log(plainLine(ctx, readyMs));

  const width = renderWord('TAILOR')[0]!.length;
  const tailor = gradientWord('TAILOR', COOL);
  const x = gradientWord('X', WARM);
  // Centre the accent X on its own line below the wordmark.
  const xPad = ' '.repeat(Math.floor((width - GLYPHS.X![0]!.length) / 2));

  const tagline = 'Content, tailored.';
  const taglinePad = ' '.repeat(
    Math.max(0, Math.floor((width - tagline.length) / 2)),
  );

  const sep = dim(' · ');
  const info =
    `${fg([52, 211, 153], '●')} ${fg([167, 243, 208], ctx.env)}` +
    sep +
    `${dim('v')}${fg([226, 232, 240], String(ctx.version))}` +
    sep +
    `${dim('↗ ')}${fg([125, 211, 252], `localhost:${ctx.port}`)}` +
    sep +
    `${fg([250, 204, 21], '⚡')} ${fg([226, 232, 240], `${readyMs}ms`)}` +
    sep +
    dim(`node ${process.versions.node.split('.')[0]}`);

  console.log(
    [
      '',
      ...tailor.map((row) => `  ${row}`),
      '',
      ...x.map((row) => `  ${xPad}${row}`),
      '',
      `  ${taglinePad}${fg([148, 130, 220], dim(tagline))}`,
      `  ${gradientRule(width, RULE)}`,
      `  ${info}`,
      '',
    ].join('\n'),
  );
};
