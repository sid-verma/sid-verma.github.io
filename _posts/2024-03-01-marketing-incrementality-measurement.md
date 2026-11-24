---
title: "Incrementality: Measuring What Marketing Actually Causes"
date: 2024-03-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - incrementality
  - causal-inference
  - marketing
  - measurement
---

Most marketing measurement conflates correlation with causation. "Users who saw our ad converted at 5%!" But would they have converted anyway? Incrementality measurement isolates what marketing actually causes—separating true lift from baseline behavior among people who would have been reached.

## Introduction and Motivation

Marketing attribution traditionally credits channels for conversions: last-click, first-click, multi-touch. But attribution tells you *which* ad was associated with a conversion, not *whether* the ad caused it. A user might have searched your brand name, seen an ad, and bought—but would have bought regardless.

Incrementality gets at causation: what's the additional lift from marketing above what would have happened anyway? This is the only number that matters for budget allocation.

## Key Concepts

### Incrementality vs. Attribution

**Attribution**: Which touchpoints preceded a conversion?
- Counts touches on converting users
- Doesn't answer "would they have converted anyway?"

**Incrementality**: Did marketing cause additional conversions?
- Compares to counterfactual (no marketing)
- Answers the causal question

### The Baseline Problem

Many people who convert after seeing an ad would have converted anyway:
- Brand searchers who see search ads
- Loyal customers who receive promotions
- Users in-market who encounter display ads

Without incrementality, you can't separate caused conversions from baseline.

## Measurement Approaches

### Randomized Controlled Trials (RCTs)

Gold standard: randomly assign treatment and control.

**Holdout test**:
- 90% receive marketing
- 10% receive nothing
- Compare conversion rates

**Ghost ads**:
- Control sees placeholder/competitor ad
- Accounts for ad exposure opportunity

### Geo Experiments

When user-level randomization isn't possible:
- Randomly assign regions to treatment/control
- Compare outcomes across regions
- Synthetic control for counterfactuals

### Matched Market Tests

Compare similar markets with different treatments:
- Match on historical behavior, demographics
- Apply treatment to some, not others
- Difference-in-differences analysis

## Mathematical Framework

### Treatment Effect

$$\text{Incrementality} = E[Y(1)] - E[Y(0)]$$

where $Y(1)$ is outcome with marketing, $Y(0)$ is outcome without.

### Lift Calculation

$$\text{Lift} = \frac{\text{Treatment Rate} - \text{Control Rate}}{\text{Control Rate}}$$

$$\text{Incremental Conversions} = (\text{Treatment Rate} - \text{Control Rate}) \times N_{treated}$$

### Cost Per Incremental Conversion

$$\text{iCPA} = \frac{\text{Marketing Spend}}{\text{Incremental Conversions}}$$

This is the true cost of acquiring a customer—often much higher than attributed CPA.

## Practical Implementation

```python
import numpy as np
from scipy import stats
import pandas as pd

class IncrementalityTest:
    """Framework for measuring marketing incrementality"""

    def __init__(self, treatment_rate: float = 0.9):
        self.treatment_rate = treatment_rate

    def run_user_level_test(self, users: pd.DataFrame,
                             duration_days: int = 14):
        """
        Run randomized holdout test

        users: DataFrame with user_id, features
        Returns: test assignment and results
        """
        n_users = len(users)

        # Random assignment
        users['treatment'] = np.random.random(n_users) < self.treatment_rate

        # In production: assign and wait for conversions
        # Here: simulate outcomes
        users['converted'] = self._simulate_conversions(users)

        return self.analyze_results(users)

    def _simulate_conversions(self, users):
        """Simulate conversion outcomes (for demonstration)"""
        # Baseline conversion probability
        baseline_prob = 0.02
        # True treatment effect
        true_lift = 0.003

        probs = baseline_prob + users['treatment'] * true_lift
        return np.random.binomial(1, probs)

    def analyze_results(self, data: pd.DataFrame):
        """Calculate incrementality from test results"""
        treatment = data[data['treatment']]
        control = data[~data['treatment']]

        # Conversion rates
        treatment_rate = treatment['converted'].mean()
        control_rate = control['converted'].mean()

        # Lift
        absolute_lift = treatment_rate - control_rate
        relative_lift = absolute_lift / control_rate if control_rate > 0 else 0

        # Statistical significance
        contingency = np.array([
            [treatment['converted'].sum(), len(treatment) - treatment['converted'].sum()],
            [control['converted'].sum(), len(control) - control['converted'].sum()]
        ])
        chi2, p_value, _, _ = stats.chi2_contingency(contingency)

        # Confidence interval (using normal approximation)
        se = np.sqrt(
            treatment_rate * (1 - treatment_rate) / len(treatment) +
            control_rate * (1 - control_rate) / len(control)
        )
        ci_lower = absolute_lift - 1.96 * se
        ci_upper = absolute_lift + 1.96 * se

        return {
            'treatment_rate': treatment_rate,
            'control_rate': control_rate,
            'absolute_lift': absolute_lift,
            'relative_lift': relative_lift,
            'p_value': p_value,
            'ci_95': (ci_lower, ci_upper),
            'incremental_conversions': absolute_lift * len(treatment),
            'is_significant': p_value < 0.05
        }


class GeoExperiment:
    """Geo-level incrementality testing"""

    def __init__(self, geos: pd.DataFrame, n_treatment: int):
        """
        geos: DataFrame with geo_id, population, historical_conversions
        n_treatment: number of geos to receive treatment
        """
        self.geos = geos
        self.n_treatment = n_treatment

    def stratified_randomization(self):
        """Assign geos to treatment/control with stratification"""
        # Sort by size for balanced assignment
        sorted_geos = self.geos.sort_values('population')

        # Pair matching: adjacent geos, one treatment, one control
        treatment_geos = []
        for i in range(0, len(sorted_geos), 2):
            if np.random.random() < 0.5:
                treatment_geos.append(sorted_geos.iloc[i]['geo_id'])
            else:
                treatment_geos.append(sorted_geos.iloc[i+1]['geo_id'])

        self.geos['treatment'] = self.geos['geo_id'].isin(treatment_geos)
        return self.geos

    def analyze_with_did(self, pre_period: pd.DataFrame,
                         post_period: pd.DataFrame):
        """Difference-in-differences analysis"""
        # Merge pre and post
        pre_period['period'] = 'pre'
        post_period['period'] = 'post'
        data = pd.concat([pre_period, post_period])
        data = data.merge(self.geos[['geo_id', 'treatment']], on='geo_id')

        # DiD estimate
        treatment_pre = data[(data['treatment']) & (data['period'] == 'pre')]['conversions'].mean()
        treatment_post = data[(data['treatment']) & (data['period'] == 'post')]['conversions'].mean()
        control_pre = data[(~data['treatment']) & (data['period'] == 'pre')]['conversions'].mean()
        control_post = data[(~data['treatment']) & (data['period'] == 'post')]['conversions'].mean()

        did_estimate = (treatment_post - treatment_pre) - (control_post - control_pre)

        return {
            'did_estimate': did_estimate,
            'treatment_change': treatment_post - treatment_pre,
            'control_change': control_post - control_pre
        }


# Example usage
np.random.seed(42)

# User-level test
test = IncrementalityTest(treatment_rate=0.9)
users = pd.DataFrame({'user_id': range(100000)})
results = test.run_user_level_test(users)

print("Incrementality Test Results:")
print(f"  Treatment rate: {results['treatment_rate']:.4f}")
print(f"  Control rate: {results['control_rate']:.4f}")
print(f"  Absolute lift: {results['absolute_lift']:.4f}")
print(f"  Relative lift: {results['relative_lift']:.1%}")
print(f"  P-value: {results['p_value']:.4f}")
print(f"  Significant: {results['is_significant']}")
```

## Common Challenges

1. **Contamination**: Control users exposed to treatment through other channels.

2. **Sample size**: Detecting small lifts requires large tests. Plan power analysis.

3. **Holdout cost**: Withholding marketing from 10% means 10% less reach.

4. **External validity**: Test conditions may not match normal operations.

5. **Cannibalization**: Marketing lifts one channel but reduces another.

## Best Practices

- **Regular testing**: Run incrementality tests periodically, not just once
- **Multiple channels**: Test each channel separately—incrementality varies
- **Power analysis**: Size tests properly to detect realistic effects
- **Long enough**: Allow full conversion windows to capture delayed effects
- **Document assumptions**: Be explicit about what you're measuring

## Summary

Incrementality is the true measure of marketing effectiveness. Key takeaways:

- Attribution ≠ Causation; incrementality measures causal lift
- RCTs are gold standard; geo experiments when user-level not possible
- True iCPA usually much higher than attributed CPA

**Further Reading**:
- Google's "Marketing Incrementality" whitepaper
- Facebook's "Conversion Lift" documentation
- Lewis & Rao, "The Unfavorable Economics of Measuring the Returns to Advertising"
