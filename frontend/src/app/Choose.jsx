import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const username = searchParams.get('username');
    if (username) {
      localStorage.setItem('username', username);
    }
  }, [location, navigate]);

  return (
    <div className="flex flex-col gap-8 justify-center items-center">
      <h1 className="text-5xl font-bold text-white">Choose an Option</h1>
      <div className="flex gap-4">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all duration-200" onClick={handleAnalyze}>
          Analyze
        </button>
        <button className="bg-rose-500 text-white px-4 py-2 rounded-md hover:bg-rose-600 transition-all duration-200" onClick={handleTrain}>
          Train
        </button>
        <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-all duration-200" onClick={handleSearch}>
          Search
        </button>
        <button className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-all duration-200" onClick={handleUpload}>
          Upload
        </button>

      </div>
    </div>
  );
};

export default Choose;