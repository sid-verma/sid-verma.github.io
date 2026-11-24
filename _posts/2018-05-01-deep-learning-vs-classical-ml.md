---
title: "When Deep Learning Wins (And When It Doesn't): A Practitioner's Guide"
date: 2018-05-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - deep-learning
  - classical-ml
  - neural-networks
  - model-selection
---

Deep learning has achieved remarkable success in vision, language, and speech—but it's not always the right choice. Understanding when to use neural networks versus classical ML methods is crucial for efficient, effective ML engineering. This guide provides practical decision frameworks based on data characteristics and constraints.

## Introduction and Motivation

On one project, our team spent weeks wiring up a deep model for a tabular prediction task: tuning architectures, scheduling GPUs, fighting exploding gradients. A baseline engineer trained a gradient boosting model in an afternoon and quietly beat us on every metric.

That experience wasn't unique. In many real-world systems, especially on structured data, **the right answer is still \"trees and linear models\"**, not a giant neural network. Deep learning is a superpower for the right problems—rich unstructured inputs, transfer learning, multimodal signals—but a liability when misapplied.

This post is an opinionated guide to when deep learning actually wins, and when you should **default to classical ML**. The goal is to help you ship faster, with simpler systems, by matching the tool to the problem instead of chasing hype.

## Intuition and Core Concepts

**Classical ML** algorithms (linear models, trees, SVMs) require:
- Feature engineering (human-designed representations)
- Work well with structured, tabular data
- Scale well to millions of examples
- Provide interpretability and fast inference

**Deep Learning** excels when:
- Raw data has spatial/temporal/sequential structure
- Features are hard to engineer (images, text, audio)
- Massive labeled datasets are available
- Compute resources are abundant

The key distinction: **classical ML requires good features; deep learning learns features**.

## Mathematical Foundations

### Representation Learning

Deep networks learn hierarchical representations:

$$h^{(l)} = \sigma(W^{(l)}h^{(l-1)} + b^{(l)})$$

Early layers learn low-level features (edges in images); later layers learn semantics (faces, objects).

### Universal Approximation

Neural networks can approximate any continuous function (given sufficient width). But approximation capacity ≠ learning capacity—generalization depends on data, optimization, and architecture.

### Inductive Bias

Every model encodes assumptions:
- **Linear models**: Target is linear combination of features
- **Decision trees**: Axis-aligned decision boundaries
- **CNNs**: Local spatial patterns, translation invariance
- **Transformers**: Attention over sequences

Match inductive bias to problem structure.

## Key Algorithms and Methods

### When Classical ML Wins

**Tabular data**: Gradient boosting (XGBoost, LightGBM) consistently beats neural networks in competitions and production. Why?
- Tree splits naturally handle feature interactions
- Robust to feature scale and missing values
- Train faster, require less tuning

**Small datasets** (<10,000 examples): Regularized linear models or small ensembles prevent overfitting. Deep networks need data to learn representations.

**Interpretability required**: Linear models, decision trees, and SHAP explanations beat neural network black boxes.

### When Deep Learning Wins

**Images**: CNNs exploit spatial locality and translation invariance. ImageNet pre-training transfers across tasks.

**Text**: Transformers capture long-range dependencies. Pre-trained LLMs (GPT, BERT) enable few-shot learning.

**Sequential data**: RNNs/Transformers model temporal dynamics in time series, speech, video.

**Multimodal**: Combining vision + language + audio requires learned representations.

## Practical Implementation

```python
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score
import torch
import torch.nn as nn
import numpy as np

# Generate synthetic tabular data
X, y = make_classification(
    n_samples=10000, n_features=20, n_informative=10,
    n_redundant=5, random_state=42
)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Classical ML: Gradient Boosting
gb = GradientBoostingClassifier(n_estimators=100)
gb.fit(X_train, y_train)
print(f"Gradient Boosting: {accuracy_score(y_test, gb.predict(X_test)):.3f}")

# Classical ML: Logistic Regression
lr = LogisticRegression(max_iter=1000)
lr.fit(X_train, y_train)
print(f"Logistic Regression: {accuracy_score(y_test, lr.predict(X_test)):.3f}")

# Deep Learning: Simple MLP
class MLP(nn.Module):
    def __init__(self, input_dim):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )

    def forward(self, x):
        return self.layers(x)

# Train MLP
model = MLP(20)
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
criterion = nn.BCELoss()

X_train_t = torch.FloatTensor(X_train)
y_train_t = torch.FloatTensor(y_train).unsqueeze(1)

for epoch in range(100):
    optimizer.zero_grad()
    outputs = model(X_train_t)
    loss = criterion(outputs, y_train_t)
    loss.backward()
    optimizer.step()

model.eval()
with torch.no_grad():
    preds = (model(torch.FloatTensor(X_test)) > 0.5).numpy()
    print(f"MLP: {accuracy_score(y_test, preds):.3f}")

# Result: Gradient Boosting typically wins on tabular data!
```

## Case Study: When Deep Learning Lost to Gradient Boosting

Consider a (lightly anonymized) churn prediction problem at a consumer subscription company:

- **Data**: ~200k users, 150 tabular features (billing history, product usage, geography, device)
- **Label**: Churned in the next 30 days (yes/no)
- **Constraints**: Daily retrains, sub-10ms online latency, need for basic feature-level explanations

Two paths emerged:

- **Path A (deep learning)**:
  - Several weeks building an MLP with embeddings for categoricals
  - Required careful normalization, regularization, learning-rate tuning
  - Harder to debug when performance regressed
- **Path B (gradient boosting)**:
  - A day to assemble a feature matrix and train XGBoost/LightGBM
  - Easy to iterate: change features, re-train, examine feature importances
  - Straightforward to deploy in existing scoring infra

When evaluated on a holdout set:

- Gradient boosting outperformed the MLP on AUC and calibration
- The tree model was **10x faster** at inference and **trivial to ship**
- Stakeholders could understand SHAP-style explanations for the tree model, but not the MLP

The lesson was not \"deep learning is bad\"—it was that **for medium-sized tabular problems with tight latency and interpretability requirements, starting with deep learning is usually a mistake**. The right move was:

1. Ship a strong tree-based baseline
2. Explore neural nets only if there was a clear upside (e.g., richer behavioral sequences, text, or images to ingest)

## Common Pitfalls and Best Practices

1. **Defaulting to deep learning**: Start simple. Establish baselines with linear models and trees before trying neural networks.

2. **Underestimating feature engineering**: On tabular data, good features + simple model often beats raw data + complex model.

3. **Ignoring transfer learning**: For vision/NLP, pre-trained models (ResNet, BERT) beat training from scratch.

4. **Wrong architecture for domain**: CNNs for tabular data rarely works. Match architecture to data structure.

5. **Insufficient regularization**: Deep networks on small data need aggressive dropout, weight decay, early stopping.

## Real-World Applications

| Domain | Best Approach | Reason |
|--------|--------------|--------|
| Credit scoring | Gradient boosting | Tabular, interpretability |
| Image classification | CNN + transfer learning | Spatial structure |
| Fraud detection | Gradient boosting | Tabular, fast inference |
| Machine translation | Transformers | Sequential, attention |
| Demand forecasting | Gradient boosting or DeepAR | Depends on data scale |
| Medical imaging | CNN + transfer learning | Visual patterns |
| Customer churn | Logistic regression | Interpretability |
| Speech recognition | Transformers + wav2vec | Audio sequences |

## Advanced Topics and Extensions

### TabNet and Deep Learning for Tabular

Recent work adapts deep learning for tabular data:
- **TabNet**: Attention-based feature selection
- **NODE**: Neural Oblivious Decision Ensembles
- **FT-Transformer**: Transformers for tabular

Results: Competitive but rarely beat well-tuned gradient boosting.

### Neural Network + Gradient Boosting Hybrids

Combine approaches:
- Use neural networks to learn embeddings for categorical features
- Feed embeddings into gradient boosting
- Example: entity embeddings from Categorical Embeddings

### AutoML

Let algorithms choose:
- AutoGluon, Auto-sklearn, H2O AutoML
- Often ensemble neural networks + gradient boosting

## Comparison with Related Methods

| Criterion | Classical ML | Deep Learning |
|-----------|-------------|---------------|
| Data volume needed | Low (1K-100K) | High (100K+) |
| Training time | Minutes | Hours/Days |
| Inference speed | Fast | Slower |
| Interpretability | High | Low |
| Tabular data | **Winner** | Competitive |
| Images/Text/Audio | Limited | **Winner** |
| Feature engineering | Required | Optional |

## Summary and Further Reading

Choosing between deep learning and classical ML depends on data type, scale, and constraints. Key takeaways:

- **Gradient boosting dominates tabular data** under realistic constraints
- **Deep learning wins** when data has spatial/temporal structure and you can exploit transfer learning
- **Start simple**: add complexity only when a baseline is clearly insufficient

### Checklist: Should You Reach for Deep Learning?

Before defaulting to a neural network, ask:

1. **Data type**
   - Is your primary signal images, text, audio, logs, or long sequences?
   - If it's mostly tabular, why won’t gradient boosting suffice?

2. **Data volume**
   - Do you have enough labeled data to justify learning rich representations?
   - If you have \<10–50k labeled examples, can you leverage pre-training instead?

3. **Constraints**
   - Latency budget per request? (e.g., \<10ms vs 200ms+)
   - Training/inference cost constraints?
   - Do you need human-readable explanations?

4. **Baselines**
   - Have you trained at least:
     - A regularized linear model
     - A tree ensemble (XGBoost / LightGBM / CatBoost)?
   - Are they clearly underperforming in a way that deep learning can plausibly fix?

5. **Organizational readiness**
   - Do you have infra for GPUs, monitoring, and experiment loops for complex models?
   - Are you okay with slower iteration cycles?

If you can't answer \"yes\" to several of these, **ship a strong classical ML baseline first**, and treat deep learning as a follow-up experiment—not the starting point.

**Further Reading**:
- Shwartz-Ziv & Armon, "Tabular Data: Deep Learning is Not All You Need" (2022)
- Grinsztajn et al., "Why do tree-based models still outperform deep learning on tabular data?" (NeurIPS 2022)
- Gorishniy et al., "Revisiting Deep Learning Models for Tabular Data" (2021)
