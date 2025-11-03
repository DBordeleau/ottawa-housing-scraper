import requests
import random
import concurrent.futures

# Manages a rotating list of proxies (supports authentication)
class ProxyRotator:
    
    def __init__(self, proxy_list=None, validate=True):
        self.proxy_list = proxy_list or []
        self.current_index = 0
        self.failed_proxies = set()
        
        if validate and self.proxy_list:
            print(f"Validating {len(self.proxy_list)} proxies...")
            self.proxy_list = self._validate_proxies(self.proxy_list)
            print(f"{len(self.proxy_list)} proxies validated successfully")

    # Validate proxies by testing them against httpbin.org/ip
    def _validate_proxies(self, proxy_list, timeout=15):
        valid_proxies = []
        
        def test_proxy(proxy):
            try:
                # Print first proxy format for debugging
                proxy_dict = self._format_proxy(proxy)
                
                # Test with httpbin
                response = requests.get(
                    'http://httpbin.org/ip',
                    proxies=proxy_dict,
                    timeout=timeout
                )
                
                if response.status_code == 200:
                    print(f"Proxy validated: {proxy[:40]}...")
                    return proxy
                else:
                    print(f"Proxy returned {response.status_code}: {proxy[:40]}...")
                    
            except requests.exceptions.ProxyError as e:
                print(f"ProxyError for {proxy[:40]}...: {str(e)[:60]}")
            except requests.exceptions.Timeout as e:
                print(f"Timeout for {proxy[:40]}...")
            except requests.exceptions.ConnectionError as e:
                print(f"ConnectionError for {proxy[:40]}...: {str(e)[:60]}")
            except Exception as e:
                print(f"Error for {proxy[:40]}...: {type(e).__name__}: {str(e)[:60]}")
            
            return None
        
        # Test proxies in parallel (limited to 5 concurrent for better debugging)
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            results = executor.map(test_proxy, proxy_list)
            valid_proxies = [p for p in results if p is not None]
        
        return valid_proxies
    
    # Format proxy string into requests-compatible dict
    def _format_proxy(self, proxy):
        """Handles both authenticated (user:pass@ip:port) and simple (ip:port) formats"""
        if '@' in proxy:
            # Authenticated proxy: user:pass@ip:port
            proxy_url = f'http://{proxy}'
        else:
            # Simple proxy: ip:port
            proxy_url = f'http://{proxy}'
        
        return {
            'http': proxy_url,
            'https': proxy_url
        }
    
    # Returns a random valid proxy in rotation
    def get_next_proxy(self):
        if not self.proxy_list:
            return None
        
        # Filter out failed proxies
        available_proxies = [p for p in self.proxy_list if p not in self.failed_proxies]
        
        if not available_proxies:
            print("All proxies have failed. Resetting failed proxy list.")
            self.failed_proxies.clear()
            available_proxies = self.proxy_list
        
        proxy = random.choice(available_proxies)
        return self._format_proxy(proxy)
    
    # A proxy is marked failed if the request fails or returns a 403 error
    def mark_proxy_failed(self, proxy_dict):
        if proxy_dict:
            proxy_url = proxy_dict.get('http', '')
            proxy = proxy_url.replace('http://', '')
            self.failed_proxies.add(proxy)
            print(f"Marked proxy as failed: {proxy[:30]}...") 

# Returns a list of proxies from proxyscrape API - These are all dead, pivoted to webshare
def fetch_free_proxy_list():
    try:
        response = requests.get(
            "https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all",
            timeout=10
        )
        if response.status_code == 200:
            proxies = [line.strip() for line in response.text.split('\n') if line.strip()]
            print(f"Fetched {len(proxies)} proxies")
            return proxies[:50]  # Limit to first 50 proxies
    except Exception as e:
        print(f"Failed to fetch proxy list: {e}")
    
    return []