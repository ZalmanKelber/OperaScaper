import json
import urllib.request
import urllib.parse
import sqlite3
import ssl

import os,sys,inspect
current_dir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)
from bs4 import BeautifulSoup

def initialize_database(cur):

    # Make some fresh tables using executescript()
    cur.executescript('''
    DROP TABLE IF EXISTS Companies;
    DROP TABLE IF EXISTS Productions;
    DROP TABLE IF EXISTS Cities;
    DROP TABLE IF EXISTS Artists;
    DROP TABLE IF EXISTS Operas;
    DROP TABLE IF EXISTS Casts;

    CREATE TABLE Cities (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
        city TEXT,
        country TEXT,
        UNIQUE (city, country)
    );

    CREATE TABLE Companies (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
        company TEXT UNIQUE
    );

    CREATE TABLE Productions (
        id INTEGER NOT NULL PRIMARY KEY UNIQUE,
        city_id,
        company_id INTEGER,
        opera_id,
        performances INTEGER
    );

    CREATE TABLE Operas (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
        title TEXT,
        composer TEXT,
        UNIQUE (title, composer)
    );

    CREATE TABLE Artists (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
        name TEXT UNIQUE
    );

    CREATE TABLE Casts (
        artist_id INTEGER,
        production_id INTEGER,
        UNIQUE (artist_id, production_id)
    );
    ''')

def fetch_cities(cur, http_info):
    for country in http_info["countries"]:
        country_code = country["code"]
        displayed = False
        http_info["values"]["country_iso"] = country_code

        data = urllib.parse.urlencode(http_info["values"])
        data = data.encode('ascii')

        req = urllib.request.Request(http_info["urls"]["country"], data, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=http_info["ctx"]) as response:
            soup = BeautifulSoup(response.read(), "html.parser")
        for element in soup.find_all("div"):
            try:
                city = element["data-city"]
                cur.execute('''INSERT INTO Cities (city, country)
                            VALUES (?, ?)''', (city, country_code))
                if not displayed:
                    displayed = True
                    print(country["name"])
            except:
                pass

def fetch_productions(cur, http_info):
    cur.execute('SELECT * FROM Cities')
    rows = cur.fetchall()
    for row in rows:
        print(row[1], row[2])
        http_info["values"]["city"] = row[1]
        http_info["values"]["country"] = row[2]

        data = urllib.parse.urlencode(http_info["values"])
        data = data.encode('ascii')

        req = urllib.request.Request(http_info["urls"]["city"], data, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=http_info["ctx"]) as response:
            soup = BeautifulSoup(response.read(), "html.parser")
        divs = soup.find_all("div")
        for i in range(len(divs)):
            try:
                prod_id = int(divs[i]["data-id_prod"])
                title = divs[i].text.strip()
                prod_info = divs[i + 1].text.split("|")
                performances = int(prod_info[1].strip())
                composer = prod_info[2].strip()
                cur.execute('''INSERT OR IGNORE INTO Operas (title, composer)
                            VALUES (?, ?)''', (title, composer))
                cur.execute('SELECT id FROM Operas WHERE title = ? AND composer = ?', (title, composer))
                opera_id = cur.fetchone()[0]
                cur.execute('''INSERT OR IGNORE INTO Productions (id, city_id, opera_id, performances)
                            VALUES (?, ?, ?, ?)''', (prod_id, row[0], opera_id, performances))
            except:
                pass

def fetch_production_info(cur, http_info):
    cur.execute('SELECT id FROM Productions')
    rows = cur.fetchall()
    counter = 1
    num_productions = len(rows)
    for row in rows:
        url_string = http_info["urls"]["production"] + "?" + "id=" + str(row[0]) + "&lang=" + http_info["values"]["lang"]
        req = urllib.request.Request(url_string, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=http_info["ctx"]) as response:
            soup = BeautifulSoup(response.read(), "html.parser")

        #find opera company
        try:
            company = soup.find_all("div", {"id" : "dote_line"})[0].text.strip()
        except:
            company = "not found"
        cur.execute('''INSERT OR IGNORE INTO Companies (company)
                    VALUES (?)''', (company,))
        cur.execute('SELECT id FROM Companies WHERE company = ?', (company,))
        company_id = cur.fetchone()[0]
        cur.execute('UPDATE Productions SET company_id = ? WHERE id = ?', (company_id, row[0]))

        try:
            #find artists
            artist_divs = soup.find_all("div", {"class" : "cell_artist_name"})
            for artist_div in artist_divs:
                artists = artist_div.text.split("/")
                for artist in artists:
                    if len(artist.strip()) > 0:
                        cur.execute('''INSERT OR IGNORE INTO Artists (name)
                                    VALUES (?)''', (artist.strip(),))
                        cur.execute('SELECT id FROM Artists WHERE name = ?', (artist.strip(),))
                        artist_id = cur.fetchone()[0]
                        cur.execute('''INSERT OR IGNORE INTO Casts (artist_id, production_id)
                                    VALUES (?, ?)''', (artist_id, row[0]))
        except:
            pass

        print(counter, "/", num_productions)
        counter += 1

dbfile = "operadb.sqlite"

with open("countries.json") as f:
  countries = json.load(f)

START_DATE = "20190101"
END_DATE = "20191231"
LANG = "en"

values = { "from" : START_DATE,
            "to" : END_DATE,
            "lang" : LANG }

country_search_url = "https://www.operabase.com/en"
city_search_url = "https://www.operabase.com/ressources/views/perfs/cities_prog.php"
production_search_url = "https://www.operabase.com/ressources/views/festivals/season_prod_fetch.php"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

http_info = {"countries" : countries,
            "ctx" : ctx,
            "urls" : {"country" : country_search_url,
                        "city" : city_search_url,
                        "production" : production_search_url},
            "values" : values}

if __name__ == "__main__":
    conn = sqlite3.connect(dbfile)
    cur = conn.cursor()
    initialize_database(cur)
    fetch_cities(cur, http_info)
    fetch_productions(cur, http_info)
    fetch_production_info(cur, http_info)
    conn.commit()
    conn.close()
