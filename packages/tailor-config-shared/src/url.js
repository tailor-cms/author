import isLocalhost from 'is-localhost';
import parse from 'url-parse';

export default function (env) {
  const hostname = resolveHostname(env);
  const protocol = env.PROTOCOL ? env.PROTOCOL : resolveProtocol(hostname);
  const port = resolvePort(env);
  const origin = resolveOrigin(hostname, protocol, port, env.REVERSE_PROXY_PORT);
  return { hostname, protocol, port, origin };
}

// Legacy config support
function resolveHostname(env) {
  const { HOSTNAME, SERVER_URL } = env;
  if (HOSTNAME) return HOSTNAME;
  const LEGACY_HOSTNAME = parse(SERVER_URL).hostname;
  return LEGACY_HOSTNAME || 'localhost';
}

function resolveProtocol(hostname) {
  return isLocalhost(hostname) ? 'http' : 'https';
}

function resolvePort(env) {
  const { PORT, SERVER_PORT } = env;
  return PORT || SERVER_PORT || 3000;
}

function resolveOriginPort(port, reverseProxyPort) {
  if (!reverseProxyPort) return `:${port}`;
  if (reverseProxyPort === '80' || reverseProxyPort === '443') return '';
  return `:${reverseProxyPort}`;
}

function resolveOrigin(
  hostname = 'localhost',
  protocol = 'http',
  port = 3000,
  reverseProxyPort
) {
  return `${protocol}://${hostname}${resolveOriginPort(
    port,
    reverseProxyPort
  )}`;
}
