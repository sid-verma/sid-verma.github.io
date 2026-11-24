---
title: "Uncovering Latent Factors: Matrix Factorization for Recommendations and Beyond"
date: 2018-11-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - matrix-factorization
  - svd
  - recommendations
  - dimensionality-reduction
---

Matrix factorization revolutionized recommender systems and earned fame through the Netflix Prize. By decomposing user-item matrices into latent factors, it captures hidden patterns in sparse data. The technique extends far beyond recommendations to topic modeling, feature learning, and data imputation.

## Introduction and Motivation

The Netflix Prize ($1 million competition, 2006-2009) thrust matrix factorization into the spotlight. The winning solution relied heavily on SVD-based techniques that outperformed all previous methods. Today, these techniques remain foundational in recommendation systems at Spotify, Amazon, and Netflix.

Understanding matrix factorization develops intuition for representation learning more broadly. The idea of learning latent factors underlies word embeddings, topic models, and even deep learning's hidden layers.

## Intuition and Core Concepts

Imagine a matrix where rows are users, columns are movies, and entries are ratings. Most entries are missing—users only rate a few movies. Matrix factorization assumes a low-rank structure: user preferences and movie attributes can be captured by a small number of latent factors.

**Key insight**: A 5-star rating of *The Matrix* might decompose into: User likes sci-fi (+) × Movie is sci-fi (+) + User likes action (+) × Movie is action (+). The latent factors capture these hidden attributes.

Mathematically, we factor the rating matrix $\mathbf{R} \in \mathbb{R}^{m \times n}$ as:
$$\mathbf{R} \approx \mathbf{P}\mathbf{Q}^T$$

where $\mathbf{P} \in \mathbb{R}^{m \times k}$ (user factors) and $\mathbf{Q} \in \mathbb{R}^{n \times k}$ (item factors), with $k \ll \min(m, n)$.

## Mathematical Foundations

### Singular Value Decomposition (SVD)

Classical SVD factors a matrix exactly:
$$\mathbf{R} = \mathbf{U}\mathbf{\Sigma}\mathbf{V}^T$$

For recommendations, we use truncated SVD keeping only top-$k$ singular values:
$$\mathbf{R}_k = \mathbf{U}_k\mathbf{\Sigma}_k\mathbf{V}_k^T$$

This gives the best rank-$k$ approximation in Frobenius norm.

### Funk SVD (for Sparse Data)

With missing entries, classical SVD doesn't apply. Simon Funk's approach fits factors by minimizing error on observed ratings:

$$\min_{\mathbf{P}, \mathbf{Q}} \sum_{(u,i) \in \text{observed}} (R_{ui} - \mathbf{p}_u^T\mathbf{q}_i)^2 + \lambda(\|\mathbf{p}_u\|^2 + \|\mathbf{q}_i\|^2)$$

### Biased Matrix Factorization

Add biases to capture systematic effects:
$$\hat{R}_{ui} = \mu + b_u + b_i + \mathbf{p}_u^T\mathbf{q}_i$$

- $\mu$: Global average rating
- $b_u$: User bias (tough vs. lenient rater)
- $b_i$: Item bias (popular vs. niche item)

## Key Algorithms and Methods

### Stochastic Gradient Descent (SGD)

For each observed rating $(u, i, R_{ui})$:

1. Compute prediction error: $e_{ui} = R_{ui} - \hat{R}_{ui}$
2. Update factors:
   - $\mathbf{p}_u \leftarrow \mathbf{p}_u + \alpha(e_{ui}\mathbf{q}_i - \lambda\mathbf{p}_u)$
   - $\mathbf{q}_i \leftarrow \mathbf{q}_i + \alpha(e_{ui}\mathbf{p}_u - \lambda\mathbf{q}_i)$

SGD scales well but may converge slowly.

### Alternating Least Squares (ALS)

Fix one factor matrix, solve for the other in closed form:

1. Fix $\mathbf{Q}$, solve for each $\mathbf{p}_u$:
   $$\mathbf{p}_u = (\mathbf{Q}_{I_u}^T\mathbf{Q}_{I_u} + \lambda\mathbf{I})^{-1}\mathbf{Q}_{I_u}^T\mathbf{r}_u$$
2. Fix $\mathbf{P}$, solve for each $\mathbf{q}_i$

ALS parallelizes easily and handles implicit feedback well.

### Non-negative Matrix Factorization (NMF)

Constrain factors to be non-negative:
$$\mathbf{R} \approx \mathbf{W}\mathbf{H}^T \quad \text{where } W_{ij} \geq 0, H_{ij} \geq 0$$

Produces interpretable, additive parts (topics in text, components in images).

## Practical Implementation

```python
import numpy as np
from scipy.sparse import csr_matrix
from scipy.sparse.linalg import svds
import matplotlib.pyplot as plt

# Create synthetic ratings matrix with latent structure
np.random.seed(42)
n_users, n_items, k_true = 500, 200, 5

# True latent factors
P_true = np.random.randn(n_users, k_true)
Q_true = np.random.randn(n_items, k_true)
R_full = P_true @ Q_true.T + np.random.randn(n_users, n_items) * 0.5

# Create sparse observations (10% density)
mask = np.random.random((n_users, n_items)) < 0.1
R_observed = R_full * mask

# SVD-based matrix factorization
k = 10  # Number of factors to learn
U, s, Vt = svds(csr_matrix(R_observed), k=k)
R_pred = U @ np.diag(s) @ Vt

# Funk SVD via gradient descent
class FunkSVD:
    def __init__(self, k=10, alpha=0.01, lambda_reg=0.1, n_epochs=20):
        self.k = k
        self.alpha = alpha
        self.lambda_reg = lambda_reg
        self.n_epochs = n_epochs

    def fit(self, R, mask):
        m, n = R.shape
        self.P = np.random.randn(m, self.k) * 0.1
        self.Q = np.random.randn(n, self.k) * 0.1
        self.mu = R[mask].mean()

        for epoch in range(self.n_epochs):
            for u in range(m):
                for i in range(n):
                    if mask[u, i]:
                        error = R[u, i] - (self.mu + self.P[u] @ self.Q[i])
                        self.P[u] += self.alpha * (error * self.Q[i] - self.lambda_reg * self.P[u])
                        self.Q[i] += self.alpha * (error * self.P[u] - self.lambda_reg * self.Q[i])

            # Compute RMSE
            pred = self.mu + self.P @ self.Q.T
            rmse = np.sqrt(((R - pred)[mask] ** 2).mean())
            if (epoch + 1) % 5 == 0:
                print(f"Epoch {epoch+1}, RMSE: {rmse:.4f}")

        return self.mu + self.P @ self.Q.T

# Train Funk SVD
funk = FunkSVD(k=10, n_epochs=20)
R_funk = funk.fit(R_observed, mask)

# Evaluate prediction on held-out entries
test_mask = ~mask & (np.random.random((n_users, n_items)) < 0.1)
rmse_funk = np.sqrt(((R_full - R_funk)[test_mask] ** 2).mean())
print(f"\nTest RMSE (Funk SVD): {rmse_funk:.4f}")
```

## Common Pitfalls and Best Practices

1. **Choosing k**: Too small loses signal; too large overfits. Cross-validate on held-out ratings.

2. **Cold start**: New users/items have no factors. Use content features, popularity baseline, or hybrid approaches.

3. **Implicit vs. explicit**: Clicks ≠ ratings. Weight implicit feedback by confidence (see Hu et al., 2008).

4. **Regularization tuning**: λ trades off fitting observed data vs. preventing overfitting. Critical for sparse data.

5. **Scalability**: For millions of users/items, use distributed ALS (Spark MLlib) or approximate methods.

## Real-World Applications

- **Recommendations**: Netflix, Spotify, Amazon product recommendations
- **Collaborative filtering**: Any domain with user-item interactions
- **Topic modeling**: NMF on document-term matrices discovers topics
- **Image processing**: NMF for face parts, feature extraction
- **Missing data imputation**: Fill in survey responses, sensor readings
- **Dimensionality reduction**: Alternative to PCA for non-negative data

## Advanced Topics and Extensions

### Temporal Dynamics

User preferences change over time:
$$\hat{R}_{ui}(t) = \mu + b_u(t) + b_i(t) + \mathbf{p}_u(t)^T\mathbf{q}_i(t)$$

### Side Information (SVD++)

Incorporate implicit feedback into user factors:
$$\hat{R}_{ui} = \mu + b_u + b_i + \left(\mathbf{p}_u + \frac{1}{\sqrt{|N_u|}}\sum_{j \in N_u} \mathbf{y}_j\right)^T\mathbf{q}_i$$

where $N_u$ is items user $u$ has interacted with.

### Neural Matrix Factorization

Replace dot product with neural network:
$$\hat{R}_{ui} = f_\theta([\mathbf{p}_u; \mathbf{q}_i])$$

Captures non-linear user-item interactions.

## Comparison with Related Methods

| Method | Interpretability | Scalability | Cold Start |
|--------|-----------------|-------------|------------|
| SVD/ALS | Medium | High | Poor |
| NMF | High | Medium | Poor |
| Neural MF | Low | Medium | Poor |
| Content-based | High | High | **Good** |
| Hybrid | Medium | Medium | **Good** |

## Summary and Further Reading

Matrix factorization uncovers latent structure in sparse data. Key takeaways:

- Decompose user-item matrices into low-rank factors
- ALS and SGD are the main optimization approaches
- Add biases and regularization for better predictions

**Further Reading**:
- Koren, Bell & Volinsky, "Matrix Factorization Techniques for Recommender Systems"
- Hu, Koren & Volinsky, "Collaborative Filtering for Implicit Feedback Datasets"
- Lee & Seung, "Algorithms for Non-negative Matrix Factorization"
