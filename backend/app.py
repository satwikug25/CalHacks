from flask import Flask, jsonify, redirect, request, session, url_for
import requests
import os
import hashlib
import base64
import secrets
from methods import getGames
from groq import Groq
import json

app = Flask(__name__)
app.secret_key = os.urandom(24)

client_id = 'chessicle.com'
port = 3000

username = ""

groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])
from dotenv import load_dotenv
load_dotenv()
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
    username = user_info["username"]
    session['username'] = username

    # Redirect back to the React frontend with the username
    return redirect(f'http://localhost:5173/choose?username={user_info["username"]}')

@app.route('/train')
def train():
    username = session.get('username')
    if not username:
        return jsonify({"error": "User not logged in"}), 401

    games = getGames(username)
    feedback = get_llama_feedback(games)
    return jsonify(feedback)

def get_llama_feedback(games):
    prompt = f"""
    Analyze the following chess games and provide feedback:
    1. Suggest 3-5 themes of puzzles that would help improve the player's skills.
    2. Provide a brief overall assessment of the player's games.

    Games data:
    {games}

    Please format your response as JSON with the following structure:
    {{
        "themes": ["theme1", "theme2", "theme3"],
        "feedback": "Your overall assessment here"
    }}
    """

    response = groq_client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a chess analysis AI. Provide insightful feedback based on the given games."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        model="llama2-70b-4096",
        max_tokens=1000,
        temperature=0.7,
    )

    # Parse the JSON response
    try:
        feedback_json = json.loads(response.choices[0].message.content)
        return feedback_json
    except json.JSONDecodeError:
        # If parsing fails, return an error message
        return {"error": "Failed to parse AI response"}

    

if __name__ == '__main__':
    app.run(port=port)
