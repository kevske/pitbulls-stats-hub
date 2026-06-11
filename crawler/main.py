#!/usr/bin/env python3
"""
BasketballBund Crawler
Fetches data from basketball-bund.net REST API and stores it in Supabase
"""

import os
import requests

from supabase import create_client, Client
from dotenv import load_dotenv
import logging
from datetime import datetime, timezone
import time
from bs4 import BeautifulSoup
try:
    from crawler.rate_limiter import RateLimiter
except ImportError:
    from rate_limiter import RateLimiter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class BasketballBundCrawler:
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_KEY')

        if not all([self.supabase_url, self.supabase_key]):
            raise ValueError("Missing required environment variables")

        # Clean and validate the Supabase URL
        self.supabase_url = self.clean_url(self.supabase_url)

        # Initialize Supabase client
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)

        # League/season configuration comes from the seasons table so a new
        # season only needs a DB row instead of a GitHub Secret change.
        # LEAGUE_ID env stays as fallback for databases without seasons table.
        self.season_id = None
        self.our_team_id = None
        self.league_id = os.getenv('LEAGUE_ID')
        season = self.fetch_current_season()
        if season:
            self.season_id = season.get('id')
            self.our_team_id = season.get('our_team_id')
            self.league_id = str(season.get('league_id'))
            logger.info(f"Using season '{season.get('name')}' (id={self.season_id}, league_id={self.league_id})")
        else:
            logger.warning("No current season found in seasons table, falling back to LEAGUE_ID env variable")

        if not self.league_id:
            raise ValueError("No league id available: insert an is_current row into seasons or set LEAGUE_ID")
        
        # BasketballBund API base URL
        self.api_base_url = "https://www.basketball-bund.net/rest"
        
        # Box score URL base
        self.box_score_base_url = "https://www.basketball-bund.net/public/ergebnisDetails.jsp"
        
        # Session for requests
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'BasketballBund-Crawler/1.0'
        })
    
    def fetch_current_season(self):
        """Fetch the current season row from the seasons table"""
        try:
            result = self.supabase.table('seasons').select('*').eq('is_current', True).limit(1).execute()
            if isinstance(result.data, list) and result.data:
                return result.data[0]
        except Exception as e:
            logger.warning(f"Could not fetch current season: {e}")
        return None

    def clean_url(self, url):
        """Clean and validate URL by removing non-printable characters"""
        if not url:
            return url
        
        # Remove newlines, tabs, and other non-printable characters
        cleaned = ''.join(char for char in url if char.isprintable())
        
        # Remove leading/trailing whitespace
        cleaned = cleaned.strip()
        
        # Ensure URL starts with https:// if not already present
        if cleaned and not cleaned.startswith(('http://', 'https://')):
            cleaned = 'https://' + cleaned
        
        logger.info(f"Cleaned URL: {cleaned}")
        return cleaned
    
    def fetch_league_data(self):
        """Fetch league data from basketball-bund.net API"""
        try:
            logger.info(f"Fetching data for league {self.league_id}")
            
            # Fetch league details
            league_details = self.fetch_competition_list()
            
            # Fetch league table/standings
            standings = self.fetch_competition_table()
            
            # Fetch game schedule
            games = self.fetch_competition_spielplan()
            
            # Fetch box scores for finished games
            box_scores = self.fetch_box_scores(games)
            
            data = {
                'league_id': self.league_id,
                'scraped_at': datetime.now(timezone.utc).isoformat(),
                'league_details': league_details,
                'teams': self.extract_teams_from_data(standings, games),
                'games': games,
                'standings': standings,
                'box_scores': box_scores
            }
            
            logger.info(f"Successfully fetched data: {len(data['teams'])} teams, {len(data['games'])} games, {len(data['standings'])} standings, {len(data['box_scores'])} box score entries")
            return data
            
        except Exception as e:
            logger.error(f"Error fetching data from API: {e}")
            raise
    
    def fetch_competition_list(self):
        """Fetch competition details"""
        try:
            url = f"{self.api_base_url}/competition/list"
            payload = [int(self.league_id)]
            response = self.session.post(url, json=payload, timeout=30)
            response.raise_for_status()
            
            api_response = response.json()
            if api_response.get('status') != '0':
                raise Exception(f"API Error: {api_response.get('message')}")
            
            return api_response.get('data', {})
            
        except requests.RequestException as e:
            logger.error(f"Error fetching competition list: {e}")
            return {}
    
    def fetch_competition_table(self):
        """Fetch league standings/table"""
        try:
            url = f"{self.api_base_url}/competition/table/id/{self.league_id}"
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            api_response = response.json()
            if api_response.get('status') != '0':
                raise Exception(f"API Error: {api_response.get('message')}")
            
            data = api_response.get('data', {})
            return data.get('tabelle', {}).get('entries', [])
            
        except requests.RequestException as e:
            logger.error(f"Error fetching competition table: {e}")
            return []
    
    def fetch_competition_spielplan(self):
        """Fetch game schedule"""
        try:
            url = f"{self.api_base_url}/competition/spielplan/id/{self.league_id}"
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            api_response = response.json()
            if api_response.get('status') != '0':
                raise Exception(f"API Error: {api_response.get('message')}")
            
            data = api_response.get('data', {})
            return data.get('matches', [])
            
        except requests.RequestException as e:
            logger.error(f"Error fetching competition spielplan: {e}")
            return []
    
    def fetch_box_scores(self, games):
        """Fetch box scores for finished games"""
        try:
            logger.info("Fetching box scores for games synchronously...")
            box_scores = []
            
            # Filter games
            games_to_fetch = []
            for game in games:
                if game.get('result') and ':' in game.get('result', ''):
                    game_id = str(game.get('matchId', ''))
                    if game_id:
                        games_to_fetch.append((game_id, game))
            
            logger.info(f"Found {len(games_to_fetch)} games to fetch box scores for")
            
            # Use rate limiter to be nice to the server while allowing faster processing
            rate_limiter = RateLimiter(min_interval=0.5)

            for index, (game_id, game) in enumerate(games_to_fetch):
                try:
                    # Respect rate limit
                    rate_limiter.wait()

                    logger.info(f"Fetching box score for game {game_id} ({index+1}/{len(games_to_fetch)})")
                    entries, qs_update = self.fetch_game_box_score(game_id, game)
                    if entries:
                        box_scores.extend(entries)
                    if qs_update:
                        # Attach to the game object; persisted together with the
                        # full game row in store_data. (The previous standalone
                        # upsert here could insert partial game rows without
                        # team names before the games were stored.)
                        game['quarter_scores'] = qs_update[1]

                except Exception as e:
                    logger.error(f"Error processing game {game_id}: {e}")
                    continue

            logger.info(f"Fetched box scores for {len(box_scores)} player entries")
            return box_scores
        except Exception as e:
            logger.error(f"Error in fetch_box_scores: {e}")
            return []

    # Async methods removed as we switched to synchronous for better stability
    # fetch_box_scores_async and fetch_single_game_box_score_async deleted




    def parse_box_score_data(self, content, game_id, game_data):
        """Parse box score HTML content"""
        try:
            soup = BeautifulSoup(content, 'html.parser')
            
            # Extract quarter scores first
            quarter_scores = self.extract_quarter_scores(soup, game_id)
            
            # Extract player statistics from both teams
            home_team_id = str(game_data.get('homeTeam', {}).get('teamPermanentId', ''))
            away_team_id = str(game_data.get('guestTeam', {}).get('teamPermanentId', ''))
            
            box_score_entries = []
            
            # Parse home team statistics
            home_stats = self.parse_player_stats(soup, home_team_id, 'heim', game_id)
            box_score_entries.extend(home_stats)
            
            # Parse away team statistics  
            away_stats = self.parse_player_stats(soup, away_team_id, 'gast', game_id)
            box_score_entries.extend(away_stats)
            
            qs_update = None
            if quarter_scores:
                qs_update = (game_id, quarter_scores)

            return box_score_entries, qs_update
        except Exception as e:
            logger.error(f"Error parsing box score for game {game_id}: {e}")
            return [], None

    # Kept for backward compatibility if needed, though mostly replaced by async version above
    def fetch_game_box_score(self, game_id, game_data):
        """Fetch box score for a specific game (synchronous)"""
        try:
            # Construct URL for box score page
            url = f"{self.box_score_base_url}?type=1&spielplan_id={game_id}&liga_id={self.league_id}&defaultview=1"

            # Use a separate session for HTML requests with different headers
            html_session = requests.Session()
            html_session.headers.update({
                'User-Agent': 'BasketballBund-Crawler/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            })

            response = html_session.get(url, timeout=30)
            response.raise_for_status()

            box_score_entries, quarter_scores = self.parse_box_score_data(response.content, game_id, game_data)
            
            return box_score_entries, quarter_scores
            
        except requests.RequestException as e:
            logger.error(f"Error fetching box score HTML for game {game_id}: {e}")
            return [], None
        except Exception as e:
            logger.error(f"Error parsing box score for game {game_id}: {e}")
            return [], None
    
    def parse_player_stats(self, soup, team_id, team_type, game_id):
        """Parse player statistics from the HTML table"""
        player_stats = []
        
        # Find the correct form
        form_name = f"spielerstatistik{team_type}"
        form = soup.find('form', {'name': form_name})
        
        if not form:
            logger.warning(f"Could not find form {form_name} for team type: {team_type}")
            return player_stats
        
        # Find all tables in this form
        tables = form.find_all('table', class_='sportView')
        
        # Look for the table that contains player data (has 'Nachname' header)
        data_table = None
        for table in tables:
            rows = table.find_all('tr')
            if len(rows) > 1:  # Should have header + data rows
                first_row = rows[0]
                cells = first_row.find_all('td')
                if len(cells) >= 8:
                    first_cell_text = cells[0].get_text(strip=True)
                    if first_cell_text == 'Nachname':
                        data_table = table
                        break
        
        if not data_table:
            logger.warning(f"Could not find player data table in form {form_name}")
            return player_stats
        
        # Find all player rows (skip header row)
        rows = data_table.find_all('tr')[1:]  # Skip header row
        
        for row in rows:
            cells = row.find_all('td')
            
            # Skip if not a player row (should have 8 cells for player data)
            if len(cells) < 8:
                continue
            
            # Check if this looks like a player row (has name data)
            last_name_cell = cells[0].get_text(strip=True)
            first_name_cell = cells[1].get_text(strip=True)
            
            if not last_name_cell or not first_name_cell:
                continue
            
            # Skip rows that might be totals or empty
            if last_name_cell in ['Gesamt', '']:
                continue
            
            try:
                # Extract player statistics
                player_stat = {
                    'game_id': game_id,  # Set the correct game_id immediately
                    'team_id': team_id,
                    'player_last_name': last_name_cell,
                    'player_first_name': first_name_cell,
                    'points': self.safe_int(cells[2].get_text(strip=True)),
                    'free_throw_attempts': self.safe_int(cells[3].get_text(strip=True)),
                    'free_throws_made': self.safe_int(cells[4].get_text(strip=True)),
                    'two_pointers': self.safe_int(cells[5].get_text(strip=True)),
                    'three_pointers': self.safe_int(cells[6].get_text(strip=True)),
                    'fouls': self.safe_int(cells[7].get_text(strip=True)),
                    'league_id': self.league_id
                }
                
                player_stats.append(player_stat)
                
            except (ValueError, IndexError) as e:
                logger.warning(f"Error parsing player row: {e}")
                continue
        
        return player_stats
    
    def safe_int(self, value):
        """Safely convert string to integer, return 0 if conversion fails"""
        try:
            return int(value) if value and value.strip() else 0
        except (ValueError, AttributeError):
            return 0
    
    def extract_quarter_scores(self, soup, game_id):
        """Extract quarter scores from the HTML page"""
        try:
            # Find the results table with quarter data
            tables = soup.find_all('table', class_='sportView')
            
            for table in tables:
                # Find all potential headers
                headers = table.find_all('td', class_='sportViewHeader')
                header_texts = [h.get_text(strip=True) for h in headers]
                
                # Dynamic index finding for better robustness
                q1_idx = -1
                ht_idx = -1
                q3_idx = -1
                
                for idx, text in enumerate(header_texts):
                    if '1.' in text and 'Viertel' in text:
                        q1_idx = idx
                    elif 'Halbzeit' in text:
                        ht_idx = idx
                    elif '3.' in text and 'Viertel' in text:
                        q3_idx = idx
                
                if q1_idx != -1 and ht_idx != -1 and q3_idx != -1:
                    # Find data rows (try sportItem first, then all rows)
                    rows = table.find_all('tr', class_=lambda x: x and ('sportItem' in str(x)))
                    
                    # If no sportItem rows found, try all rows
                    if not rows:
                        rows = table.find_all('tr')
                    
                    for row in rows:
                        cells = row.find_all('td', class_=lambda x: x and ('sportItem' in str(x)))
                        
                        # Fallback: try all cells if no sportItem cells found
                        if len(cells) == 0:
                            cells = row.find_all('td')
                        
                        max_idx = max(q1_idx, ht_idx, q3_idx)
                        if len(cells) > max_idx:
                            # Extract quarter scores using dynamic indices
                            first_quarter = cells[q1_idx].get_text(strip=True)
                            halftime = cells[ht_idx].get_text(strip=True)
                            third_quarter = cells[q3_idx].get_text(strip=True)
                            
                            # Only process if we have actual score data (not headers or empty)
                            if ':' in first_quarter or ':' in halftime or ':' in third_quarter:
                                # Parse the score pairs (format: "home : away")
                                quarter_scores = {
                                    'first_quarter_home': self.parse_score_pair(first_quarter, 'home'),
                                    'first_quarter_away': self.parse_score_pair(first_quarter, 'away'),
                                    'halftime_home': self.parse_score_pair(halftime, 'home'),
                                    'halftime_away': self.parse_score_pair(halftime, 'away'),
                                    'third_quarter_home': self.parse_score_pair(third_quarter, 'home'),
                                    'third_quarter_away': self.parse_score_pair(third_quarter, 'away')
                                }
                                
                                logger.info(f"Extracted quarter scores for game {game_id}: {quarter_scores}")
                                return quarter_scores
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting quarter scores for game {game_id}: {e}")
            return None
    
    def parse_score_pair(self, score_text, team):
        """Parse a score pair like '14 : 14' and return the specified team's score"""
        try:
            if not score_text or ':' not in score_text:
                return None
            
            parts = score_text.split(':')
            if len(parts) != 2:
                return None
            
            home_score = self.safe_int(parts[0].strip())
            away_score = self.safe_int(parts[1].strip())
            
            return home_score if team == 'home' else away_score
            
        except Exception as e:
            logger.warning(f"Error parsing score pair '{score_text}': {e}")
            return None
    
    def extract_teams_from_data(self, standings, games):
        """Extract unique teams from standings and games"""
        teams = {}
        
        # Extract teams from standings
        for entry in standings:
            team = entry.get('team', {})
            if team:
                team_id = str(team.get('teamPermanentId', ''))
                teams[team_id] = {
                    'team_id': team_id,
                    'name': team.get('teamname', ''),
                    'league_id': self.league_id
                }
        
        # Extract teams from games (for any missing teams)
        for game in games:
            home_team = game.get('homeTeam', {})
            guest_team = game.get('guestTeam', {})
            
            for team in [home_team, guest_team]:
                if team:
                    team_id = str(team.get('teamPermanentId', ''))
                    if team_id not in teams:
                        teams[team_id] = {
                            'team_id': team_id,
                            'name': team.get('teamname', ''),
                            'league_id': self.league_id
                        }
        
        return list(teams.values())
    
    def test_supabase_connection(self):
        """Test connectivity to Supabase before attempting operations"""
        try:
            logger.info(f"Testing connection to Supabase: {self.supabase_url}")
            
            # Simple ping to test connectivity
            response = self.supabase.table('scrape_log').select('count').limit(1).execute()
            logger.info("Supabase connection test successful")
            return True
            
        except Exception as e:
            logger.error(f"Supabase connection test failed: {e}")
            raise
    
    def store_data(self, data):
        """Store fetched data in Supabase with retry logic"""
        max_retries = 3
        retry_delay = 10  # seconds
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Storing data in Supabase (attempt {attempt + 1}/{max_retries})")
                
                # Test connectivity first
                self.test_supabase_connection()
                
                # Store teams
                if data['teams']:
                    teams_result = self.supabase.table('teams').upsert(data['teams'], on_conflict='team_id').execute()
                    logger.info(f"Stored {len(data['teams'])} teams")
                
                # Store games (transform API data to database format)
                if data['games']:
                    games_data = self.transform_games_data(data['games'])
                    games_result = self.supabase.table('games').upsert(games_data, on_conflict='game_id').execute()
                    logger.info(f"Stored {len(games_data)} games")

                    # Assign sequential tsv_game_number to any new Pitbulls games
                    self.assign_tsv_game_numbers()

                # Store standings (transform API data to database format)
                if data['standings']:
                    standings_data = self.transform_standings_data(data['standings'])
                    if self.season_id is not None:
                        standings_result = self.supabase.table('standings').upsert(
                            standings_data, on_conflict='season_id,team_id'
                        ).execute()
                    else:
                        standings_result = self.supabase.table('standings').upsert(standings_data).execute()
                    logger.info(f"Stored {len(standings_data)} standings entries")

                # Store box scores (transform and store player statistics)
                if data.get('box_scores'):
                    box_scores_data = self.transform_box_scores_data(data['box_scores'], data['games'])
                    if box_scores_data:
                        # Upsert on the per-player-per-game unique constraint.
                        # minutes_played/seconds_played/player_slug are not part
                        # of the payload, so manually maintained values survive
                        # automatically — no delete+insert data-loss window.
                        box_scores_result = self.supabase.table('box_scores').upsert(
                            box_scores_data,
                            on_conflict='game_id,team_id,player_first_name,player_last_name'
                        ).execute()
                        logger.info(f"Stored {len(box_scores_data)} box score entries")
                
                # Store scrape metadata
                metadata = {
                    'league_id': data['league_id'],
                    'scraped_at': data['scraped_at'],
                    'teams_count': len(data['teams']),
                    'games_count': len(data['games']),
                    'standings_count': len(data['standings']),
                    'box_scores_count': len(data.get('box_scores', [])),
                    'status': 'success'
                }
                metadata_result = self.supabase.table('scrape_log').insert(metadata).execute()
                
                logger.info("Successfully stored all data in Supabase")
                return True
                
            except Exception as e:
                logger.error(f"Error storing data in Supabase (attempt {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    logger.info(f"Waiting {retry_delay} seconds before retry...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    # Log failure on final attempt
                    try:
                        failure_metadata = {
                            'league_id': self.league_id,
                            'scraped_at': datetime.now(timezone.utc).isoformat(),
                            'teams_count': 0,
                            'games_count': 0,
                            'standings_count': 0,
                            'box_scores_count': 0,
                            'status': 'failed',
                            'error_message': str(e)
                        }
                        self.supabase.table('scrape_log').insert(failure_metadata).execute()
                    except:
                        pass  # If we can't even log the failure, just give up
                    raise
    
    def transform_games_data(self, games):
        """Transform API games data to database format"""
        transformed_games = []
        
        for game in games:
            # Parse result if available
            home_score = None
            away_score = None
            status = 'scheduled'
            
            result = game.get('result')
            if result and ':' in result:
                try:
                    home_score, away_score = result.split(':')
                    home_score = int(home_score.strip())
                    away_score = int(away_score.strip())
                    status = 'finished' if game.get('ergebnisbestaetigt', False) else 'provisional'
                except ValueError:
                    pass
            
            # Cancellation wins over any result state. (The previous extra
            # branch here overrode 'provisional' with 'live', leaving games
            # stuck on 'live' until the league confirmed the result.)
            if game.get('abgesagt', False):
                status = 'cancelled'
            
            # Combine date and time
            game_datetime = None
            if game.get('kickoffDate') and game.get('kickoffTime'):
                game_datetime = f"{game['kickoffDate']} {game['kickoffTime']}"
            
            # Generate box score URL for finished games
            box_score_url = None
            if result and ':' in result:
                game_id = str(game.get('matchId', ''))
                if game_id:
                    box_score_url = f"{self.box_score_base_url}?type=1&spielplan_id={game_id}&liga_id={self.league_id}&defaultview=1"
            
            transformed_game = {
                'game_id': str(game.get('matchId', '')),
                'home_team_id': str(game.get('homeTeam', {}).get('teamPermanentId', '')),
                'away_team_id': str(game.get('guestTeam', {}).get('teamPermanentId', '')),
                'home_team_name': game.get('homeTeam', {}).get('teamname', ''),
                'away_team_name': game.get('guestTeam', {}).get('teamname', ''),
                'game_date': game.get('kickoffDate'),
                'game_time': game.get('kickoffTime'),
                'home_score': home_score,
                'away_score': away_score,
                'status': status,
                'league_id': self.league_id,
                'box_score_url': box_score_url,
                'quarter_scores': game.get('quarter_scores')
            }
            if self.season_id is not None:
                transformed_game['season_id'] = self.season_id
            
            transformed_games.append(transformed_game)
        
        return transformed_games
    
    def transform_standings_data(self, standings):
        """Transform API standings data to database format"""
        transformed_standings = []
        
        for entry in standings:
            team = entry.get('team', {})
            
            transformed_standing = {
                'team_id': str(team.get('teamPermanentId', '')),
                'team_name': team.get('teamname', ''),
                'league_id': self.league_id,
                'position': entry.get('rang', 0),
                'games_played': entry.get('anzspiele', 0),
                'wins': entry.get('s', 0),
                'losses': entry.get('n', 0),
                'points': entry.get('anzGewinnpunkte', 0),
                'points_for': entry.get('koerbe', 0),
                'points_against': entry.get('gegenKoerbe', 0),
                'scoring_difference': entry.get('korbdiff', 0),
                'scraped_at': datetime.now(timezone.utc).isoformat()
            }
            if self.season_id is not None:
                transformed_standing['season_id'] = self.season_id

            transformed_standings.append(transformed_standing)
        
        return transformed_standings
    
    def transform_box_scores_data(self, box_scores, games):
        """Transform box scores data to database format"""
        transformed_box_scores = []
        
        for box_score in box_scores:
            # game_id is already correctly set during parsing
            game_id = box_score.get('game_id', '')
            
            if not game_id:
                logger.warning(f"Box score entry missing game_id")
                continue
            
            transformed_box_score = {
                'game_id': game_id,
                'team_id': box_score.get('team_id', ''),
                'player_last_name': box_score.get('player_last_name', ''),
                'player_first_name': box_score.get('player_first_name', ''),
                'points': box_score.get('points', 0),
                'free_throw_attempts': box_score.get('free_throw_attempts', 0),
                'free_throws_made': box_score.get('free_throws_made', 0),
                'two_pointers': box_score.get('two_pointers', 0),
                'three_pointers': box_score.get('three_pointers', 0),
                'fouls': box_score.get('fouls', 0),
                'league_id': self.league_id,
                'scraped_at': datetime.now(timezone.utc).isoformat()
            }
            if self.season_id is not None:
                transformed_box_score['season_id'] = self.season_id

            transformed_box_scores.append(transformed_box_score)

        return transformed_box_scores

    def assign_tsv_game_numbers(self):
        """Assign tsv_game_number to new Pitbulls games via DB function"""
        try:
            result = self.supabase.rpc('assign_tsv_game_numbers').execute()
            assigned = result.data if isinstance(result.data, int) else 0
            if assigned:
                logger.info(f"Assigned tsv_game_number to {assigned} new games")
        except Exception as e:
            logger.warning(f"Could not assign tsv game numbers (DB function missing?): {e}")

    def run(self):
        """Main execution method"""
        logger.info("Starting BasketballBund crawler")
        
        try:
            # Fetch data from website
            data = self.fetch_league_data()
            
            # Store data in Supabase
            self.store_data(data)
            
            logger.info("Crawler execution completed successfully")
            
        except Exception as e:
            logger.error(f"Crawler execution failed: {e}")
            raise

if __name__ == "__main__":
    crawler = BasketballBundCrawler()
    crawler.run()
