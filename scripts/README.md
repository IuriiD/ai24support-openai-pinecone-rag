This folder contains Python scripts used for preparation, parsing and saving embeddings to Pinecone.
Please see comments in the files for more information.

### Scripts description:
- `rephrase-faq.py`: This is a helper script used to prepare testing/dummy data. It reads the original FAQ snippets stored in the google spreadsheet XXX, and rephrases them, removing any identifiers (addresses, phone numbers etc)
- `add-faq-embeds-to-pinecone.py`: This script is used to populate the Pinecone vector DB with contexts. It reads questions and answers from a Google spreadsheet, generates vectors for question+answer and stores the vectors + text in Pinecone
- `local-test.py`: This script is used for testing the app in order to finetune the prompts and configs. It reads questions from a google spreadcheet XXX and then triggers a locally run app to get the responses, and saves the responses to the same google spreadsheet (where they are then manually checked for correctness)

### Prerequisites
- Create Python virtual environment and install the dependencies:
```bash
python3 -m venv env
source env/bin/activate
pip3 install -r requirements.txt
```
- Scripts `add-faq-embeds-to-pinecone.py` and `rephrase-faq.py` need OpenAI and Pinecone credentials: create `.env` file using `.env.example` as an example, fill in the needed values.
- All scripts need a json key file to access Google spreadsheet with questions and save answers there: create Google Cloud project, service account and save the key for it in json format, copy its content to `ai24support-gdocs-service-account-key.json`. Add the user with `client_email` from the key file as "Editor" to your Google spreadsheet.