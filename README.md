# spell-checker

This project is for my Natural Language Processing module, where I built a spellchecker. Special thanks to my group mates, Lucas, Yi Fan, Yuen Neng and Pui Chyi for the documentation.

We used allrecipes.com as our corpus to build the system.

1. To install all the packages to run the exe:

pip install -r requirements.txt

2. To install the packages for everything, including the notebooks:

pip install -r full_requirements.txt

2. Location of scrapped data:

recipes_ingredients.json

(the remaining json files were urls, won't be used in analysis)

3. Codes used for scrapping:

data_extraction.ipynb

4. Codes for initial bigram:

bigram.ipynb

5. GUI

The GUI is basically a webpage, except it runs on python. The webpage files are in the web folder. To open the GUI, run app.py

6. Link to how I chunked phrases and the tips and tricks I came up with:

https://github.com/nopynospy/pos_tagging

7. To generate exe file
python -m eel app.py web --onefile --noconsole