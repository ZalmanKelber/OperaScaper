import json
import sqlite3

default_dbfile = "operadb.sqlite"

def get_cities():
    cities = dict()
    cur.execute('''SELECT Productions.performances, Operas.composer, Cities.id, Cities.lat, Cities.lng
                FROM Productions JOIN Operas ON Productions.opera_id = Operas.id
                JOIN Cities ON Productions.city_id = Cities.id;
    ''')
    productions = cur.fetchall()
    for production in productions:
        if production[2] not in cities:
            cities[production[2]] = {"productions" : [{"performances" : production[0],
                                                        "composer" : production[1]}],
                                        "lat" : production[3],
                                        "lng" : production[4]}
        else:
            cities[production[2]]["productions"].append({"performances" : production[0],
                                                        "composer" : production[1]})
    with open('js/cities.js', 'w') as outfile:
        outfile.write("cities = ")
        json.dump(cities, outfile)

def get_casts():
    casts = dict()
    cur.execute('''SELECT Casts.production_id, Casts.artist_id, Productions.company_id
				FROM Casts JOIN Productions on Casts.production_id = Productions.id;
    ''')
    cast_members = cur.fetchall()
    for item in cast_members:
        if item[0] not in casts:
            casts[item[0]] = {"company" : item[2], "cast" : [item[1]]}
        else:
            casts[item[0]]["cast"].append(item[1])
    with open('js/casts.js', 'w') as outfile:
        outfile.write("casts = ")
        json.dump(casts, outfile)

def get_artists():
    artists = dict()
    cur.execute('SELECT * FROM Artists')
    artist_list = cur.fetchall()
    for artist in artist_list:
        artists[artist[0]] = artist[1]
    with open('js/artists.js', 'w') as outfile:
        outfile.write("artists = ")
        json.dump(artists, outfile)

def get_artist_info():
    artist_info = dict()
    cur.execute('''SELECT Casts.artist_id, Productions.performances, Productions.city_id, Productions.company_id
                FROM Casts JOIN Productions ON Casts.production_id = Productions.id;
    ''')
    cast_members = cur.fetchall()
    for artist in cast_members:
        if artist[0] not in artist_info:
            artist_info[artist[0]] = {"companies" : {artist[3] : True},
                                        "cities" : {artist[2] : True},
                                        "productions" : 1,
                                        "performances" : artist[1]}
        else:
            artist_info[artist[0]]["productions"] += 1
            artist_info[artist[0]]["performances"] += artist[1]
            if artist[3] not in artist_info[artist[0]]["companies"]:
                artist_info[artist[0]]["companies"][artist[3]] = True
            if artist[2] not in artist_info[artist[0]]["cities"]:
                artist_info[artist[0]]["cities"][artist[2]] = True
    for artist in artist_info:
        artist_info[artist]["companies"] = len(artist_info[artist]["companies"].keys())
        artist_info[artist]["cities"] = len(artist_info[artist]["cities"].keys())
    with open('js/artist_info.js', 'w') as outfile:
        outfile.write("artist_info = ")
        json.dump(artist_info, outfile)


if __name__ == "__main__":
    dbfile = input("Enter file: ") or default_dbfile
    conn = sqlite3.connect(dbfile)
    cur = conn.cursor()
    get_cities()
    get_casts()
    get_artists()
    get_artist_info()
    conn.close()
