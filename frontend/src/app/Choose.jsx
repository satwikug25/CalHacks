import React,{useEffect} from 'react';
import { useNavigate, Link , useLocation} from 'react-router-dom';
import './css/Choose.css';

const Choose = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleAnalyze = () => {
    navigate('/analyze');
  };

  const handleTrain = () => {
    navigate('/train');
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const username = searchParams.get('username');
    if (username) {
      localStorage.setItem('username', username);
    }
  }, [location, navigate]);

  return (
    <div className="container">
      <h1>Choose an Option</h1>
      <div className="buttonContainer">
        <button className="button" onClick={handleAnalyze}>
          Analyze
        </button>
        <button className="button" onClick={handleTrain}>
          Train
        </button>
      </div>
    </div>
  );
};

export default Choose;