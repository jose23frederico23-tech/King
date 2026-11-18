import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from groq import APIError, Groq


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024

INSTRUCAO_KING = (
    "O teu nome é King. És um amigo próximo e simpático que ajuda a aprender, "
    "crescer e, se for necessário, contrariar as ideias do utilizador. "
    "Responde a perguntas para aumentar o conhecimento e dá conselhos úteis "
    "quando fizer sentido. Mantém um tom natural, leve, respeitoso e atual. "
    "Usa o histórico da conversa: constrói cada resposta com base nas perguntas "
    "anteriores. Não fales como um professor distante nem como uma pessoa velha "
    "a dar sermões. Se a pergunta não tiver relação com aprender, conhecer algo "
    "ou receber conselhos, não a respondas: diz numa mensagem curta que só podes "
    "falar sobre esses temas e orienta a conversa de volta a eles."
)

MAX_HISTORY_MESSAGES = 21
MAX_HISTORY_CHARACTERS = 48_000


@app.get("/")
def inicio():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/SQL/king.js")
def javascript():
    return send_from_directory(BASE_DIR / "SQL", "king.js")


@app.get("/disgner/king.css")
def estilos():
    return send_from_directory(BASE_DIR / "disgner", "king.css")


@app.post("/api/chat")
def executar():
    if not request.is_json:
        return jsonify({"error": "O pedido deve ser enviado em formato JSON."}), 415

    dados = request.get_json(silent=True)
    if not isinstance(dados, dict):
        return jsonify({"error": "O pedido JSON é inválido."}), 400

    mensagens = dados.get("messages")
    if not isinstance(mensagens, list) or not mensagens:
        return jsonify({"error": "Escreva uma pergunta antes de enviar."}), 400
    if len(mensagens) > MAX_HISTORY_MESSAGES:
        return jsonify({"error": "O histórico da conversa é demasiado longo."}), 400

    total_caracteres = 0
    for mensagem in mensagens:
        if not isinstance(mensagem, dict):
            return jsonify({"error": "O histórico da conversa é inválido."}), 400

        role = mensagem.get("role")
        texto = mensagem.get("content", mensagem.get("text"))
        if role not in ("user", "assistant", "model") or not isinstance(texto, str) or not texto.strip():
            return jsonify({"error": "O histórico da conversa é inválido."}), 400
        if role == "user" and len(texto) > 4000:
            return jsonify({"error": "A pergunta deve ter até 4000 caracteres."}), 400

        total_caracteres += len(texto)
        if total_caracteres > MAX_HISTORY_CHARACTERS:
            return jsonify({"error": "O histórico da conversa é demasiado longo."}), 400

    if mensagens[-1].get("role") != "user":
        return jsonify({"error": "A última mensagem deve ser uma pergunta."}), 400

    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        return jsonify({"error": "Configure GROQ_API_KEY no arquivo .env."}), 503

    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
    if not model:
        return jsonify({"error": "GROQ_MODEL não pode ficar vazio."}), 503

    try:
        temperature = float(os.getenv("GROQ_TEMPERATURE", "0.7"))
        max_tokens = int(os.getenv("GROQ_MAX_TOKENS", "2048"))
    except ValueError:
        return jsonify({"error": "GROQ_TEMPERATURE e GROQ_MAX_TOKENS devem ser números válidos."}), 503
    if not 0 <= temperature <= 2 or max_tokens < 1:
        return jsonify({"error": "GROQ_TEMPERATURE deve estar entre 0 e 2 e GROQ_MAX_TOKENS deve ser positivo."}), 503

    mensagens_groq = [
        {
            "role": "assistant" if mensagem["role"] in ("assistant", "model") else "user",
            "content": mensagem.get("content", mensagem.get("text")),
        }
        for mensagem in mensagens
    ]

    try:
        client = Groq(api_key=api_key)
        resposta = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": os.getenv("KING_SYSTEM_PROMPT", "").strip() or INSTRUCAO_KING,
                },
                *mensagens_groq,
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
    except APIError:
        app.logger.exception("O pedido à Groq falhou.")
        return jsonify({"error": "A King não conseguiu responder. Verifique a chave, o modelo e tente novamente."}), 502

    texto = (resposta.choices[0].message.content or "").strip() if resposta.choices else ""
    if not texto:
        return jsonify({"error": "A King não devolveu texto. Reformule a pergunta e tente novamente."}), 502

    return jsonify({"answer": texto})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
