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
    games = response.json()
    
    # Split the text into lines and parse each line as JSON
    
    
    return


