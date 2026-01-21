import requests
from bs4 import BeautifulSoup

url1 = "https://www.ptt.cc/bbs/index.html"
url2 = "https://www.dcard.tw/f"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36"
}

# ptt
response1 = requests.get(url1, headers=headers)
soup1 = BeautifulSoup(response1.text, "html.parser")