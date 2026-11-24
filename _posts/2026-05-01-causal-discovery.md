---
title: "Causal Discovery: Algorithms for Learning Causal Structure from Data"
date: 2026-05-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - causal-discovery
  - causal-inference
  - structure-learning
  - graphical-models
---

Can we discover causal relationships from data alone? Causal discovery algorithms attempt to learn the causal graph structure—which variables cause which—from observational or experimental data. This is among the most ambitious goals in machine learning.

## Introduction and Motivation

Most causal inference assumes a known causal graph. But where does the graph come from? Domain experts provide structure, but this doesn't scale: we can't manually specify relationships among thousands of variables.

Causal discovery attempts to learn the graph from data. While impossible in complete generality (correlation doesn't imply causation), under certain assumptions, we can make progress.

## The Goal

Learn a Directed Acyclic Graph (DAG) $G$ where:
- Nodes are observed variables
- Edges represent direct causal effects
- $X \rightarrow Y$ means "X directly causes Y"

From this graph, we can:
- Identify confounders
- Determine adjustment sets
- Answer causal queries

## Key Assumptions

### Causal Markov Condition

Every variable is independent of its non-descendants given its parents:
$$X \perp \text{NonDesc}(X) | \text{Parents}(X)$$

### Faithfulness

All and only the independencies in the data are entailed by the graph. (No "accidental" cancellations.)

### Causal Sufficiency

No unmeasured common causes. (Can be relaxed with some algorithms.)

## Algorithm Families

### Constraint-Based (PC, FCI)

Use conditional independence tests to learn skeleton, then orient edges.

**PC Algorithm**:
1. Start fully connected
2. Remove edge X—Y if independent given some subset
3. Orient v-structures: X → Z ← Y when X—Z—Y and X,Y not adjacent
4. Apply orientation rules

### Score-Based (GES, CAM)

Search over DAG space, maximizing a score (BIC, BGe):
$$\text{Score}(G) = \log P(D|G) - \text{complexity}(G)$$

**GES (Greedy Equivalence Search)**:
1. Forward phase: Add edges greedily
2. Backward phase: Remove edges greedily

### Functional Causal Models

Assume specific functional form (linear, ANM), exploit asymmetries.

**LiNGAM (Linear Non-Gaussian Acyclic Model)**:
$$X = BX + \epsilon$$

Non-Gaussianity of errors enables causal direction identification.

## Practical Implementation

```python
import numpy as np
from scipy import stats
from itertools import combinations

class PCAlgorithm:
    """Simplified PC algorithm for causal discovery"""

    def __init__(self, alpha=0.05):
        self.alpha = alpha

    def conditional_independence_test(self, X, Y, Z, data):
        """Test X ⊥ Y | Z using partial correlation"""
        if len(Z) == 0:
            # Marginal correlation
            r, p = stats.pearsonr(data[X], data[Y])
            return p > self.alpha

        # Partial correlation via residuals
        X_resid = self._residualize(data[X], data[list(Z)])
        Y_resid = self._residualize(data[Y], data[list(Z)])
        r, p = stats.pearsonr(X_resid, Y_resid)
        return p > self.alpha

    def _residualize(self, y, X):
        """Get residuals of y ~ X"""
        from sklearn.linear_model import LinearRegression
        model = LinearRegression().fit(X, y)
        return y - model.predict(X)

    def learn_skeleton(self, data, variables):
        """Learn undirected skeleton"""
        n = len(variables)
        adjacency = {v: set(variables) - {v} for v in variables}
        separating_sets = {}

        depth = 0
        while depth < n - 1:
            for (X, Y) in list(combinations(variables, 2)):
                if Y not in adjacency[X]:
                    continue

                # Test conditioning sets of size 'depth'
                neighbors = adjacency[X] - {Y}
                if len(neighbors) < depth:
                    continue

                for Z in combinations(neighbors, depth):
                    if self.conditional_independence_test(X, Y, set(Z), data):
                        # Remove edge
                        adjacency[X].discard(Y)
                        adjacency[Y].discard(X)
                        separating_sets[(X, Y)] = set(Z)
                        separating_sets[(Y, X)] = set(Z)
                        break

            depth += 1

        return adjacency, separating_sets

    def orient_edges(self, adjacency, separating_sets, variables):
        """Orient v-structures and apply rules"""
        directed = {v: {'parents': set(), 'children': set()}
                   for v in variables}
        undirected = {v: set(adjacency[v]) for v in variables}

        # Find v-structures: X → Z ← Y where X,Y not adjacent
        for Z in variables:
            neighbors = list(undirected[Z])
            for (X, Y) in combinations(neighbors, 2):
                if Y in adjacency[X]:  # X and Y adjacent
                    continue

                sep_set = separating_sets.get((X, Y), set())
                if Z not in sep_set:  # Z is collider
                    # Orient X → Z ← Y
                    directed[Z]['parents'].add(X)
                    directed[Z]['parents'].add(Y)
                    directed[X]['children'].add(Z)
                    directed[Y]['children'].add(Z)
                    undirected[Z].discard(X)
                    undirected[Z].discard(Y)
                    undirected[X].discard(Z)
                    undirected[Y].discard(Z)

        return directed, undirected

    def fit(self, data):
        """Full PC algorithm"""
        variables = list(data.columns)

        # Step 1: Learn skeleton
        adjacency, sep_sets = self.learn_skeleton(data, variables)

        # Step 2: Orient edges
        directed, undirected = self.orient_edges(adjacency, sep_sets, variables)

        return {
            'directed': directed,
            'undirected': undirected,
            'adjacency': adjacency
        }


def generate_linear_scm_data(n_samples=1000):
    """Generate data from known linear SCM"""
    np.random.seed(42)

    # True graph: X → Y → Z, X → Z
    X = np.random.randn(n_samples)
    Y = 0.8 * X + np.random.randn(n_samples) * 0.5
    Z = 0.5 * X + 0.6 * Y + np.random.randn(n_samples) * 0.5
    W = np.random.randn(n_samples)  # Independent

    import pandas as pd
    return pd.DataFrame({'X': X, 'Y': Y, 'Z': Z, 'W': W})


# Example
data = generate_linear_scm_data()
pc = PCAlgorithm(alpha=0.05)
result = pc.fit(data)

print("Learned structure:")
print("Directed edges:")
for v, info in result['directed'].items():
    for parent in info['parents']:
        print(f"  {parent} → {v}")

print("\nUndirected edges:")
for v, neighbors in result['undirected'].items():
    for n in neighbors:
        if v < n:  # Print each edge once
            print(f"  {v} — {n}")
```

## Equivalence Classes

Many DAGs encode the same conditional independencies:

**Markov Equivalence Class**: DAGs with same skeleton and v-structures.

We can only learn up to the equivalence class from observational data. Interventional data can break ties.

## Challenges

### Finite Sample

Independence tests can fail with limited data. Use regularization, bootstrap.

### Scaling

$O(n^k)$ for conditioning set size $k$. Modern variants use local search.

### Latent Confounders

Violate causal sufficiency. FCI algorithm handles this but recovers less structure.

### Nonlinear Relationships

Linear methods miss nonlinear dependencies. Kernel-based, neural approaches exist.

## Summary

Causal discovery attempts to learn causal structure from data. Key takeaways:

- Constraint-based methods use independence tests
- Score-based methods search DAG space
- Can only learn up to equivalence class from observational data

**Further Reading**:
- Spirtes, Glymour & Scheines, *Causation, Prediction, and Search*
- Peters, Janzing & Schölkopf, *Elements of Causal Inference*
- Causal Discovery Toolbox (CDT) Python library
