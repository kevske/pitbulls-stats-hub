import requests
import logging
from bs4 import BeautifulSoup
import sys

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

LEAGUE_ID = 49400
GAME_ID = 2786721
API_BASE_URL = "https://www.basketball-bund.net/rest"
BOX_SCORE_BASE_URL = "https://www.basketball-bund.net/public/ergebnisDetails.jsp"

def fetch_competition_spielplan():
    try:
        url = f"{API_BASE_URL}/competition/spielplan/id/{LEAGUE_ID}"
        print(f"Fetching schedule from: {url}")
        response = requests.get(url)
        response.raise_for_status()
        
        api_response = response.json()
        if api_response.get('status') != '0':
            print(f"API Error: {api_response.get('message')}")
            return []
        
        data = api_response.get('data', {})
        return data.get('matches', [])
    except Exception as e:
        print(f"Error fetching schedule: {e}")
        return []

def safe_int(value):
    try:
        return int(value) if value and value.strip() else 0
    except (ValueError, AttributeError):
        return 0

def parse_player_stats(soup, team_id, team_type, game_id):
    player_stats = []
    
    # Find the correct form
    form_name = f"spielerstatistik{team_type}"
    form = soup.find('form', {'name': form_name})
    
    if not form:
        print(f"Could not find form {form_name}")
        return player_stats
    
    # Find all tables in this form
    tables = form.find_all('table', class_='sportView')
    
    # Look for the table that contains player data
    data_table = None
    for table in tables:
        rows = table.find_all('tr')
        if len(rows) > 1:
            first_row = rows[0]
            cells = first_row.find_all('td')
            if len(cells) >= 8:
                first_cell_text = cells[0].get_text(strip=True)
                if first_cell_text == 'Nachname':
                    data_table = table
                    break
    
    if not data_table:
        print(f"Could not find player data table in form {form_name}")
        return player_stats
    
    rows = data_table.find_all('tr')[1:]
    
    for row in rows:
        cells = row.find_all('td')
        if len(cells) < 8: continue
        
        last_name = cells[0].get_text(strip=True)
        first_name = cells[1].get_text(strip=True)
        
        if not last_name or not first_name or last_name in ['Gesamt', '']:
            continue
            
        print(f"Found player: {first_name} {last_name} ({team_type})")
        player_stats.append({
            'name': f"{first_name} {last_name}",
            'points': safe_int(cells[2].get_text(strip=True))
        })
            
    return player_stats

def check_game():
    # 1. Check Schedule
    matches = fetch_competition_spielplan()
    target_game = None
    for match in matches:
        if str(match.get('matchId')) == str(GAME_ID):
            target_game = match
            break
            
    if not target_game:
        print(f"Game {GAME_ID} NOT found in schedule!")
        return

    import json
    print("Game Details JSON:")
    print(json.dumps(target_game, indent=2))

    print(f"Game found: {target_game.get('homeTeam', {}).get('teamname')} vs {target_game.get('guestTeam', {}).get('teamname')}")
    print(f"Result: {target_game.get('result')}")
    print(f"Ergebnisbestaetigt: {target_game.get('ergebnisbestaetigt')}")

    if not (target_game.get('result') and ':' in target_game.get('result', '')):
        print("Game result invalid or missing colon, crawler would SKIP this game.")
    else:
        print("Game result valid, crawler would PROCEED to fetch box score.")

    # 2. Check Box Score Parsing
    print("\nAttempting to fetch and parse box score HTML...")
    url = f"{BOX_SCORE_BASE_URL}?type=1&spielplan_id={GAME_ID}&liga_id={LEAGUE_ID}&defaultview=1"
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, headers={
            'User-Agent': 'BasketballBund-Crawler/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        })
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        home_stats = parse_player_stats(soup, 'mock_id', 'heim', GAME_ID)
        away_stats = parse_player_stats(soup, 'mock_id', 'gast', GAME_ID)
        
        print(f"Parsed {len(home_stats)} home players")
        print(f"Parsed {len(away_stats)} away players")
        
    except Exception as e:
        print(f"Error fetching/parsing HTML: {e}")

if __name__ == "__main__":
    check_game()
