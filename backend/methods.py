from flask import jsonify
import requests
import json


def getGames(username):
    url = f'https://lichess.org/api/games/user/{username}'
    
    headers = {
        'Accept': 'application/x-ndjson'
    }

    params = {
        'max': 25,
        'perfType':'rapid',
        'pgnInJson':True,
        'evals':True,
        'opening':True,
    }

    response = requests.get(url, headers=headers, params=params)
    
    # Get the raw text response
    games = response.text.split('\n')

    # with open("t.json", "w") as f:
    #     f.write(games)
    
    print(games)

    return games



