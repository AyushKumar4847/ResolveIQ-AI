from langchain_huggingface import HuggingFaceEmbeddings  # noqa: I001
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from pathlib import Path
import tempfile
import pymupdf

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

splitter = RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=100)


def ingest_pdf(filebytes: bytes):
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(filebytes)
            temp_path = Path(f.name)

        pdf = pymupdf.open(str(temp_path))
        documents = [
            Document(page_content=page.get_text("text"), metadata={"page": page.number})
            for page in pdf
        ]
        pdf.close()

        chunks = splitter.split_documents(documents)

        content = [chunk.page_content for chunk in chunks]
        vectors = embeddings.embed_documents(content)

        return [
            {"content": content[i], "index": i, "embedding": vectors[i], "page_number": chunks[i].metadata.get("page")}
            for i in range(len(content))
        ]

    except Exception as e:
        print("Error:", e)
        raise

    finally:
        if temp_path:
            temp_path.unlink(missing_ok=True)
