---
title: "Semantic Search: Beyond Keywords with Dense Retrieval and Embeddings"
date: 2025-02-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - semantic-search
  - embeddings
  - dense-retrieval
  - nlp
---

Semantic search understands meaning, not just keywords. When a user searches "tips for a job interview," semantic search knows to return content about "career advice" and "interview preparation"—even without those exact words. This capability is powered by dense embeddings and neural retrieval systems.

## Introduction and Motivation

The first time I replaced a battle-tested BM25 search with a shiny dense retriever, power users immediately complained that \"search got worse.\" Exact ID lookups broke, long-tail queries surfaced vaguely-related docs, and suddenly we were debugging vector indices instead of shipping features.

That experience captures both the promise and the risk of semantic search. When it works, it feels like magic: users can type natural language and get exactly what they meant, not what they typed. When it fails, it feels fuzzy and imprecise compared to the crispness of keyword matching.

Traditional keyword search fails when users and documents use different words for the same concept. "Automobile" doesn't match "car." "How to fix a bug" doesn't match "debugging tutorial."

Semantic search bridges this gap by representing queries and documents as dense vectors in a learned embedding space. Similar meanings cluster together, enabling retrieval based on concepts, not just lexical overlap. This post is about how to get there **without breaking everything that already works**.

## Core Concepts

### Dense vs. Sparse Representations

**Sparse (traditional)**: High-dimensional vectors with mostly zeros. One dimension per word. BM25, TF-IDF.

**Dense**: Low-dimensional (768-1536) vectors with continuous values. Learned by neural networks. Captures semantic relationships.

### Embedding Models

**Sentence transformers**: BERT-based models trained for semantic similarity.
- all-MiniLM-L6-v2: Fast, 384 dimensions
- all-mpnet-base-v2: Better quality, 768 dimensions
- E5, BGE, GTE: State-of-the-art multilingual

**Training objectives**:
- Contrastive learning: Push similar pairs together, dissimilar apart
- InfoNCE loss: Maximize similarity for positive pairs vs. negatives

### Vector Databases

Store and search embeddings efficiently:
- **FAISS**: Facebook's library for similarity search
- **Pinecone, Weaviate, Milvus**: Managed vector databases
- **pgvector**: PostgreSQL extension

Approximate Nearest Neighbor (ANN) algorithms enable sub-millisecond search over millions of vectors.

## Mathematical Foundations

### Contrastive Learning

InfoNCE loss for learning embeddings:

$$\mathcal{L} = -\log\frac{\exp(\text{sim}(q, d^+)/\tau)}{\sum_{d \in \{d^+\} \cup D^-} \exp(\text{sim}(q, d)/\tau)}$$

where $\tau$ is temperature, $d^+$ is positive (relevant) document, $D^-$ are negatives.

### Similarity Measures

$$\text{Cosine similarity} = \frac{\mathbf{q} \cdot \mathbf{d}}{\|\mathbf{q}\| \|\mathbf{d}\|}$$

$$\text{Dot product} = \mathbf{q} \cdot \mathbf{d}$$

$$\text{Euclidean} = \|\mathbf{q} - \mathbf{d}\|_2$$

For normalized vectors, cosine = dot product.

## Practical Implementation

```python
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss

class SemanticSearch:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.index = None
        self.documents = []

    def index_documents(self, documents: list):
        """Create searchable index from documents"""
        self.documents = documents

        # Encode all documents
        embeddings = self.model.encode(
            documents,
            show_progress_bar=True,
            convert_to_numpy=True
        )

        # Normalize for cosine similarity
        faiss.normalize_L2(embeddings)

        # Create FAISS index
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)  # Inner product (cosine for normalized)
        self.index.add(embeddings)

        return self

    def search(self, query: str, k: int = 5):
        """Search for relevant documents"""
        # Encode query
        query_embedding = self.model.encode([query], convert_to_numpy=True)
        faiss.normalize_L2(query_embedding)

        # Search
        scores, indices = self.index.search(query_embedding, k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            results.append({
                'document': self.documents[idx],
                'score': float(score)
            })

        return results


class HybridSearch:
    """Combine sparse (BM25) and dense retrieval"""

    def __init__(self, model_name='all-MiniLM-L6-v2', alpha=0.5):
        self.dense_search = SemanticSearch(model_name)
        self.alpha = alpha  # Weight for dense vs. sparse
        self.bm25 = None

    def index_documents(self, documents: list):
        from rank_bm25 import BM25Okapi

        self.documents = documents
        self.dense_search.index_documents(documents)

        # Tokenize for BM25
        tokenized = [doc.lower().split() for doc in documents]
        self.bm25 = BM25Okapi(tokenized)

        return self

    def search(self, query: str, k: int = 10):
        # Dense scores
        dense_results = self.dense_search.search(query, k=len(self.documents))
        dense_scores = {r['document']: r['score'] for r in dense_results}

        # Normalize dense scores
        max_dense = max(dense_scores.values())
        dense_scores = {d: s/max_dense for d, s in dense_scores.items()}

        # BM25 scores
        tokenized_query = query.lower().split()
        bm25_scores = self.bm25.get_scores(tokenized_query)
        max_bm25 = max(bm25_scores) if max(bm25_scores) > 0 else 1
        bm25_scores = bm25_scores / max_bm25

        # Combine
        hybrid_scores = []
        for i, doc in enumerate(self.documents):
            dense = dense_scores.get(doc, 0)
            sparse = bm25_scores[i]
            hybrid = self.alpha * dense + (1 - self.alpha) * sparse
            hybrid_scores.append((doc, hybrid, dense, sparse))

        # Sort and return top k
        hybrid_scores.sort(key=lambda x: x[1], reverse=True)

        return [
            {
                'document': doc,
                'hybrid_score': h,
                'dense_score': d,
                'sparse_score': s
            }
            for doc, h, d, s in hybrid_scores[:k]
        ]


# Example usage
documents = [
    "Machine learning is a subset of artificial intelligence.",
    "Deep learning uses neural networks with many layers.",
    "Natural language processing enables computers to understand text.",
    "Computer vision allows machines to interpret images.",
    "Reinforcement learning trains agents through trial and error.",
    "Transfer learning reuses knowledge from pre-trained models.",
    "Supervised learning requires labeled training data.",
    "Unsupervised learning finds patterns in unlabeled data."
]

# Semantic search
searcher = SemanticSearch()
searcher.index_documents(documents)

query = "how do computers understand human language"
results = searcher.search(query, k=3)

print(f"Query: {query}\n")
for i, r in enumerate(results):
    print(f"{i+1}. [{r['score']:.3f}] {r['document']}")

# Hybrid search
hybrid = HybridSearch(alpha=0.6)
hybrid.index_documents(documents)

query = "neural network layers"
results = hybrid.search(query, k=3)

print(f"\nHybrid Search: {query}\n")
for i, r in enumerate(results):
    print(f"{i+1}. [H:{r['hybrid_score']:.3f} D:{r['dense_score']:.3f} S:{r['sparse_score']:.3f}]")
    print(f"   {r['document']}")
```

## Scaling Challenges

### Approximate Nearest Neighbors

Exact search is O(n). ANN algorithms trade accuracy for speed:
- **IVF (Inverted File)**: Cluster vectors, only search nearby clusters
- **HNSW (Hierarchical Navigable Small World)**: Graph-based search
- **PQ (Product Quantization)**: Compress vectors

### Index Sharding

Distribute across machines for billion-scale:
- Partition by document ID or embedding space
- Query all shards, merge results

## Best Practices

1. **Normalize embeddings**: For cosine similarity, always normalize.

2. **Batch encode**: Much faster than one-by-one encoding.

3. **Hybrid is usually best**: Combine dense and sparse for robustness.

4. **Domain-specific fine-tuning**: Pre-trained models may not work for specialized domains.

5. **Monitor recall**: Track what percentage of relevant docs are retrieved.

## Failure Modes and How to Avoid Them

### 1. Breaking Exact Lookups

If you replace keyword search wholesale with dense retrieval:

- Users searching for **IDs, codes, or exact titles** may suddenly get approximate matches.
- Example: Query `"order #12345"` returning \"order #12346\" because the embedding model thinks they're similar.

**Mitigations**:
- Detect ID-like queries (regex, heuristics) and **route them to exact match**.
- Use **hybrid scoring** and give sparse matches a big boost when there is an exact hit.

### 2. Embedding Drift and Index Staleness

When you:
- Retrain your embedding model
- Change preprocessing
- Add new domains

you can silently corrupt embedding-space assumptions:

- Old vectors are no longer comparable to new ones
- Relevance degrades over time without obvious failures

**Mitigations**:
- Version your embedding models and indices
- Periodically **re-embed** and **rebuild** the index as a batch job
- Track **recall@K** on a labeled validation set across model versions

### 3. Making LLMs Hallucinate More

In RAG systems, a weak retriever can:

- Pull in semi-related but wrong documents
- Cause the LLM to confidently synthesize answers that are \"plausible but false\"

**Mitigations**:
- Treat retrieval quality as a **first-class metric** (recall@K, MRR)
- Use **rerankers** (cross-encoders) on top of dense retrieval for critical flows
- Add simple filters (e.g., require at least one document above a similarity threshold)

## Summary

Semantic search enables meaning-based retrieval through dense embeddings. Key takeaways:

- Dense embeddings capture semantic similarity and unlock natural-language search
- Hybrid (dense + sparse) usually gives the best of both worlds and protects exact-match use cases
- ANN algorithms enable fast search at scale, but you must handle index versioning and drift
- Retrieval quality directly determines downstream RAG and LLM behavior

### Checklist: Rolling Out Semantic Search Safely

Before you flip traffic to a dense or hybrid retriever:

1. **Define success**
   - What metrics matter? (Recall@K, query success rate, CTR, task completion)
   - Which query segments are in scope (head, torso, tail)?

2. **Protect exact-match flows**
   - ID/code/title lookups route to strict keyword search
   - Hybrid scoring strongly rewards exact token overlap for those cases

3. **Build an eval suite**
   - Labeled query–document pairs for offline recall@K
   - Real queries and click logs for implicit evaluation

4. **Start hybrid, not dense-only**
   - Use BM25 as a safety net
   - Tune the dense/sparse mixing weight per surface if needed

5. **Version everything**
   - Embedding model versions
   - Index build versions
   - Rollouts and rollbacks tracked per version

6. **Monitor in production**
   - Query success, CTR, zero-result rate, and user complaints
   - Guardrails for obvious regressions before ramping up traffic

If you treat semantic search as a **gradual, measured upgrade to your existing stack**—rather than a rip-and-replace—you can get the best parts of Eugene-style semantic IDs and dense retrieval while preserving the reliability of classic search.

**Further Reading**:
- Reimers & Gurevych, "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks"
- Karpukhin et al., "Dense Passage Retrieval for Open-Domain Question Answering"
- FAISS documentation and tutorials
