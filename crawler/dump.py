import requests
import json

LEAGUE_ID = 49400
GAME_ID = 2786721
API_BASE_URL = "https://www.basketball-bund.net/rest"

url = f"{API_BASE_URL}/competition/spielplan/id/{LEAGUE_ID}"
response = requests.get(url)
data = response.json().get('data', {}).get('matches', [])

for m in data:
    if str(m.get('matchId')) == str(GAME_ID):
        with open('game_dump.json', 'w') as f:
            json.dump(m, f, indent=2)
        print("Dumped!")
        break
