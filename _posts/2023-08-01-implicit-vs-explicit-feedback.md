---
title: "Clicks vs. Ratings: The Signal You Choose Shapes the Model You Build"
date: 2023-08-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - implicit-feedback
  - explicit-feedback
  - recommendations
  - user-signals
---

Should you train on clicks or ratings? Views or purchases? The choice between implicit and explicit feedback fundamentally shapes your model's behavior. This primer explores the trade-offs, biases, and techniques for building systems that learn from the signals users actually generate.

## Introduction and Motivation

Netflix has star ratings, but most users don't rate. They watch—or stop watching. Clicks are abundant; ratings are sparse. But clicks are noisy: users click accidentally, get distracted, or click without engaging.

Choosing the right signal determines what your model optimizes. Optimize for clicks? You might get clickbait. Optimize for ratings? You have sparse data and selection bias. Understanding these trade-offs is crucial for building systems that actually serve users.

## Types of Feedback

### Explicit Feedback

Direct user preferences:
- Star ratings (1-5)
- Thumbs up/down
- Reviews
- Survey responses

**Pros**: Clear signal of preference
**Cons**: Sparse (few users rate), selection bias (satisfied/dissatisfied rate more)

### Implicit Feedback

Inferred from behavior:
- Clicks, views, plays
- Dwell time, scroll depth
- Purchases, adds-to-cart
- Skips, exits

**Pros**: Abundant, captures all users
**Cons**: Noisy, hard to interpret (click ≠ like)

## Mathematical Differences

### Explicit Feedback Modeling

Predict rating directly:
$$\hat{r}_{ui} = f(\mathbf{p}_u, \mathbf{q}_i)$$

Minimize squared error on observed ratings:
$$\mathcal{L} = \sum_{(u,i) \in \text{observed}} (r_{ui} - \hat{r}_{ui})^2$$

### Implicit Feedback Modeling

Binary outcomes: interaction happened (1) or not (0).
But unobserved ≠ negative—just **unknown**.

Weighted matrix factorization:
$$\mathcal{L} = \sum_{u,i} c_{ui}(p_{ui} - \mathbf{p}_u^T\mathbf{q}_i)^2$$

where $c_{ui} = 1 + \alpha \cdot (\text{interaction count})$ gives higher confidence to observed interactions.

### Bayesian Personalized Ranking (BPR)

Learn from pairwise comparisons:
$$\mathcal{L}_{BPR} = -\sum_{u,i,j} \ln\sigma(\hat{r}_{ui} - \hat{r}_{uj})$$

where $(i, j)$ pairs have observed $i$ and unobserved $j$ for user $u$.

## Key Considerations

### Position Bias

Users click higher-ranked items regardless of relevance:
$$P(\text{click}|i) = P(\text{relevant}|i) \cdot P(\text{examine}|position_i)$$

Items shown higher get more clicks—not because they're better.

**Solutions**:
- Inverse propensity weighting
- Position-aware models
- Randomized exposure logs

### Selection Bias

Users rate items they've already filtered:
- People who hate horror movies don't rate horror movies
- Missing ratings aren't random

**Solutions**:
- Model missing-not-at-random
- Use implicit signals to debias
- Matrix completion with MNAR

### Engagement ≠ Satisfaction

Clicks and dwell time don't always mean satisfaction:
- Clickbait gets clicks but annoys users
- Addictive content maximizes engagement, not wellbeing

**Solutions**:
- Multi-signal models (clicks + dwell + returns)
- Long-term outcome optimization
- User surveys for ground truth

## Practical Implementation

```python
import numpy as np
import torch
import torch.nn as nn

class ImplicitMF(nn.Module):
    """Weighted matrix factorization for implicit feedback"""

    def __init__(self, n_users, n_items, n_factors=64, alpha=40):
        super().__init__()
        self.user_factors = nn.Embedding(n_users, n_factors)
        self.item_factors = nn.Embedding(n_items, n_factors)
        self.alpha = alpha

        # Initialize small values
        nn.init.normal_(self.user_factors.weight, std=0.01)
        nn.init.normal_(self.item_factors.weight, std=0.01)

    def forward(self, user_ids, item_ids):
        user_emb = self.user_factors(user_ids)
        item_emb = self.item_factors(item_ids)
        return (user_emb * item_emb).sum(dim=1)

    def weighted_loss(self, user_ids, item_ids, interactions):
        """Weighted MSE: higher weight for observed interactions"""
        predictions = self.forward(user_ids, item_ids)

        # Preference: 1 if any interaction, 0 otherwise
        preferences = (interactions > 0).float()

        # Confidence: higher for observed interactions
        confidence = 1 + self.alpha * interactions

        loss = (confidence * (preferences - predictions) ** 2).mean()
        return loss


class BPRLoss(nn.Module):
    """Bayesian Personalized Ranking loss"""

    def forward(self, pos_scores, neg_scores):
        diff = pos_scores - neg_scores
        loss = -torch.log(torch.sigmoid(diff) + 1e-10).mean()
        return loss


# Training loop with negative sampling
def train_implicit_model(model, train_data, n_epochs=10, neg_samples=4):
    """
    train_data: dict with 'user_id', 'item_id', 'interaction_count'
    """
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    bpr_loss = BPRLoss()

    all_items = set(range(model.item_factors.num_embeddings))

    for epoch in range(n_epochs):
        total_loss = 0
        n_batches = 0

        # For each observed interaction
        for user_id, item_id, count in zip(
            train_data['user_id'],
            train_data['item_id'],
            train_data['interaction_count']
        ):
            optimizer.zero_grad()

            # Positive item
            pos_score = model(
                torch.tensor([user_id]),
                torch.tensor([item_id])
            )

            # Sample negative items
            neg_items = np.random.choice(
                list(all_items - {item_id}),
                neg_samples,
                replace=False
            )
            neg_scores = model(
                torch.tensor([user_id] * neg_samples),
                torch.tensor(neg_items)
            )

            # BPR loss
            loss = bpr_loss(
                pos_score.expand(neg_samples),
                neg_scores
            )

            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            n_batches += 1

        print(f"Epoch {epoch+1}, Loss: {total_loss/n_batches:.4f}")
```

## Converting Between Signal Types

### Binarization

Convert explicit ratings to implicit:
- Ratings ≥ 4 → positive
- Ratings < 3 → negative
- 3 → maybe exclude

### Confidence Weighting

Weight implicit signals by strength:
- View count
- Dwell time
- Purchase amount

### Multi-Signal Fusion

Combine multiple signals:
$$\text{score} = \alpha \cdot \text{clicks} + \beta \cdot \text{dwell} + \gamma \cdot \text{purchase}$$

Or train multi-task model with shared representations.

## Best Practices

1. **Start with abundant signals**: Implicit signals enable model iteration even without ratings.

2. **Debias position effects**: Position-aware models or IPW essential for click data.

3. **Validate with explicit**: Use explicit feedback (when available) to validate implicit models.

4. **Multi-objective**: Optimize multiple signals to avoid gaming single metrics.

5. **Long-term outcomes**: Correlate short-term signals with long-term retention.

## Real-World Examples

| Platform | Primary Signal | Challenge |
|----------|---------------|-----------|
| Netflix | Watch time, completion | Different genres have different lengths |
| Spotify | Skips, completions, saves | Skip could mean bad song or bad mood |
| Amazon | Purchases, cart adds | Purchase ≠ satisfaction |
| YouTube | Watch time, engagement | Addictive ≠ valuable |
| Airbnb | Bookings, contact rates | Convert funnel stages |

## Summary

Implicit and explicit feedback require different modeling approaches. Key takeaways:

- Explicit is clean but sparse; implicit is abundant but noisy
- Position bias and selection bias affect all feedback types
- BPR and weighted MF handle implicit feedback effectively
- Combine signals and validate with long-term outcomes

**Further Reading**:
- Hu, Koren & Volinsky, "Collaborative Filtering for Implicit Feedback Datasets"
- Rendle et al., "BPR: Bayesian Personalized Ranking from Implicit Feedback"
- Chen et al., "Bias and Debias in Recommender System: A Survey and Future Directions"
