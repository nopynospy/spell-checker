import eel

# Get web page files from web folder
eel.init('web')

# Create python functions that can be called by webpage
@eel.expose
def get_candidates():
    eel.return_candidates([
            {"word": "cat", "distance": 5},
            {"word": "fish", "distance": 3},
            {"word": "carrot", "distance": 8},
            {"word": "egg", "distance": 9},
            {"word": "onion", "distance": 12},
            {"word": "seaweed", "distance": 4},
            {"word": "apple", "distance": 9},
            {"word": "car", "distance": 15},
            {"word": "house", "distance": 11},
            {"word": "old", "distance": 7},
            {"word": "new", "distance": 7},
            {"word": "past", "distance": 13},
            {"word": "pig", "distance": 15},
            {"word": "world", "distance": 11},
            {"word": "end", "distance": 7},
            {"word": "water", "distance": 7},
            {"word": "cold", "distance": 13},
        ])

# Index.html is where the main UI components are stored
eel.start('index.html')