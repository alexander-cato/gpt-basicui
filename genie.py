import openai
import random
import string
import os
import traceback
import json


def get_chatgpt_response(model_name, messages):
    try:
        openai.api_key = os.environ.get("OPENAI_API_KEY")

        prompt = messages[-1]["content"].rstrip(string.punctuation)

        response = openai.ChatCompletion.create(
            model=model_name, messages=messages, temperature=0.7
        )

        print("Raw API response:", json.dumps(response, indent=2))

        if response["choices"]:
            reply = response["choices"][0]["message"]["content"]
            return reply
        else:
            return "The model failed to deliver the response in a valid format. See logs for debugging."

    except Exception as e:
        print("Error in ask_question:", e)
        print(traceback.format_exc())

        return "An error occurred while processing the request. See logs for debugging."
