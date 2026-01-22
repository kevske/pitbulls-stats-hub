import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Load env
load_dotenv()

# Manually map VITE vars if missing
if not os.getenv('SUPABASE_URL') and os.getenv('VITE_SUPABASE_URL'):
    os.environ['SUPABASE_URL'] = os.getenv('VITE_SUPABASE_URL')

if not os.getenv('SUPABASE_KEY') and os.getenv('VITE_SUPABASE_ANON_KEY'):
    os.environ['SUPABASE_KEY'] = os.getenv('VITE_SUPABASE_ANON_KEY')

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

def check_schema():
    print("Checking box_scores columns...")
    try:
        # Supabase-py doesn't have a direct 'describe table' method easily accessible via public API 
        # unless we use rpc or just try to select one row and see keys.
        res = supabase.table('box_scores').select('*').limit(1).execute()
        if res.data:
            print("Columns found in a row:")
            print(res.data[0].keys())
        else:
            print("No data in box_scores, cannot infer columns from data.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()
