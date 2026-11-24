---
title: "Double/Debiased ML: High-Dimensional Causal Inference with Modern Methods"
date: 2020-08-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - double-ml
  - causal-inference
  - machine-learning
  - econometrics
---

Double Machine Learning (DML) bridges the gap between flexible ML prediction and rigorous causal inference. By using ML for nuisance parameters while maintaining valid statistical inference for causal effects, DML enables estimation of treatment effects even with many confounders and complex functional forms.

## Introduction and Motivation

Traditional econometric methods require correct functional form specification. Machine learning handles complex relationships but doesn't provide valid inference for causal parameters. DML combines their strengths: use ML for prediction tasks (propensity scores, outcome models) while preserving statistical properties for causal estimation.

This is crucial in high-dimensional settings where you have many potential confounders—exactly where regularization and ML shine, but where naive application of ML for causal questions fails.

## Intuition and Core Concepts

**The problem with naive ML for causality**: ML models optimize prediction, not causal identification. Regularization biases coefficient estimates. Overfitting the nuisance parameters biases treatment effect estimates.

**DML solution**: Two key innovations:
1. **Neyman-orthogonal scores**: Construct estimating equations insensitive to nuisance parameter errors
2. **Cross-fitting**: Avoid overfitting bias by predicting on held-out folds

Together, these allow using any ML method for nuisance estimation while obtaining $\sqrt{n}$-consistent, asymptotically normal treatment effect estimates.

## Mathematical Foundations

### Partial Linear Model

$$Y = D\theta_0 + g_0(X) + \epsilon$$
$$D = m_0(X) + V$$

where $\theta_0$ is the causal parameter of interest, $g_0$ and $m_0$ are nuisance functions.

### Naive Approach Fails

If we estimate $\hat{g}, \hat{m}$ on full sample and plug in:
$$\hat{\theta} = \frac{\sum_i (D_i - \hat{m}(X_i))(Y_i - \hat{g}(X_i))}{\sum_i (D_i - \hat{m}(X_i))^2}$$

Regularization bias from $\hat{g}, \hat{m}$ contaminates $\hat{\theta}$.

### Neyman-Orthogonality

Construct moment condition:
$$\psi(W; \theta, \eta) = (Y - D\theta - g(X))(D - m(X))$$

where $\eta = (g, m)$ are nuisance parameters.

This is **orthogonal**: $\partial_\eta \mathbb{E}[\psi]|_{\eta=\eta_0} = 0$

First-order errors in nuisance estimation don't affect $\hat{\theta}$.

### Cross-Fitting

Split data into K folds. For each fold:
1. Estimate nuisance parameters on OTHER folds
2. Compute scores on THIS fold

This avoids overfitting bias by ensuring predictions are always out-of-sample.

## Key Algorithms and Methods

### DML Algorithm (Partially Linear Model)

1. Split data into K folds
2. For each fold k:
   - Train $\hat{g}_{-k}$ predicting Y from X on folds $\neq k$
   - Train $\hat{m}_{-k}$ predicting D from X on folds $\neq k$
   - Compute residuals on fold k:
     - $\tilde{Y}_i = Y_i - \hat{g}_{-k}(X_i)$
     - $\tilde{D}_i = D_i - \hat{m}_{-k}(X_i)$
3. Pool residuals across folds
4. Regress $\tilde{Y}$ on $\tilde{D}$: $\hat{\theta} = (\tilde{D}'\tilde{D})^{-1}\tilde{D}'\tilde{Y}$

### AIPW for Binary Treatment

Augmented IPW combines propensity weighting and outcome regression:

$$\hat{\theta} = \frac{1}{n}\sum_i \left[\hat{\mu}_1(X_i) - \hat{\mu}_0(X_i)\right]$$
$$+ \frac{1}{n}\sum_i \frac{D_i(Y_i - \hat{\mu}_1(X_i))}{\hat{e}(X_i)}$$
$$- \frac{1}{n}\sum_i \frac{(1-D_i)(Y_i - \hat{\mu}_0(X_i))}{1-\hat{e}(X_i)}$$

Doubly robust: consistent if either propensity or outcome model is correct.

## Practical Implementation

```python
import numpy as np
import pandas as pd
from sklearn.model_selection import cross_val_predict, KFold
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model import LassoCV
import statsmodels.api as sm

# Simulate high-dimensional confounding
np.random.seed(42)
n, p = 2000, 50  # 50 potential confounders

X = np.random.normal(0, 1, (n, p))
# Only first 10 confounders matter
true_confounders = X[:, :10]

# Treatment depends on confounders
propensity = 1 / (1 + np.exp(-true_confounders @ np.random.normal(0, 0.3, 10)))
D = np.random.binomial(1, propensity)

# Outcome depends on treatment AND confounders
g0 = true_confounders @ np.random.normal(0, 1, 10)
theta_true = 2.0  # True treatment effect
Y = theta_true * D + g0 + np.random.normal(0, 1, n)

# Naive OLS (biased, doesn't include confounders)
naive = sm.OLS(Y, sm.add_constant(D)).fit()
print(f"Naive OLS: {naive.params[1]:.2f} (true: {theta_true})")

# Double Machine Learning
def double_ml(Y, D, X, n_folds=5):
    kf = KFold(n_splits=n_folds, shuffle=True, random_state=42)

    # Residualize using cross-fitting
    Y_resid = np.zeros(n)
    D_resid = np.zeros(n)

    for train_idx, test_idx in kf.split(X):
        # Fit outcome model (Y ~ X)
        g_model = RandomForestRegressor(n_estimators=100, random_state=42)
        g_model.fit(X[train_idx], Y[train_idx])
        Y_resid[test_idx] = Y[test_idx] - g_model.predict(X[test_idx])

        # Fit treatment model (D ~ X)
        m_model = RandomForestRegressor(n_estimators=100, random_state=42)
        m_model.fit(X[train_idx], D[train_idx])
        D_resid[test_idx] = D[test_idx] - m_model.predict(X[test_idx])

    # Final stage: regress Y_resid on D_resid
    theta_hat = np.sum(D_resid * Y_resid) / np.sum(D_resid ** 2)

    # Standard error
    n = len(Y)
    psi = (Y_resid - theta_hat * D_resid) * D_resid
    var_theta = np.mean(psi ** 2) / (np.mean(D_resid ** 2) ** 2) / n
    se = np.sqrt(var_theta)

    return theta_hat, se

theta_dml, se_dml = double_ml(Y, D, X)
print(f"\nDouble ML: {theta_dml:.2f} (SE: {se_dml:.2f})")
print(f"95% CI: [{theta_dml - 1.96*se_dml:.2f}, {theta_dml + 1.96*se_dml:.2f}]")

# Using DoubleML library (more robust)
from doubleml import DoubleMLData, DoubleMLPLR
from sklearn.ensemble import RandomForestRegressor

df = pd.DataFrame(X, columns=[f'X{i}' for i in range(p)])
df['Y'] = Y
df['D'] = D

dml_data = DoubleMLData(df, y_col='Y', d_cols='D',
                         x_cols=[f'X{i}' for i in range(p)])

ml_g = RandomForestRegressor(n_estimators=100, random_state=42)
ml_m = RandomForestRegressor(n_estimators=100, random_state=42)

dml_plr = DoubleMLPLR(dml_data, ml_g, ml_m, n_folds=5)
dml_plr.fit()

print(f"\nDoubleML library: {dml_plr.coef[0]:.2f} (SE: {dml_plr.se[0]:.2f})")
```

## Common Pitfalls and Best Practices

1. **Not enough folds**: With K=2, high variance. Use K=5 or more.

2. **Poor ML performance**: If nuisance models predict poorly, variance inflates. Check prediction quality.

3. **Positivity violations**: Extreme propensity scores cause issues. Trim or use overlap weights.

4. **Model selection**: Use cross-validation to select ML hyperparameters, but on the training folds (nested CV).

5. **Confidence intervals**: Use influence function-based standard errors, not bootstrap (which may be invalid).

## Real-World Applications

- **Tech**: Feature impact with many user covariates
- **Economics**: Policy evaluation with high-dimensional controls
- **Healthcare**: Treatment effects with rich patient data
- **Marketing**: Campaign effects controlling for many customer attributes
- **Finance**: Credit policy evaluation with many risk factors

## Advanced Topics and Extensions

### CATE Estimation

Estimate heterogeneous treatment effects:
$$\tau(x) = \mathbb{E}[Y(1) - Y(0) | X = x]$$

Methods: Causal Forests, Meta-learners (T-learner, X-learner), DR-learner.

### Sensitivity Analysis

Test robustness to unmeasured confounding:
- Omitted variable bias bounds
- Sensitivity parameters for exclusion restrictions

### Extensions to Other Models

- **IV with DML**: Use ML for first-stage and outcome models
- **DiD with DML**: Doubly robust difference-in-differences
- **Panel data**: Fixed effects + DML for time-varying confounders

## Comparison with Related Methods

| Method | High-Dimensional? | Valid Inference? | Complexity |
|--------|-------------------|------------------|------------|
| OLS | No | Yes | Low |
| Lasso | Yes | No* | Low |
| Propensity Score | Limited | Yes | Medium |
| Double ML | **Yes** | **Yes** | Medium |
| Targeted ML (TMLE) | **Yes** | **Yes** | High |

*Post-selection inference methods exist but are complex.

## Summary and Further Reading

Double Machine Learning enables valid causal inference with ML-estimated nuisance parameters. Key takeaways:

- Orthogonalization makes estimates insensitive to nuisance model errors
- Cross-fitting prevents overfitting bias
- Use any ML method for predictions; DML ensures valid inference

**Further Reading**:
- Chernozhukov et al., "Double/Debiased Machine Learning for Treatment and Causal Parameters" (2018)
- DoubleML Python/R package documentation
- Kennedy, "Semiparametric Doubly Robust Targeted Minimum Loss-Based Estimation"
- Athey & Wager, "Estimating Treatment Effects with Causal Forests"
