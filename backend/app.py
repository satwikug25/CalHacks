from flask import Flask, jsonify, redirect, request, session, url_for
import requests
import os
import hashlib
import base64
import secrets
from methods import getGames
from groq import Groq
import json
from flask_cors import CORS
from dotenv import load_dotenv
import urllib.parse
load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})  
client_id = 'chessicle.com'
port = 5000

username = ""

groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])

# Function to base64url encode
def base64url_encode(data):
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

# Create the code verifier
def create_verifier():
    return base64url_encode(secrets.token_bytes(32))

# Create the code challenge from verifier
def create_challenge(verifier):
    digest = hashlib.sha256(verifier.encode('utf-8')).digest()
    return base64url_encode(digest)

@app.route('/login')
def login():
    verifier = create_verifier()
    challenge = create_challenge(verifier)

    session['code_verifier'] = verifier

    params = {
        'response_type': 'code',
        'client_id': client_id,
        'redirect_uri': url_for('callback', _external=True),
        'scope': 'preference:read',
        'code_challenge_method': 'S256',
        'code_challenge': challenge
    }
    auth_url = 'https://lichess.org/oauth?' + '&'.join([f'{key}={value}' for key, value in params.items()])
    return redirect(auth_url)

@app.route('/callback')
def callback():
    code = request.args.get('code')
    verifier = session.get('code_verifier')
    redirect_uri = url_for('callback', _external=True)

    # Exchange authorization code for access token
    token_url = 'https://lichess.org/api/token'
    data = {
        'grant_type': 'authorization_code',
        'client_id': client_id,
        'code': code,
        'code_verifier': verifier,
        'redirect_uri': redirect_uri,
    }
    response = requests.post(token_url, json=data, headers={'Content-Type': 'application/json'})
    token_response = response.json()

    if 'access_token' not in token_response:
        return 'Failed to get access token'

    access_token = token_response['access_token']

    # Use the access token to get the user's Lichess account information
    user_info_url = 'https://lichess.org/api/account'
    headers = {'Authorization': f'Bearer {access_token}'}
    user_info_response = requests.get(user_info_url, headers=headers)
    user_info = user_info_response.json()
    

    # Redirect back to the React frontend with the username
    return redirect(f'http://localhost:5173/choose?username={user_info["username"]}')

@app.get('/analyze_and_get_puzzles')
def analyze_and_get_puzzles():
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "Username is required"}), 400

    try:
        # First, get the analysis from the /train endpoint
        games = getGames(username)
        feedback = get_llama_feedback(games,username)
        
        # Extract recommended themes from the analysis
        recommended_themes = json.loads(feedback).get('recommended_themes', [])
        print("JOKE", recommended_themes)
        
        # Use these themes to fetch puzzles
        puzzles = get_puzzles(recommended_themes)
        
        print({
            "analysis": feedback,
            "puzzles": puzzles
        })
        return jsonify({
            "analysis": feedback,
            "puzzles": puzzles
        })
    except Exception as e:
        print(f"Error in analyze_and_get_puzzles: {str(e)}")
        return jsonify({"error": "An error occurred while processing your request"}), 500


# @app.get('/train')
# def train():
#     username = request.args.get('username')
#     if not username:
#         return jsonify({"error": "User not logged in"}), 401

#     games = getGames(username)
#     feedback = get_llama_feedback(games,username)
#     return jsonify(feedback)

groq_api_key = os.environ.get('GROQ_API_KEY')
if not groq_api_key:
    raise ValueError("GROQ_API_KEY is not set in environment variables")

groq_client = Groq(api_key=groq_api_key)

    # Use a model that exists and you have access to
model = "llama-3.1-70b-versatile"

@app.post('/ask_question')
def ask_question():
    data = request.json
    question = data.get('question')
    pgn = data.get('pgn')
    currentMove = data.get('currentMove')

    prompt = f'''You will be given the following details about a chess game: 
                \nQuestion: {question}

                If the question is not related to chess, no matter the below details, respond with "I'm sorry, I can only provide feedback on chess games."
                The user might also ask general questions about moves that are not in the PGN but hypothetical, in which case you should answer them based on the PGN and current board position.

                \nPGN: {pgn}
                \nCurrent Move: {currentMove}

                Limit your answers to 50 words and be brutal.'''
    
    try:
        response = groq_client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert chess analyst providing personalized feedback to players."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1000,
            top_p=1,
            stream=False,
            stop=None
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error in get_llama_feedback: {str(e)}")
        return f"An error occurred while generating feedback: {str(e)}"

@app.post('/get_evaluation')
def get_evaluation():
    data = request.json
    fen = data.get('fen')
    square = data.get('square')
    moves = data.get('moves')
    
    prompt = f'''You are given the FEN of a chess game as well as a square and possible moves for the piece at that square: 
                Your job is to return an array of objects for each possible movewith eval property (ranging from -1 for terrible move to +1 for great move but no 0s) and a 1-2 line reason for the eval. Be absolutely honest, don't sugarcoat anything, with opening moves you can be less extreme with the eval.
                IF A MOVE CAUSES LOSSES AT ALL, ESPECIALLY HEAVY ONES LIKE THE LOSS OF A PIECE, MAKE SURE THE EVAL IS NEGATIVE AND THE REASON CONVEYS THIS, BE BRUTAL.
                
                FEN: {fen}
                Square: {square}
                Possible Moves: {moves}

                MAKE SURE YOU RETURN ONLY AN ARRAY IN THE GIVEN FORMAT. DO NOT RETURN ANYTHING ELSE INCLUDING ANY TEXT OUTSIDE THE ARRAY. 
                ARRAY:'''
    
    try:
        response = groq_client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert chess analyst providing personalized feedback to players."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1000,
            top_p=1,
            stream=False,
            stop=None
        )
        print(response.choices[0].message.content)
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error in get_llama_feedback: {str(e)}")
        return f"An error occurred while generating feedback: {str(e)}"

@app.route('/get_games/<username>')
def getGames10(username):
    if not username:
        return jsonify({"error": "Username is required"}), 400

    url = f'https://lichess.org/api/games/user/{username}'

    headers = {
        'Accept': 'application/x-ndjson'
    }

    params = {
        'max': 10,
        'perfType': 'rapid',
        'pgnInJson': True,
        'evals': True,
        'opening': True,
    }

    response = requests.get(url, headers=headers, params=params)

    # Get the raw text response
    games = response.text.split('\n')

    # with open("t.json", "w") as f:
    #     f.write(games)

    return jsonify(games)

def get_llama_feedback(games, username):
    puzzle_categories = [
        "advancedPawn", "advantage", "anastasiaMate", "arabianMate", "attackingF2F7",
        "attraction", "backRankMate", "bishopEndgame", "bodenMate", "castling",
        "capturingDefender", "crushing", "doubleBishopMate", "dovetailMate", "equality",
        "kingsideAttack", "clearance", "defensiveMove", "deflection", "discoveredAttack",
        "doubleCheck", "endgame", "exposedKing", "fork", "hangingPiece", "hookMate",
        "interference", "intermezzo", "knightEndgame", "mate", "mateIn1", "mateIn2",
        "mateIn3", "mateIn4", "mateIn5", "middlegame", "opening", "pawnEndgame", "pin",
        "promotion", "queenEndgame", "queenRookEndgame", "queensideAttack", "quietMove",
        "rookEndgame", "sacrifice", "skewer", "smotheredMate", "trappedPiece",
        "underPromotion", "xRayAttack", "zugzwang"
    ]

    prompt = f"""
    Analyze the following chess game played by {username} and provide detailed, personalized feedback:

    Game data:
    {games}

    Please provide feedback in the following format:
    1. Opening Analysis: Comment on the player's opening choices and early game strategy.
    2. Middlegame Evaluation: Assess the player's tactical and positional play during the middlegame.
    3. Endgame Performance: Evaluate how the player handled the endgame, if applicable.
    4. Strengths: Highlight 2-3 aspects of {username}'s play that were particularly strong.
    5. Areas for Improvement: Suggest 2-3 specific areas where {username} could focus on improving.
    6. Recommended Themes: Propose 3-5 puzzle themes or study areas that would benefit {username}'s chess skills based on this game. Choose from the following categories:
    {', '.join(puzzle_categories)}

    Please format your response as JSON with the following structure:
    {{
        "opening_analysis": "Your analysis here",
        "middlegame_evaluation": "Your evaluation here",
        "endgame_performance": "Your evaluation here",
        "strengths": ["Strength 1", "Strength 2", "Strength 3"],
        "areas_for_improvement": ["Area 1", "Area 2", "Area 3"],
        "recommended_themes": ["Theme 1", "Theme 2", "Theme 3", "Theme 4", "Theme 5"]
    }}

    Ensure that the recommended_themes are chosen from the provided puzzle categories list and only return the JSON and nothing else
    """

    try:
        response = groq_client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert chess analyst providing personalized feedback to players."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1000,
            top_p=1,
            stream=False,
            stop=None
        )
        print(response.choices[0].message.content)
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error in get_llama_feedback: {str(e)}")
        return f"An error occurred while generating feedback: {str(e)}"
    
def get_puzzles(themes, rating='1500', count='10'):
    url = "https://chess-puzzles.p.rapidapi.com/"
    headers = {
        'x-rapidapi-key': os.environ['RAPIDAPI_KEY'],
        'x-rapidapi-host': "chess-puzzles.p.rapidapi.com"
    }
    all_puzzles = []
    print("JOKE", themes)

    for theme in themes:
        querystring = {
            "themes": json.dumps([theme]),
            "rating": rating,
            "count": count
        }
        print(f"Fetching puzzles for theme: {theme}")
        
        try:
            response = requests.get(url, headers=headers, params=querystring)
            response.raise_for_status()
            puzzles_json = json.loads(response.text)
            all_puzzles.append(puzzles_json['puzzles'])
            # ... (error handling code remains the same)
        except requests.exceptions.RequestException as e:
            if e.response.status_code == 400:
                print(f"Ignoring 400 error for theme: {theme}")
                continue
            else:
                raise

    print(f"Total puzzles fetched: {len(all_puzzles)}")
    return all_puzzles[0]

if __name__ == '__main__':
    app.run()
