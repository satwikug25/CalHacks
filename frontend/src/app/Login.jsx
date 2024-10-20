import { useState, useEffect } from 'react';
import { FaChessKnight, FaChessPawn  } from 'react-icons/fa';

function Login() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const handleLogin = () => {
    // Redirect to your backend's /login route to start the OAuth flow
    window.location.href = 'http://localhost:5000/login';
  };

  return (
    <div className="flex flex-col gap-10 justify-center items-center h-screen">
      <div className={`flex items-end gap-0.5 transition-transform duration-700 ${isLoaded ? 'translate-y-0' : 'translate-y-10'}`}>
        {/* <h2 className="text-white text-6xl font-bold">g</h2> */}
        <FaChessPawn className="text-white text-6xl mb-2.5" />
        {/* <h2 className="text-white text-6xl font-bold">mbit</h2> */}
      </div>
      <h2 className={`text-5xl font-bold text-white w-[500px] leading-tight transition-transform duration-700 delay-100 ${isLoaded ? 'translate-y-0' : 'translate-y-10'}`}>
        The only chess tutor you will <span className="animate-text bg-gradient-to-br from-lime-500 to-teal-500 bg-clip-text text-transparent">ever</span> need
      </h2>
      <button 
        className={`animate-text bg-gradient-to-br from-lime-600 to-teal-600 w-fit text-xl font-medium text-white px-6 py-3 rounded-md hover:from-lime-700 hover:to-teal-700 transition-all duration-200 flex items-center gap-2 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
        onClick={handleLogin}
        style={{ transitionDelay: '300ms' }}
      >
        <FaChessKnight className="text-xl" />
        Login with Lichess
      </button>
    </div>
  );
}

export default Login;
