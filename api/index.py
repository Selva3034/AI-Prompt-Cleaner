from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
import os


# ============================================================
# ENVIRONMENT VARIABLES
# ============================================================

# Local development:
# Load backend/.env if it exists.
# On Vercel, environment variables are provided automatically.
load_dotenv(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "backend",
        ".env"
    )
)


# ============================================================
# FLASK APPLICATION
# ============================================================

app = Flask(__name__)

# CORS is useful during local development.
# Production frontend and backend are same-origin on Vercel.
CORS(app)


# ============================================================
# GROQ API CONFIGURATION
# ============================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "Promptly AI backend is running"
    })


@app.route("/api", methods=["GET"])
def api_health():
    return jsonify({
        "success": True,
        "message": "Promptly AI API is running"
    })


# ============================================================
# CLEAN PROMPT API
# ============================================================

@app.route("/api/clean-prompt", methods=["POST"])
@app.route("/clean-prompt", methods=["POST"])
def clean_prompt():

    try:

        # ----------------------------------------------------
        # Get JSON request
        # ----------------------------------------------------

        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "error": "Invalid request data."
            }), 400


        # ----------------------------------------------------
        # Get user input
        # ----------------------------------------------------

        prompt = data.get("prompt", "").strip()
        prompt_type = data.get("type", "general")


        # ----------------------------------------------------
        # Validate prompt
        # ----------------------------------------------------

        if not prompt:
            return jsonify({
                "success": False,
                "error": "Please enter a prompt."
            }), 400


        # ----------------------------------------------------
        # Check API key
        # ----------------------------------------------------

        if not GROQ_API_KEY:
            return jsonify({
                "success": False,
                "error": "GROQ_API_KEY is not configured."
            }), 500


        # ----------------------------------------------------
        # Prompt optimization instructions
        # ----------------------------------------------------

        system_instruction = f"""
You are Promptly AI, an expert prompt optimization assistant.

Your job is to transform a user's rough idea into a clear,
specific, structured and effective AI prompt.

Prompt category:
{prompt_type}

Improve the user's prompt while preserving the user's
original intention.

The improved prompt should:

- Clearly define the task
- Add useful context when appropriate
- Specify the expected output
- Remove unnecessary wording
- Be easy for another AI model to understand
- Make the prompt specific and actionable
- Preserve the original intention
- Not invent requirements that were not implied by the user

Return ONLY the improved prompt.

Do not explain what you changed.
Do not add headings such as "Improved Prompt".
Do not add unnecessary commentary.
"""


        # ----------------------------------------------------
        # Send request to Groq
        # ----------------------------------------------------

        response = client.responses.create(
            model="openai/gpt-oss-20b",
            instructions=system_instruction,
            input=prompt
        )


        # ----------------------------------------------------
        # Get AI result
        # ----------------------------------------------------

        improved_prompt = response.output_text.strip()


        # ----------------------------------------------------
        # Return result
        # ----------------------------------------------------

        return jsonify({
            "success": True,
            "improved_prompt": improved_prompt
        })


    except Exception as error:

        # Print the real error in Vercel/local logs
        print("Error:", error)

        return jsonify({
            "success": False,
            "error": "Something went wrong while processing your prompt."
        }), 500


# ============================================================
# LOCAL DEVELOPMENT
# ============================================================

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )