import nltk
from nltk.util import ngrams
from nltk import pos_tag, word_tokenize, RegexpParser, Tree
from nltk.tokenize import PunktSentenceTokenizer
# Function to generate n-grams from sentences.
def extract_ngrams(data, num):
    n_grams = ngrams(nltk.word_tokenize(data), num)
    return [ ' '.join(grams) for grams in n_grams]
 
data = "You can draw syntactic trees."

# print("1-gram: ", extract_ngrams(data, 1))
# print("2-gram: ", extract_ngrams(data, 2))
# print("3-gram: ", extract_ngrams(data, 3))
# print("4-gram: ", extract_ngrams(data, 4))

tagged = pos_tag(word_tokenize(data))

	
grammar = r"""
  NP: {<DT|JJ|NN.*>+}          # Chunk sequences of DT, JJ, NN
  PP: {<IN><NP>}               # Chunk prepositions followed by NP
  VP: {<VB.*><NP|PP|CLAUSE>+$} # Chunk verbs and their arguments
  CLAUSE: {<NP><VP>}           # Chunk NP, VP
  """

#Extract all parts of speech from any text
# chunker = RegexpParser("""
#                        NP: {<DT>?<JJ>*<NN>}    #To extract Noun Phrases
#                        P: {<IN>}               #To extract Prepositions
#                        V: {<V.*>}              #To extract Verbs
#                        PP: {<p> <NP>}          #To extract Prepositional Phrases
#                        VP: {<V> <NP|PP>*}      #To extract Verb Phrases
#                        """)

chunker = RegexpParser(grammar)

# Print all parts of speech in above sentence
output = chunker.parse(tagged)
print(output)

output.draw()

tokenizer = PunktSentenceTokenizer()

def process_content(corpus):

    tokenized = tokenizer.tokenize(corpus)

    try:
        for sent in tokenized:
            words = nltk.word_tokenize(sent)
            tagged = nltk.pos_tag(words)
            print(tagged)
    except Exception as e:
        print(str(e))

process_content(data)