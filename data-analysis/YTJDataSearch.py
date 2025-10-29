import pandas as pd
import requests, time, json, os

# --- CONFIG ---
INPUT_CSV = "BFData.csv"
CACHE_FILE = "ytj_cache.json"
DELAY = 0.5
API_URL = "https://avoindata.prh.fi/opendata-ytj-api/v3/companies?businessId="

def load_cache():
    # Load prev cache file
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            try:
                cache = json.load(f)
            except json.JSONDecodeError:
                cache = {}
        print(f"Loaded {len(cache)} cached entries.")
        return cache
    return {}

def save_cache(cache):
    # Write the cache to the disk
    tmp_file = CACHE_FILE + ".tmp"
    with open(tmp_file, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False)
    os.replace(tmp_file, CACHE_FILE)

def fetch_company(business_id):
    # Fetch company by business ID
    url = API_URL + business_id
    try:
        r = requests.get(url, timeout=15)
        if r.status_code == 200:
            return r.json()
        elif r.status_code == 429:
            print("Waiting for 30sec due to rate limit")
            time.sleep(30)
            return fetch_company(business_id)
        else:
            print(f"Error {r.status_code} for {business_id}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Network error for {business_id}: {e}")
        return None

def main():
    # Load business IDs
    df = pd.read_csv(INPUT_CSV)
    business_ids = df["Y-tunnus"].dropna().astype(str).unique()

    # Load cache
    cache = load_cache()
    done = set(cache.keys())

    # Process remaining IDs
    for i, bid in enumerate(business_ids):
        if bid in done:
            continue  # Skip already cached
        data = fetch_company(bid)
        if data:
            cache[bid] = data
            print(f"[{i+1}/{len(business_ids)}] Saved {bid}")
            save_cache(cache)
        else:
            print(f"[{i+1}/{len(business_ids)}] Skipped {bid} (no data)")
        time.sleep(DELAY)

    print("Caching complete, data saved to", CACHE_FILE)


if __name__ == "__main__":
    main()