---
title: "NDCG, MAP, and MRR: A Deep Dive into Ranking Evaluation Metrics"
date: 2024-01-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - evaluation-metrics
  - ranking
  - ndcg
  - information-retrieval
---

> In 2009, Microsoft researchers published a paper showing that improving NDCG@10 by just 0.01 could increase revenue by millions of dollars. Yet many ML engineers optimize for accuracy or AUC—metrics that don't measure what actually matters in ranking systems.

Ranking isn't classification. Users care about order, not probabilities. The first result matters more than the tenth. And relevance isn't binary—some results are perfect, others are just okay.

How do you know if your ranking model is good? Classification has accuracy and AUC. Regression has RMSE. Ranking has its own family of metrics: NDCG, MAP, MRR, and more. Understanding these metrics—and when to use which—is essential for evaluating and improving ranking systems. Choosing the wrong metric can make your model worse at what actually matters.

## Introduction and Motivation

Ranking metrics differ fundamentally from classification or regression metrics. We care about relative order, not absolute scores. We care more about top positions than bottom ones. And we often have graded relevance, not just binary labels.

Choosing the wrong metric leads you astray. Optimize for the wrong thing, and your model gets worse at what matters. This primer covers the major ranking metrics, their properties, and when to use each.

## Binary vs. Graded Relevance

**Binary**: Relevant (1) or not (0)
- Simpler labels
- Metrics: Precision, Recall, MAP, MRR

**Graded**: Relevance on a scale (0-4)
- Captures degrees of relevance
- Metrics: NDCG, ERR

## Core Metrics

Before diving into the formulas, this decision tree summarizes when each metric is most appropriate:

{% drawio path="assets/diagrams/evaluation-metrics-decision-tree.drawio" page_number=0 height=460 %}

*Figure: Decision tree for choosing between MRR, MAP, and NDCG based on query type and relevance labels.*

### Precision@K and Recall@K

**Precision@K**: Fraction of top-K results that are relevant
$$P@K = \frac{|\text{relevant} \cap \text{top-K}|}{K}$$

**Recall@K**: Fraction of all relevant documents in top-K
$$R@K = \frac{|\text{relevant} \cap \text{top-K}|}{|\text{relevant}|}$$

### Mean Reciprocal Rank (MRR)

Position of **first** relevant result:
$$\text{MRR} = \frac{1}{|Q|}\sum_{q=1}^{|Q|} \frac{1}{\text{rank}_q}$$

Best when there's one main answer (navigational queries, QA).

### Mean Average Precision (MAP)

Average precision across recall levels:
$$\text{AP} = \frac{\sum_{k=1}^n P@k \cdot \text{rel}(k)}{|\text{relevant}|}$$
$$\text{MAP} = \frac{1}{|Q|}\sum_{q=1}^{|Q|} \text{AP}_q$$

Considers all relevant documents, not just first. Good for informational queries.

### Normalized Discounted Cumulative Gain (NDCG)

Handles graded relevance with position discounting:

$$\text{DCG@K} = \sum_{i=1}^K \frac{2^{rel_i} - 1}{\log_2(i+1)}$$

$$\text{NDCG@K} = \frac{\text{DCG@K}}{\text{IDCG@K}}$$

where IDCG is DCG of ideal ranking. NDCG ∈ [0, 1].

### Expected Reciprocal Rank (ERR)

Models cascading browsing—user stops at satisfying result:
$$\text{ERR} = \sum_{r=1}^n \frac{1}{r} \prod_{i=1}^{r-1}(1 - R_i) \cdot R_r$$

where $R_i = \frac{2^{rel_i} - 1}{2^{max\_rel}}$ is probability of satisfaction.

## Mathematical Properties

### Position Discounting

| Metric | Position Discount |
|--------|------------------|
| Precision | None (all equal) |
| MAP | Implicit (through AP formula) |
| MRR | 1/rank (first result only) |
| NDCG | 1/log(rank+1) |
| ERR | Cascade model (stops when satisfied) |

### Normalization

- **NDCG**: Normalized by ideal ranking → [0, 1]
- **MAP**: Normalized by relevant count → [0, 1]
- **Precision/Recall**: Inherently bounded [0, 1]

### Cutoff Selection (K)

Common choices:
- **K=1**: First result quality (navigational)
- **K=3-5**: Above the fold
- **K=10**: First page
- **K=20-100**: Deep evaluation

## Practical Implementation

```python
import numpy as np
from typing import List

def dcg_at_k(relevances: List[float], k: int) -> float:
    """Discounted Cumulative Gain at K"""
    relevances = np.array(relevances)[:k]
    positions = np.arange(1, len(relevances) + 1)
    discounts = np.log2(positions + 1)
    gains = (2 ** relevances - 1) / discounts
    return gains.sum()

def ndcg_at_k(relevances: List[float], k: int) -> float:
    """Normalized DCG at K"""
    dcg = dcg_at_k(relevances, k)
    ideal_relevances = sorted(relevances, reverse=True)
    idcg = dcg_at_k(ideal_relevances, k)
    return dcg / idcg if idcg > 0 else 0.0

def precision_at_k(relevances: List[int], k: int) -> float:
    """Precision at K (binary relevance)"""
    return sum(relevances[:k]) / k

def recall_at_k(relevances: List[int], k: int) -> float:
    """Recall at K (binary relevance)"""
    total_relevant = sum(relevances)
    if total_relevant == 0:
        return 0.0
    return sum(relevances[:k]) / total_relevant

def average_precision(relevances: List[int]) -> float:
    """Average Precision for a single query"""
    relevant_count = sum(relevances)
    if relevant_count == 0:
        return 0.0

    precisions = []
    for k in range(1, len(relevances) + 1):
        if relevances[k-1] == 1:
            precisions.append(precision_at_k(relevances, k))

    return sum(precisions) / relevant_count

def reciprocal_rank(relevances: List[int]) -> float:
    """Reciprocal Rank (position of first relevant)"""
    for i, rel in enumerate(relevances):
        if rel == 1:
            return 1.0 / (i + 1)
    return 0.0

def err(relevances: List[float], max_grade: int = 4) -> float:
    """Expected Reciprocal Rank"""
    result = 0.0
    prob_stop = 0.0

    for i, rel in enumerate(relevances):
        # Probability of satisfaction at position i
        utility = (2 ** rel - 1) / (2 ** max_grade)
        prob_not_stopped = 1 - prob_stop
        result += prob_not_stopped * utility / (i + 1)
        prob_stop += prob_not_stopped * utility

    return result


# Example usage
relevances_graded = [3, 2, 0, 1, 2, 0, 0, 1, 0, 0]  # Graded 0-4
relevances_binary = [1, 1, 0, 1, 1, 0, 0, 1, 0, 0]  # Binary

print(f"NDCG@5: {ndcg_at_k(relevances_graded, 5):.4f}")
print(f"NDCG@10: {ndcg_at_k(relevances_graded, 10):.4f}")
print(f"Precision@5: {precision_at_k(relevances_binary, 5):.4f}")
print(f"MAP: {average_precision(relevances_binary):.4f}")
print(f"MRR: {reciprocal_rank(relevances_binary):.4f}")
print(f"ERR: {err(relevances_graded):.4f}")

# Compare rankings
ranking_a = [3, 2, 1, 0]  # Good items first
ranking_b = [0, 1, 2, 3]  # Good items last

print(f"\nRanking A NDCG@4: {ndcg_at_k(ranking_a, 4):.4f}")
print(f"Ranking B NDCG@4: {ndcg_at_k(ranking_b, 4):.4f}")
```

## Choosing the Right Metric

| Query Type | Best Metric | Reason |
|------------|-------------|--------|
| Navigational (one answer) | MRR | Find the one right result |
| Informational | MAP, NDCG | All relevant docs matter |
| Graded relevance | NDCG | Distinguishes relevance levels |
| E-commerce | NDCG + Revenue | Relevance + business value |

## Common Pitfalls

1. **Wrong K**: Using K=10 when users only see 3 results distorts evaluation.

2. **Binary when graded**: Forcing binary labels loses information. Use graded relevant and NDCG.

3. **Ignoring ties**: How do you score tied predictions? Break ties randomly for unbiased estimate.

4. **Aggregation method**: Mean vs. median. Mean sensitive to outliers.

5. **Offline-online gap**: High NDCG doesn't guarantee high CTR. Validate online.

## Advanced Considerations

### Statistical Significance

Use paired tests comparing metrics across queries:
- Paired t-test
- Wilcoxon signed-rank
- Bootstrap confidence intervals

### Cascade Metrics

Model user browsing behavior:
- Users examine results top-to-bottom
- May stop at any relevant result
- ERR captures this explicitly

### Diversity Metrics

Standard metrics ignore redundancy:
- α-NDCG penalizes redundant results
- Intent-aware metrics cover subtopics

## Summary

Ranking metrics capture different aspects of quality. Key takeaways:

- NDCG for graded relevance with position discounting
- MAP for binary relevance, all docs matter
- MRR for single-answer queries
- Choose metric matching your use case; don't optimize the wrong thing

**Further Reading**:
- Järvelin & Kekäläinen, "Cumulated Gain-Based Evaluation of IR Techniques"
- Chapelle et al., "Expected Reciprocal Rank for Graded Relevance"
- Manning, Raghavan & Schütze, *Introduction to Information Retrieval*, Chapter 8
