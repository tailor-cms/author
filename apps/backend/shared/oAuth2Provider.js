import { ClientCredentials } from 'simple-oauth2';
import request from 'axios';
import oAuthConfig from '#config/consumer.ts';

function createOAuth2Provider() {
  if (!oAuthConfig.isAuthConfigured) {
    return { isConfigured: false };
  }
  const { clientId, clientSecret, tokenHost, tokenPath } = oAuthConfig;

  const client = new ClientCredentials({
    client: { id: clientId, secret: clientSecret },
    auth: { tokenHost, tokenPath },
  });

  let accessToken;

  async function send(url, payload) {
    if (!accessToken || accessToken.expired()) {
      await getAccessToken();
    }
    return request
      .post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken.token.access_token}`,
        },
      })
      .catch((error) => console.error(error.message));
  }

  function getAccessToken() {
    return client
      .getToken()
      .then((token) => {
        accessToken = token;
      })
      .catch((error) => console.error('Access Token Error', error.message));
  }

  return { send, isConfigured: true };
}

export default createOAuth2Provider();
