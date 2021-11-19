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

@eel.expose
def get_all_words():
    eel.return_all_words([
        "dispensable",
        "romantic",
        "squirrel",
        "bolt",
        "fixed",
        "winter",
        "many",
        "poke",
        "rhetorical",
        "linen",
        "tempt",
        "transition",
        "pan",
        "extraterrestrial",
        "cane",
        "plant",
        "please",
        "adventure",
        "computing",
        "chimney",
        "corruption",
        "congress",
        "language",
        "prejudice",
        "lesson",
        "initial",
        "parallel",
        "tool",
        "rain",
        "deliver",
        "distributor",
        "peak",
        "fluctuation",
        "safe",
        "commemorate",
        "descent",
        "settle",
        "breathe",
        "radical",
        "assume",
        "fine",
        "mastermind",
        "first",
        "conversation",
        "unlike",
        "bear",
        "available",
        "glare",
        "guess",
        "aware",
        "willpower"
    ])


# Index.html is where the main UI components are stored
eel.start('index.html')