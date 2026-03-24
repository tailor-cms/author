import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const IMAGE = {
  path: path.join(__dirname, 'test-image.jpg'),
  name: 'test-image.jpg',
};
export const DOCUMENT = {
  path: path.join(__dirname, 'test-document.pdf'),
  name: 'test-document.pdf',
};
export const VIDEO = {
  path: path.join(__dirname, 'test-video.mp4'),
  name: 'test-video.mp4',
};
export const AUDIO = {
  path: path.join(__dirname, 'test-audio.mp3'),
  name: 'test-audio.mp3',
};
