---
title: "Propensity Score Matching: Creating Randomized Trials from Observational Data"
date: 2019-10-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - propensity-score
  - matching
  - causal-inference
  - observational-studies
---

When randomized experiments aren't possible, propensity score methods create pseudo-randomization from observational data. By balancing treated and control groups on observed characteristics, we can estimate causal effects—under the assumption that we've measured all relevant confounders.

## Introduction and Motivation

Doctors don't randomly assign treatments—they consider patient health, history, and preferences. Marketers don't randomly send promotions—they target likely responders. This non-random assignment confounds treatment-outcome relationships.

Propensity score methods address this by modeling the treatment assignment mechanism. If we can predict who gets treatment based on observed features, we can compare treated and control units that had equal probability of treatment—mimicking randomization.

## Intuition and Core Concepts

**The propensity score** is the probability of receiving treatment given observed characteristics:

$$e(X) = P(T = 1 | X)$$

**Why it works** (Rosenbaum & Rubin, 1983): If treatment assignment is ignorable given X, it's also ignorable given e(X). This reduces the dimensionality curse—instead of balancing on many covariates, we balance on a single score.

**Selection on observables**: The critical assumption is that all confounders are observed. If unmeasured factors affect both treatment and outcome, propensity methods fail.

## Mathematical Foundations

### Balancing Property

The propensity score balances covariates:

$$T \perp X | e(X)$$

At any propensity score value, treatment is independent of covariates. This enables valid comparison of treated/control within propensity strata.

### Identification

Under unconfoundedness ($Y(0), Y(1) \perp T | X$) and positivity ($0 < e(X) < 1$):

$$\text{ATE} = \mathbb{E}\left[\frac{TY}{e(X)} - \frac{(1-T)Y}{1-e(X)}\right]$$

### Inverse Probability Weighting (IPW)

Weight observations by inverse of treatment probability:

$$\hat{\tau}_{IPW} = \frac{1}{n}\sum_{i=1}^n \left[\frac{T_i Y_i}{\hat{e}(X_i)} - \frac{(1-T_i)Y_i}{1-\hat{e}(X_i)}\right]$$

Reweights the sample to create pseudo-population where treatment is random.

## Key Algorithms and Methods

### Propensity Score Estimation

Usually logistic regression:
$$\log\frac{e(X)}{1-e(X)} = \beta_0 + \beta^T X$$

Can also use machine learning (Random Forests, GBM), but beware of overfitting.

### Matching Methods

**Nearest neighbor**: Match each treated unit to control(s) with closest propensity score.

**Caliper matching**: Match only within distance threshold (e.g., 0.1 SD of propensity).

**Radius matching**: Match to all controls within radius.

**Kernel matching**: Weight controls by distance from treated unit.

### Weighting Methods

**IPW**: Weight by inverse propensity (can have high variance with extreme weights).

**Stabilized weights**: $w_1 = P(T=1)/e(X)$ and $w_0 = P(T=0)/(1-e(X))$

**Overlap weights**: $w = T(1-e(X)) + (1-T)e(X)$ — emphasizes overlap region.

### Balance Checking

After matching/weighting, verify covariate balance:
- Standardized mean differences (SMD < 0.1 is good)
- Variance ratios (close to 1)
- Visual: love plots, density plots

## Practical Implementation

```python
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import NearestNeighbors
import matplotlib.pyplot as plt

# Simulate confounded observational data
np.random.seed(42)
n = 2000

# Confounders
age = np.random.normal(50, 10, n)
income = np.random.normal(60000, 20000, n)

# Treatment probability depends on confounders
propensity_true = 1 / (1 + np.exp(-(-3 + 0.05 * age + 0.00002 * income)))
treatment = np.random.binomial(1, propensity_true)

# Outcome depends on confounders AND treatment (true effect = 10)
outcome = 100 + 0.5 * age + 0.0001 * income + 10 * treatment + np.random.normal(0, 10, n)

df = pd.DataFrame({
    'age': age,
    'income': income,
    'treatment': treatment,
    'outcome': outcome
})

# Naive comparison (biased)
naive_effect = df[df['treatment'] == 1]['outcome'].mean() - df[df['treatment'] == 0]['outcome'].mean()
print(f"Naive effect: {naive_effect:.2f} (true: 10)")

# Estimate propensity scores
X = df[['age', 'income']]
y = df['treatment']
ps_model = LogisticRegression()
ps_model.fit(X, y)
df['propensity'] = ps_model.predict_proba(X)[:, 1]

# Propensity score matching (nearest neighbor)
treated = df[df['treatment'] == 1].reset_index(drop=True)
control = df[df['treatment'] == 0].reset_index(drop=True)

nn = NearestNeighbors(n_neighbors=1)
nn.fit(control[['propensity']])
distances, indices = nn.kneighbors(treated[['propensity']])

matched_control = control.iloc[indices.flatten()]
matched_effect = treated['outcome'].mean() - matched_control['outcome'].mean()
print(f"Matched effect: {matched_effect:.2f}")

# IPW estimator
weights_treated = 1 / df['propensity']
weights_control = 1 / (1 - df['propensity'])

ipw_effect = (
    (df[df['treatment'] == 1]['outcome'] * weights_treated[df['treatment'] == 1]).sum() /
    weights_treated[df['treatment'] == 1].sum() -
    (df[df['treatment'] == 0]['outcome'] * weights_control[df['treatment'] == 0]).sum() /
    weights_control[df['treatment'] == 0].sum()
)
print(f"IPW effect: {ipw_effect:.2f}")

# Balance check (standardized mean differences)
def smd(a, b):
    return (a.mean() - b.mean()) / np.sqrt((a.var() + b.var()) / 2)

print("\nCovariate balance (SMD, target: <0.1):")
print(f"  Before - Age: {smd(treated['age'], control['age']):.3f}")
print(f"  Before - Income: {smd(treated['income'], control['income']):.3f}")
print(f"  After - Age: {smd(treated['age'], matched_control['age']):.3f}")
print(f"  After - Income: {smd(treated['income'], matched_control['income']):.3f}")
```

## Common Pitfalls and Best Practices

1. **Positivity violations**: If some covariate values only occur in treated group, can't estimate effect. Trim or use overlap weights.

2. **Model-dependent**: Misspecified propensity model → poor balance → biased estimates. Check balance, not prediction accuracy.

3. **Extreme weights**: Large weights (low propensity for treatment among treated) inflate variance. Trim or stabilize weights.

4. **Matching with replacement**: Can help with limited overlap but requires correct variance estimation.

5. **Post-matching analysis**: Use matched-pair methods; don't just pool and regress.

## Real-World Applications

- **Healthcare**: Treatment effect estimation from EHR data
- **Marketing**: Campaign lift measurement
- **Education**: Program evaluation
- **Public health**: Policy impact assessment
- **HR**: Training program effectiveness

## Advanced Topics and Extensions

### Doubly Robust Estimation

Combine propensity weighting with outcome regression:

$$\hat{\tau}_{DR} = \frac{1}{n}\sum_i \left[\frac{T_i(Y_i - \hat{m}_1(X_i))}{\hat{e}(X_i)} + \hat{m}_1(X_i)\right]$$
$$- \frac{1}{n}\sum_i \left[\frac{(1-T_i)(Y_i - \hat{m}_0(X_i))}{1-\hat{e}(X_i)} + \hat{m}_0(X_i)\right]$$

Consistent if either propensity or outcome model is correct.

### Generalized Propensity Score

For continuous or multi-valued treatments:
$$GPS(t, X) = f_{T|X}(t|X)$$

### Sensitivity Analysis

What if there's unmeasured confounding? Rosenbaum bounds quantify how much unmeasured confounding would be needed to explain away the effect.

## Comparison with Related Methods

| Method | Key Strength | Weakness |
|--------|-------------|----------|
| Matching | Transparent, visible balance | Discards data, curse of dimensionality |
| IPW | Uses all data | Extreme weight sensitivity |
| Doubly Robust | Protection from one misspecification | More complex |
| Regression | Simple | Functional form sensitive |
| AIPW/TMLE | Semiparametric efficiency | Implementation complexity |

## Summary and Further Reading

Propensity scores enable causal inference by balancing observed confounders. Key takeaways:

- Balance covariates by matching or weighting on propensity scores
- Always check covariate balance after adjustment
- Unmeasured confounding remains a threat—be transparent about assumptions

**Further Reading**:
- Rosenbaum & Rubin (1983), "The Central Role of the Propensity Score"
- Austin (2011), "An Introduction to Propensity Score Methods" (Statistics in Medicine)
- Stuart (2010), "Matching Methods for Causal Inference" (Statistical Science)
- Hernán & Robins, *Causal Inference: What If*, Chapter 12
