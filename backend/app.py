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

@app.get('/train')
def train():
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "User not logged in"}), 401

    games = getGames(username)
    feedback = get_llama_feedback(games,username)
    return jsonify(feedback)

def get_llama_feedback(games, username):
    groq_api_key = os.environ.get('GROQ_API_KEY')
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY is not set in environment variables")

    groq_client = Groq(api_key=groq_api_key)

    # Use a model that exists and you have access to
    model = "llama-3.1-70b-versatile"  # or another model you have access to

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

    Ensure that the recommended_themes are chosen from the provided puzzle categories list.
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

    

    

if __name__ == '__main__':
    app.run(port=port)
