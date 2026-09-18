import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI


# =========================================
# ENVIRONMENT
# =========================================

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")


# =========================================
# FLASK APP
# =========================================

app = Flask(__name__)

CORS(app)


# =========================================
# GROQ CLIENT
# =========================================

client = None

if groq_api_key:
    client = OpenAI(
        api_key=groq_api_key,
        base_url="https://api.groq.com/openai/v1"
    )


# =========================================
# CONSTANTS
# =========================================

MAX_PROMPT_LENGTH = 2000

ALLOWED_TYPES = {
    "General",
    "Coding",
    "Writing",
    "Marketing",
    "Learning",
    "Creative"
}


SYSTEM_INSTRUCTION = """
You are Promptly AI, an expert prompt improvement assistant.

Your job is to transform a rough user idea into a clear,
specific, structured and effective AI prompt.

Follow these rules:

1. Preserve the user's original intention.
2. Do not invent requirements that the user did not request.
3. Remove unnecessary wording.
4. Add useful context when it is directly implied.
5. Make the desired output clear.
6. Use structured instructions when appropriate.
7. Make the prompt practical for an AI model to follow.
8. Do not explain what you changed.
9. Return ONLY the improved prompt.
"""


# =========================================
# HEALTH ROUTE
# =========================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "status": "success",
        "message": "Promptly AI API is running"
    })


# =========================================
# CLEAN PROMPT
# =========================================

@app.route("/api/clean-prompt", methods=["POST"])
def clean_prompt():

    # -------------------------------------
    # Validate JSON
    # -------------------------------------

    if not request.is_json:

        return jsonify({
            "success": False,
            "error": "Request must contain JSON data."
        }), 400


    data = request.get_json(
        silent=True
    )


    if not isinstance(data, dict):

        return jsonify({
            "success": False,
            "error": "Invalid request data."
        }), 400


    # -------------------------------------
    # Get values
    # -------------------------------------

    prompt = data.get("prompt", "")
    prompt_type = data.get(
        "type",
        "General"
    )


    # -------------------------------------
    # Validate prompt
    # -------------------------------------

    if not isinstance(prompt, str):

        return jsonify({
            "success": False,
            "error": "Prompt must be text."
        }), 400


    prompt = prompt.strip()


    if not prompt:

        return jsonify({
            "success": False,
            "error": "Please enter a prompt."
        }), 400


    if len(prompt) > MAX_PROMPT_LENGTH:

        return jsonify({
            "success": False,
            "error": (
                "Prompt cannot exceed "
                f"{MAX_PROMPT_LENGTH} characters."
            )
        }), 400


    # -------------------------------------
    # Validate prompt type
    # -------------------------------------

    if not isinstance(prompt_type, str):

        prompt_type = "General"


    if prompt_type not in ALLOWED_TYPES:

        prompt_type = "General"


    # -------------------------------------
    # API key check
    # -------------------------------------

    if not groq_api_key or client is None:

        return jsonify({
            "success": False,
            "error": (
                "AI service is not configured. "
                "Please add GROQ_API_KEY."
            )
        }), 500


    # -------------------------------------
    # Build user input
    # -------------------------------------

    user_input = f"""
Prompt Type: {prompt_type}

User's rough prompt:
{prompt}
"""


    # -------------------------------------
    # Call Groq
    # -------------------------------------

    try:

        response = client.responses.create(

            model="openai/gpt-oss-20b",

            instructions=SYSTEM_INSTRUCTION,

            input=user_input
        )


        improved_prompt = (
            response.output_text
            if response.output_text
            else ""
        )


        improved_prompt = improved_prompt.strip()


        if not improved_prompt:

            return jsonify({
                "success": False,
                "error": (
                    "The AI returned an empty result. "
                    "Please try again."
                )
            }), 502


        return jsonify({

            "success": True,

            "improved_prompt":
                improved_prompt

        }), 200


    except Exception as error:

        print(
            "Groq API error:",
            str(error)
        )


        return jsonify({

            "success": False,

            "error": (
                "Unable to improve the prompt "
                "right now. Please try again."
            )

        }), 500


# =========================================
# ERROR HANDLER
# =========================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "success": False,
        "error": "Endpoint not found."
    }), 404


# =========================================
# LOCAL DEVELOPMENT
# =========================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )