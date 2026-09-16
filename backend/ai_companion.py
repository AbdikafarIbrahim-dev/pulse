from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def ask_ai_about_records(question: str, records: list) -> str:
    if not records:
        context = "The patient has no medical records on file yet."
    else:
        context = "Here are the patient's medical records:\n\n"
        for r in records:
            context += f"- {r.title}: {r.description or 'No description'} (dated {r.created_at})\n"

    prompt = f"""You are a helpful medical records assistant for a patient using a health app called Pulse.
You can only answer questions based on the patient's own records provided below.
Do not give medical advice, diagnoses, or treatment recommendations — only help the patient understand and recall their own record history.
If the answer isn't in their records, say so clearly.

{context}

Patient's question: {question}

Answer:"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content