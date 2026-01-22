import requests
import json

LEAGUE_ID = 49400
GAME_ID = 2786721
API_BASE_URL = "https://www.basketball-bund.net/rest"

def check_game_status():
    try:
        url = f"{API_BASE_URL}/competition/spielplan/id/{LEAGUE_ID}"
        response = requests.get(url)
        data = response.json().get('data', {}).get('matches', [])
        
        target_game = next((g for g in data if str(g.get('matchId')) == str(GAME_ID)), None)
        
        if target_game:
            home = target_game.get('homeTeam', {})
            print(f"Has teamPermanentId: {'teamPermanentId' in home}")
            print(f"Keys: {list(home.keys())}")
            print(f"teamPermanentId value: {home.get('teamPermanentId')}")
        else:
            print("GAME NOT FOUND")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_game_status()
