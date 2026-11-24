---
title: "Uplift Modeling: Predicting Who Will Respond to Treatment"
date: 2024-06-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - uplift-modeling
  - cate
  - causal-ml
  - personalization
---

Not everyone responds to treatment the same way. Some customers buy regardless of promotions; others never will. Uplift modeling identifies who is persuadable—predicting individual treatment effects to optimize intervention targeting. This is causal machine learning in action.

## Introduction and Motivation

Sending promotions to everyone is wasteful. Loyal customers don't need discounts. Unlikely buyers won't convert regardless. The opportunity is in the middle: persuadable customers whose behavior *changes* because of marketing.

Uplift modeling (also called heterogeneous treatment effects or CATE estimation) predicts individual-level causal effects. Instead of "will this person buy?" it asks "will this person buy *because of* our intervention?"

## The Four Customer Segments

When you send a promotion, customers fall into four groups:

| Segment | Without Treatment | With Treatment | What to Do |
|---------|------------------|----------------|------------|
| **Sure Things** | Buy | Buy | Don't waste money |
| **Lost Causes** | Don't buy | Don't buy | Don't waste money |
| **Persuadables** | Don't buy | Buy | Target these! |
| **Do-Not-Disturb** | Buy | Don't buy | Avoid treatment |

Traditional models can't distinguish these. Uplift models can.

## Mathematical Framework

### Conditional Average Treatment Effect (CATE)

$$\tau(x) = \mathbb{E}[Y(1) - Y(0) | X = x]$$

The expected treatment effect for individuals with characteristics $x$.

### Fundamental Problem

We observe $Y_i = T_i \cdot Y_i(1) + (1-T_i) \cdot Y_i(0)$

Never both potential outcomes for same individual. Must estimate counterfactuals.

### Transformed Outcome

Under unconfoundedness with propensity $e(x)$:
$$\tilde{Y} = \frac{T \cdot Y}{e(X)} - \frac{(1-T) \cdot Y}{1-e(X)}$$

$\mathbb{E}[\tilde{Y}|X] = \tau(X)$. Regress $\tilde{Y}$ on $X$ to estimate CATE.

## Key Methods

### T-Learner (Two-Model)

Train separate models for treatment and control:
$$\hat{\tau}(x) = \hat{\mu}_1(x) - \hat{\mu}_0(x)$$

Simple but sensitive to model capacity differences.

### S-Learner (Single Model)

Single model with treatment as feature:
$$\hat{\mu}(x, t) = f(x, t)$$
$$\hat{\tau}(x) = \hat{\mu}(x, 1) - \hat{\mu}(x, 0)$$

May underestimate effects if treatment signal is weak.

### X-Learner

1. Fit $\hat{\mu}_0, \hat{\mu}_1$ (T-learner step)
2. Impute treatment effects:
   - For treated: $D_i^1 = Y_i - \hat{\mu}_0(X_i)$
   - For control: $D_i^0 = \hat{\mu}_1(X_i) - Y_i$
3. Fit $\hat{\tau}_0, \hat{\tau}_1$ on imputed effects
4. Combine: $\hat{\tau}(x) = g(x)\hat{\tau}_0(x) + (1-g(x))\hat{\tau}_1(x)$

Best when treatment/control imbalanced.

### Causal Forests

Random forests modified for CATE estimation:
- Split to maximize heterogeneity in treatment effect
- Honesty: separate samples for splitting and estimation
- Provides valid confidence intervals

## Practical Implementation

```python
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.model_selection import train_test_split

class TLearner:
    """Two-model uplift learner"""

    def __init__(self, base_learner=None):
        self.model_treatment = base_learner or GradientBoostingRegressor()
        self.model_control = base_learner or GradientBoostingRegressor()

    def fit(self, X, treatment, y):
        # Split by treatment
        X_treat = X[treatment == 1]
        y_treat = y[treatment == 1]
        X_control = X[treatment == 0]
        y_control = y[treatment == 0]

        # Fit separate models
        self.model_treatment.fit(X_treat, y_treat)
        self.model_control.fit(X_control, y_control)

        return self

    def predict_uplift(self, X):
        return self.model_treatment.predict(X) - self.model_control.predict(X)


class SLearner:
    """Single-model uplift learner"""

    def __init__(self, base_learner=None):
        self.model = base_learner or GradientBoostingRegressor()

    def fit(self, X, treatment, y):
        # Add treatment as feature
        X_with_t = np.column_stack([X, treatment])
        self.model.fit(X_with_t, y)
        return self

    def predict_uplift(self, X):
        # Predict with treatment=1 and treatment=0
        X_treat = np.column_stack([X, np.ones(len(X))])
        X_control = np.column_stack([X, np.zeros(len(X))])
        return self.model.predict(X_treat) - self.model.predict(X_control)


class XLearner:
    """X-learner for imbalanced treatment"""

    def __init__(self):
        self.models = {}

    def fit(self, X, treatment, y):
        # Step 1: T-learner
        self.mu1 = GradientBoostingRegressor().fit(X[treatment==1], y[treatment==1])
        self.mu0 = GradientBoostingRegressor().fit(X[treatment==0], y[treatment==0])

        # Step 2: Impute treatment effects
        D1 = y[treatment==1] - self.mu0.predict(X[treatment==1])
        D0 = self.mu1.predict(X[treatment==0]) - y[treatment==0]

        # Step 3: Fit effect models
        self.tau1 = GradientBoostingRegressor().fit(X[treatment==1], D1)
        self.tau0 = GradientBoostingRegressor().fit(X[treatment==0], D0)

        # Propensity for weighting
        self.propensity = GradientBoostingClassifier().fit(X, treatment)

        return self

    def predict_uplift(self, X):
        g = self.propensity.predict_proba(X)[:, 1]
        tau1 = self.tau1.predict(X)
        tau0 = self.tau0.predict(X)
        return g * tau0 + (1 - g) * tau1


# Simulation
np.random.seed(42)
n = 10000

# Features
X = np.random.randn(n, 5)

# True CATE: depends on X[:, 0]
true_cate = 0.5 * X[:, 0]  # Positive uplift when X0 > 0

# Random treatment
treatment = np.random.binomial(1, 0.5, n)

# Outcome
baseline = 0.3 + 0.1 * X[:, 1]  # Baseline conversion
y_prob = baseline + treatment * true_cate
y = np.random.binomial(1, np.clip(y_prob, 0, 1))

# Train models
X_train, X_test, t_train, t_test, y_train, y_test = train_test_split(
    X, treatment, y, test_size=0.3, random_state=42
)

t_learner = TLearner().fit(X_train, t_train, y_train)
s_learner = SLearner().fit(X_train, t_train, y_train)
x_learner = XLearner().fit(X_train, t_train, y_train)

# Evaluate: correlation with true CATE
true_cate_test = 0.5 * X_test[:, 0]
print("Correlation with true CATE:")
print(f"  T-Learner: {np.corrcoef(t_learner.predict_uplift(X_test), true_cate_test)[0,1]:.3f}")
print(f"  S-Learner: {np.corrcoef(s_learner.predict_uplift(X_test), true_cate_test)[0,1]:.3f}")
print(f"  X-Learner: {np.corrcoef(x_learner.predict_uplift(X_test), true_cate_test)[0,1]:.3f}")
```

## Evaluation

### Uplift Curves

Rank by predicted uplift, measure cumulative effect:

1. Sort by $\hat{\tau}(x)$ descending
2. At each percentile, compute actual lift in that group
3. Compare to random targeting

**Qini curve**: Cumulative incremental gains vs. fraction targeted.

### AUUC (Area Under Uplift Curve)

Analogous to AUC for uplift models. Higher = better targeting.

## Common Pitfalls

1. **No treatment randomization**: Can't estimate uplift without experimental data.

2. **Confusing response with uplift**: High responders ≠ high uplift. Sure Things respond but have zero uplift.

3. **Ignoring negative uplift**: Some treatments backfire. Include Do-Not-Disturb in optimization.

4. **Too little data**: CATE estimation needs large samples. Pool similar groups if needed.

## Applications

- **Marketing**: Who to target with promotions, offers
- **Healthcare**: Personalized treatment selection
- **Retention**: Who benefits from intervention
- **Pricing**: Price sensitivity across segments
- **HR**: Which employees respond to training

## Summary

Uplift modeling enables truly personalized interventions. Key takeaways:

- Uplift ≠ response; model who *changes* behavior
- T-learner, S-learner, X-learner, and Causal Forests are key methods
- Requires experimental data for valid estimation

**Further Reading**:
- Künzel et al., "Metalearners for Estimating Heterogeneous Treatment Effects" (2019)
- Athey & Imbens, "Recursive Partitioning for Heterogeneous Causal Effects"
- Gutierrez & Gérardy, "Causal Inference and Uplift Modelling: A Review"
