import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from flask import Flask, jsonify, request

while True:
    print("\n\n")
    print("Bem-vindo ao King! O seu assistente de aprendizagem e crescimento.")
    print("Faça uma pergunta ou peça um conselho. (Digite 'sair' para encerrar.)\n")
    pergunta = input("O que você quer melhorar hoje? \n:")
    if pergunta.lower() == "sair":
        print("Até logo! Continue a aprender e a crescer!")
        break

    load_dotenv(Path(__file__).resolve().with_name(".env"))

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("Erro: defina GEMINI_API_KEY no arquivo .env.")

    model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()
    if not model:
        raise SystemExit("Erro: GEMINI_MODEL não pode ficar vazio.")

    client = genai.Client(api_key=api_key)
    resposta = client.interactions.create(
    model=model,
    input=(
        "És um amigo próximo e simpático que ajuda a aprender, crescer e se for necessario contraria as ideias do usuario "
        "Responde a perguntas para aumentar o conhecimento e dá conselhos úteis "
        "quando fizer sentido. Mantém um tom natural, leve, respeitoso e atual; e se baseia na pergunta anterior da a nova resposta. "
        "não fales como um professor distante nem como uma pessoa velha a dar sermões. "
        "Se a pergunta não tiver relação com aprender, conhecer algo ou receber e o teu nome é King, então ignora a pergunta e responde com uma mensagem curta a dizer que só podes falar sobre aprender, conhecer algo ou receber conselhos. "
        "conselhos, responde brevemente e orienta a conversa de volta a esses temas.\n\n"
        f"Pergunta: {pergunta}"
    ),
)

    if not resposta.output_text:
        raise SystemExit("Erro: o Gemini não devolveu texto.")
    os.system("cls")
    print("King: ", resposta.output_text)

    gemini = Flask(__name__)


    @gemini.route("/")
    def inicio():
        return "oi King!"





#@gemini.route("/executar", methods=["POST"])
#def executar():
#    dados = request.get_json()
#    nome = dados.get("nome", "") if isinstance(dados, dict) else ""
#    resultado = f"King: "
#    return jsonify({"King: ": resultado})


#if __name__ == "__main__":
#    gemini.run(debug=True, port=5000)
