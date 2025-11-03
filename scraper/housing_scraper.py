"""
    Extracts real estate data from weekly market in review posts made by "ottawaagent" on /r/ottawa
    and uploads the data to supabase.
"""

import requests
import re
import os
import time
import random
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from proxy_rotator import ProxyRotator, fetch_free_proxy_list

load_dotenv()

# Supabase setup
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Pool of user agents to rotate through
USER_AGENTS = [
    # Chrome Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",

    # Firefox Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
    
    # Edge Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    
    # Chrome macOS
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    
    # Firefox macOS
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
    
    # Safari macOS
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    
    # Chrome Linux
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

# Returns a random User-Agent from the pool
def get_random_user_agent():
    return random.choice(USER_AGENTS)

# Returns browser headers with a random user-agent
# Inspired by https://github.com/jpjacobpadilla/Stealth-Requests
def get_realistic_headers():
    user_agent = get_random_user_agent()
    
    if 'Chrome' in user_agent and 'Edg' not in user_agent:
        sec_ch_ua = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"'
    elif 'Edg' in user_agent:
        sec_ch_ua = '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"'
    else:
        sec_ch_ua = None
    
    headers = {
        "User-Agent": user_agent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0",
    }
    
    # Chrome-specific headers
    if sec_ch_ua:
        headers["sec-ch-ua"] = sec_ch_ua
        headers["sec-ch-ua-mobile"] = "?0"
        headers["sec-ch-ua-platform"] = '"Windows"'
    
    return headers

# Fetch reddit posts with retries, user agent and proxy rotation
def fetch_reddit_posts(username, proxy_rotator, max_retries=3, limit=100):
    url = f"https://old.reddit.com/user/{username}/submitted.json"
    
    all_posts = []
    after = None  # Pagination cursor

    while True:
        url = f"https://old.reddit.com/user/{username}/submitted.json?limit={limit}"
        if after:
            url += f"&after={after}"
        
        print(f"\nFetching posts (batch of up to {limit})...")
        if after:
            print(f"   Continuing from cursor: {after}")
        
        for attempt in range(max_retries):
            try:
                proxy = proxy_rotator.get_next_proxy()
                
                # Get realistic headers with rotated User-Agent
                headers = get_realistic_headers()
                
                print(f"Attempt {attempt + 1}/{max_retries} using proxy: {proxy['http'][:50]}...")

                # Add random delay before each request to avoid rate limiting/detection
                if attempt > 0 or len(all_posts) > 0:
                    delay = random.uniform(3, 8)
                    print(f"   Waiting {delay:.1f}s before request...")
                    time.sleep(delay)
                
                response = requests.get(
                    url, 
                    headers=headers, 
                    proxies=proxy,
                    timeout=30
                )
                
                # Check if we are rate limited and retry in 1 minute
                if response.status_code == 429:
                    retry_after = response.headers.get('Retry-After', 60)
                    wait_time = int(retry_after) if retry_after.isdigit() else 60
                    print(f"Rate limited. Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    proxy_rotator.mark_proxy_failed(proxy)
                    continue
                
                # If access is forbidden mark the proxy as failed
                if response.status_code == 403:
                    print("Access forbidden - proxy may be blocked")
                    proxy_rotator.mark_proxy_failed(proxy)
                    continue
                
                response.raise_for_status()
                data = response.json()
                
                posts = data['data']['children']
                all_posts.extend(posts)
                
                print(f"Fetched {len(posts)} posts (total so far: {len(all_posts)})")
                
                # Check if there are more posts (pagination)
                after = data['data'].get('after')
                
                if not after:
                    # No more posts to fetch
                    print(f"\nFinished fetching all posts. Total: {len(all_posts)}\n")
                    return {'data': {'children': all_posts}}
                
                # Successfully fetched this batch, break retry loop and continue to next batch
                break
                
            # Mark proxy as failed on proxy errors or timeouts
            except requests.exceptions.ProxyError as e:
                print(f"   Proxy error: {e}")
                proxy_rotator.mark_proxy_failed(proxy)
            except requests.exceptions.Timeout as e:
                print(f"   Timeout error: {e}")
                proxy_rotator.mark_proxy_failed(proxy)
            except requests.exceptions.RequestException as e:
                print(f"   Request error: {e}")
                proxy_rotator.mark_proxy_failed(proxy)
            
            # Wait before retry with exponential backoff
            if attempt < max_retries - 1:
                wait_time = random.uniform(5, 10) * (attempt + 1)
                print(f"   Waiting {wait_time:.1f}s before retry...")
                time.sleep(wait_time)
        else:
            raise Exception(f"Failed to fetch Reddit posts after {max_retries} attempts")

# Extract numbers from selftext using regex
def extract_number(text, pattern):
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        value = match.group(1).replace(',', '')
        # Check if it's a price (contains $)
        if '$' in match.group(0):
            return value.replace('$', '')
        return value
    return None

# Parse the selftext to extract relevant real estate data
def parse_real_estate_data(selftext):
    data = {}
    
    # Freehold Sales
    freehold_section = re.search(r'\*\*\*Freehold\*\*\*(.*?)\*\*\*Condos\*\*\*', selftext, re.DOTALL)
    if freehold_section:
        section_text = freehold_section.group(1)
        data['freehold'] = {
            'active_listings': extract_number(section_text, r'Number of active listings:\s*(\d+)'),
            'conditional_sales': extract_number(section_text, r'Number of conditional sales:\s*(\d+)'),
            'sold_properties': extract_number(section_text, r'Number of sold properties:\s*(\d+)'),
            'median_list_price': extract_number(section_text, r'Median list price:\s*\$?([\d,]+)'),
            'median_sold_price': extract_number(section_text, r'Median sold price:\s*\$?([\d,]+)'),
            'median_dom': extract_number(section_text, r'Median DOM:\s*(\d+)')
        }
    
    # Condo Sales
    condo_section = re.search(r'\*\*\*Condos\*\*\*(.*?)\*\*\*Freehold Rentals\*\*\*', selftext, re.DOTALL)
    if condo_section:
        section_text = condo_section.group(1)
        data['condos'] = {
            'active_listings': extract_number(section_text, r'Number of active listings:\s*(\d+)'),
            'conditional_sales': extract_number(section_text, r'Number of conditional sales:\s*(\d+)'),
            'sold_properties': extract_number(section_text, r'Number of sold properties:\s*(\d+)'),
            'median_list_price': extract_number(section_text, r'Median list price:\s*\$?([\d,]+)'),
            'sold_price': extract_number(section_text, r'Sold price:\s*\$?([\d,]+)'),
            'median_dom': extract_number(section_text, r'Median DOM:\s*(\d+)')
        }
    
    # Freehold Rentals
    freehold_rental_section = re.search(r'\*\*\*Freehold Rentals\*\*\*(.*?)\*\*\*Condo Rentals\*\*\*', selftext, re.DOTALL)
    if freehold_rental_section:
        section_text = freehold_rental_section.group(1)
        data['freehold_rentals'] = {
            'active_listings': extract_number(section_text, r'Number of active listings:\s*(\d+)'),
            'rented_properties': extract_number(section_text, r'Number of rented properties:\s*(\d+)'),
            'median_list_price': extract_number(section_text, r'Median (?:list(?:ed)?) price:\s*\$?([\d,]+)'),
            'median_rented_price': extract_number(section_text, r'Median rented price:\s*\$?([\d,]+)'),
            'median_dom': extract_number(section_text, r'Median DOM:\s*(\d+)')
        }
    
    # Condo Rentals
    condo_rental_section = re.search(r'\*\*\*Condo Rentals\*\*\*(.*?)$', selftext, re.DOTALL)
    if condo_rental_section:
        section_text = condo_rental_section.group(1)
        data['condo_rentals'] = {
            'active_listings': extract_number(section_text, r'Number of active listings:\s*(\d+)'),
            'rented_properties': extract_number(section_text, r'Number of rented properties:\s*(\d+)'),
            'median_list_price': extract_number(section_text, r'Median list price:\s*\$?([\d,]+)'),
            'median_rented_price': extract_number(section_text, r'Median rented price:\s*\$?([\d,]+)'),
            'median_dom': extract_number(section_text, r'Median DOM:\s*(\d+)')
        }
    
    return data

# Upload parsed data to appropriate supabase tables
def insert_to_supabase(post_date, data):
    if 'freehold' in data:
        freehold_data = {**data['freehold'], 'date': post_date}
        supabase.table('freehold_sales').insert(freehold_data).execute()
    
    if 'condos' in data:
        condo_data = {**data['condos'], 'date': post_date}
        supabase.table('condo_sales').insert(condo_data).execute()
    
    if 'freehold_rentals' in data:
        freehold_rental_data = {**data['freehold_rentals'], 'date': post_date}
        supabase.table('freehold_rentals').insert(freehold_rental_data).execute()
    
    if 'condo_rentals' in data:
        condo_rental_data = {**data['condo_rentals'], 'date': post_date}
        supabase.table('condo_rentals').insert(condo_rental_data).execute()

# Main entry point to fetch /u/ottawaagent posts and process them
def main():
    print("=" * 60)
    print("Ottawa Housing Scraper - Starting up")
    print("=" * 60)

    # Check if running in GitHub Actions (only need most recent post)
    is_github_actions = os.environ.get('GITHUB_ACTIONS') == 'true'
    if is_github_actions:
        print("\nRunning in GitHub Actions")

    # Use webshare proxies from .env
    proxy_list_str = os.environ.get("PROXY_LIST", "")
    proxy_list = []
    
    if proxy_list_str:
        print("\nFound PROXY_LIST in .env file")
        proxy_list = [p.strip() for p in proxy_list_str.split(',') if p.strip()]
        print(f"Loaded {len(proxy_list)} proxies from PROXY_LIST")
    else:
        # Fallback to free proxies (this literally will never work)
        print("\nNo PROXY_LIST found in .env file")
        print("Attempting to fetch free proxies (Probably not going to work)")
        proxy_list = fetch_free_proxy_list()
        
        if proxy_list:
            print(f"Fetched {len(proxy_list)} free proxies (success not guaranteed)")
        else:
            print("Failed to fetch free proxies")

    # Validate we have proxies
    if not proxy_list:
        print("\n" + "=" * 60)
        print("ERROR: NO PROXIES AVAILABLE")
        print("=" * 60)
        print("\nScript will NOT run without valid proxies. Quitting now.")
        print("=" * 60)
        return
    
    # Initialize proxy rotator with validation
    print(f"\nValidating {len(proxy_list)} proxies (this may take 30-60 seconds)...")
    print("Testing each proxy against httpbin.org...")
    proxy_rotator = ProxyRotator(proxy_list, validate=True)
    
    # Check if we have any valid proxies after validation
    if not proxy_rotator.proxy_list or len(proxy_rotator.proxy_list) == 0:
        print("\n" + "=" * 60)
        print("ERROR: NO VALID PROXIES AFTER VALIDATION")
        print("=" * 60)
        print("\nAll provided proxies failed validation.")
        print("\nScript will NOT run without valid proxies. Quitting now.")
        print("=" * 60)
        return
    
    print(f"Successfully validated {len(proxy_rotator.proxy_list)} working proxies")
    print("\n" + "=" * 60)
    print("Starting scraper with proxy protection enabled")
    print("=" * 60 + "\n")
    
    # Only fetch posts now that we have valid proxies
    reddit_data = fetch_reddit_posts("ottawaagent", proxy_rotator)
    posts = reddit_data['data']['children']
    
    # Only process posts after the cutoff date
    cutoff_date_str = os.environ.get("CUTOFF_DATE", "2024-01-01")
    CUTOFF_DATE = datetime.strptime(cutoff_date_str, "%Y-%m-%d") if cutoff_date_str else None
    
    # Filter for weekly review posts in /r/ottawa (he crossposts so this is necessary to avoid duplicates)
    target_posts = [
        post['data'] for post in posts
        if "The Ottawa Real Estate Market: Week In Review" in post['data']['title']
        and post['data']['subreddit'].lower() == 'ottawa'
        and (CUTOFF_DATE is None or datetime.fromtimestamp(post['data']['created_utc']) >= CUTOFF_DATE)
    ]
    
    # Sort by date (newest first) and limit (if set)
    target_posts.sort(key=lambda x: x['created_utc'], reverse=True)
    max_posts_str = os.environ.get("MAX_POSTS")
    if max_posts_str and max_posts_str.isdigit():
        max_posts = int(max_posts_str)
        print(f"Limiting to {max_posts} posts (MAX_POSTS is set in .env)")
        target_posts = target_posts[:max_posts]
    else:
        print(f"Processing all {len(target_posts)} posts (no MAX_POSTS limit)")
    
    print(f"Found {len(target_posts)} matching posts to process\n")
    
    for post in target_posts:
        post_date = datetime.fromtimestamp(post['created_utc']).strftime('%Y-%m-%d')
        selftext = post['selftext']
        post_id = post['id']
        
        # Check if we've already processed this post (date matches)
        existing = supabase.table('freehold_sales').select('*').eq('date', post_date).execute()
        if existing.data:
            print(f"Post from {post_date} already processed, skipping")
            continue
        
        print(f"Processing post from {post_date}")
        
        parsed_data = parse_real_estate_data(selftext)
        
        insert_to_supabase(post_date, parsed_data)
        print(f"Successfully inserted data for {post_date}\n")
        
        # Add delay between posts to avoid rate limiting/detection
        time.sleep(random.uniform(3, 7))
    
    print("=" * 60)
    print("Scraping completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    main()