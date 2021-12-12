# eel is the main UI library
import eel
# json is the main file format used for reading
import json
# connect to global environment, since its best practice to put tokens in a .env file
import os.path
from dotenv import load_dotenv
# pymongo is a driver for mongodb
import pymongo
# uuid generates unique id
import uuid
import certifi
ca = certifi.where()
# These are the librabries that were also used in Colab while building the logic
from nltk import edit_distance, TweetTokenizer, ngrams
# However, when exporting to exe, eng_to_ipa causes compatibility issues
import eng_to_ipa as eng_to_ipa
import re

# These are libraries used to generate test result for benchmarking purposes
import enchant
from sklearn.metrics import classification_report
import random
import string
import math

#  Connect to database to get bigrams

load_dotenv()

ENDPOINT = os.getenv('HEADER') +  os.getenv('GUEST_ID') + ":" +os.getenv('GUEST_PW') +  os.getenv('ENDPOINT')

CLIENT = pymongo.MongoClient(ENDPOINT)
DB = CLIENT[os.getenv('DB_NAME')]

MYCOL = DB[os.getenv('COL_NAME')]

# Initiate tweet tokenizer
tknzr = TweetTokenizer()

# Get unigrams
UNIGRAMS = []

with open('unigrams.json') as json_file:
    UNIGRAMS = json.load(json_file)
    json_file.close()

CORPUS = sorted([d['token'] for d in UNIGRAMS if 'token' in d])

CORPUS_WORDS = [x for x in CORPUS if x[0].isalpha()]

# These variables would serve as 'cache' to reuse data and for state management
state_mgm_text = ""
state_mgm_tokens = []
state_mgm_positions = []
state_mgm_tt = 20

positions = []

state_mgm_bigrams = []

non_words = []

curr_tokens = []
curr_bigrams = []

user_message = ""

# Initiate pyenchant
ENCHANT = enchant.Dict("en_US")

# Declare classification class names
CLASS_NAMES = ['real word', 'non-word']

# Define variables for detecting phrases
text_file = open("all_phrases.txt", "r")
PHRASES = text_file.readlines()
text_file.close()
CLEANED_PHRASES = []

# Drop trailing spaces in phrases
for phrase in PHRASES:
    CLEANED_PHRASES.append(phrase.strip())

# Drop last words in phrases
def drop_last_word(text):
    return ' '.join(text.split(' ')[:-1])

PHRASE_LENGTHS = []
FINAL_PHRASES = [drop_last_word(line) for line in CLEANED_PHRASES]

# Get the length of phrases
for phrase in FINAL_PHRASES:
    PHRASE_LENGTHS.append(len(phrase.split(' ')))

MAX_PHRASE_LENGTH = max(PHRASE_LENGTHS)

# Get web page files from web folder
eel.init('web')

# Return all the unigrams to display on the left side of the UI
@eel.expose
def get_all_words():
    eel.return_all_words(sorted(CORPUS_WORDS))

# This is a helper function that randomly removes items from list based on seed given
# https://stackoverflow.com/questions/44883905/randomly-remove-x-elements-from-a-list
def delete_rand_items(items, n, seed):
    n = math.ceil(len(items) * (n/100))
    random.seed(seed)
    to_delete = set(random.sample(range(len(items)),n))
    return [x for i,x in enumerate(items) if not i in to_delete]

# This function checks for nonword errors
def get_similar_words(word, corpus=UNIGRAMS, dist1=2, dist2=2): 
    similar_words = []
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
            if spell_dist <= dist1:
                similar_words.append({"word": entry['token'], "stats": spell_dist, "type": "nonword-sp"})
            # When ipa translation fails, the original word is used.
            # If the ipa is translated, the orignal word will not be in the result
            if word not in ipa:
                # In the current corpus entry, if ipa translation is available
                if 'ipa' in entry.keys(): 
                    # Get ipa symbols edit distance of word vs current corpus entry ipa
                    sound_dist = edit_distance(entry['ipa'], ipa)
                    # If smaller than target distance, append the entry
                    if sound_dist < dist2:
                        similar_words.append({"word": entry['token'], "stats": sound_dist, "type": "nonword-sd"})

    # A similar word may appear twice, if both its spelling and sound edit distance are close
    # Keep only unique words in the list
    similar_words = list({v['word']:v for v in similar_words}.values())
    # Sort the suggestions by edit distance in an ascending order
    similar_words = sorted(similar_words, key = lambda i: i['stats'])
    return similar_words

# Helper function gets the differences between 2 lists of tuples
def compare_list_tuple(ls1, ls2):
    return set(ls2) - set(ls1)

def get_word_errors(bigram, unigrams=UNIGRAMS):
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

# This function creates error message to show in user interface
def create_error_message(line, kind, num, cause, suggestion):
    return "Line " + str(line) + ": Found "+ kind +" error " + str(num) + ": " + cause + "<br />Suggestions: " + ", ".join([item['word'] for item in suggestion])

# This function gets line number by counting the number of linebreaks at current position
def get_line_number(text, number):
    text = text[:number]
    return text.count("\n") + 1

# This function preprocesses a text, so that the logic is same as that in Colab
def preprocess_input(text):
    text = re.sub("([0-9]+ [0])+", "4", text)
    text = text.replace('(', '( ')
    text = text.replace(')', ' )')
    text = text.replace(u'\ufeff', ' ')
    return tknzr.tokenize(text)

# Run pyenchant and compare result with actual results
def run_py_enchant(text, tokens, actual):
    pred = []
    errors = []
    if len(actual) < 1:
        text = re.sub("([0-9]+ [0])+", "4", text)
        text = text.replace('(', '( ')
        text = text.replace(')', ' )')
        text = text.replace(u'\ufeff', ' ')
    for t in tokens:
        if t[0].isalpha():
            if ENCHANT.check(t) == False:
                suggestions = ENCHANT.suggest(t)
                # response = []
                # for s in suggestions:
                #     response.append("'" + s + "'")
                # response = "[" + (', '.join(response)) + "]"
                errors.append({"token": t, "suggestions": suggestions, "id": str(uuid.uuid4())})
                pred.append(1)
            else:
                pred.append(0)
        else:
            pred.append(0)
    
    # Generate html text of pyenchant results to display in UI by adding line breaks 
    # text = text.replace("\n", "<br />")
    # Generate classification report
    report = classification_report(actual, pred, target_names=CLASS_NAMES)
    # Return to UI
    eel.return_enchant(text, errors)
    eel.return_report(report)

# This function detects phrases in a text
def find_phrases(text):
    candidates = []
    # Start from 2 because start from second word
    loop = 2
    while loop < MAX_PHRASE_LENGTH:
        matches = []
        # Get the first nth words of all the phrases
        checks = [" ".join(line.split()[:loop]) for line in CLEANED_PHRASES]
        checks = list(set(checks))
        for c in checks:
            # If the first nth word of a phrase is found in a text
            if c in text:
                # Find the phrases that start with the first nth words
                phrases = list(filter(lambda x: x.startswith(c), CLEANED_PHRASES))
                # But there is no point if the whole phrase is already found in the text
                phrases = [x for x in phrases if x != c]
                # Svae the suggestions
                matches.append({"phrase": c, "suggestions": phrases})
        candidates = candidates + matches
        # Quit loop if no more matches
        if len(matches) < 1:
            break
        else:
            loop += 1
    candidates = [i for n, i in enumerate(candidates) if i not in candidates[n + 1:]]

    # Generate the report in html format
    report = ""
    for i, c in enumerate(candidates):
        report = report + "Phrase " + str(i + 1) + " "+ c["phrase"] + ": " + ", ".join(c["suggestions"]) + "<br />"

    return report

# This function gets a text and find errors
@eel.expose
def get_user_text(text, isTest, tokens = [], seed =999, drop=0, actual=[]):
    print(isTest)
    # Global variable, because the cache variables will be updated
    global state_mgm_text, state_mgm_tokens, state_mgm_bigrams, state_mgm_positions, user_message, state_mgm_tt
    # Might need to delete from unigrams list if it is for testing purposes to prevent overfit
    corpus = delete_rand_items(UNIGRAMS, drop, seed)
    user_message = ""
    # Posistions contain a list of all tokens in user text and their starting position
    positions = []
    # Create a variable to keep track of search index
    searchPosition = 0
    # If the current text has changed
    return_load_message("Receiving user input text")
    # Tokenize user input text with nltk
    if len(tokens) > 0:
        curr_tokens = tokens
    else:
        curr_tokens = preprocess_input(text)
    for c in curr_tokens:
        # Get the token and its position
        entry = {"token": c, "start": text.find(c, searchPosition)}
        entry["line"] = get_line_number(text, int(entry["start"]))
        positions.append(entry)
        # Update search index, so that next iteration searches after this word
        searchPosition += len(c)
    #  For efficiency purpose, get suggestions from previous checks
    return_load_message("Loading suggestions from cache")
    if state_mgm_tt != drop:
        state_mgm_positions = []
        state_mgm_tokens = []
        state_mgm_bigrams = []
    state_mgm_tt = drop
    for i, p in enumerate(positions):
        for o, s in enumerate(state_mgm_positions):
            # Found a nonword with suggestions that still exists from earlier check
            if p["token"] == s["token"] and "suggestions" in list(s.keys()):
                if s["type"] == "nonword":
                    p["suggestions"] = s["suggestions"]
                    p["type"] = s["type"]
                    p["id"] = s["id"]
                    return_position(p)
            # Finding if a pair of bigram with suggestion still exist from earlier check
            try:
                if state_mgm_positions[o]["token"] == positions[i]["token"] and state_mgm_positions[o+1]["token"] == positions[i+1]["token"] and "suggestions" in list(state_mgm_positions[o+1].keys()):
                    if state_mgm_positions[o+1]["type"] == "realword":
                        positions[i+1]["suggestions"] = state_mgm_positions[o+1]["suggestions"]
                        positions[i+1]["type"] = state_mgm_positions[o+1]["type"]
                        positions[i+1]["id"] = state_mgm_positions[o+1]["id"]
                        positions[i+1]["before"] = state_mgm_positions[o+1]["before"]
                        return_position(positions[i+1])
            except Exception as e:
                pass
    # Only get the new tokens typed
    new_tokens = [i for i in curr_tokens if i not in state_mgm_tokens]
    # Remove duplicates
    new_tokens = list(set(new_tokens))
    # Convert list into list of dictionaries
    new_tokens = [{"token": i} for i in new_tokens]
    # Using the current tokens, generate bigrams
    curr_bigrams = list(ngrams(curr_tokens,2))
    new_bigrams = list(set(curr_bigrams) - set(state_mgm_bigrams))
    # NLTK n-gram returns a list of tuple and keep only new bigrams added by user
    new_bigrams = compare_list_tuple(state_mgm_bigrams, curr_bigrams)
    bigram_log_number = 0
    # For efficiency, only check the new bigrams that were not in the cache
    for b in curr_bigrams:
        if b in new_bigrams:
            # For every new bigram added
            real_word_suggestions = get_word_errors(b, corpus)
            # If there is suggestion
            if real_word_suggestions:
                # Generate a list of positions for the UI, so that it knows what to highlight and how
                for i, p in enumerate(positions):
                    try:
                        if positions[i]["token"] == b[0] and positions[i+1]["token"] == b[1]:
                            positions[i+1]["suggestions"] = real_word_suggestions
                            positions[i+1]["before"] = positions[i]["token"]
                            positions[i+1]["type"] = "realword"
                            positions[i+1]["id"] =  str(uuid.uuid4())
                            return_position(positions[i+1])
                            bigram_log_number += 1
                            msg = create_error_message(positions[i]["line"], "real word", bigram_log_number, b[1], real_word_suggestions)
                            return_load_message(msg)
                    except Exception as e:
                        pass
    non_word_log_number = 0
    for n in new_tokens:
        # Check non word if token is a word, since a token can be punctuation
        if n["token"].isalpha():
            non_word_suggestions = get_similar_words(n["token"], corpus)
            # If there is suggestion
            # Generate a list of positions for the UI, so that it knows what to highlight and how
            if len(non_word_suggestions) > 0:
                n["suggestions"] = non_word_suggestions
                # Add the suggestion to the positions list
                for p in positions:
                    if p["token"] == n["token"]:
                        p["suggestions"] = n["suggestions"]
                        p["type"] = "nonword"
                        p["id"] =  str(uuid.uuid4())
                        return_position(p)
                        non_word_log_number += 1
                        msg = create_error_message(p["line"], "non-word", non_word_log_number, p["token"], p["suggestions"])
                        return_load_message(msg)

    # Update the cache variables, which will then be used on the next text submission
    state_mgm_text = text
    state_mgm_tokens = curr_tokens
    state_mgm_bigrams = curr_bigrams
    state_mgm_positions = positions
    # print(positions)
    eel.return_suggestions(positions)

    # Find phrases and return to UI
    phrases = find_phrases(text)
    eel.return_phrases(phrases)
    nonwords = []
    realwords = []
    for p in positions:
        if p["token"][0].isalpha() and "type" in list(p.keys()):
            if p["type"] == "nonword":
                # suggestions = json.dumps(p["suggestions"], separators=(',', ':'))
                # suggestions = suggestions.replace('"', "'")
                nonwords.append({"token": p["token"], "suggestions": p["suggestions"], "id": p["id"]})
            else:
                # suggestions = json.dumps(p["suggestions"], separators=(',', ':'))
                # suggestions = suggestions.replace('"', "'")
                realwords.append({"token": p["before"]+ " " + p["token"], "suggestions": p["suggestions"], "id": p["id"]})

    eel.return_pred(text, nonwords, realwords)
    # If actual results optional argument were given, then its a test
    if len(actual) > 0:
        pred = []
        nonwords = []
        realwords = []
        for p in positions:
            if p["token"][0].isalpha() and "type" in list(p.keys()):
                if p["type"] == "nonword":
                    pred.append(1)
                else:
                    pred.append(0)
            else:
                pred.append(0)
        # return pred
        # text = text.replace("\n", "<br />")
        # Generate classification report
        report = classification_report(actual, pred, target_names=CLASS_NAMES)
        # Return to UI
        
        eel.return_pred_report(report)

                
# This function returns all positions to the UI
def return_suggestions(positions):
    eel.return_suggestions(positions)

# This function returns one position to the UI
def return_position(position):
    eel.return_suggestion(position)

# This function shows a message to the user in the UI
def return_load_message(message):
    global user_message
    user_message += message + "<br /><br />"
    eel.return_load_message(str(user_message))

# This function shuffles words in a sentence, used for testing purposes
# https://stackoverflow.com/questions/22161075/how-to-scramble-the-words-in-a-sentence-python
def shuffle(iter, seed, by):
    iter = iter.split(by)
    seed = int(seed)
    random.seed(seed)
    foo = list(iter)
    random.shuffle(foo)
    return by.join(foo)

# This function ensures that user has given number in the input in UI
def validate_input_num(input):
    output = re.sub("[^0-9]", "", input)
    return int(output)

# This function generates tests
@eel.expose
def generate_sample(length=50, seed=999, nw=10, tt=20):
    # in case user added decimal places in input boxes
    seed = validate_input_num(seed)
    length = validate_input_num(length)
    nw = validate_input_num(nw)
    tt = validate_input_num(tt)

    if nw < 10:
        nw = 10
    elif nw > 50:
        nw = 50

    if tt < 20:
        tt = 20
    elif tt > 50:
        tt = 50

    random.seed(seed)
    texts = []

    # Get samples from preprocessed data
    with open('preprocessed.json') as f:
        texts = json.load(f)
        f.close()

    result = ""

    # Randomly select lines from the preprocessed data and shuffle each line based on seed
    while len(result.split()) < length:
        entry = shuffle(random.Random(seed).choice(texts), seed, " ")
        seed += 1
        entry = " ".join(entry.split())
        result = result + "\n\n" + entry

    # Drop trailing whitepsaces
    result = result.strip()

    result = re.sub("([0-9]+ [0])+", "4", result)
    result = result.replace(u'\ufeff', ' ')
    result = result.replace('(', '( ')
    result = result.replace(')', ' )')

    # Randomly generate non-word errors based on seed given
    # https://stackoverflow.com/questions/51079986/generate-misspelled-words-typos
    actual = []
    all_tokens = preprocess_input(result)
    for i, t in enumerate(all_tokens):
        outcome = random.random()
        # If the token is not too short and the probability is lower than what is given by user
        if outcome <= nw/100 and len(t) > 1 and t[0].isalpha():
            ix = random.choice(range(len(t)))
            # Modify the word with random characters
            new_t = ''.join([t[w] if w != ix else random.choice(string.ascii_letters) for w in range(len(t))])
            result = result.replace(t, new_t)
            actual.append(1)
            all_tokens[i] = new_t
        else:
            actual.append(0)

    # all_tokens = preprocess_input(result)
    eel.return_sample(result)

    get_user_text(result, 1, all_tokens, seed, tt, actual)
    run_py_enchant(result, all_tokens, actual)


# Index.html is where the main UI components are stored
eel.start('index.html')