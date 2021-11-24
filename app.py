import eel
import json

from nltk import edit_distance

bigram_file_output = []

with open('bigrams.json') as json_file:
    bigram_file_output = json.load(json_file)

CORPUS = sorted([d['token'] for d in bigram_file_output if 'token' in d])

CORPUS_WORDS = [x for x in CORPUS if x[0].isalpha()]

state_mgm_text = ""

non_words = []

# Get web page files from web folder
eel.init('web')

CANDIDATES = [
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
        ]

# Create python functions that can be called by webpage
@eel.expose
def get_candidates():
    eel.return_candidates(CANDIDATES)

@eel.expose
def get_all_words():
    eel.return_all_words(sorted(CORPUS_WORDS))

def get_similar_words(word, dist=2): 
  similar_words = []
  entries = []
  corpus = CORPUS
  if word in corpus:
    return None
  else:
    w2 = word
    similar_words += ([w1 for w1 in corpus if edit_distance(w1, w2) < dist])
    for sw in similar_words:
        entry = {"word": sw, "distance": edit_distance(sw, w2)}
        entries.append(entry)
    print(entries)
    return entries

@eel.expose
def check_non_words(text):
    old_text = state_mgm_text
    non_words = []
    if text != old_text:
        curr_words = text.split(" ")
        for w in curr_words:
            if not w.isspace() and len(w) > 2:
                suggestions = get_similar_words(w)
                if suggestions:
                    non_word = {"non": w, "suggestion": get_similar_words(w)}
                    non_words.append(non_word)
    eel.return_nonwords(non_words)

# Index.html is where the main UI components are stored
eel.start('index.html')