from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Allow frontend requests
CORS(app)

# Get Groq API key from .env
groq_api_key = os.getenv("GROQ_API_KEY")

# Create Groq client
client = OpenAI(
    api_key=groq_api_key,
    base_url="https://api.groq.com/openai/v1"
)


# ---------------------------------------
# Home Route
# ---------------------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Promptly AI backend is running"
    })


# ---------------------------------------
# Clean Prompt API
# ---------------------------------------
@app.route("/api/clean-prompt", methods=["POST"])
def clean_prompt():

    try:
        # Get JSON data from frontend
        data = request.get_json()

        # Get user's prompt
        prompt = data.get("prompt", "").strip()

        # Get selected prompt type
        prompt_type = data.get("type", "general")

        # Check empty prompt
        if not prompt:
            return jsonify({
                "success": False,
                "error": "Please enter a prompt."
            }), 400

        # Check API key
        if not groq_api_key:
            return jsonify({
                "success": False,
                "error": "GROQ_API_KEY is not configured."
            }), 500

        # Instructions for AI
        system_instruction = f"""
You are Promptly AI, an expert prompt optimization assistant.

Your job is to transform a user's rough idea into a clear,
specific, structured and effective AI prompt.

Prompt category:
{prompt_type}

Improve the user's prompt while preserving their original intention.

Your improved prompt should:

- Clearly define the task
- Add useful context when appropriate
- Specify the expected output
- Remove unnecessary wording
- Be easy for another AI model to understand
- Make the prompt specific and actionable
- Not invent requirements that were not implied by the user

Return ONLY the improved prompt.

Do not explain what you changed.
Do not add headings such as "Improved Prompt".
Do not add unnecessary commentary.
"""

        # Send request to Groq
        response = client.responses.create(
            model="openai/gpt-oss-20b",
            instructions=system_instruction,
            input=prompt
        )

        # Get AI generated prompt
        improved_prompt = response.output_text.strip()

        # Send result back to frontend
        return jsonify({
            "success": True,
            "improved_prompt": improved_prompt
        })

    except Exception as error:

        # Print actual error in terminal
        print("Error:", error)

        return jsonify({
            "success": False,
            "error": "Something went wrong while processing your prompt."
        }), 500


# ---------------------------------------
# Start Flask Server
# ---------------------------------------
if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )