import os
from flask import Flask, request, jsonify, render_template
from urllib.parse import quote
from genie import get_chatgpt_response

app = Flask(__name__)

current_model = "gpt-4"

def escape_html(unsafe):
    return (unsafe.replace("&", "&amp;")
                  .replace("<", "&lt;")
                  .replace(">", "&gt;")
                  .replace('"', "&quot;")
                  .replace("'", "&#039;"))

def sanitize_user_input(input):
    return (input.replace("\r\n", "\\n")
                  .replace("\n", "\\n")
                  .replace("\r", "\\n")
                  .replace("\\", "\\\\")
                  .replace(",", "\\,")
                  .replace(":", "\\:")
                  .replace("{", "\\{")
                  .replace("}", "\\}")
                  .replace("[", "\\[")
                  .replace("]", "\\]"))

def sanitize_input(input):
    return quote(input)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/chatgpt", methods=["POST"])
def chatgpt():
    messages = request.json.get("messages", [])
    rules = get_rules()
    messages.insert(0, {'role': 'system', 'content': rules})
    if not messages:
        return jsonify({"error": "Missing messages"}), 400

    response_text = get_chatgpt_response(current_model, messages)

    return jsonify({"output": response_text})

@app.route("/static/main.js")
def serve_js():
    return app.send_static_file("main.js")

@app.route("/api/set_model", methods=["POST"])
def set_model():
    global current_model
    new_model = request.json.get("model", None)
    if new_model:
        current_model = new_model
        return jsonify({"status": "Model changed"}), 200
    return jsonify({"error": "No model specified"}), 400

@app.route("/api/get_rules", methods=["GET"])
def get_rules():
    with open("rules.txt", "r") as file:
        rules = file.read()
    escaped_rules = escape_html(rules)
    sanitized_rules = sanitize_user_input(escaped_rules)
    final_sanitized_rules = sanitize_input(sanitized_rules)
    return final_sanitized_rules

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6565)
