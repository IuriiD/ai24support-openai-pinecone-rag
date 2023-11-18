# This is a helper script used to prepare testing/dummy data. It reads the original FAQ
# snippets stored in the google spreadsheet XXX, and rephrases them, removing
# any identifiers (addresses, phone numbers etc)

import os
import tiktoken
import openai
import pinecone
import uuid
import json
import time
import gspread
from langchain.chat_models import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

from oauth2client.service_account import ServiceAccountCredentials
from langchain.schema import (
    SystemMessage,
    HumanMessage
)

chat = ChatOpenAI(
    temperature=0.9,
    model='gpt-3.5-turbo'
)

credentials_file = 'ai24support-gdocs-service-account-key.json'
spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1w7kynyCnPPGsU1Qidjw_os1u6C8g-FG-Ov-vjG0GAvU/edit'

tokenizer = tiktoken.get_encoding("gpt2")

# Indicate the rows to be processed
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

values_in_column_B = worksheet.col_values(2)

column_B_sliced = values_in_column_B[_starting_row_index:_last_row_to_test_index]

system_message_prompt = """ Rephrase the following FAQ article keeping the main information and formatting, but rewording the contents.
Replace "XXX" with "ExampleShop".
Replace any phone numbers, addresses and other personally identifiable information with similar but randomly generated values.
"""

for idx, value in enumerate(column_B_sliced):
    context = value
    response = column_B_sliced[idx]

    id = str(uuid.uuid4())
    tokens = tokenizer.encode(response)
    print('tokens=', len(tokens))

    print('\n\n>>>> Original text:')
    print(response)

    system_message = SystemMessage(content=system_message_prompt)
    human_message = HumanMessage(content=response)
    ai_response = chat([system_message, human_message])

    print('\n\n>>>> Rephrased:')
    print(ai_response.content)

    worksheet.update_cell(_starting_row_index + idx + 1, 3, ai_response.content)

    time.sleep(0.1)

print("DONE")
