---
title: "RAG: Retrieval-Augmented Generation for Grounded LLM Responses"
date: 2025-11-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - rag
  - retrieval-augmented-generation
  - llms
  - information-retrieval
---

> In 2023, ChatGPT confidently told a user that the 2024 Olympics were canceled—because its training data cut off in 2021. LLMs are brilliant, but they're frozen in time, prone to hallucination, and can't access your private data.

Retrieval-Augmented Generation (RAG) solves all three problems by grounding LLM responses in retrieved documents. Instead of relying on what the model memorized during training, RAG retrieves current, relevant information and generates answers from that evidence.

This architecture has become the standard for knowledge-intensive applications—from customer support to legal research to internal knowledge bases. Here's how it works and how to build it.

## Introduction and Motivation

LLMs have remarkable capabilities but significant limitations: they hallucinate, their knowledge has a cutoff date, and they can't access private data. RAG addresses all three by retrieving relevant documents and incorporating them into the generation process.

Instead of relying solely on what the model memorized during training, RAG retrieves current, relevant information and generates responses grounded in that evidence.

## RAG Architecture

The diagram below shows the end-to-end RAG pipeline—from the user query, through retrieval and context construction, to grounded generation:

{% drawio path="assets/diagrams/rag-architecture.drawio" page_number=0 height=560 %}

*Figure: RAG architecture connecting the query encoder, vector database, document store, and LLM to produce grounded answers.*

### Basic Pipeline

```
Query → Retriever → Top-K Documents → Context + Query → LLM → Response
```

1. **Query processing**: Parse user query
2. **Retrieval**: Find relevant documents
3. **Context construction**: Format retrieved docs
4. **Generation**: LLM produces answer using context

### Components

**Retriever**: Dense retrieval (embedding similarity), sparse (BM25), or hybrid.

**Document store**: Vector database for embeddings, search index for text.

**Generator**: LLM that incorporates retrieved context.

**Chunking**: Split documents into retrievable units (paragraphs, sections).

## Mathematical Framework

### Retrieval

Given query $q$, retrieve documents maximizing:
$$d^* = \arg\max_{d \in D} s(q, d)$$

where $s$ is similarity (dot product, cosine, learned).

### Generation with Context

$$P(y | q, D) = P(y | q, \text{top-k}(D))$$

The LLM conditions on retrieved documents.

### Joint Optimization

End-to-end RAG:
$$P(y | q) = \sum_{d \in D} P(y | q, d) \cdot P(d | q)$$

Marginalize over retrieved documents.

## Practical Implementation

```python
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
from typing import List, Dict

class SimpleRAG:
    """Basic RAG implementation"""

    def __init__(self,
                 embedding_model='all-MiniLM-L6-v2',
                 chunk_size=500,
                 chunk_overlap=50):
        self.embedder = SentenceTransformer(embedding_model)
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.index = None
        self.chunks = []
        self.metadata = []

    def chunk_document(self, text: str, source: str = None) -> List[Dict]:
        """Split document into chunks"""
        chunks = []
        words = text.split()

        for i in range(0, len(words), self.chunk_size - self.chunk_overlap):
            chunk_words = words[i:i + self.chunk_size]
            chunk_text = ' '.join(chunk_words)
            chunks.append({
                'text': chunk_text,
                'source': source,
                'start_idx': i
            })

        return chunks

    def add_documents(self, documents: List[Dict]):
        """Add documents to the index

        documents: List of {'text': str, 'source': str}
        """
        for doc in documents:
            doc_chunks = self.chunk_document(doc['text'], doc.get('source'))
            self.chunks.extend([c['text'] for c in doc_chunks])
            self.metadata.extend(doc_chunks)

        # Build FAISS index
        embeddings = self.embedder.encode(self.chunks, show_progress_bar=True)
        embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)

        self.index = faiss.IndexFlatIP(embeddings.shape[1])
        self.index.add(embeddings.astype('float32'))

        return self

    def retrieve(self, query: str, k: int = 5) -> List[Dict]:
        """Retrieve relevant chunks"""
        query_embedding = self.embedder.encode([query])
        query_embedding = query_embedding / np.linalg.norm(query_embedding)

        scores, indices = self.index.search(query_embedding.astype('float32'), k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            results.append({
                'text': self.chunks[idx],
                'score': float(score),
                'metadata': self.metadata[idx]
            })

        return results

    def format_context(self, retrieved: List[Dict]) -> str:
        """Format retrieved chunks for LLM context"""
        context_parts = []
        for i, r in enumerate(retrieved):
            source = r['metadata'].get('source', 'Unknown')
            context_parts.append(f"[Source {i+1}: {source}]\n{r['text']}")

        return "\n\n".join(context_parts)

    def generate_prompt(self, query: str, context: str) -> str:
        """Create prompt for LLM"""
        return f"""Answer the question based on the provided context. If the context doesn't contain enough information, say so.

Context:
{context}

Question: {query}

Answer:"""


class AdvancedRAG(SimpleRAG):
    """RAG with advanced techniques"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.query_expansion = True
        self.reranking = True

    def expand_query(self, query: str) -> List[str]:
        """Generate query variations (in practice, use LLM)"""
        # Simplified: use the query as-is
        # Real implementation would use LLM to generate variations
        return [query]

    def retrieve_with_expansion(self, query: str, k: int = 5) -> List[Dict]:
        """Retrieve with query expansion"""
        queries = self.expand_query(query)

        all_results = []
        seen_chunks = set()

        for q in queries:
            results = self.retrieve(q, k=k)
            for r in results:
                chunk_hash = hash(r['text'])
                if chunk_hash not in seen_chunks:
                    seen_chunks.add(chunk_hash)
                    all_results.append(r)

        # Sort by score and take top k
        all_results.sort(key=lambda x: x['score'], reverse=True)
        return all_results[:k]

    def rerank(self, query: str, retrieved: List[Dict]) -> List[Dict]:
        """Rerank with cross-encoder (simplified)"""
        # In practice, use a cross-encoder model
        # Here we just return as-is
        return retrieved

    def query(self, question: str, k: int = 5) -> Dict:
        """Full RAG pipeline"""
        # Retrieve
        if self.query_expansion:
            retrieved = self.retrieve_with_expansion(question, k=k*2)
        else:
            retrieved = self.retrieve(question, k=k*2)

        # Rerank
        if self.reranking:
            retrieved = self.rerank(question, retrieved)[:k]

        # Format context
        context = self.format_context(retrieved)

        # Generate prompt
        prompt = self.generate_prompt(question, context)

        return {
            'prompt': prompt,
            'retrieved': retrieved,
            'context': context
        }


# Example usage
documents = [
    {
        'text': """Machine learning is a subset of artificial intelligence that enables
        systems to learn and improve from experience without being explicitly programmed.
        It focuses on developing algorithms that can access data and use it to learn for
        themselves. The learning process begins with observations or data, such as examples,
        direct experience, or instruction, to look for patterns in data and make better
        decisions in the future.""",
        'source': 'ML Overview'
    },
    {
        'text': """Deep learning is a subset of machine learning that uses neural networks
        with many layers. These deep neural networks are capable of learning hierarchical
        representations of data. Deep learning has achieved remarkable success in computer
        vision, natural language processing, and speech recognition.""",
        'source': 'Deep Learning Intro'
    },
    {
        'text': """Transformers are a type of neural network architecture that uses
        self-attention mechanisms. Introduced in 2017, transformers have become the
        foundation for most modern NLP models including BERT, GPT, and T5. They are
        particularly effective for sequence-to-sequence tasks.""",
        'source': 'Transformers'
    }
]

# Build RAG system
rag = AdvancedRAG()
rag.add_documents(documents)

# Query
result = rag.query("What is deep learning?", k=2)
print("Retrieved context:")
print(result['context'])
print("\nGenerated prompt:")
print(result['prompt'][:500] + "...")
```

## Advanced Techniques

### Query Expansion

Generate multiple query variants:
- Hypothetical document embeddings (HyDE)
- LLM-generated query reformulations
- Synonym expansion

### Hybrid Retrieval

Combine dense and sparse:
$$s_{hybrid} = \alpha \cdot s_{dense} + (1-\alpha) \cdot s_{sparse}$$

### Iterative Retrieval

Multi-hop reasoning:
1. Retrieve for initial query
2. Generate intermediate reasoning
3. Retrieve for refined query
4. Generate final answer

### Self-RAG

Model decides when to retrieve and evaluates its own outputs.

## Evaluation

### Retrieval Quality
- Recall@K: Are relevant docs retrieved?
- MRR: Rank of first relevant doc

### Generation Quality
- Faithfulness: Is answer supported by retrieved docs?
- Relevance: Does answer address the question?
- Hallucination rate: Unsupported claims

## Best Practices

1. **Chunk wisely**: Semantic boundaries, not arbitrary splits.

2. **Optimize retrieval first**: Generation can't fix bad retrieval.

3. **Include citations**: Help users verify claims.

4. **Handle no-context gracefully**: When nothing relevant retrieved.

5. **Monitor and iterate**: Track failure modes in production.

## Summary

RAG grounds LLM responses in retrieved evidence. Key takeaways:

- Retrieval quality determines overall quality
- Chunk documents semantically for better retrieval
- Hybrid and advanced techniques improve robustness

**Further Reading**:
- Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"
- Gao et al., "Retrieval-Augmented Generation for Large Language Models: A Survey"
- LangChain, LlamaIndex documentation
