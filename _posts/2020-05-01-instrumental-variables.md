---
title: "Instrumental Variables: Finding Causal Needles in Confounded Haystacks"
date: 2020-05-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - instrumental-variables
  - causal-inference
  - econometrics
  - endogeneity
---

When unmeasured confounders bias your estimates, instrumental variables (IV) offer a path to causal inference. By finding exogenous variation that affects treatment but not outcome directly, IV methods isolate causal effects even with hidden confounding. This technique is a cornerstone of causal econometrics.

## Introduction and Motivation

Standard regression fails when treatment and error are correlated—unmeasured confounders create endogeneity. Propensity scores can't help without measuring those confounders. Experiments may be impossible.

Instrumental variables provide a solution: find an external source of variation in treatment that's uncorrelated with confounders. Use this variation to identify the causal effect. IV is the go-to tool when you suspect unmeasured confounding.

## Intuition and Core Concepts

Imagine studying whether education increases earnings. Ability confounds this relationship—smart people get more education AND earn more. We can't measure ability perfectly.

**The instrument**: Draft lottery numbers during Vietnam War. Being drafted is random (uncorrelated with ability), affects education (drafted men had education interrupted), but doesn't directly affect later earnings (which is debatable). Draft number variability lets us isolate education's causal effect.

**Two requirements for a valid instrument**:
1. **Relevance**: Instrument affects treatment (first stage)
2. **Exclusion restriction**: Instrument affects outcome ONLY through treatment

## Mathematical Foundations

### The Endogeneity Problem

Model: $Y = \beta_0 + \beta_1 X + \epsilon$

If $\text{Cov}(X, \epsilon) \neq 0$, OLS is biased:
$$\hat{\beta}_{OLS} = \beta_1 + \frac{\text{Cov}(X, \epsilon)}{\text{Var}(X)}$$

### IV Solution

Let $Z$ be instrument. Identify $\beta_1$ using:
$$\beta_1 = \frac{\text{Cov}(Y, Z)}{\text{Cov}(X, Z)} = \frac{\text{Reduced Form}}{\text{First Stage}}$$

If $\text{Cov}(Z, \epsilon) = 0$ (exclusion), this is consistent.

### Two-Stage Least Squares (2SLS)

**Stage 1**: Regress treatment on instrument
$$X = \gamma_0 + \gamma_1 Z + \nu$$

**Stage 2**: Regress outcome on fitted values
$$Y = \beta_0 + \beta_1 \hat{X} + \epsilon$$

### Local Average Treatment Effect (LATE)

IV estimates the effect on **compliers**—those whose treatment status is changed by the instrument. This is a local effect, not ATE.

$$\text{LATE} = \frac{E[Y|Z=1] - E[Y|Z=0]}{E[X|Z=1] - E[X|Z=0]}$$

## Key Algorithms and Methods

### Testing Instrument Validity

**Relevance**: First-stage F-statistic should be > 10 (Staiger-Stock rule). Weak instruments cause severe bias.

**Exclusion**: Untestable by data. Requires domain knowledge and argumentation.

**Over-identification tests**: With multiple instruments, test if they give same estimate (Hansen's J test).

### Just-Identified vs. Over-Identified

- **Just-identified**: Same number of instruments as endogenous variables. Exactly identified, no testable restrictions.
- **Over-identified**: More instruments than endogenous variables. Can test over-identifying restrictions.

### Weak Instruments

When first stage is weak, 2SLS is biased toward OLS. Solutions:
- Use LIML (Limited Information Maximum Likelihood) instead of 2SLS
- Report Anderson-Rubin confidence intervals
- Find stronger instruments

## Practical Implementation

```python
import numpy as np
import pandas as pd
import statsmodels.api as sm
from linearmodels.iv import IV2SLS
from scipy import stats

# Simulate IV scenario: returns to education
np.random.seed(42)
n = 5000

# Unmeasured confounder: ability
ability = np.random.normal(0, 1, n)

# Instrument: proximity to college (random, affects education, not earnings directly)
proximity = np.random.normal(0, 1, n)

# Education depends on ability AND proximity
education = 12 + 2 * ability + 1 * proximity + np.random.normal(0, 1, n)

# Earnings depend on ability AND education (true effect = 1000 per year)
earnings = 20000 + 1000 * education + 5000 * ability + np.random.normal(0, 5000, n)

df = pd.DataFrame({
    'earnings': earnings,
    'education': education,
    'proximity': proximity,
    'const': 1
})

# OLS (biased due to omitted ability)
ols = sm.OLS(df['earnings'], sm.add_constant(df['education'])).fit()
print(f"OLS estimate: {ols.params['education']:.0f} per year education")
print(f"  (Biased upward due to ability, true effect is 1000)")

# 2SLS with IV
iv_model = IV2SLS.from_formula('earnings ~ 1 + [education ~ proximity]', data=df)
iv_results = iv_model.fit()
print(f"\n2SLS estimate: {iv_results.params['education']:.0f} per year education")
print(f"  (Closer to true effect of 1000)")

# First stage diagnostics
first_stage = sm.OLS(df['education'], sm.add_constant(df['proximity'])).fit()
print(f"\nFirst stage F-statistic: {first_stage.fvalue:.1f}")
print(f"  (Should be > 10 for strong instrument)")

# Manual 2SLS for understanding
# Stage 1: regress education on proximity
stage1 = sm.OLS(df['education'], sm.add_constant(df['proximity'])).fit()
df['education_hat'] = stage1.fittedvalues

# Stage 2: regress earnings on predicted education
stage2 = sm.OLS(df['earnings'], sm.add_constant(df['education_hat'])).fit()
print(f"\nManual 2SLS: {stage2.params['education_hat']:.0f}")
```

## Common Pitfalls and Best Practices

1. **Weak instruments**: First-stage F < 10 means biased estimates. Find stronger instruments or use robust methods.

2. **Exclusion violation**: The hardest part. Think carefully about direct effects of instrument on outcome.

3. **LATE ≠ ATE**: IV estimates effect on compliers only. Consider whether this is the relevant population.

4. **Many instruments**: Too many instruments relative to sample size can over-fit first stage.

5. **Instrument hunting**: Searching for instruments that "work" is p-hacking. Pre-specify and justify instruments.

## Real-World Applications

**Classic instruments**:
- **Distance to college**: Education returns
- **Draft lottery**: Vietnam-era studies
- **Quarter of birth**: Compulsory schooling effects
- **Rainfall**: Agricultural productivity, conflict
- **Shift-share**: Labor market shocks

**Tech/business applications**:
- **Price elasticity**: Cost shocks as instruments for price
- **Ad effectiveness**: Regional ad cost variation
- **Feature usage**: Random assignment to default settings

## Advanced Topics and Extensions

### Control Function Approach

Alternative to 2SLS that's more efficient with non-linear first stages:

1. Estimate first stage, get residuals $\hat{\nu}$
2. Include $\hat{\nu}$ as control in outcome regression:
   $Y = \beta_0 + \beta_1 X + \theta \hat{\nu} + \epsilon$

### Regression Discontinuity as IV

RD can be viewed as IV where instrument is crossing the threshold:
$$Z_i = \mathbb{1}[X_i \geq c]$$

### Machine Learning for IV

**Double/Debiased ML**: Use ML for first stage while maintaining valid inference.

**Deep IV**: Neural networks for non-linear first and second stages.

## Comparison with Related Methods

| Method | Handles Unmeasured Confounding? | Requirement |
|--------|--------------------------------|-------------|
| OLS | No | Correct specification |
| Propensity Score | No | All confounders measured |
| IV | **Yes** | Valid instrument |
| DiD | Partially (time-invariant) | Parallel trends |
| RDD | **Yes** (locally) | Threshold assignment |

## Summary and Further Reading

Instrumental variables enable causal inference when unmeasured confounders exist. Key takeaways:

- Instruments must affect treatment (relevance) but not outcome directly (exclusion)
- Weak instruments cause severe bias; always check first-stage F
- IV estimates LATE, not ATE—the effect on compliers

**Further Reading**:
- Angrist & Pischke, *Mostly Harmless Econometrics*, Chapter 4
- Angrist, Imbens & Rubin, "Identification of Causal Effects Using Instrumental Variables" (1996)
- Stock, Wright & Yogo, "A Survey of Weak Instruments" (2002)
- Cunningham, *Causal Inference: The Mixtape*, IV chapter
