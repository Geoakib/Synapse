import urllib.request
import urllib.parse
import json
import sys
import os

BASE_URL = "http://127.0.0.1:8001"
CURRENT_DIR = os.getcwd()

def test_cycles():
    print(f"Testing /api/cycles...")
    try:
        with urllib.request.urlopen(f"{BASE_URL}/api/cycles") as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                print(f"✅ Cycles check passed. Found {data.get('count')} cycles.")
            else:
                print(f"❌ Cycles check failed: {response.status}")
                sys.exit(1)
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

def test_set_target():
    target_path = os.path.join(CURRENT_DIR) # The current directory (Synapse)
    print(f"Testing /api/set_target with path: {target_path}")
    
    url = f"{BASE_URL}/api/set_target"
    data = json.dumps({"path": target_path}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                body = json.loads(response.read().decode())
                if body["status"] == "success":
                    print(f"✅ Target set successfully: {body['message']}")
                else:
                    print(f"❌ Target set failed: {body['message']}")
                    sys.exit(1)
            else:
                print(f"❌ Target set request failed: {response.status}")
                sys.exit(1)
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_cycles()
    test_set_target()
    test_cycles()
