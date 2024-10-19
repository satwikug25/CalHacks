import React from 'react';

function Login() {
  const handleLogin = () => {
    // Redirect to your backend's /login route to start the OAuth flow
    window.location.href = 'http://localhost:5000/login';
  };

  return (
    <div>
      <h1>Login with Lichess</h1>
      <button onClick={handleLogin}>Login with Lichess</button>
    </div>
  );
}

export default Login;
