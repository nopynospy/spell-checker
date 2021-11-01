import os.path
from dotenv import load_dotenv
import pymongo

load_dotenv()
endpoint = os.getenv('HEADER') +  os.getenv('GUEST_ID') + ":" +os.getenv('GUEST_PW') +  os.getenv('ENDPOINT')

client = pymongo.MongoClient(endpoint)
db = client["steamboat-squad"]

mycol = db["noun"]

myquery = { "word": "cat" }

mydoc = mycol.find(myquery)

for x in mydoc:
  print(x)

# mylist = [
#   { "word": "for"},
#   { "word": "and"},
#   { "word": "nor"},
#   { "word": "but"},
#   { "word": "or"},
#   { "word": "yet"},
#   { "word": "so"},
# ]

# x = mycol.insert_many(mylist)