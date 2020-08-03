import urllib.request, urllib.parse
import sqlite3
import ssl
import json

def initialize(cur):
    cur.executescript('''
    CREATE TABLE IF NOT EXISTS CitiesCopy(
       id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
       city TEXT,
       country TEXT,
       lat REAL,
       lng REAL,
       UNIQUE (city, country)
    );

    INSERT INTO CitiesCopy(id, city, country)
    SELECT id, city, country
    FROM Cities;

    DROP TABLE Cities;

    ALTER TABLE CitiesCopy RENAME TO Cities;
    ''')
def load_countries():
    with open("countries.json") as f:
      countries = json.load(f)
    country_map = dict()
    for country in countries:
        country_map[country["code"]] = country["name"]
    return country_map

def fixes(city_name):

    if city_name == "Bialystok": return "Białystok"
    if city_name == "Québec": return "Québec City"
    return city_name

def fetch_locations(cur, api_info):
    country_map = load_countries()
    cur.execute('SELECT * FROM Cities')
    cities = cur.fetchall()
    for city in cities:
        values = dict()
        values["address"] = fixes(city[1]) + ", " + country_map[city[2]]
        values["key"] = api_info["key"]
        data = urllib.parse.urlencode(values)
        url = api_info["service_url"] + data

        response = urllib.request.urlopen(url, context=ctx)
        location_data = response.read().decode()
        print(values["address"])

        try:
            js = json.loads(location_data)
        except:
            print("couldn't load data")  # We print in case unicode causes an error
            continue

        if 'status' not in js or (js['status'] != 'OK' and js['status'] != 'ZERO_RESULTS') :
            print("couldn't load data")
            break

        try:
            lat = js["results"][0]["geometry"]["location"]["lat"]
            lng = js["results"][0]["geometry"]["location"]["lng"]
            cur.execute('UPDATE Cities SET lat = ?, lng = ? WHERE id = ?', (lat, lng, city[0]))
        except:
            continue

default_dbfile = "operadb.sqlite"
api_info = dict()
api_info["service_url"] = "http://py4e-data.dr-chuck.net/json?"
api_info["key"] = 42

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

api_info["ctx"] = ctx

if __name__ == "__main__":
    dbfile = input("Enter file: ") or default_dbfile
    conn = sqlite3.connect(dbfile)
    cur = conn.cursor()
    initialize(cur)
    fetch_locations(cur, api_info)
    conn.commit()
    conn.close()
