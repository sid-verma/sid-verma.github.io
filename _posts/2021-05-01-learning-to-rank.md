---
title: "Learning to Rank: From Pointwise to Listwise Neural Ranking Models"
date: 2021-05-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - learning-to-rank
  - search
  - neural-ranking
  - information-retrieval
---

Learning to Rank (LTR) trains machine learning models to order items by relevance. From search engines to recommendation systems, ranking is fundamental to information access. This primer covers pointwise, pairwise, and listwise approaches, along with modern neural ranking architectures.

## Introduction and Motivation

Ranking is everywhere: search results, product listings, news feeds, ad auctions. Unlike classification or regression, the goal isn't a single prediction—it's the relative ordering of items. A good ranker puts relevant items at the top, where users actually look.

LTR bridges IR and ML: use ML techniques optimized for ranking metrics like NDCG, MAP, and MRR. Understanding LTR is essential for anyone building search or recommendation systems.

## Intuition and Core Concepts

**Ranking vs. classification/regression**:
- Classification: Predict category
- Regression: Predict value
- Ranking: Predict relative order

**Training data**: Query-document pairs with relevance labels (often graded: 0-4 relevance).

**Three approaches**:
- **Pointwise**: Treat as regression/classification on individual items
- **Pairwise**: Learn to order pairs correctly
- **Listwise**: Optimize ranking of entire lists

## Mathematical Foundations

### Ranking Metrics

**NDCG (Normalized Discounted Cumulative Gain)**:
$$\text{DCG}_k = \sum_{i=1}^k \frac{2^{rel_i} - 1}{\log_2(i+1)}$$
$$\text{NDCG}_k = \frac{\text{DCG}_k}{\text{IDCG}_k}$$

Higher relevance at higher ranks → higher NDCG.

**MAP (Mean Average Precision)**:
$$\text{AP} = \frac{\sum_{k=1}^n P(k) \cdot \text{rel}(k)}{|\text{relevant docs}|}$$

**MRR (Mean Reciprocal Rank)**:
$$\text{MRR} = \frac{1}{|Q|}\sum_{i=1}^{|Q|} \frac{1}{\text{rank}_i}$$

### Pointwise Loss

Treat as regression on relevance scores:
$$\mathcal{L}_{\text{pointwise}} = \sum_{q,d} (y_{qd} - f(q, d))^2$$

### Pairwise Loss

Compare document pairs—should rank more relevant higher:
$$\mathcal{L}_{\text{pairwise}} = \sum_{y_i > y_j} \max(0, f(q, d_j) - f(q, d_i) + \epsilon)$$

### Listwise Loss

Optimize ranking directly. ListNet uses cross-entropy on permutation probabilities.

## Key Algorithms and Methods

### RankNet (Pairwise)

Learn probability that $d_i$ should rank above $d_j$:
$$P_{ij} = \frac{1}{1 + e^{-\sigma(s_i - s_j)}}$$

Minimize cross-entropy:
$$\mathcal{L} = -\bar{P}_{ij}\log P_{ij} - (1-\bar{P}_{ij})\log(1-P_{ij})$$

### LambdaRank

Weight pairs by their impact on NDCG:
$$|\Delta\text{NDCG}_{ij}|$$

Lambda gradient: $\lambda_{ij} = |\Delta\text{NDCG}_{ij}| \cdot \frac{-\sigma}{1 + e^{\sigma(s_i - s_j)}}$

This directly optimizes NDCG despite its non-differentiability.

### LambdaMART

Combines LambdaRank with gradient boosting (MART). State-of-the-art for traditional LTR. Used in Bing, Yahoo, and many industrial systems.

### Neural Ranking Models

**Cross-Encoder**: Joint query-document encoding with BERT:
$$\text{score} = \text{MLP}(\text{BERT}([q; d]))$$

Accurate but expensive (can't precompute document representations).

**Bi-Encoder (Two-Tower)**: Separate encoders:
$$\text{score} = \text{sim}(E_q(q), E_d(d))$$

Efficient (precompute document embeddings) but less accurate.

## Practical Implementation

```python
import torch
import torch.nn as nn
import numpy as np

class RankNetLoss(nn.Module):
    """Pairwise ranking loss"""

    def __init__(self, sigma=1.0):
        super().__init__()
        self.sigma = sigma

    def forward(self, scores, relevance):
        """
        scores: (batch, n_docs) - predicted scores
        relevance: (batch, n_docs) - relevance labels
        """
        batch_size, n_docs = scores.shape

        # Create all pairs
        scores_i = scores.unsqueeze(2)  # (batch, n_docs, 1)
        scores_j = scores.unsqueeze(1)  # (batch, 1, n_docs)
        rel_i = relevance.unsqueeze(2)
        rel_j = relevance.unsqueeze(1)

        # Mask: only pairs where i should rank above j
        valid_pairs = (rel_i > rel_j).float()

        # Probability that i ranks above j
        s_diff = self.sigma * (scores_i - scores_j)
        P_ij = torch.sigmoid(s_diff)

        # Binary cross-entropy loss
        loss = -valid_pairs * torch.log(P_ij + 1e-10)

        return loss.sum() / valid_pairs.sum()

class LambdaRankLoss(nn.Module):
    """LambdaRank: weight pairs by NDCG impact"""

    def __init__(self, sigma=1.0, k=10):
        super().__init__()
        self.sigma = sigma
        self.k = k

    def _dcg(self, relevance, k):
        positions = torch.arange(1, k + 1, device=relevance.device).float()
        discounts = torch.log2(positions + 1)
        gains = (2 ** relevance[:, :k] - 1) / discounts
        return gains.sum(dim=1)

    def _ndcg_delta(self, relevance, i, j, idcg):
        """Compute |Delta NDCG| for swapping positions i and j"""
        n = relevance.shape[1]
        pos_i = torch.arange(n, device=relevance.device)[i]
        pos_j = torch.arange(n, device=relevance.device)[j]

        discount_i = 1 / torch.log2(pos_i.float() + 2)
        discount_j = 1 / torch.log2(pos_j.float() + 2)

        gain_i = 2 ** relevance[:, i] - 1
        gain_j = 2 ** relevance[:, j] - 1

        delta = torch.abs(
            (gain_i - gain_j) * (discount_i - discount_j)
        ) / idcg.unsqueeze(1)

        return delta

    def forward(self, scores, relevance):
        # Simplified version - full implementation more complex
        return RankNetLoss(self.sigma)(scores, relevance)

# Simple ranking model
class RankingModel(nn.Module):
    def __init__(self, input_dim, hidden_dim=64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, 1)
        )

    def forward(self, x):
        return self.net(x).squeeze(-1)

# Evaluation
def compute_ndcg(scores, relevance, k=10):
    """Compute NDCG@k"""
    # Sort by predicted scores
    sorted_indices = torch.argsort(scores, descending=True)
    sorted_relevance = relevance[sorted_indices]

    # DCG
    positions = torch.arange(1, k + 1).float()
    discounts = torch.log2(positions + 1)
    dcg = ((2 ** sorted_relevance[:k] - 1) / discounts).sum()

    # Ideal DCG
    ideal_sorted = torch.sort(relevance, descending=True)[0]
    idcg = ((2 ** ideal_sorted[:k] - 1) / discounts).sum()

    return (dcg / idcg).item() if idcg > 0 else 0.0
```

## Common Pitfalls and Best Practices

1. **Position bias in training data**: Users click higher items. Use inverse propensity weighting or unbiased LTR.

2. **Feature normalization**: Features at different scales. Normalize per-query when possible.

3. **List size variation**: Queries have different numbers of results. Handle variable-length lists properly.

4. **Metric mismatch**: Optimize metric you care about. NDCG weights top positions more than MAP.

5. **Evaluation leakage**: Don't overfit to offline metrics. A/B test online.

## Real-World Applications

- **Web search**: Google, Bing search ranking
- **E-commerce**: Product search and browse
- **Recommendations**: Ranking candidate items
- **Advertising**: Ad slot allocation
- **Question answering**: Passage ranking for RAG

## Advanced Topics and Extensions

### Pre-trained Transformers for Ranking

Fine-tune BERT for ranking:
- MonoBERT: Cross-encoder reranking
- ColBERT: Efficient late interaction
- SPLADE: Learned sparse representations

### Unbiased Learning to Rank

Address position bias in click data:
- Inverse Propensity Scoring (IPS)
- Dual Learning Algorithm
- Regression EM

### Multi-Objective Ranking

Balance relevance, diversity, freshness, revenue:
$$\text{score} = \alpha \cdot \text{relevance} + \beta \cdot \text{diversity} + \gamma \cdot \text{revenue}$$

## Comparison with Related Methods

| Method | Approach | Pros | Cons |
|--------|----------|------|------|
| Pointwise | Regression | Simple | Ignores relative order |
| Pairwise | Compare pairs | Captures preference | O(n²) pairs |
| Listwise | Optimize list | Direct metric opt | Complex implementation |
| LambdaMART | Gradient boosting + lambda | SOTA for features | Not end-to-end |
| Neural Cross-Encoder | BERT-based | Best quality | Slow at scale |

## Summary and Further Reading

Learning to Rank optimizes ML models for ranking metrics. Key takeaways:

- Pairwise and listwise approaches outperform pointwise
- LambdaMART remains competitive with neural methods on feature-rich data
- Neural rankers excel with raw text but are expensive

**Further Reading**:
- Burges, "From RankNet to LambdaRank to LambdaMART" (2010)
- Nogueira & Cho, "Passage Re-ranking with BERT" (2019)
- Liu, *Learning to Rank for Information Retrieval* (book)
- Ai et al., "Unbiased Learning to Rank" (2018)
