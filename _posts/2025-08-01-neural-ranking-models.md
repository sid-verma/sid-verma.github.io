---
title: "Neural Ranking Models: Cross-Encoders, Bi-Encoders, and Late Interaction"
date: 2025-08-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - neural-ranking
  - bert
  - colbert
  - information-retrieval
---

Neural ranking models have revolutionized search by capturing semantic relationships between queries and documents. From cross-encoders to efficient late interaction models like ColBERT, understanding these architectures is essential for modern IR systems.

## Introduction and Motivation

Traditional ranking relies on lexical features—BM25, TF-IDF—that miss semantic similarity. "Car repair" and "automobile maintenance" share meaning but few words.

Neural rankers solve this by jointly encoding queries and documents with deep networks, learning rich representations that capture meaning. The challenge: doing this efficiently at web scale.

## Architecture Taxonomy

### Cross-Encoder

Joint encoding of query-document pairs:

$$\text{score}(q, d) = \text{MLP}(\text{BERT}([CLS] q [SEP] d))$$

**Pros**: Best accuracy—full attention between query and document tokens.
**Cons**: Expensive—must re-encode for each query-document pair. O(n) per query.

### Bi-Encoder (Two-Tower)

Separate encoders, dot-product similarity:

$$\text{score}(q, d) = E_q(q)^T \cdot E_d(d)$$

**Pros**: Efficient—document embeddings precomputed, ANN search.
**Cons**: No query-document interaction during encoding.

### Late Interaction (ColBERT)

Token-level embeddings with late interaction:

$$\text{score}(q, d) = \sum_{i \in q} \max_{j \in d} E_{q_i}^T \cdot E_{d_j}$$

**Pros**: Rich interactions; documents still precomputable.
**Cons**: Storage for token embeddings; more complex retrieval.

## Mathematical Details

### Cross-Encoder Scoring

Full transformer attention across query and document:

$$\mathbf{h} = \text{Transformer}([\text{CLS}, q_1, ..., q_m, \text{SEP}, d_1, ..., d_n])$$
$$s = \mathbf{W}^T \mathbf{h}_{CLS}$$

### Contrastive Training

Train with in-batch negatives:

$$\mathcal{L} = -\log\frac{e^{s(q, d^+)}}{e^{s(q, d^+)} + \sum_{d^- \in B} e^{s(q, d^-)}}$$

Hard negatives (BM25 retrievals that aren't relevant) improve learning.

### ColBERT MaxSim

Per-query-term maximum similarity:

$$\text{MaxSim}(q, d) = \sum_{i=1}^{|q|} \max_{j=1}^{|d|} \mathbf{E}_{q_i}^T \mathbf{E}_{d_j}$$

Captures best-matching document term for each query term.

## Practical Implementation

```python
import torch
import torch.nn as nn
from transformers import AutoModel, AutoTokenizer

class CrossEncoder(nn.Module):
    """Cross-encoder for pairwise ranking"""

    def __init__(self, model_name='bert-base-uncased'):
        super().__init__()
        self.encoder = AutoModel.from_pretrained(model_name)
        self.classifier = nn.Linear(self.encoder.config.hidden_size, 1)

    def forward(self, input_ids, attention_mask):
        outputs = self.encoder(input_ids, attention_mask=attention_mask)
        cls_output = outputs.last_hidden_state[:, 0]  # [CLS] token
        return self.classifier(cls_output).squeeze(-1)


class BiEncoder(nn.Module):
    """Bi-encoder (two-tower) for efficient retrieval"""

    def __init__(self, model_name='bert-base-uncased'):
        super().__init__()
        self.query_encoder = AutoModel.from_pretrained(model_name)
        self.doc_encoder = AutoModel.from_pretrained(model_name)

    def encode_query(self, input_ids, attention_mask):
        outputs = self.query_encoder(input_ids, attention_mask=attention_mask)
        # Mean pooling
        embeddings = outputs.last_hidden_state
        mask = attention_mask.unsqueeze(-1).expand(embeddings.size())
        return (embeddings * mask).sum(1) / mask.sum(1)

    def encode_doc(self, input_ids, attention_mask):
        outputs = self.doc_encoder(input_ids, attention_mask=attention_mask)
        embeddings = outputs.last_hidden_state
        mask = attention_mask.unsqueeze(-1).expand(embeddings.size())
        return (embeddings * mask).sum(1) / mask.sum(1)

    def forward(self, query_input_ids, query_attention_mask,
                doc_input_ids, doc_attention_mask):
        query_emb = self.encode_query(query_input_ids, query_attention_mask)
        doc_emb = self.encode_doc(doc_input_ids, doc_attention_mask)
        return (query_emb * doc_emb).sum(dim=-1)


class ColBERT(nn.Module):
    """ColBERT-style late interaction model"""

    def __init__(self, model_name='bert-base-uncased', dim=128):
        super().__init__()
        self.encoder = AutoModel.from_pretrained(model_name)
        self.linear = nn.Linear(self.encoder.config.hidden_size, dim)

    def encode(self, input_ids, attention_mask):
        outputs = self.encoder(input_ids, attention_mask=attention_mask)
        embeddings = self.linear(outputs.last_hidden_state)
        embeddings = nn.functional.normalize(embeddings, dim=-1)
        return embeddings, attention_mask

    def score(self, query_emb, query_mask, doc_emb, doc_mask):
        """MaxSim scoring"""
        # query_emb: (batch, q_len, dim)
        # doc_emb: (batch, d_len, dim)

        # Similarity matrix: (batch, q_len, d_len)
        sim = torch.bmm(query_emb, doc_emb.transpose(1, 2))

        # Mask document padding
        doc_mask_expanded = doc_mask.unsqueeze(1).expand_as(sim)
        sim = sim.masked_fill(~doc_mask_expanded.bool(), float('-inf'))

        # Max over document tokens
        max_sim = sim.max(dim=2).values  # (batch, q_len)

        # Mask query padding
        max_sim = max_sim.masked_fill(~query_mask.bool(), 0)

        # Sum over query tokens
        return max_sim.sum(dim=1)


# Training utilities
def contrastive_loss(query_emb, pos_doc_emb, neg_doc_embs, temperature=0.05):
    """In-batch contrastive loss"""
    # Positive scores
    pos_scores = (query_emb * pos_doc_emb).sum(dim=-1) / temperature

    # Negative scores
    neg_scores = torch.mm(query_emb, neg_doc_embs.T) / temperature

    # InfoNCE
    logits = torch.cat([pos_scores.unsqueeze(1), neg_scores], dim=1)
    labels = torch.zeros(len(query_emb), dtype=torch.long, device=query_emb.device)

    return nn.functional.cross_entropy(logits, labels)


# Reranking pipeline
class NeuralReranker:
    def __init__(self, cross_encoder_path):
        self.tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
        self.model = CrossEncoder()
        # In practice, load trained weights
        self.model.eval()

    def rerank(self, query: str, documents: list, top_k: int = 10):
        """Rerank documents for a query"""

        scores = []
        for doc in documents:
            # Encode query-doc pair
            inputs = self.tokenizer(
                query, doc,
                padding=True,
                truncation=True,
                max_length=512,
                return_tensors='pt'
            )

            with torch.no_grad():
                score = self.model(**inputs)
            scores.append(score.item())

        # Sort by score
        ranked = sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)
        return ranked[:top_k]
```

## Efficiency Techniques

### Knowledge Distillation

Train smaller bi-encoder from cross-encoder teacher:
$$\mathcal{L} = \text{CE}(s_{student}, \sigma(s_{teacher}/T))$$

### Quantization

Compress embeddings:
- **Scalar quantization**: Float32 → Int8
- **Product quantization**: Compress to codes

### Approximate Search

HNSW, IVF for sub-linear retrieval with bi-encoders.

## Multi-Stage Ranking

1. **Retrieval**: Bi-encoder + ANN (1000 candidates)
2. **First-stage reranking**: Efficient cross-encoder (100 candidates)
3. **Final reranking**: Large cross-encoder (top 10-20)

## Best Practices

1. **Hard negative mining**: Use BM25 or previous model negatives.

2. **Distillation**: Cross-encoder to bi-encoder for deployment.

3. **Domain adaptation**: Fine-tune on domain-specific data.

4. **Hybrid retrieval**: Combine with BM25 for robustness.

## Summary

Neural rankers capture semantic relevance beyond lexical matching. Key takeaways:

- Cross-encoders are accurate but expensive; use for reranking
- Bi-encoders enable efficient retrieval via ANN
- Late interaction (ColBERT) balances quality and efficiency

**Further Reading**:
- Nogueira & Cho, "Passage Re-ranking with BERT"
- Khattab & Zaharia, "ColBERT: Efficient and Effective Passage Search"
- Hofstätter et al., "Efficiently Teaching an Effective Dense Retriever with Balanced Topic Aware Sampling"
