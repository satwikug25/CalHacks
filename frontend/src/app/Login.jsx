import React from 'react';

const Login = () => {
    
  return (
    <div className="login-container">
      <h2>Login to Lichess</h2>
      <form className="login-form">
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" name="username" required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" required />
        </div>
        <button type="submit" className="login-button">Log In</button>
      </form>
      <div className="login-options">
        <a href="#">Forgot password?</a>
        <a href="#">Create an account</a>
      </div>
    </div>
  );
};

export default Login;

