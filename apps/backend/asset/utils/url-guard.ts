// SSRF protection utilities for user-supplied URLs.
// Two layers:
// - isPublicUrl (sync); input validation (express-validator)
// - assertPublicUrl (async); execution-time check with DNS resolution
import dns from 'node:dns/promises';
import { general as config } from '#config';
import { isIP } from 'node:net';

const BLOCKED_HOSTS = new Set(['localhost', '[::1]']);
const PRIVATE_IP_RANGES = [
  /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^0\./, /^169\.254\./, /^::1$/, /^fc00:/, /^fe80:/, /^fd/,
];

function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_RANGES.some((r) => r.test(ip));
}

function assertPublicHostname(hostname: string): void {
  if (BLOCKED_HOSTS.has(hostname)) {
    throw new Error('Requests to localhost are not allowed');
  }
  if (isIP(hostname) && isPrivateIp(hostname)) {
    throw new Error('Requests to private IP addresses are not allowed');
  }
}

function assertHttpProtocol(protocol: string): void {
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new Error(`Unsupported protocol: ${protocol}`);
  }
}

// Sync SSRF check for express-validator .custom() chains.
// Validates protocol and hostname/IP literals. Cannot detect
// DNS rebinding (use assertPublicUrl for that).
export function isPublicUrl(url: string): true {
  const { protocol, hostname } = new URL(url);
  assertHttpProtocol(protocol);
  assertPublicHostname(hostname);
  return true;
}

// Async SSRF check with DNS resolution.
// Resolves hostname to IP before the request to prevent
// rebinding attacks where a public hostname resolves to a private IP.
export async function assertPublicUrl(url: string): Promise<void> {
  const { protocol, hostname } = new URL(url);
  assertHttpProtocol(protocol);
  if (config.allowPrivateUrls) return;
  assertPublicHostname(hostname);
  if (isIP(hostname)) return;
  const { address } = await dns.lookup(hostname);
  if (isPrivateIp(address) || BLOCKED_HOSTS.has(address)) {
    throw new Error('Hostname resolves to a private IP address');
  }
}
