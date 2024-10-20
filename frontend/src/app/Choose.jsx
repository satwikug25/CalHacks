import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChessBoard, FaPuzzlePiece, FaSearch, FaUpload } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import { FaChessPawn } from 'react-icons/fa';

const Choose = () => {
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
  }, [location, navigate]);

  return (
    <div className="flex flex-col gap-10 justify-center items-center h-[90vh] relative">
      <div className="flex flex-col gap-6 items-center w-[750px]">
      <div className="flex items-end gap-0.5">
        {/* <h2 className="text-white text-6xl font-bold">g</h2> */}
        <FaChessPawn className="text-white text-6xl mb-2.5" />
        {/* <h2 className="text-white text-6xl font-bold">mbit</h2> */}
      </div>
        <h1 className="text-5xl font-bold text-white">Go from beginner to <span className="animate-text bg-gradient-to-br from-lime-500 to-teal-500 bg-clip-text text-transparent">master</span></h1>
        <p className="text-neutral-300 text-2xl">Analyze your games, train with puzzles, search for famous games, or upload your own.</p>
      </div>
      <div className="flex gap-4">
        <button className="bg-lime-600 text-white font-medium text-lg px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2" onClick={handleAnalyze}>
          <FaChessBoard /> Analyze
        </button>
        <button className="bg-green-600 text-white font-medium text-lg px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2" onClick={handleTrain}>
          <FaPuzzlePiece /> Train
        </button>
        <button className="bg-emerald-600 text-white font-medium text-lg px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2" onClick={handleSearch}>
          <FaSearch /> Search
        </button>
        <button className="bg-teal-600 text-white font-medium text-lg px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2" onClick={handleUpload}>
          <FaUpload /> Upload
        </button>
      </div>
      <button 
        className="text-red-400 font-medium rounded-md transition-all duration-200 flex items-center gap-1"
        onClick={handleLogout}
      >
        <FiLogOut /> Logout from Lichess
      </button>
    </div>
  );
};

export default Choose;
