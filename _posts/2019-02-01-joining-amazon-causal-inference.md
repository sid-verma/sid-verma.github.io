---
title: "Causality in Industry: Why Correlation Isn't Enough for Business Decisions"
date: 2019-02-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - causal-inference
  - observational-data
  - confounding
  - business-analytics
---

Correlation doesn't imply causation—but business decisions require causal understanding. Will this promotion increase sales, or are sales increasing anyway? Does our drug work, or are healthier patients choosing it? Causal inference provides tools to answer these questions from observational data when experiments aren't possible.

## Introduction and Motivation

Machine learning excels at prediction but often fails at causal questions. A model might predict that customers who receive promotional emails buy more, but this doesn't mean emails cause purchases—perhaps engaged customers are both more likely to buy and more likely to be emailed.

In industry, we constantly need causal answers: What's the ROI of this marketing campaign? Does this feature improve retention? Should we change pricing? Traditional ML gives correlations; causal inference gives actionable insights.

## Intuition and Core Concepts

The fundamental challenge: we can never observe both potential outcomes for the same unit. If we give a patient drug A, we can't see what would have happened with placebo. This is the **fundamental problem of causal inference**.

**Key concepts**:
- **Treatment**: The intervention we're studying (drug, promotion, feature)
- **Outcome**: What we're trying to affect (health, purchase, engagement)
- **Confounders**: Variables that affect both treatment and outcome
- **Counterfactual**: What would have happened under different treatment

Simpson's Paradox illustrates the danger: a treatment can appear helpful overall but harmful in every subgroup, or vice versa. Confounders drive these paradoxes.

## Mathematical Foundations

### Potential Outcomes Framework (Rubin Causal Model)

For each unit $i$, define potential outcomes:
- $Y_i(1)$: Outcome if treated
- $Y_i(0)$: Outcome if not treated

**Individual Treatment Effect**: $\tau_i = Y_i(1) - Y_i(0)$

We only observe one: $Y_i = T_i \cdot Y_i(1) + (1-T_i) \cdot Y_i(0)$

**Average Treatment Effect (ATE)**: $\tau = \mathbb{E}[Y(1) - Y(0)]$

**Average Treatment Effect on Treated (ATT)**: $\tau_{ATT} = \mathbb{E}[Y(1) - Y(0) | T=1]$

### Identification Assumptions

To estimate causal effects from observational data:

1. **SUTVA** (Stable Unit Treatment Value): No interference between units; one version of treatment
2. **Ignorability** (Unconfoundedness): $Y(0), Y(1) \perp T | X$ — no unmeasured confounders
3. **Positivity**: $0 < P(T=1|X) < 1$ — all units have some chance of treatment

When these hold: $\mathbb{E}[Y(1) - Y(0) | X] = \mathbb{E}[Y | T=1, X] - \mathbb{E}[Y | T=0, X]$

## Key Algorithms and Methods

### Randomized Controlled Trials (RCTs)

Gold standard: randomly assign treatment. Randomization ensures $T \perp X$, eliminating confounding. A/B tests are online RCTs.

### Statistical Adjustment

Control for confounders via regression:
$$Y = \beta_0 + \beta_1 T + \beta_2 X + \epsilon$$

$\beta_1$ estimates treatment effect conditional on $X$. Assumes correct functional form.

### Propensity Score Methods

Model treatment probability: $e(X) = P(T=1|X)$

- **Matching**: Pair treated/control with similar propensity scores
- **Weighting (IPW)**: Weight by inverse of treatment probability
- **Stratification**: Analyze within propensity score strata

### Difference-in-Differences

Compare changes over time between treated and control groups:
$$\tau = (Y_{treat,after} - Y_{treat,before}) - (Y_{control,after} - Y_{control,before})$$

Requires parallel trends assumption.

## Practical Implementation

```python
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression, LinearRegression
import statsmodels.formula.api as smf

# Simulate observational data with confounding
np.random.seed(42)
n = 1000

# Confounder: customer engagement level
X = np.random.normal(5, 2, n)

# Treatment depends on confounder (more engaged customers get promo)
propensity_true = 1 / (1 + np.exp(-(X - 5)))
T = np.random.binomial(1, propensity_true)

# Outcome depends on both treatment AND confounder
# True treatment effect is 2.0
Y = 3 + 2.0 * T + 1.5 * X + np.random.normal(0, 1, n)

df = pd.DataFrame({'X': X, 'T': T, 'Y': Y})

# Naive comparison (biased due to confounding)
naive_effect = df[df['T'] == 1]['Y'].mean() - df[df['T'] == 0]['Y'].mean()
print(f"Naive treatment effect: {naive_effect:.2f} (biased)")

# Regression adjustment
model = smf.ols('Y ~ T + X', data=df).fit()
print(f"Adjusted treatment effect: {model.params['T']:.2f} (closer to true effect of 2.0)")

# Propensity score IPW
ps_model = LogisticRegression()
ps_model.fit(df[['X']], df['T'])
propensity = ps_model.predict_proba(df[['X']])[:, 1]

# IPW estimator
weights = T / propensity + (1 - T) / (1 - propensity)
ipw_effect = (
    np.sum(T * Y / propensity) / np.sum(T / propensity) -
    np.sum((1 - T) * Y / (1 - propensity)) / np.sum((1 - T) / (1 - propensity))
)
print(f"IPW treatment effect: {ipw_effect:.2f}")

print(f"\nTrue treatment effect: 2.00")
```

## Common Pitfalls and Best Practices

1. **Unmeasured confounding**: No method can adjust for variables you didn't measure. Always consider what's missing.

2. **P-hacking causal claims**: Just because a coefficient is significant doesn't mean it's causal. Be rigorous about assumptions.

3. **Confusing prediction with causation**: Good predictive models can have acausal features. Would removing the feature change the outcome?

4. **Ignoring selection effects**: Who's in your sample matters. Treatment effects may not generalize.

5. **Functional form assumptions**: Linear regression assumes linear relationships. Test assumptions or use flexible models.

## Real-World Applications

- **Marketing**: Does this campaign increase purchases (not just predict them)?
- **Product**: Does this feature improve retention (not just correlate)?
- **Pricing**: What's the demand elasticity (not just price-sales correlation)?
- **Healthcare**: Does this treatment improve outcomes (controlling for patient health)?
- **Policy**: Did this intervention reduce crime (accounting for trends)?

## Advanced Topics and Extensions

### Instrumental Variables

When there's unmeasured confounding, use instruments: variables that affect treatment but not outcome directly. Example: distance to hospital affects treatment choice but not health directly.

### Regression Discontinuity

When treatment is assigned by a threshold (test score, age, income), compare just above vs. just below the threshold.

### Synthetic Control

For aggregate interventions (policy change in one state), construct synthetic control from weighted average of similar untreated units.

### Double Machine Learning

Use ML for nuisance parameters (propensity, outcome models) while maintaining valid inference for causal parameters.

## Comparison with Related Methods

| Method | Requires | Handles | Weakness |
|--------|----------|---------|----------|
| RCT | Random assignment | All confounders | Expensive, not always feasible |
| Regression | Measured confounders | Measured confounding | Functional form assumptions |
| Propensity Score | Measured confounders | Measured confounding | Positivity violations |
| IV | Valid instrument | Unmeasured confounding | Hard to find valid instruments |
| DiD | Parallel trends | Time-invariant confounders | Trend assumption untestable |

## Summary and Further Reading

Causal inference moves beyond prediction to understand what actually changes outcomes. Key takeaways:

- Correlation ≠ causation; confounders create spurious associations
- RCTs eliminate confounding; observational methods require assumptions
- Always be explicit about identification assumptions

**Further Reading**:
- Angrist & Pischke, *Mostly Harmless Econometrics*
- Imbens & Rubin, *Causal Inference for Statistics, Social, and Biomedical Sciences*
- Cunningham, *Causal Inference: The Mixtape* (free online)
- Hernán & Robins, *Causal Inference: What If* (free online)
