import json
import requests
from datetime import datetime

BASE_URL = "http://localhost:8000"

QUESTIONS = [
    # RAG and Information Retrieval
    "What is the main purpose of Retrieval-Augmented Generation (RAG)?",
    "What is Information Retrieval (IR), and how does a search engine use it?",
    "What are the main problems with relying only on a pretrained LLM to answer factual questions?",
    "What is the difference between sparse retrieval and dense retrieval?",
    "What is the bag-of-words model, and how does it represent a document?",
    "What are term frequency (TF) and inverse document frequency (IDF) in information retrieval?",
    "How does TF-IDF help determine the importance of words in a document?",
    "What is BM25, and how do its parameters k and b affect document scoring?",
    "What is cosine similarity, and how is it used to rank documents?",
    "What are the two main components of a RAG system, and how do they work together?",

    # Artificial Intelligence
    "What is Artificial Intelligence (AI), and what tasks can AI systems perform?",
    "What is the difference between Artificial Intelligence, Machine Learning, Deep Learning, and Generative AI?",
    "What are the main steps involved in developing and deploying an AI system?",
    "What are the main types of AI, including predictive, perception, language, and generative AI?",
    "How is AI used in healthcare, education, agriculture, finance, and transportation?",
    "What are the major advantages and disadvantages of Artificial Intelligence?",
    "How can AI hallucinations, bias, privacy risks, and security threats affect users?",
    "How is AI changing jobs, and which human skills remain valuable?",
    "What are multimodal AI systems and AI agents, and what can they do?",
    "How can people use AI responsibly while protecting privacy and verifying information?",

    # HTML, CSS, and JavaScript
    "What is HTML, and how does it define the structure of a webpage?",
    "What are HTML elements, tags, and attributes, and how are they used?",
    "What are semantic HTML elements, and why are tags such as header, nav, main, and footer useful?",
    "What is CSS, and how does it control the appearance of HTML elements?",
    "What is the CSS box model, and what are content, padding, border, and margin?",
    "What is the difference between inline, block, and inline-block elements in CSS?",
    "How do Flexbox and CSS Grid help create webpage layouts?",
    "What are CSS media queries, and how do they help create responsive web designs?",
    "What is the difference between var, let, and const in JavaScript?",
    "What are JavaScript arrays, promises, async/await, and DOM event listeners, and how are they used?"
]


def run_evaluation():
    results = []

    for i, question in enumerate(QUESTIONS, 1):
        print(f"[{i}/30] {question}")
        try:
            response = requests.post(
                f"{BASE_URL}/ask/",
                json={"question": question},
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                results.append({
                    "question": question,
                    "answer": data["answer"],
                    "evidence": data["evidence"],
                    "status": "success"
                })
            else:
                results.append({
                    "question": question,
                    "answer": None,
                    "evidence": None,
                    "status": f"error_{response.status_code}"
                })
        except Exception as e:
            results.append({
                "question": question,
                "answer": None,
                "evidence": None,
                "status": f"exception: {str(e)}"
            })

    output = {
        "evaluated_at": datetime.utcnow().isoformat(),
        "total": len(results),
        "success_count": sum(1 for r in results if r["status"] == "success"),
        "results": results
    }

    output_path = "tests/evaluation/results.json"
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nDone. {output['success_count']}/30 successful. Results saved to {output_path}")


if __name__ == "__main__":
    run_evaluation()
