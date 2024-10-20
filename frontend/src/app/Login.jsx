function Login() {
  const handleLogin = () => {
    // Redirect to your backend's /login route to start the OAuth flow
    window.location.href = 'http://localhost:5000/login';
  };

  return (
    <div className="flex flex-col gap-6 justify-center items-center">
      <h1 className="text-4xl font-bold text-white">Login with Lichess</h1>
      <button className="bg-blue-500 w-fit text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all duration-200" onClick={handleLogin}>Login with Lichess</button>
    </div>
  );
}

export default Login;
