---
title: "Pareto Optimal ML: Balancing Multiple Objectives in Machine Learning"
date: 2022-06-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - multi-objective
  - optimization
  - pareto
  - machine-learning
---

Real-world ML problems rarely have a single objective. Recommenders balance relevance and diversity. Ranking balances engagement and revenue. Models trade off accuracy and latency. Multi-objective optimization provides frameworks for navigating these trade-offs systematically.

## Introduction and Motivation

Single-objective optimization is comfortable: maximize accuracy, minimize loss. But production systems serve multiple masters. A recommendation system that maximizes clicks might show only popular items, sacrificing diversity. A model that maximizes accuracy might be too slow for real-time serving.

Understanding Pareto optimality and multi-objective techniques helps you make principled trade-offs rather than ad-hoc compromises.

## Intuition and Core Concepts

**Multiple objectives often conflict**: Improving one degrades another. You can't maximize relevance AND maximize revenue AND maximize diversity simultaneously.

**Pareto optimality**: Solution A dominates B if A is at least as good on all objectives and strictly better on at least one. Pareto-optimal solutions aren't dominated by any other solution.

**Pareto frontier**: The set of Pareto-optimal solutions. Each point represents a different trade-off—none is objectively "best."

## Mathematical Foundations

### Multi-Objective Problem

$$\min_x \mathbf{f}(x) = [f_1(x), f_2(x), ..., f_k(x)]^T$$

No single optimal solution; seek Pareto frontier.

### Pareto Dominance

Solution $x$ dominates $y$ ($x \prec y$) if:
- $f_i(x) \leq f_i(y)$ for all $i$
- $f_j(x) < f_j(y)$ for at least one $j$

### Weighted Sum Scalarization

Convert to single objective:
$$\min_x \sum_{i=1}^k w_i f_i(x)$$

Different weights $w$ trace different points on Pareto frontier.

### Constraint Approach

Optimize one objective, constrain others:
$$\min_x f_1(x) \quad \text{s.t.} \quad f_i(x) \leq \epsilon_i \text{ for } i > 1$$

## Key Algorithms and Methods

### Linear Scalarization

Simplest approach: weighted sum of objectives.

Pros: Simple, convex problems well-behaved
Cons: Can't find non-convex Pareto regions

### ε-Constraint Method

Fix constraints on secondary objectives, optimize primary:

```python
def epsilon_constraint(f1, f2, epsilon, optimizer):
    """Optimize f1 subject to f2 <= epsilon"""
    def objective(x):
        if f2(x) > epsilon:
            return float('inf')  # Infeasible
        return f1(x)
    return optimizer(objective)
```

### Multi-Gradient Methods

For neural networks, compute gradients for each objective:
$$\nabla_\theta f_i(\theta)$$

Find update direction that improves all (or most) objectives:
- **MGDA**: Minimum-norm solution in gradient cone
- **PCGrad**: Project conflicting gradients

### Evolutionary Algorithms

NSGA-II, MOEA/D for exploring Pareto frontiers:
1. Maintain population of solutions
2. Evolve toward Pareto frontier
3. Maintain diversity along frontier

## Practical Implementation

```python
import numpy as np
from scipy.optimize import minimize
import matplotlib.pyplot as plt

# Example: Relevance vs. Diversity trade-off

def relevance_score(weights, item_relevances):
    """Higher is better"""
    return np.dot(weights, item_relevances)

def diversity_score(weights, item_features):
    """Larger spread = more diverse"""
    selected_features = weights[:, None] * item_features
    # Variance as diversity proxy
    return np.var(selected_features[weights > 0.1], axis=0).sum()

def pareto_frontier(n_items=20, n_points=50):
    """Trace Pareto frontier by varying weights"""
    np.random.seed(42)

    # Item properties
    item_relevances = np.random.rand(n_items)
    item_features = np.random.rand(n_items, 5)

    # Scalarization weights
    alphas = np.linspace(0.01, 0.99, n_points)

    results = []
    for alpha in alphas:
        def objective(weights):
            rel = -relevance_score(weights, item_relevances)  # Minimize negative
            div = -diversity_score(weights, item_features)
            return alpha * rel + (1 - alpha) * div

        # Constraint: weights sum to 1
        constraints = {'type': 'eq', 'fun': lambda w: np.sum(w) - 1}
        bounds = [(0, 1)] * n_items

        x0 = np.ones(n_items) / n_items
        result = minimize(objective, x0, method='SLSQP',
                         bounds=bounds, constraints=constraints)

        if result.success:
            w = result.x
            rel = relevance_score(w, item_relevances)
            div = diversity_score(w, item_features)
            results.append((rel, div, w))

    return results

# Compute Pareto frontier
frontier = pareto_frontier()
relevances = [r[0] for r in frontier]
diversities = [r[1] for r in frontier]

# Plot
plt.figure(figsize=(10, 6))
plt.scatter(relevances, diversities, c=range(len(frontier)), cmap='viridis')
plt.xlabel('Relevance')
plt.ylabel('Diversity')
plt.title('Pareto Frontier: Relevance vs. Diversity')
plt.colorbar(label='Trade-off point')
plt.savefig('pareto_frontier.png', dpi=150)

# Multi-task neural network example
import torch
import torch.nn as nn

class MultiTaskModel(nn.Module):
    def __init__(self, input_dim, shared_dim, n_tasks):
        super().__init__()
        self.shared = nn.Sequential(
            nn.Linear(input_dim, shared_dim),
            nn.ReLU(),
            nn.Linear(shared_dim, shared_dim),
            nn.ReLU()
        )
        self.task_heads = nn.ModuleList([
            nn.Linear(shared_dim, 1) for _ in range(n_tasks)
        ])

    def forward(self, x):
        shared = self.shared(x)
        return [head(shared) for head in self.task_heads]

def multi_task_loss(outputs, targets, weights):
    """Weighted multi-task loss"""
    losses = [nn.MSELoss()(out, tgt) for out, tgt in zip(outputs, targets)]
    return sum(w * l for w, l in zip(weights, losses))
```

## Common Pitfalls and Best Practices

1. **Ignoring trade-offs**: Don't pretend single objective captures everything. Make trade-offs explicit.

2. **Wrong weights**: Weights in scalarization aren't intuitive. A/B test to find right balance.

3. **Local solutions**: Weighted sums may miss parts of Pareto frontier. Use multiple starting points.

4. **Changing preferences**: Business priorities shift. Build systems that easily adjust objective weights.

5. **Metric gaming**: When you optimize X, Y degrades. Monitor all relevant metrics.

## Real-World Applications

- **Recommendations**: Relevance + diversity + freshness + monetization
- **Ranking**: Engagement + revenue + user satisfaction
- **Modeling**: Accuracy + latency + memory
- **Ads**: CTR + revenue + user experience
- **Content moderation**: Precision + recall + fairness

## Advanced Topics

### Hyperparameter Multi-Objective

Tuning involves multiple objectives:
- Validation accuracy (maximize)
- Training time (minimize)
- Model size (minimize)

Use multi-objective Bayesian optimization.

### Fair ML as Multi-Objective

Balance accuracy across groups:
$$\min_\theta \{\text{Loss}(\theta), |\text{Accuracy}_A - \text{Accuracy}_B|\}$$

Pareto frontier shows accuracy-fairness trade-off.

### Online Multi-Objective

Bandit settings with multiple rewards:
- Pareto UCB algorithms
- Multi-objective Thompson Sampling

## Summary and Further Reading

Multi-objective optimization provides principled frameworks for trade-offs. Key takeaways:

- Real problems have multiple, conflicting objectives
- Pareto frontier captures the set of optimal trade-offs
- Scalarization, constraints, and evolutionary methods explore frontiers

**Further Reading**:
- Deb, *Multi-Objective Optimization Using Evolutionary Algorithms*
- Sener & Koltun, "Multi-Task Learning as Multi-Objective Optimization" (NeurIPS 2018)
- Miettinen, *Nonlinear Multiobjective Optimization*
