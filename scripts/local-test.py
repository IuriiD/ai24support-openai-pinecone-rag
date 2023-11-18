# This script is used for testing the app in order to finetune the prompts and configs.
# It reads questions from a google spreadcheet XXX and then triggers a locally run app
# to get the responses, and saves the responses to the same google spreadsheet
# (where they are then manually checked for correctness)

import gspread
import requests
import uuid
import time
import tiktoken
from oauth2client.service_account import ServiceAccountCredentials

tokenizer = tiktoken.get_encoding("gpt2")

# Replace with your own credentials JSON file and spreadsheet URL
credentials_file = 'ai24support-gdocs-service-account-key.json'

spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1hRn9-Jx0Q8GqxQeL-ehSR7tr4498DhuYf9XhQzAXrac/edit'
starting_row_index = 1
last_row_to_test_index = 10

# Authenticate using the JSON credentials
scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
credentials = ServiceAccountCredentials.from_json_keyfile_name(credentials_file, scope)
client = gspread.authorize(credentials)

url = 'http://localhost:3000/api/v1/complete'
headers = {
    'x-customer-id': '74a2aeb0-6963-4eb2-b458-e62877fcc152',  # example customer ID
    'x-api-key': 'secret',
    'Content-Type': 'application/json'
}

# Open the spreadsheet by URL
spreadsheet = client.open_by_url(spreadsheet_url)

# Get the first worksheet (you can modify this if needed)
worksheet = spreadsheet.get_worksheet(0)

# Read values from column B and save to column C
values_in_column_B = worksheet.col_values(2)

for index, value in enumerate(
    values_in_column_B[starting_row_index: last_row_to_test_index + 1]
):
    actual_index = index + starting_row_index
    print('index=', actual_index)
    print(f'\nTesting row #{actual_index}')
    print(f'QUESTION: {value}')

    data = {
        "userId": str(uuid.uuid4()),
        "query": value
    }

    response = requests.post(url, headers=headers, json=data)
    tokens = tokenizer.encode(response.text)
    print(f'ANSWER: {response.text} - {len(tokens)} tokens\n\n')
    worksheet.update_cell(actual_index + 1, 4, response.text.replace('"', '') + f' [{str(len(tokens))}]')
    time.sleep(1)

print("DONE")
