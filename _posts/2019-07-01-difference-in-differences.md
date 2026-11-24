---
title: "Difference-in-Differences: The Gold Standard for Natural Experiments"
date: 2019-07-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - difference-in-differences
  - causal-inference
  - quasi-experiments
  - econometrics
---

Difference-in-Differences (DiD) is the workhorse method for evaluating policies, interventions, and product changes when true experiments aren't feasible. By comparing changes over time between treated and control groups, DiD controls for both group-specific and time-specific confounders—under the right assumptions.

## Introduction and Motivation

Many business questions involve interventions that can't be randomized: a new law affects some states, a feature rolls out to certain markets first, a policy change impacts one customer segment. DiD lets us estimate causal effects from these "natural experiments."

Tech companies use DiD extensively: measuring launch impact by comparing regions, evaluating policy changes across time, and analyzing feature rollouts. It's the method of choice when randomization isn't possible but you have pre/post data for treated and control groups.

## Intuition and Core Concepts

The core idea is elegant. Suppose we launch a feature in city A but not city B:

1. **First difference**: How did outcomes change in city A (before vs. after)?
2. **Second difference**: Subtract how outcomes changed in city B (before vs. after)

The result isolates the treatment effect by removing:
- All pre-existing differences between cities (city fixed effects)
- All common time trends (time fixed effects)

**The parallel trends assumption**: In the absence of treatment, both groups would have followed the same trajectory. We're estimating what the treated group's counterfactual would have been using the control group's trend.

## Mathematical Foundations

### Basic DiD Estimator

With two periods (before/after) and two groups (treated/control):

$$\hat{\tau}_{DiD} = (\bar{Y}_{T,post} - \bar{Y}_{T,pre}) - (\bar{Y}_{C,post} - \bar{Y}_{C,pre})$$

### Regression Formulation

$$Y_{it} = \alpha + \beta_1 \text{Treat}_i + \beta_2 \text{Post}_t + \beta_3 (\text{Treat}_i \times \text{Post}_t) + \epsilon_{it}$$

- $\beta_1$: Pre-treatment difference between groups
- $\beta_2$: Common time effect
- $\beta_3$: **DiD estimator** (treatment effect)

### Two-Way Fixed Effects (Generalized DiD)

With multiple periods and units:

$$Y_{it} = \alpha_i + \gamma_t + \beta D_{it} + \epsilon_{it}$$

- $\alpha_i$: Unit fixed effects
- $\gamma_t$: Time fixed effects
- $D_{it}$: Treatment indicator
- $\beta$: Average treatment effect

## Key Algorithms and Methods

### Standard DiD Requirements

1. **Treatment and control groups**: Some units receive treatment, others don't
2. **Pre and post periods**: Data before and after intervention
3. **Parallel trends**: Groups would have evolved similarly without treatment
4. **No anticipation**: Treatment doesn't affect pre-period outcomes
5. **No spillovers**: Control group isn't affected by treatment

### Testing Parallel Trends

While untestable for the counterfactual period, examine pre-trends:
- Plot outcomes for both groups over time
- Test for differences in pre-treatment trends
- Event study: estimate period-by-period effects

$$Y_{it} = \alpha_i + \gamma_t + \sum_{k \neq -1} \beta_k \cdot \mathbb{1}[t - t_i^* = k] + \epsilon_{it}$$

Pre-treatment coefficients ($k < 0$) should be zero.

### Staggered DiD

When treatment rolls out at different times:
- Recent research (Goodman-Bacon, 2021) shows two-way fixed effects can be biased
- Use modern estimators: Callaway & Sant'Anna, Sun & Abraham, Borusyak et al.

## Practical Implementation

```python
import numpy as np
import pandas as pd
import statsmodels.formula.api as smf
import matplotlib.pyplot as plt

# Simulate DiD data
np.random.seed(42)
n_units = 100
n_periods = 10
treatment_period = 5

# Create panel data
data = []
for unit in range(n_units):
    is_treated = unit < n_units // 2  # First half treated
    unit_effect = np.random.normal(10 if is_treated else 8, 1)

    for t in range(n_periods):
        time_effect = 0.5 * t
        treatment_effect = 3 if (is_treated and t >= treatment_period) else 0
        noise = np.random.normal(0, 0.5)

        y = unit_effect + time_effect + treatment_effect + noise
        data.append({
            'unit': unit,
            'time': t,
            'treated': is_treated,
            'post': t >= treatment_period,
            'Y': y
        })

df = pd.DataFrame(data)
df['treat_post'] = df['treated'] & df['post']

# Basic DiD regression
did_model = smf.ols('Y ~ treated + post + treat_post', data=df).fit()
print("Basic DiD Results:")
print(f"  Treatment effect: {did_model.params['treat_post[T.True]']:.2f}")
print(f"  (True effect is 3.0)")

# Two-way fixed effects
twfe_model = smf.ols('Y ~ treat_post + C(unit) + C(time)', data=df).fit()
print(f"\nTWFE Treatment effect: {twfe_model.params['treat_post[T.True]']:.2f}")

# Event study
df['rel_time'] = df['time'] - treatment_period
df.loc[~df['treated'], 'rel_time'] = -999  # Control group dummy

event_study = smf.ols(
    'Y ~ C(rel_time, Treatment(-1)) * treated + C(unit) + C(time)',
    data=df[df['rel_time'] != -999]
).fit()

# Plot parallel trends
plt.figure(figsize=(10, 6))
for treated in [True, False]:
    group_data = df[df['treated'] == treated].groupby('time')['Y'].mean()
    label = 'Treated' if treated else 'Control'
    plt.plot(group_data.index, group_data.values, 'o-', label=label)

plt.axvline(x=treatment_period - 0.5, color='red', linestyle='--', label='Treatment')
plt.xlabel('Time')
plt.ylabel('Outcome')
plt.legend()
plt.title('Parallel Trends Check')
plt.tight_layout()
plt.savefig('parallel_trends.png', dpi=150)
```

## Common Pitfalls and Best Practices

1. **Parallel trends violation**: If pre-trends diverge, DiD is biased. Use event studies, matching, or synthetic control.

2. **Staggered treatment bias**: Two-way fixed effects with staggered adoption can have wrong signs. Use modern estimators.

3. **Clustering standard errors**: Cluster at treatment unit level. Too few clusters → wild bootstrap.

4. **Anticipation effects**: If units change behavior before treatment, estimates are biased.

5. **Compositional changes**: If group membership changes over time, interpret with caution.

## Real-World Applications

- **Policy evaluation**: Minimum wage laws, Medicaid expansion, tax changes
- **Tech product launches**: Feature rollouts to regions, platform policy changes
- **Marketing**: Campaign effects by market, promotion windows
- **Labor**: Training program effects, workplace interventions
- **Finance**: Regulatory changes, market structure shifts

## Advanced Topics and Extensions

### Triple Differences (DDD)

Add another comparison dimension when parallel trends is questionable:

$$\tau = [(\text{Treat}, \text{Post}, \text{Affected}) - (\text{Treat}, \text{Pre}, \text{Affected})]$$
$$- [(\text{Treat}, \text{Post}, \text{Unaffected}) - (\text{Treat}, \text{Pre}, \text{Unaffected})]$$
$$- [(\text{Control}, \text{Post}, \text{Affected}) - (\text{Control}, \text{Pre}, \text{Affected})]$$
$$+ [(\text{Control}, \text{Post}, \text{Unaffected}) - (\text{Control}, \text{Pre}, \text{Unaffected})]$$

### Synthetic Control

When no good control group exists, construct one:
$$\hat{Y}_t^{(0)} = \sum_j w_j Y_{jt}$$

Choose weights to match pre-treatment outcomes.

### Callaway-Sant'Anna Estimator

For staggered DiD, compute group-time average treatment effects, then aggregate:

1. Estimate ATT(g,t) for each cohort g at each time t
2. Aggregate across cohorts and time as needed

## Comparison with Related Methods

| Method | Requirement | Controls For |
|--------|-------------|-------------|
| Basic DiD | 2 groups, 2 periods, parallel trends | Time-invariant confounders, common trends |
| Event Study | Multiple pre-periods | Same + tests parallel trends |
| Synthetic Control | Pre-treatment outcomes | Time-varying confounders (better match) |
| Triple Differences | Additional comparison group | Violations of parallel trends |

## Summary and Further Reading

Difference-in-Differences estimates causal effects by comparing changes across groups. Key takeaways:

- Parallel trends assumption is critical and untestable for counterfactual
- Use event studies to assess pre-trends and dynamic effects
- Modern methods handle staggered adoption better than two-way fixed effects

**Further Reading**:
- Cunningham, *Causal Inference: The Mixtape*, Chapter on DiD
- Angrist & Pischke, *Mostly Harmless Econometrics*, Chapter 5
- Roth et al., "What's Trending in Difference-in-Differences?" (2023)
- Goodman-Bacon, "Difference-in-Differences with Variation in Treatment Timing"
