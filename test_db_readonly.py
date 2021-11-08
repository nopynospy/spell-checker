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
