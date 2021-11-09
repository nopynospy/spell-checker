import eel

eel.init('web')

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
            {"word": "car", "distance": 15},
            {"word": "house", "distance": 11},
            {"word": "old", "distance": 7},
            {"word": "new", "distance": 7},
            {"word": "past", "distance": 13},
        ])

eel.start('index.html')