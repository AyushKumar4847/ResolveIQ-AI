from langchain_groq import ChatGroq
from app.core.config import settings
from langchain_core.prompts import ChatPromptTemplate
from app.services.retrieval import search_chunks

llm = ChatGroq(model="openai/gpt-oss-20b",
    api_key=settings.GROQ_API_KEY)


prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an expert technical support assistant for ResolveIQ AI.
Answer the user's question clearly and accurately using ONLY the provided context.
If the context does not contain enough information, state: "I don't have enough information to answer this question."

Formatting Guidelines:
- Structure your answer with clear headers, concise paragraphs, and bullet points.
- If using tables, format standard markdown tables without extra blank lines between rows.
- Always cite verified source references clearly with brackets, for example: [Page 4] or [Document.pdf | Page 4]."""),
    ("human", "Context:\n{context}\n\nQuestion: {question}")
])

def generate_answers(db, question):
    chunks = search_chunks(db, question)
    context_chunks = []
    for chunk in chunks:
        doc_name = chunk.document.filename if chunk.document else "Knowledge Document"
        page_str = f"Page {chunk.page_number + 1}" if chunk.page_number is not None else "Page N/A"
        context_chunks.append(f"[{doc_name} | {page_str}]:\n{chunk.content}")

    context = "\n\n---\n\n".join(context_chunks)
    chain = prompt | llm  

    output = chain.invoke({"context": context, "question": question})
    return output.content, context
