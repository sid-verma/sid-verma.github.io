---
title: "Econometrics for ML Engineers: Bridging Statistics and Causal Reasoning"
date: 2019-04-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - econometrics
  - causal-inference
  - regression
  - statistics
---

Econometrics bridges economic theory, statistics, and data to estimate causal relationships. For ML engineers transitioning to causal inference, econometric methods provide battle-tested techniques for extracting causal insights from observational data. This primer covers essential concepts every data scientist should know.

## Introduction and Motivation

While ML focuses on prediction, econometrics obsesses over causation. Econometricians have decades of experience answering questions like: Does minimum wage reduce employment? Does education increase earnings? Do marketing campaigns generate incremental revenue?

These methods are directly applicable to industry problems. Tech companies increasingly hire economists for causal analysis, and ML engineers who understand econometric thinking have a significant advantage in product analytics and strategic decision-making.

## Intuition and Core Concepts

**Econometrics vs. ML**: ML minimizes prediction error on held-out data. Econometrics cares about coefficient interpretation—specifically, what happens when you intervene to change X.

**Endogeneity**: The core problem in econometrics. X is endogenous if $\text{Cov}(X, \epsilon) \neq 0$. Sources include:
- Omitted variable bias (confounding)
- Measurement error
- Simultaneity (X affects Y AND Y affects X)
- Selection bias

**Identification**: Can we isolate the causal effect from the data? Identification strategies exploit natural experiments, instruments, or structural assumptions.

## Mathematical Foundations

### The Linear Regression Model

$$Y_i = \beta_0 + \beta_1 X_i + \beta_2 Z_i + \epsilon_i$$

OLS estimates: $\hat{\beta} = (\mathbf{X}^T\mathbf{X})^{-1}\mathbf{X}^T\mathbf{y}$

### OLS Assumptions for Causal Interpretation

1. **Linearity**: $E[Y|X]$ is linear in parameters
2. **Random sampling**: Observations are i.i.d.
3. **No perfect multicollinearity**: $(\mathbf{X}^T\mathbf{X})$ is invertible
4. **Zero conditional mean**: $E[\epsilon|X] = 0$ ← Critical for causality
5. **Homoskedasticity**: $\text{Var}(\epsilon|X) = \sigma^2$ (for standard errors)

When (4) fails, $\hat{\beta}$ is biased and inconsistent.

### Standard Errors and Inference

Standard errors measure coefficient uncertainty:
$$\text{SE}(\hat{\beta}_j) = \sqrt{\hat{\sigma}^2 (\mathbf{X}^T\mathbf{X})^{-1}_{jj}}$$

**Robust (heteroskedasticity-consistent) standard errors** don't assume homoskedasticity:
$$\text{HC SE} = (\mathbf{X}^T\mathbf{X})^{-1}\mathbf{X}^T\text{diag}(\hat{e}_i^2)\mathbf{X}(\mathbf{X}^T\mathbf{X})^{-1}$$

**Clustered standard errors** account for within-group correlation (e.g., by user, by store).

## Key Algorithms and Methods

### Omitted Variable Bias

If we omit variable $Z$ that's correlated with $X$ and affects $Y$:

$$\hat{\beta}_1 = \beta_1 + \beta_2 \gamma$$

where $\gamma = \frac{\text{Cov}(X, Z)}{\text{Var}(X)}$

Bias direction: sign($\beta_2$) × sign($\gamma$)

### Instrumental Variables (IV)

Find instrument $Z$ that:
1. Affects $X$ (relevance): $\text{Cov}(Z, X) \neq 0$
2. Doesn't directly affect $Y$ (exclusion): $\text{Cov}(Z, \epsilon) = 0$

Two-Stage Least Squares (2SLS):
1. Stage 1: Regress $X$ on $Z$, get fitted values $\hat{X}$
2. Stage 2: Regress $Y$ on $\hat{X}$

### Fixed Effects

Panel data with unit-specific unobserved heterogeneity:
$$Y_{it} = \alpha_i + \beta X_{it} + \epsilon_{it}$$

De-mean to remove fixed effects:
$$Y_{it} - \bar{Y}_i = \beta(X_{it} - \bar{X}_i) + (\epsilon_{it} - \bar{\epsilon}_i)$$

Controls for all time-invariant confounders.

## Practical Implementation

```python
import numpy as np
import pandas as pd
import statsmodels.api as sm
import statsmodels.formula.api as smf
from linearmodels.panel import PanelOLS
from linearmodels.iv import IV2SLS

# Simulated panel data
np.random.seed(42)
n_units, n_time = 100, 10
n_obs = n_units * n_time

# Unit fixed effects (unobserved)
unit_effects = np.repeat(np.random.normal(0, 2, n_units), n_time)

# Treatment correlated with unit effects
X = unit_effects + np.random.normal(0, 1, n_obs)

# Outcome
Y = 3 + 2 * X + unit_effects + np.random.normal(0, 1, n_obs)

df = pd.DataFrame({
    'unit': np.repeat(range(n_units), n_time),
    'time': np.tile(range(n_time), n_units),
    'X': X,
    'Y': Y
})

# Naive OLS (biased due to omitted unit effects)
ols = smf.ols('Y ~ X', data=df).fit()
print(f"Naive OLS coefficient: {ols.params['X']:.3f} (true: 2.0)")

# OLS with robust standard errors
ols_robust = smf.ols('Y ~ X', data=df).fit(cov_type='HC3')
print(f"Naive OLS with robust SE: {ols.params['X']:.3f} ({ols_robust.bse['X']:.3f})")

# Fixed Effects estimation
df = df.set_index(['unit', 'time'])
fe_model = PanelOLS.from_formula('Y ~ X + EntityEffects', data=df)
fe_result = fe_model.fit()
print(f"Fixed Effects coefficient: {fe_result.params['X']:.3f}")

# Instrumental Variables example
np.random.seed(42)
Z = np.random.normal(0, 1, 1000)  # Instrument
X = 0.5 * Z + np.random.normal(0, 1, 1000)  # First stage
Y = 2 * X + np.random.normal(0, 1, 1000)  # True effect

iv_df = pd.DataFrame({'Y': Y, 'X': X, 'Z': Z, 'const': 1})

# 2SLS
iv_model = IV2SLS.from_formula('Y ~ 1 + [X ~ Z]', data=iv_df)
iv_result = iv_model.fit()
print(f"\n2SLS coefficient: {iv_result.params['X']:.3f}")
print(f"First stage F-stat: {iv_result.first_stage.diagnostics['f.stat'].iloc[0]:.1f}")
```

## Common Pitfalls and Best Practices

1. **Weak instruments**: First-stage F-statistic should be > 10. Weak instruments cause bias.

2. **Overcontrolling**: Including a descendant of treatment (mediator) or a collider as control biases estimates.

3. **Clustering errors**: Cluster at the level of treatment variation. Multi-way clustering when multiple sources of correlation.

4. **Multiple testing**: Report all specifications, not just significant ones. Pre-register hypotheses.

5. **External validity**: Effect estimated on one population may not generalize.

## Real-World Applications

- **Marketing ROI**: IV using regional advertising cost variation
- **Product features**: Fixed effects across users over time
- **Pricing strategy**: Regression discontinuity at price thresholds
- **Policy evaluation**: Difference-in-differences around policy changes
- **Labor economics**: Returns to education using twins studies

## Advanced Topics and Extensions

### Generalized Method of Moments (GMM)

Unifies many estimators. Finds parameters satisfying moment conditions:
$$\mathbb{E}[g(Y, X, \theta_0)] = 0$$

### Maximum Likelihood Estimation

For models where OLS doesn't apply (discrete outcomes, censored data):
$$\hat{\theta} = \arg\max_\theta \sum_i \log f(Y_i | X_i, \theta)$$

### Quantile Regression

Estimate effects at different points of the outcome distribution, not just the mean:
$$\min_\beta \sum_i \rho_\tau(Y_i - X_i\beta)$$

## Comparison with Related Methods

| Method | Key Assumption | Use Case |
|--------|---------------|----------|
| OLS | Zero conditional mean | Controlled experiments |
| IV | Valid instrument | Endogeneity from confounding |
| Fixed Effects | Time-invariant confounders | Panel data |
| Diff-in-Diff | Parallel trends | Pre-post intervention |
| RDD | Continuity at cutoff | Threshold-based assignment |

## Summary and Further Reading

Econometrics provides rigorous tools for causal inference from observational data. Key takeaways:

- OLS estimates are causal only under strong assumptions
- Endogeneity (confounding) requires identification strategies
- Fixed effects, IV, and DiD are workhorses of causal econometrics

**Further Reading**:
- Angrist & Pischke, *Mostly Harmless Econometrics*
- Wooldridge, *Econometric Analysis of Cross Section and Panel Data*
- Cunningham, *Causal Inference: The Mixtape* (free online)
- Stock & Watson, *Introduction to Econometrics*
