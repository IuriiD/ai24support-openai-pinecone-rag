# This script is used to populate the Pinecone vector DB with contexts.
# It reads questions and answers from a Google spreadsheet, generates
# vectors for question+answer and stores the vectors + text in Pinecone

import os
import tiktoken
import openai
import pinecone
import uuid
import json
import time
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from dotenv import load_dotenv

load_dotenv()

# You need to generate a Google Cloud service account key
# in Google Cloud console and provide the path to the file
credentials_file = 'ai24support-gdocs-service-account-key.json'
spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1w7kynyCnPPGsU1Qidjw_os1u6C8g-FG-Ov-vjG0GAvU/edit'

tokenizer = tiktoken.get_encoding("gpt2")

openai.organization = os.getenv('OPENAI_ORG')
openai.api_key = os.getenv('OPENAI_API_KEY')

PINECONE_INDEX_NAME = os.getenv('PINECONE_INDEX_NAME')
MODEL = "text-embedding-ada-002"
INDEX_DIMENSIONS = 1536  # specific for "text-embedding-ada-002" model

pinecone.init(
    api_key = os.getenv('PINECONE_API_KEY'),
    environment = os.getenv('PINECONE_ENVIRONMENT')
)

# List Pinecone indexes and check if API works
print('Pinecone Indexes: ', pinecone.list_indexes())

# Check requests to OpenAI
print('OpenAI Engines: ', openai.Engine.list())

# # check if PINECONE_INDEX_NAME index already exists (only create index if not)
if PINECONE_INDEX_NAME not in pinecone.list_indexes():
    pinecone.create_index(PINECONE_INDEX_NAME, dimension=INDEX_DIMENSIONS)

# connect to index
index = pinecone.Index(PINECONE_INDEX_NAME)

# CHANGE THIS INTERVAL TO DEFINE WHICH ROWS TO PROCESS
start_row_number = 1
last_row_to_process = 1

_starting_row_index = start_row_number - 1
_last_row_to_test_index = last_row_to_process

# Authenticate using the JSON credentials
scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
credentials = ServiceAccountCredentials.from_json_keyfile_name(credentials_file, scope)
client = gspread.authorize(credentials)

# Open the spreadsheet by URL
spreadsheet = client.open_by_url(spreadsheet_url)

# Get the first worksheet (you can modify this if needed)
worksheet = spreadsheet.get_worksheet(0)

# Answers are assumed to be in the 3rd column,
# Questions - in the 4th column, as a list of strings (e.g. ["Q1", "Q2", "Q3"])
values_in_column_C = worksheet.col_values(3)  # faq page
values_in_column_D = worksheet.col_values(4)  # question variants

column_C_sliced = values_in_column_C[_starting_row_index:_last_row_to_test_index]
column_D_sliced = values_in_column_D[_starting_row_index:_last_row_to_test_index]

stored_vector_ids = []

for idx, value in enumerate(column_C_sliced):
    context = value
    answer = column_C_sliced[idx]
    questions = json.loads(column_D_sliced[idx])

    print(f'\n\nANSWER:\n{answer}')
    print(f'\n\nQUESTIONS:\n{questions}')

    for q_idx, question in enumerate(questions):
        print(f'\n\nPROCESSING QUESTION #{q_idx}:\n{question}')
        question_and_answer = f'{question} {answer}'

        id = str(uuid.uuid4())
        print(id)
        tokens = tokenizer.encode(question_and_answer)
        print('tokens=', len(tokens))

        # create embeddings
        res = openai.Embedding.create(
            input=[question_and_answer],
            engine=MODEL
            )
        embeds = [record['embedding'] for record in res['data']]
        print('Generated embeddings for ', id)

        meta = {
            "data_type": "knowledge_base",
            "text": question_and_answer,
            "customer": "demo"
        }

        to_upsert = (
            id,  # vector ID
            embeds,  # vector values
            meta)  # meta (source text)

        # upsert vector to Pinecone
        index.upsert(vectors=[to_upsert])
        print(f'Vector #{id} was upserted OK')
        stored_vector_ids.append(id)
        time.sleep(0.1)

print("DONE")
for item in stored_vector_ids:
    print(item)
