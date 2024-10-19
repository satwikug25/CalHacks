import React, { useEffect, useState } from 'react';
import { OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';

// Lichess OAuth configuration
const lichessHost = 'https://lichess.org';
const scopes = ['email:read'];
const clientId = 'chesickle';
const clientUrl = (() => {
  const url = new URL(window.location.href);
  url.search = ''; 
  return url.href;
})();

const Login = () => {
  const [oauth, setOauth] = useState(null);
  const [accessContext, setAccessContext] = useState(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {

    const oauthInstance = new OAuth2AuthCodePKCE({
      authorizationUrl: `${lichessHost}/oauth`,
      tokenUrl: `${lichessHost}/api/token`,
      clientId,
      scopes,
      redirectUrl: clientUrl,
      onAccessTokenExpiry: (refreshAccessToken) => refreshAccessToken(),
      onInvalidGrant: () => setError('Invalid grant'),
    });
    setOauth(oauthInstance);

    const initAuth = async () => {
      try {
        const hasAuthCode = await oauthInstance.isReturningFromAuthServer();
        if (hasAuthCode) {
          const accessContext = await oauthInstance.getAccessToken();
          setAccessContext(accessContext);

          const fetchWithAuth = oauthInstance.decorateFetchHTTPClient(window.fetch);
          await fetchUserEmail(fetchWithAuth);
        }
      } catch (err) {
        setError(err.toString());
      }
    };

    initAuth();
  }, []);

  const login = async () => {
    if (oauth) {
      await oauth.fetchAuthorizationCode(); 
    }
  };

  const logout = async () => {
    const token = accessContext?.token?.value;
    setAccessContext(null);
    setEmail('');
    setError(null);

    
    await fetch(`${lichessHost}/api/token`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const fetchUserEmail = async (fetchWithAuth) => {
    try {
      const res = await fetchWithAuth(`${lichessHost}/api/account/email`);
      const data = await res.json();
      setEmail(data.email);
      console.log(clientId);
    } catch (err) {
      setError(err.toString());
    }
  };

  return (
    <div className="login-container">
      <h2>Lichess Login</h2>
      <p>Email: {email || 'Not logged in'}</p>
      <p>Client ID: {clientId}</p>  
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <button onClick={login} disabled={!!accessContext?.token}>
        Login
      </button>
      <button onClick={logout} disabled={!accessContext?.token}>
        Logout
      </button>
    </div>
  );
};

export default Login;
