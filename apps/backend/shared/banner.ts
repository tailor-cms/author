/**
 * Boot banner - a 24-bit ANSI wordmark (coloured via chalk) printed once the
 * server is up: a gradient "TAILOR X" logo, Local + Network URLs (clickable
 * via OSC 8 hyperlinks), a status line, and a scan-to-open QR code for the
 * network URL (opt out with BOOT_QR=0 or NO_QR). Falls back to a single plain
 * line when NO_COLOR is set, under CI, or the terminal is too narrow - so
 * machine-read logs stay clean.
 */
import os from 'node:os';
import { Chalk } from 'chalk';
import qrcode from 'qrcode-terminal';

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
  X: ['██     ██', '  ██ ██  ', '   ███   ', '  ██ ██  ', '██     ██'],
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

// Flat accent stylers for the status area, pre-bound to their 24-bit hues.
// (The gradient art shares this truecolour space;
type Styler = (text: string) => string;
const accent = chalk.rgb(94, 234, 212); // teal - arrows & QR marker
const value = chalk.rgb(226, 232, 240); // slate - versions & timings
const muted = chalk.rgb(148, 130, 220); // violet - tagline & network host
const dot = chalk.rgb(52, 211, 153); // green - status dot
const envTint = chalk.rgb(167, 243, 208); // mint - environment name
const local = chalk.rgb(125, 211, 252); // sky - localhost URL
const bolt = chalk.rgb(250, 204, 21); // amber - ready-time bolt

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
const plainLine = (
  { version, port, env }: BannerContext,
  network: string | undefined,
  readyMs: number,
) =>
  `Tailor X v${version}  ·  http://localhost:${port}` +
  (network ? `  ·  http://${network}` : '') +
  `  ·  ${env}  ·  ready in ${readyMs}ms`;

// OSC 8 terminal hyperlink - makes the URL ⌘/ctrl-clickable in terminals that
// support it, and degrades to plain text everywhere else.
const hyperlink = (url: string, text: string) =>
  `\u001B]8;;${url}\u0007${text}\u001B]8;;\u0007`;

// First non-internal IPv4 address, so the app can be opened from another
// device (phone/tablet) on the same network. `undefined` when offline.
const networkHost = (port: string | number): string | undefined => {
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        return `${net.address}:${port}`;
      }
    }
  }
  return undefined;
};

// A "➜  Label  host" row with the host rendered as a clickable link.
const urlRow = (label: string, host: string, color: Styler) =>
  `  ${accent('➜')}  ${dim(label.padEnd(9))}` +
  color(hyperlink(`http://${host}`, host));

// Compact QR code for a URL, returned as raw rows (caller pads/centres them).
// The library invokes the callback synchronously, so we capture and return.
const renderQr = (url: string): string[] => {
  let out = '';
  qrcode.generate(url, { small: true }, (qr: string) => {
    out = qr;
  });
  return out.replace(/\n+$/, '').split('\n');
};

// Left pad that centres `content` of `contentWidth` columns within `width`,
// keeping the banner's 2-space base indent.
const centrePad = (width: number, contentWidth: number): string =>
  ' '.repeat(2 + Math.max(0, Math.floor((width - contentWidth) / 2)));

// Print the boot banner, or the plain fallback when colour is unavailable.
export const printBanner = (ctx: BannerContext): void => {
  const readyMs = Math.round(process.uptime() * 1000);
  const network = networkHost(ctx.port);

  // Render the art whenever colour isn't disabled. `pnpm dev` pipes the
  // backend through `concurrently`, so stdout isn't a TTY yet colour still
  // reaches the terminal - fall back to a plain line only for NO_COLOR / CI /
  // very narrow logs.
  const columns = process.stdout.columns ?? 80;
  const noColor = !!process.env.NO_COLOR || process.env.TERM === 'dumb';
  const canRender = !noColor && !process.env.CI && columns >= 64;
  if (!canRender) return console.log(plainLine(ctx, network, readyMs));

  const width = renderWord('TAILOR')[0]!.length;
  const tailor = gradientWord('TAILOR', COOL);
  const x = gradientWord('X', WARM);
  const tagline = 'Content, tailored.';

  // Centre the accent X and tagline under the wordmark, like the QR below.
  const xPad = centrePad(width, GLYPHS.X![0]!.length);
  const taglinePad = centrePad(width, tagline.length);

  const sep = dim(' · ');
  const meta = [
    `${dot('●')} ${envTint(ctx.env)}`,
    `${dim('v')}${value(String(ctx.version))}`,
    `${bolt('⚡')} ${value(`${readyMs}ms`)}`,
    dim(`node ${process.versions.node.split('.')[0]}`),
  ].join(sep);

  const urls = [urlRow('Local', `localhost:${ctx.port}`, local)];
  if (network) urls.push(urlRow('Network', network, muted));

  // Reaching here means colour rendered; show the QR unless explicitly off,
  // centred under the wordmark like the accent X.
  const qrDisabled = process.env.BOOT_QR === '0' || !!process.env.NO_QR;
  const qr: string[] = [];
  if (network && !qrDisabled) {
    const rows = renderQr(`http://${network}`);
    const qrPad = centrePad(width, rows[0]?.length ?? 0);
    const hint = 'Scan to open on another device';
    const hintPad = centrePad(width, hint.length + 2);
    qr.push(
      '',
      `${hintPad}${accent('▦')} ${dim(hint)}`,
      ...rows.map((row) => `${qrPad}${row}`),
    );
  }

  console.log(
    [
      '',
      ...tailor.map((row) => `  ${row}`),
      '',
      ...x.map((row) => `${xPad}${row}`),
      '',
      `${taglinePad}${muted(dim(tagline))}`,
      `  ${gradientRule(width, RULE)}`,
      ...urls,
      '',
      `  ${meta}`,
      ...qr,
      '',
      '',
    ].join('\n'),
  );
};
