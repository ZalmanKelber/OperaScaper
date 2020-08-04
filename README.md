To run this project, download the directory and make sure you either have the bs4 library installed in the parent directory or else change the import statements in opera_scraper.py and geo_scraper.py to access it differently.  Run those two functions followed by load_json.py (depending on your internet connection, it should take about 45 minutes to search through a year’s worth of data on operabase).  Then open up index.html in a browser.  Note that the JavaScript  is all written without the use of ES6 modules, so browsers can run it without the need of servers.  As such, it can be viewed with sample data from 2019 on github pages [here](https://zalmankelber.github.io/OperaScaper/).

This project uses the Python BeautifulSoup library to scrape data from Operabase and store it in a SQLite database, which is then transferred into several JSON objects readable by the JavaScript files that perform three data visualizations using the D3 library.

The first is a zoomable map (in the  EckertIV projection) showing the number of performances per city worldwide, that can be modified by user input to show the number of performances of operas by a particular composer per city.

The second is a chart that shows the amount of performances, productions, companies or cities (according to user-selected input from a drop down menu) that various percentages of singers worked at over the specified time (2019 in the sample data).

The third is a clickable chart showing clusters of singers who worked together on productions at at least three separate companies.
