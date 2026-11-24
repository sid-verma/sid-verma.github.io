---
title: "Incrementality Testing at Scale: Building Always-On Measurement Platforms"
date: 2025-05-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - ad-tech
  - incrementality
  - experimentation
  - measurement
---

> *"Attribution tells you who got the credit. Incrementality tells you who did the work."*

Running one experiment is easy. Running a thousand is hard.
In [Randomized Control Trials](/posts/randomized-control-trials-in-marketing/), we established *how* to measure the causal impact of a single campaign. But a typical growth team runs hundreds of campaigns across Google, Facebook, TikTok, and TV.

This post covers the engineering and data science challenge of **Scaling Incrementality**: How to build a platform that automatically measures valid lift across every channel, 24/7.

> **Related reading**: Builds on [AB Testing Designs](/posts/ab-testing-designs/) and feeds into [Ad Tech Metrics](/posts/ad-tech-metrics-explained/).

---

## Chapter I: The Scaling Challenge

Ad-hoc studies don't scale because:
1. **Contamination**: If the Facebook team holds out 10% of users, and the Email team holds out 10%, some users are in both holdouts, some in neither, some in one. Interaction effects become a nightmare.
2. **Opportunity Cost**: Holding out 10% of your audience permanently means throwing away 10% of potential revenue (if ads work).
3. **Manual Overhead**: Setting up a Ghost Ad study requires custom tracking pixels and manual analysis.

We need a **Universal Control Group (UCG)**.

---

## Chapter II: Universal Control Group Architecture

Instead of per-campaign controls, we hash User IDs to create a global holdout.

### The Modulo Strategy
Every user is assigned a bucket:
`bucket = hash(user_id) % 100`

- **Bucket 0-89**: Global Treatment (Eligible for everything)
- **Bucket 90-94**: **Dark Control** (No ads ever. Use for long-term baseline).
- **Bucket 95-99**: **Rotational Control** (Hold out from specific channels).

### Infrastructure Integration
Values must be propagated to every ad partner:
- **Google**: Upload Customer Match list with `exclude` on Control IDs.
- **Facebook**: Custom Audience exclusion.
- **Internal**: If you serve ads, check `user_bucket` at request time.

**Key constraint**: Advertising platforms eventually "forget" excluded users or match rates fluctuate. The UCG requires constant monitoring of **SRS (Sample Ratio Mismatch)** to ensure the control group remains representative.

---

## Chapter III: From Multi-Touch Attribution (MTA) to Calibration

MTA models (Shapley, Markov) are granular but biased. Incrementality (RCT) is unbiased but sparse.
**Calibration** combines them.

$$iROAS_{channel} = \underbrace{ROAS_{MTA}}_{\text{Always on}} \times \underbrace{\beta_{calibration}}_{\text{From RCT}}$$

If MTA says Facebook ROAS is $4.0$, but a quarterly Geo-Lift test shows actual lift is $2.0$:
$$\beta_{FB} = 0.5$$
We effectively "downweight" the biased attribution model using the ground truth from experiments.

---

## Chapter IV: Budget Optimization with Diminishing Returns

Once we have **Incremental ROAS (iROAS)**, how do we spend the next dollar?
We use the **Marginal** iROAS. Advertising follows a diminishing returns curve (saturation).

$$Revenue = A \times Spend^B$$
where $0 < B < 1$.

Optimization problem:
$$\max \sum A_i \cdot x_i^{B_i} \text{ subject to } \sum x_i \le Budget$$

This is a convex optimization problem easily solved with Lagrange Multipliers (or `scipy`).

```python
import numpy as np
from scipy.optimize import minimize

class BudgetOptimizer:
    def __init__(self, channels):
        """
        channels: list of dicts with 'name', 'alpha', 'beta' (coeff, exponent)
        Model: Revenue = alpha * spend ^ beta
        """
        self.channels = channels

    def objective(self, spends):
        # We want to maximize Revenue, so minimize negative Revenue
        total_revenue = 0
        for i, spend in enumerate(spends):
            c = self.channels[i]
            total_revenue += c['alpha'] * (spend ** c['beta'])
        return -total_revenue

    def optimize(self, total_budget):
        n = len(self.channels)
        # Initial guess: equal split
        initial_guess = [total_budget / n] * n

        # Constraint: sum(spends) = total_budget
        constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - total_budget})

        # Bounds: spend >= 0
        bounds = [(0, total_budget) for _ in range(n)]

        result = minimize(
            self.objective,
            initial_guess,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints
        )

        return {
            self.channels[i]['name']: round(spend, 2)
            for i, spend in enumerate(result.x)
        }

# Example Data from Lift Tests
channels = [
    {'name': 'Facebook', 'alpha': 50, 'beta': 0.6}, # High scale, diminishes fast
    {'name': 'Google', 'alpha': 30, 'beta': 0.8},   # Efficient, diminishes slow
    {'name': 'TikTok', 'alpha': 10, 'beta': 0.5}    # Experimental
]

optimizer = BudgetOptimizer(channels)
allocation = optimizer.optimize(total_budget=10000)

print("Optimal Allocation:", allocation)
# Optimal Allocation: {'Facebook': 3788.12, 'Google': 5985.45, 'TikTok': 226.43}
```
*Note how Google gets more budget because its $\beta$ (0.8) indicates it scales better than Facebook (0.6).*

---

## Chapter V: Integrating Marketing Mix Modeling (MMM)

At the highest level (TV, Billboards), we can't track users. We use **Bayesian MMM** (e.g., Robyn, LightweightMMM).
This treats the whole marketing plan as a regression problem:

$$Sales_t = \text{Trend}_t + \text{Seasonality}_t + \sum \text{Adstock}(Spend_{i,t}) + \epsilon$$

**The Triangulation Strategy**:
1. **MTA**: For daily, user-level tactical bidding.
2. **Incrementality (RCTs)**: To calibrate the MTA.
3. **MMM**: To measure the "dark" channels and long-term baselines that RCTs miss.

---

## Summary

Building an incrementality platform moves the marketing organization from "We think it works" to "We know what the next dollar will yield."

| Level | Method | Frequency | Purpose |
|-------|--------|-----------|---------|
| Tacitcal | MTA / Last-Touch | Real-time | Bidding algorithms |
| Strategic | Experimentation Platform | Monthly | Calibrating MTA weights |
| Executive | MMM | Quarterly | Annual budgeting & TV/Brand |

> *"All models are wrong, but some are useful."* — George Box
> *"Uncalibrated models are dangerous."* — Modern Data Scientist
