import eel
import json
import os.path
from dotenv import load_dotenv
import pymongo

from nltk import edit_distance, TweetTokenizer, ngrams
import eng_to_ipa as eng_to_ipa

load_dotenv()
ENDPOINT = os.getenv('HEADER') +  os.getenv('GUEST_ID') + ":" +os.getenv('GUEST_PW') +  os.getenv('ENDPOINT')

CLIENT = pymongo.MongoClient(ENDPOINT)
DB = CLIENT[os.getenv('DB_NAME')]

MYCOL = DB[os.getenv('COL_NAME')]

tknzr = TweetTokenizer()

unigrams = []

with open('unigrams.json') as json_file:
    unigrams = json.load(json_file)

CORPUS = sorted([d['token'] for d in unigrams if 'token' in d])

CORPUS_WORDS = [x for x in CORPUS if x[0].isalpha()]

state_mgm_text = ""
state_mgm_tokens = []
state_mgm_positions = []

positions = []

state_mgm_bigrams = []

non_words = []

curr_tokens = []
curr_bigrams = []

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

def get_similar_words(word, dist1=2, dist2=2): 
    similar_words = []
    corpus = unigrams
    # Remove trailing whitespaces
    word = word.strip()
    ipa = eng_to_ipa.convert(word)
    # If token does not exist in corpus
    if not any(d['token'] == word for d in corpus):
        # Loop through corpus
        for entry in corpus:
            # Get spelling edit distance of word vs current corpus entry
            spell_dist = edit_distance(entry['token'], word)
            # If smaller than the target distance, append the entry
            if spell_dist < dist1:
                similar_words.append({"word": entry['token'], "stats": spell_dist})
            # When ipa translation fails, the original word is used.
            # If the ipa is translated, the orignal word will not be in the result
            if word not in ipa:
                # In the current corpus entry, if ipa translation is available
                if 'ipa' in entry.keys(): 
                    # Get ipa symbols edit distance of word vs current corpus entry ipa
                    sound_dist = edit_distance(entry['ipa'], ipa)
                    # If smaller than target distance, append the entry
                    if sound_dist < dist2:
                        similar_words.append({"word": entry['token'], "stats": sound_dist})

    # A similar word may appear twice, if both its spelling and sound edit distance are close
    # Keep only unique words in the list
    similar_words = list({v['word']:v for v in similar_words}.values())
    # Sort the suggestions by edit distance in an ascending order
    similar_words = sorted(similar_words, key = lambda i: i['stats'])
    return similar_words

# Helper function gets the differences between 2 lists of tuples
def compare_list_tuple(ls1, ls2):
    return set(ls2) - set(ls1)

def get_word_errors(bigram):
    # If the word in the first word in bigram is a word in unigrams
    if any(d['token'] == bigram[0] for d in unigrams) and any(d['token'] == bigram[1] for d in unigrams):
        suggestions = []
        # Send a query to get its bigrams
        myquery = { "token":  bigram[0] }
        # Return only the  bigrams, exclude the primary key and token
        result = MYCOL.find(myquery)
        # Convert mongodb cursor object to list
        result = result[0]["bigrams"]
        # If second word is not part of the bigrams of the first word in the corpus
        if bigram[1] not in set().union(*(d.keys() for d in result)):
            for r in result:
                entry = {"word": list(r.keys())[0], "stats": list(r.values())[0]}
                suggestions.append(entry)
        return suggestions

def check_new(lst, query):
    for i, dic in enumerate(lst):
        if dic["token"] == query["token"] and dic["start"] == query["start"] and "suggestions" in list(query.keys()):
            return i
    return -1

def combine_old_new(list1, list2):
    for old in list1:
        index = check_new(list2, old)
        if index > -1:
            list2[index]["suggestions"] = old["suggestions"]
    return list2

@eel.expose
def get_user_text(text):
    global state_mgm_text, state_mgm_tokens, state_mgm_bigrams, state_mgm_positions
    # Posistions contain a list of all tokens in user text and their starting position
    positions = []
    # Create a variable to keep track of search index
    searchPosition = 0
    # If the current text has changed
    if text != state_mgm_text:
        # Tokenize user input text with nltk
        curr_tokens = tknzr.tokenize(text)
        for c in curr_tokens:
            # Get the token and its position
            entry = {"token": c, "start": text.find(c, searchPosition)}
            positions.append(entry)
            # Update search index, so that next iteration searches after this word
            searchPosition += len(c)
        # Only get the new tokens typed
        new_tokens = [i for i in curr_tokens if i not in state_mgm_tokens]
        # Remove duplicates
        new_tokens = list(set(new_tokens))
        # Convert list into list of dictionaries
        new_tokens = [{"token": i} for i in new_tokens]
        # Using the current tokens, generate bigrams
        curr_bigrams = ngrams(curr_tokens,2)
        # NLTK n-gram returns a list of tuple and keep only new bigrams added by user
        new_bigrams = compare_list_tuple(state_mgm_bigrams, curr_bigrams)
        for b in new_bigrams:
            # For every new bigram added
            real_word_suggestions = get_word_errors(b)
            # If there is suggestion
            if real_word_suggestions:
                for i, p in enumerate(positions):
                    try:
                        if positions[i]["token"] == b[0] and positions[i+1]["token"] == b[1]:
                            positions[i+1]["suggestions"] = real_word_suggestions
                            eel.return_suggestion(positions[i+1])
                    except Exception as e:
                        pass
        for n in new_tokens:
            # Check non word if token is a word, since a token can be punctuation
            if n["token"].isalpha():
                print(n["token"])
                non_word_suggestions = get_similar_words(n["token"])
                # If there is suggestion
                if len(non_word_suggestions) > 0:
                    n["suggestions"] = non_word_suggestions
                    # Add the suggestion to the positions list
                    for p in positions:
                        if p["token"] == n["token"]:
                            p["suggestions"] = n["suggestions"]
                            eel.return_suggestion(entry)

        curr_positions = combine_old_new(state_mgm_positions, positions)

        # Save the current text, so that when user make changes, can be detected
        state_mgm_text = text
        state_mgm_tokens = curr_tokens
        state_mgm_bigrams = curr_bigrams
        state_mgm_positions = curr_positions

        print(curr_positions)
        eel.return_suggestions(curr_positions)

@eel.expose
def return_positions():
    eel.return_suggestions(positions)

def return_position(position):
    eel.return_suggestion(position)

# Index.html is where the main UI components are stored
eel.start('index.html')