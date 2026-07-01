import requests
from PIL import Image
import time
import os

# Create dummy image
img = Image.new('RGB', (100, 100), color = 'red')
img.save('dummy.jpg')

print("1. Testing Upload API...")
with open('dummy.jpg', 'rb') as f:
    files = {'file': ('dummy.jpg', f, 'image/jpeg')}
    res = requests.post('http://localhost:8000/api/upload', files=files)
    
print(f"Upload Status: {res.status_code}")
data = res.json()
print(f"Upload Response: {data}")
session_id = data['sessionId']

print("\n2. Testing Reconstruct Start API...")
res2 = requests.post(f'http://localhost:8000/api/reconstruct/{session_id}')
print(f"Reconstruct Start Status: {res2.status_code}")
print(f"Reconstruct Start Response: {res2.json()}")

print("\n3. Testing Reconstruct Status Polling...")
for i in range(5):
    res3 = requests.get(f'http://localhost:8000/api/reconstruct/{session_id}/status')
    status_data = res3.json()
    print(f"Poll {i+1}: {status_data}")
    if status_data.get('status') == 'complete':
        break
    time.sleep(1)

print("\nAll tests complete.")
