import { FaChessKnight, FaChessPawn  } from 'react-icons/fa';

function Login() {
  const handleLogin = () => {
    // Redirect to your backend's /login route to start the OAuth flow
    window.location.href = 'http://localhost:5000/login';
  };

  return (
    <div className="flex flex-col gap-10 justify-center items-center">
      <div className="flex items-end gap-0.5">
        {/* <h2 className="text-white text-6xl font-bold">g</h2> */}
        <FaChessPawn className="text-white text-6xl mb-2.5" />
        {/* <h2 className="text-white text-6xl font-bold">mbit</h2> */}
      </div>
      <h2 className="text-5xl font-bold text-white w-[500px] leading-tight">The only chess tutor you will <span className="animate-text bg-gradient-to-br from-lime-500 to-teal-500 bg-clip-text text-transparent">ever</span> need</h2>
      <button className="animate-text bg-gradient-to-br from-lime-600 to-teal-600 w-fit text-xl font-medium text-white px-6 py-3 rounded-md hover:from-lime-700 hover:to-teal-700 transition-all duration-200 flex items-center gap-2" onClick={handleLogin}>
        <FaChessKnight className="text-xl" />
        Login with Lichess
      </button>
    </div>
  );
}

export default Login;
