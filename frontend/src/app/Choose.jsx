import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChessBoard, FaPuzzlePiece, FaSearch, FaUpload } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import { FaChessPawn } from 'react-icons/fa';

const Choose = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleAnalyze = () => {
    navigate('/analyze');
  };

  const handleTrain = () => {
    navigate('/train');
  };

  const handleSearch = () => {
    navigate('/search');
  };

  const handleUpload = () => {
    navigate('/upload');
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    navigate('/');
  };
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const username = searchParams.get('username');
    if (username) {
      localStorage.setItem('username', username);
    }
    
    // Trigger animations after a short delay
    setTimeout(() => setIsLoaded(true), 100);
  }, [location, navigate]);

  return (
    <div className="flex flex-col gap-10 justify-center items-center h-[90vh] relative">
      <div className={`flex flex-col gap-6 items-center w-[750px] transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className={`flex items-end gap-0.5 transition-transform duration-700 ${isLoaded ? 'translate-y-0' : 'translate-y-10'}`}>
          <FaChessPawn className="text-white text-6xl mb-2.5" />
        </div>
        <h1 className={`text-5xl font-bold text-white transition-transform duration-700 delay-100 ${isLoaded ? 'translate-y-0' : 'translate-y-10'}`}>
          Go from beginner to <span className="animate-text bg-gradient-to-br from-lime-500 to-teal-500 bg-clip-text text-transparent">master</span>
        </h1>
        <p className={`text-neutral-300 text-2xl transition-transform duration-700 delay-200 ${isLoaded ? 'translate-y-0' : 'translate-y-10'}`}>
          Analyze your games, train with puzzles, search for famous games, or upload your own.
        </p>
      </div>
      <div className={`flex gap-4 transition-opacity duration-1000 delay-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {['Analyze', 'Train', 'Search', 'Upload'].map((action, index) => (
          <button
            key={action}
            className={`bg-${['lime', 'green', 'emerald', 'teal'][index]}-600 text-white font-medium text-lg px-4 py-2 rounded-md transition-all duration-500 flex items-center gap-2 hover:scale-105`}
            onClick={[handleAnalyze, handleTrain, handleSearch, handleUpload][index]}
            style={{ transitionDelay: `${400 + index * 100}ms` }}
          >
            {[<FaChessBoard />, <FaPuzzlePiece />, <FaSearch />, <FaUpload />][index]} {action}
          </button>
        ))}
      </div>
      <button 
        className={`text-red-400 font-medium rounded-md transition-all duration-500 flex items-center gap-1 hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleLogout}
        style={{ transitionDelay: '800ms' }}
      >
        <FiLogOut /> Logout from Lichess
      </button>
    </div>
  );
};

export default Choose;
