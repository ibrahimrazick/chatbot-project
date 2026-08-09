import os
from dotenv import load_dotenv, find_dotenv
from openai import OpenAI

load_dotenv(find_dotenv())

nvidia_key = os.getenv("NVIDIA_API_KEY")

if not nvidia_key:
    print("⚠️ WARNING: NVIDIA_API_KEY was not found in your .env file.")

# Updated base URL for Nemotron 3 Ultra
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=nvidia_key or "dummy_key"
)

MODEL_ID = "nvidia/nemotron-3-ultra-550b-a55b"

def ask_grok(user_message: str) -> str:
    if not nvidia_key:
        return "⚠️ NVIDIA_API_KEY is missing in your .env file."

    try:
        completion = client.chat.completions.create(
            model=MODEL_ID,
            messages=[{"role": "user", "content": user_message}],
            temperature=1,
            top_p=0.95,
            max_tokens=16384,
            extra_body={
                "chat_template_kwargs": {"enable_thinking": True},
                "reasoning_budget": 16384
            },
            stream=False
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"⚠️ NVIDIA API Error: {str(e)}"