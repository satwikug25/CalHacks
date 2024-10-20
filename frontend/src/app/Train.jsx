import React, { useState, useEffect, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaLightbulb } from 'react-icons/fa';

// import './css/Train.css';

const ChessGame = () => {
    const navigate = useNavigate();
    const [puzzles, setPuzzles] = useState([]);
    const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
    const [game, setGame] = useState(null);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [message, setMessage] = useState('');
    const [moveHistory, setMoveHistory] = useState([]);
    const [userColor, setUserColor] = useState('w');
    const [isAnimating, setIsAnimating] = useState(false);
    const [moveInput, setMoveInput] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSolving, setIsSolving] = useState(false);
    const username = localStorage.getItem('username');

    useEffect(() => {
        setTimeout(() => setIsLoaded(true), 100);
    }, []);

    const fetchTrainingData = async () => {
        try {
            const response = await fetch(`http://localhost:5000/analyze_and_get_puzzles?username=${username}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data.puzzles;
        } catch (error) {
            console.error('Error fetching training data:', error);
            return [];
        }
    };

    useEffect(() => {
        const loadPuzzles = async () => {
            let fetchedPuzzles = [];
            const storedPuzzles = localStorage.getItem('chessPuzzles');
            
            if (storedPuzzles.length > 0){
                fetchedPuzzles = JSON.parse(storedPuzzles);
                console.log('Puzzles loaded from local storage');
            } else {
                fetchedPuzzles = await fetchTrainingData();
                localStorage.setItem('chessPuzzles', JSON.stringify(fetchedPuzzles));
                console.log('Puzzles fetched from server and stored in local storage');
            }
            
            setPuzzles(fetchedPuzzles);
            if (fetchedPuzzles.length > 0) {
                initializeGame(fetchedPuzzles[0]);
            } else {
                setMessage('No puzzles available. Please try again later.');
            }
        };
        loadPuzzles();
    }, []);

    const initializeGame = useCallback((puzzle) => {
        if (!puzzle) {
            console.error('No puzzle available to initialize the game.');
            setMessage('No puzzles available. Please try again later.');
            return;
        }

        const newGame = new Chess(puzzle.fen);
        const activeColor = newGame.turn();
        const newUserColor = activeColor === 'w' ? 'b' : 'w';
        setUserColor(newUserColor);
        setGame(newGame);
        setCurrentMoveIndex(0);
        setMoveHistory([]);
        
        if (newUserColor === 'b') {
            setMessage("This is the initial position. Watch the computer's move...");
            setTimeout(() => makeComputerMove(newGame, [], 0, puzzle), 1000);
        } else {
            setMessage("Your turn to solve the puzzle!");
        }

        console.log('Initialized game:', newGame.fen(), 'User color:', newUserColor);
    }, []);

    const animateComputerMoves = (currentGame, moves) => {
        setIsAnimating(true);
        let moveIndex = 0;

        const animateMove = () => {
            if (moveIndex < moves.length) {
                const move = moves[moveIndex];
                const newGame = new Chess(currentGame.fen());
                newGame.move(move);
                setGame(newGame);
                setMoveHistory(prevHistory => [...prevHistory, move]);
                setCurrentMoveIndex(moveIndex + 1);
                console.log('Computer move made:', move, 'New FEN:', newGame.fen());

                moveIndex++;
                setTimeout(animateMove, 1000);
            } else {
                setIsAnimating(false);
                setMessage('Your turn to solve the puzzle!');
            }
        };

        animateMove();
    };

    const makeComputerMove = useCallback((currentGame, currentMoveHistory, moveIndex, currentPuzzle) => {
        if (!currentPuzzle || !currentPuzzle.moves || currentPuzzle.moves.length <= moveIndex) {
            console.error('Invalid puzzle data or move index.');
            setMessage('Error: Unable to make computer move. Please try another puzzle.');
            return;
        }

        const computerMove = currentPuzzle.moves[moveIndex];
        
        const newGame = new Chess(currentGame.fen());
        newGame.move(computerMove);
        const newMoveHistory = [...currentMoveHistory, computerMove];

        setGame(newGame);
        setCurrentMoveIndex(moveIndex + 1);
        setMoveHistory(newMoveHistory);
        
        console.log('Computer move made:', computerMove, 'New FEN:', newGame.fen());
    }, []);

    const showCongratulations = () => {
        setMessage('Congratulations! You\'ve solved the puzzle!');
        setTimeout(nextPuzzle, 2000);
    };

    const resetGame = () => {
        initializeGame(puzzles[currentPuzzleIndex]);
    };

    const nextPuzzle = () => {
        const newIndex = (currentPuzzleIndex + 1) % puzzles.length;
        setCurrentPuzzleIndex(newIndex);
        initializeGame(puzzles[newIndex]);
    };

    const prevPuzzle = () => {
        const newIndex = (currentPuzzleIndex - 1 + puzzles.length) % puzzles.length;
        setCurrentPuzzleIndex(newIndex);
        initializeGame(puzzles[newIndex]);
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleMove(moveInput);
            setMoveInput('');
        }
    };

    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'ArrowLeft') {
                prevPuzzle();
            } else if (event.key === 'ArrowRight') {
                nextPuzzle();
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [currentPuzzleIndex, puzzles]);

    const handleMove = useCallback((move) => {
        if (isAnimating || !game || game.turn() !== userColor) return;

        console.log('Attempting move:', move);
        const currentPuzzle = puzzles[currentPuzzleIndex];
        if (!currentPuzzle || !currentPuzzle.moves) {
            console.error('Invalid puzzle data');
            setMessage('Error: Invalid puzzle data. Please try another puzzle.');
            return;
        }

        const expectedMove = currentPuzzle.moves[currentMoveIndex];

        console.log('Expected move:', expectedMove);

        if (move === expectedMove) {
            const newGame = new Chess(game.fen());
            newGame.move(move);
            const newMoveHistory = [...moveHistory, move];
            
            setGame(newGame);
            setCurrentMoveIndex(prevIndex => prevIndex + 1);
            setMoveHistory(newMoveHistory);

            console.log('Correct move made. New FEN:', newGame.fen());

            if (currentMoveIndex + 1 < currentPuzzle.moves.length) {
                setMessage('Correct! Opponent is thinking...');
                setIsAnimating(true);
                setTimeout(() => {
                    makeComputerMove(newGame, newMoveHistory, currentMoveIndex + 1, currentPuzzle);
                    setIsAnimating(false);
                    if (currentMoveIndex + 2 < currentPuzzle.moves.length) {
                        setMessage('Your turn to solve the puzzle!');
                    } else {
                        showCongratulations();
                    }
                }, 500);
            } else {
                showCongratulations();
            }
        } else {
            setMessage('Incorrect move. Try again!');
            console.log('Incorrect move. Expected:', expectedMove, 'Got:', move);
        }
    }, [game, userColor, puzzles, currentPuzzleIndex, currentMoveIndex, moveHistory, makeComputerMove, showCongratulations, isAnimating]);

    const solvePuzzle = useCallback(() => {
        setIsSolving(true);
        const currentPuzzle = puzzles[currentPuzzleIndex];
        const newGame = new Chess(currentPuzzle.fen);
        setGame(newGame);
        setCurrentMoveIndex(0);
        setMoveHistory([]);

        const animateSolution = (moveIndex = 0) => {
            if (moveIndex < currentPuzzle.moves.length) {
                setTimeout(() => {
                    const move = currentPuzzle.moves[moveIndex];
                    newGame.move(move);
                    setGame(new Chess(newGame.fen()));
                    setMoveHistory(prevHistory => [...prevHistory, move]);
                    setCurrentMoveIndex(moveIndex + 1);
                    animateSolution(moveIndex + 1);
                }, 1000);
            } else {
                setIsSolving(false);
                showCongratulations();
            }
        };

        animateSolution();
    }, [puzzles, currentPuzzleIndex, showCongratulations]);

    if (!game) {
        return <div className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-16 gap-8">
            <button onClick={() => navigate('/choose')} className={`text-neutral-500 hover:text-neutral-600 rounded-md absolute top-10 left-10 flex flex-row gap-2 border-none justify-center items-center transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '300ms' }}>
                <FaArrowLeft /> Go Back
            </button>
            
            <h1 className={`text-5xl font-bold text-white transition-transform duration-700 ${isLoaded ? 'translate-y-0' : 'translate-y-10'}`}>
                Customized <span className="animate-text bg-gradient-to-br from-lime-500 to-teal-500 bg-clip-text text-transparent">puzzles</span> for you.
            </h1>
            
            <div className="flex flex-row gap-4 justify-center items-center">
            <button className="h-40 w-16 justify-center items-center bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-md transition-colors duration-200" onClick={prevPuzzle}>
                        <FaChevronLeft size={32} />
                    </button>
            <div className={`flex flex-col items-center transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '200ms' }}>
                <div className="flex flex-col justify-center gap-2 text-white px-8 py-6 bg-neutral-800 rounded-t-xl w-full">

                    <h2 className="text-2xl font-semibold">Puzzle: {currentPuzzleIndex + 1} / {puzzles.length}</h2>
                    {/* <p className="text-white text-lg">{message}</p> */}
                </div>
                
                <div className="w-[480px] relative">
                    <Chessboard
                        position={game.fen()}
                        boardOrientation={userColor === 'w' ? 'white' : 'black'}
                        onPieceDrop={(sourceSquare, targetSquare) => {
                            if (isAnimating || game.turn() !== userColor) return false;
                            const move = `${sourceSquare}${targetSquare}`;
                            handleMove(move);
                            return true;
                        }}
                    />
                    {currentMoveIndex >= puzzles[currentPuzzleIndex]?.moves.length && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                            <div className="text-center">
                                <div className="text-5xl mb-4">🎉</div>
                                <h2 className="text-3xl font-bold text-white mb-2">Congratulations!</h2>
                                <p className="text-xl text-white">You've solved the puzzle!</p>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col items-center gap-4 bg-neutral-800 rounded-b-xl w-full px-8 py-6">
                <div className="text-white flex justify-between items-center w-full">
                <div className="flex flex-row gap-3 justify-end items-end">
                    <h2 className="text-2xl font-semibold">Move {currentMoveIndex } / {puzzles[currentPuzzleIndex]?.moves.length}</h2>
                    <h2 className="text-lg text-neutral-300">{game.turn() === 'w' ? 'White' : 'Black'}'s turn</h2>
                </div>
                    <div className="flex gap-2">
                        <button 
                            className="bg-lime-500 hover:bg-lime-600 bg-opacity-75 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2" 
                            onClick={solvePuzzle}
                            disabled={isSolving}
                        >
                            <FaLightbulb /> Solve
                        </button>
                        <button 
                            className="bg-red-600 hover:bg-red-700 bg-opacity-75 text-white px-4 py-2 rounded-md transition-colors duration-200" 
                            onClick={resetGame}
                        >
                            Reset 
                        </button>
                    </div>
                </div>
                
                {/* <input
                    className="bg-neutral-700 text-white px-4 py-2 rounded-md w-64 hidden"
                    type="text"
                    placeholder="Enter move (e.g., e2e4)"
                    value={moveInput}
                    onChange={(e) => setMoveInput(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                /> */}
                
                </div>
            </div>
            <button className="h-40 w-16 justify-center items-center bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-md transition-colors duration-200" onClick={nextPuzzle}>
                <FaChevronRight size={32} />
            </button>
            </div>
        </div>
    );
};

export default ChessGame;
