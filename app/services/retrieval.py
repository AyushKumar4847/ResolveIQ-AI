from sqlalchemy.orm import joinedload
from app.services.ingestion import embeddings
from app.models.documents import DocumentChunk

def search_chunks(db, query, top_k=5):
    query_vector = embeddings.embed_query(query)
    return (
        db.query(DocumentChunk)
        .options(joinedload(DocumentChunk.document))
        .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
        .limit(top_k)
        .all()
    )
