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
import json
from datetime import datetime, timezone
import time
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class BasketballBundCrawler:
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_KEY')
        self.league_id = os.getenv('LEAGUE_ID')
        
        if not all([self.supabase_url, self.supabase_key, self.league_id]):
            raise ValueError("Missing required environment variables")
        
        # Clean and validate the Supabase URL
        self.supabase_url = self.clean_url(self.supabase_url)
        
        # Initialize Supabase client
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
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
            response = self.session.post(url, json=payload)
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
            response = self.session.get(url)
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
            response = self.session.get(url)
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
        box_scores = []
        
        for game in games:
            # Only fetch box scores for finished games
            if game.get('result') and ':' in game.get('result', ''):
                try:
                    game_id = str(game.get('matchId', ''))
                    if not game_id:
                        continue
                    
                    logger.info(f"Fetching box score for game {game_id}")
                    box_score_data = self.fetch_game_box_score(game_id, game)
                    if box_score_data:
                        box_scores.extend(box_score_data)
                    
                    # Add delay to avoid overwhelming the server
                    time.sleep(1)
                    
                except Exception as e:
                    logger.error(f"Error fetching box score for game {game.get('matchId', 'unknown')}: {e}")
                    continue
        
        logger.info(f"Fetched box scores for {len(box_scores)} player entries")
        return box_scores
    
    def fetch_game_box_score(self, game_id, game_data):
        """Fetch box score for a specific game"""
        try:
            # Construct URL for box score page
            url = f"{self.box_score_base_url}?type=1&spielplan_id={game_id}&liga_id={self.league_id}&defaultview=1"
            
            # Use a separate session for HTML requests with different headers
            html_session = requests.Session()
            html_session.headers.update({
                'User-Agent': 'BasketballBund-Crawler/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            })
            
            response = html_session.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
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
            
            # Store quarter scores in the games table if found
            if quarter_scores:
                self.update_game_with_quarter_scores(game_id, quarter_scores)
            
            return box_score_entries
            
        except requests.RequestException as e:
            logger.error(f"Error fetching box score HTML for game {game_id}: {e}")
            return []
        except Exception as e:
            logger.error(f"Error parsing box score for game {game_id}: {e}")
            return []
    
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
            quarter_scores = {}
            
            # Find the results table with quarter data
            tables = soup.find_all('table', class_='sportView')
            logger.info(f"Found {len(tables)} sportView tables for game {game_id}")
            
            for i, table in enumerate(tables):
                # Look for table with quarter headers
                headers = table.find_all('td', class_='sportViewHeader')
                header_texts = [h.get_text(strip=True) for h in headers]
                logger.info(f"Table {i} headers: {header_texts}")
                
                if '1.\xa0Viertel' in header_texts and 'Halbzeit' in header_texts and '3.\xa0Viertel' in header_texts:
                    logger.info(f"Found quarter scores table in table {i}")
                    # Find data rows - try different approaches
                    all_rows = table.find_all('tr')
                    logger.info(f"Total rows in quarter table: {len(all_rows)}")
                    
                    # Debug: show all rows and their classes
                    for k, row in enumerate(all_rows):
                        row_class = row.get('class', [])
                        logger.info(f"Row {k} class: {row_class}")
                    
                    # Try multiple row selection methods
                    rows = table.find_all('tr', class_=lambda x: x and x.startswith('sportItem'))
                    logger.info(f"Found {len(rows)} rows with sportItem* class")
                    
                    if len(rows) == 0:
                        # Fallback: try all rows that aren't headers
                        rows = [row for row in all_rows if not any('header' in str(cls).lower() for cls in row.get('class', []))]
                        logger.info(f"Fallback: found {len(rows)} non-header rows")
                    
                    for j, row in enumerate(rows):
                        cells = row.find_all('td', class_=lambda x: x and x.startswith('sportItem'))
                        logger.info(f"Row {j} has {len(cells)} sportItem cells")
                        
                        # Fallback: try all cells if no sportItem cells found
                        if len(cells) == 0:
                            cells = row.find_all('td')
                            logger.info(f"Row {j} has {len(cells)} total cells (fallback)")
                        
                        if len(cells) >= 9:  # Should have enough columns for quarter data
                            # Extract quarter scores from columns 6, 7, 8 (0-indexed)
                            first_quarter = cells[6].get_text(strip=True)
                            halftime = cells[7].get_text(strip=True)
                            third_quarter = cells[8].get_text(strip=True)
                            final_score = cells[5].get_text(strip=True)  # Endstand column
                            
                            logger.info(f"Quarter data - Q1: {first_quarter}, HT: {halftime}, Q3: {third_quarter}, Final: {final_score}")
                            
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
                        else:
                            logger.warning(f"Row {j} has insufficient cells ({len(cells)}), expected >= 9")
            
            logger.warning(f"No quarter scores table found for game {game_id}")
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
    
    def update_game_with_quarter_scores(self, game_id, quarter_scores):
        """Update the games table with quarter scores"""
        try:
            update_data = {
                'quarter_scores': quarter_scores,
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            
            result = self.supabase.table('games').update(update_data).eq('game_id', game_id).execute()
            
            if result.data:
                logger.info(f"Updated game {game_id} with quarter scores")
                return True
            else:
                logger.warning(f"No game found with ID {game_id} to update quarter scores")
                return False
                
        except Exception as e:
            logger.error(f"Error updating game {game_id} with quarter scores: {e}")
            return False
    
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
                
                # Store standings (transform API data to database format)
                if data['standings']:
                    standings_data = self.transform_standings_data(data['standings'])
                    standings_result = self.supabase.table('standings').upsert(standings_data).execute()
                    logger.info(f"Stored {len(standings_data)} standings entries")
                
                # Store box scores (transform and store player statistics)
                if data.get('box_scores'):
                    box_scores_data = self.transform_box_scores_data(data['box_scores'], data['games'])
                    if box_scores_data:
                        # Preserve existing minutes_played and player_slug data before deletion
                        preserved_data = self.preserve_minutes_data(box_scores_data)
                        
                        # Delete existing box scores for these games to avoid duplicates
                        game_ids = list(set([bs['game_id'] for bs in box_scores_data]))
                        for game_id in game_ids:
                            self.supabase.table('box_scores').delete().eq('game_id', game_id).execute()
                        
                        # Merge preserved data back into new box scores
                        final_box_scores = self.merge_preserved_data(box_scores_data, preserved_data)
                        
                        # Insert new box scores with preserved minutes
                        box_scores_result = self.supabase.table('box_scores').upsert(final_box_scores).execute()
                        logger.info(f"Stored {len(final_box_scores)} box score entries")
                
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
            
            if game.get('abgesagt', False):
                status = 'cancelled'
            elif result and not game.get('ergebnisbestaetigt', False):
                status = 'live'
            
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
                'box_score_url': box_score_url
            }
            
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
            
            transformed_box_scores.append(transformed_box_score)
        
        return transformed_box_scores
    
    def preserve_minutes_data(self, new_box_scores):
        """Preserve minutes_played and player_slug data from existing box scores"""
        preserved_data = {}
        
        try:
            # Get game_ids from new box scores
            game_ids = list(set([bs['game_id'] for bs in new_box_scores]))
            
            # Fetch existing box scores for these games
            for game_id in game_ids:
                result = self.supabase.table('box_scores').select(
                    'game_id', 'team_id', 'player_first_name', 'player_last_name', 
                    'minutes_played', 'player_slug'
                ).eq('game_id', game_id).execute()
                
                for row in result.data:
                    # Create a unique key for each player
                    key = f"{row['game_id']}_{row['team_id']}_{row['player_first_name']}_{row['player_last_name']}"
                    preserved_data[key] = {
                        'minutes_played': row.get('minutes_played'),
                        'player_slug': row.get('player_slug')
                    }
            
            logger.info(f"Preserved minutes data for {len(preserved_data)} player entries")
            
        except Exception as e:
            logger.warning(f"Error preserving minutes data: {e}")
        
        return preserved_data
    
    def merge_preserved_data(self, new_box_scores, preserved_data):
        """Merge preserved minutes data into new box scores"""
        merged_scores = []
        
        for box_score in new_box_scores:
            # Create the same key to find preserved data
            key = f"{box_score['game_id']}_{box_score['team_id']}_{box_score['player_first_name']}_{box_score['player_last_name']}"
            
            # Add preserved data if available
            if key in preserved_data:
                preserved = preserved_data[key]
                box_score['minutes_played'] = preserved.get('minutes_played')
                box_score['player_slug'] = preserved.get('player_slug')
            else:
                box_score['minutes_played'] = None
                box_score['player_slug'] = None
            
            merged_scores.append(box_score)
        
        return merged_scores
    
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
