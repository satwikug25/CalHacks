import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './css/Choose.css';

const Choose =() => {
  const navigate = useNavigate();

  const handleAnalyze = () => {
    navigate('/analyze');
  };

  const handleTrain = () => {
    navigate('/train');
  };

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