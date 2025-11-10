import requests
import os

# Manages Webshare rotating proxy endpoint (no manual rotation needed)
class ProxyRotator:
    
    
    # Initialize with Webshare rotating proxy endpoint.
    # Webshare handles rotation automatically - no validation needed.
    def __init__(self, host=None, port=None, username=None, password=None):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        
        if not all([host, port, username, password]):
            raise ValueError("All proxy credentials must be provided: host, port, username, password")
        
        self.proxy_url = f"http://{username}:{password}@{host}:{port}"
        print(f"Initialized Webshare rotating proxy: {host}:{port}")
        print(f"Username: {username}")
        print("Webshare will automatically rotate IPs on each request")

    
    # Returns the proxy dict for requests.
    def get_proxy(self):
        return {
            'http': self.proxy_url,
            'https': self.proxy_url
        }
    
    # Test the Webshare rotating proxy endpoint. Returns True if working, False otherwise.
    def test_proxy(self, timeout=15):
        try:
            proxy_dict = self.get_proxy()
            response = requests.get(
                'http://httpbin.org/ip',
                proxies=proxy_dict,
                timeout=timeout
            )
            
            if response.status_code == 200:
                ip_data = response.json()
                print(f"✓ Proxy test successful! Current IP: {ip_data.get('origin', 'unknown')}")
                return True
            else:
                print(f"✗ Proxy test failed with status code: {response.status_code}")
                return False
                
        except requests.exceptions.ProxyError as e:
            print(f"✗ ProxyError: {str(e)[:100]}")
            return False
        except requests.exceptions.Timeout:
            print(f"✗ Timeout after {timeout}s")
            return False
        except requests.exceptions.ConnectionError as e:
            print(f"✗ ConnectionError: {str(e)[:100]}")
            return False
        except Exception as e:
            print(f"✗ Unexpected error: {type(e).__name__}: {str(e)[:100]}")
            return False