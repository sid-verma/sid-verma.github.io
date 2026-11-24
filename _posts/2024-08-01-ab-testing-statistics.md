---
title: "A/B Testing at Scale: Statistical Methods for Trustworthy Experiments"
date: 2024-08-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - ab-testing
  - experimentation
  - statistics
  - hypothesis-testing
---

> In 2012, Google ran over 7,000 A/B tests. By 2020, that number exceeded 100,000 per year. A/B testing is the backbone of data-driven decision making—but most experiments are run incorrectly.

P-hacking, underpowered tests, and multiple comparison problems plague naively run experiments. A poorly designed test can confidently tell you a feature improved conversion when it actually made things worse.

This primer covers the statistical foundations every experimentation practitioner needs: power analysis, multiple testing corrections, variance reduction, and how to avoid the traps that lead to false conclusions.

## Introduction and Motivation

"Did this feature improve conversion?" A/B testing gives a definitive answer by randomly assigning users to treatment and control, then comparing outcomes. It's the backbone of data-driven decision making at every tech company.

But A/B testing done wrong leads to false conclusions. P-hacking, underpowered tests, and multiple comparison problems plague naively run experiments. Understanding the statistics is essential.

## Statistical Framework

At a high level, a trustworthy A/B test follows the workflow below—from experiment design and power analysis through randomization, data collection, analysis, and interpretation:

{% drawio path="assets/diagrams/ab-testing-workflow.drawio" page_number=0 height=620 %}

*Figure: End-to-end A/B testing workflow from experiment design and power analysis to randomization, data collection, analysis, and decision-making.*

### Hypothesis Testing

**Null hypothesis** ($H_0$): Treatment has no effect
**Alternative hypothesis** ($H_1$): Treatment has effect

**Two types of errors**:
- Type I (α): Reject $H_0$ when true (false positive)
- Type II (β): Fail to reject $H_0$ when false (false negative)

**Power** = 1 - β: Probability of detecting true effect

### Test Statistics

For comparing proportions (conversion rates):
$$z = \frac{\hat{p}_T - \hat{p}_C}{\sqrt{\hat{p}(1-\hat{p})(\frac{1}{n_T} + \frac{1}{n_C})}}$$

For comparing means (revenue, time spent):
$$t = \frac{\bar{X}_T - \bar{X}_C}{\sqrt{\frac{s_T^2}{n_T} + \frac{s_C^2}{n_C}}}$$

### Minimum Detectable Effect (MDE)

With power = 0.8 and α = 0.05:
$$\text{MDE} \approx 2.8 \times \sqrt{\frac{2\sigma^2}{n}}$$

Smaller effects require larger samples.

## Sample Size Calculation

### For Proportions

$$n = \frac{2(z_{\alpha/2} + z_\beta)^2 p(1-p)}{\delta^2}$$

where $p$ is baseline conversion, $\delta$ is minimum detectable effect.

### For Continuous Metrics

$$n = \frac{2(z_{\alpha/2} + z_\beta)^2 \sigma^2}{\delta^2}$$

## Practical Implementation

```python
import numpy as np
from scipy import stats
import pandas as pd

class ABTest:
    """Framework for A/B test analysis"""

    def __init__(self, alpha=0.05, power=0.8):
        self.alpha = alpha
        self.power = power
        self.z_alpha = stats.norm.ppf(1 - alpha/2)
        self.z_beta = stats.norm.ppf(power)

    def required_sample_size(self, baseline_rate: float,
                             mde: float, metric_type='proportion'):
        """Calculate required sample size per group"""
        if metric_type == 'proportion':
            p = baseline_rate
            var = p * (1 - p)
            effect = mde * p  # Relative MDE to absolute
        else:
            var = baseline_rate  # Pass variance for continuous
            effect = mde

        n = 2 * (self.z_alpha + self.z_beta)**2 * var / effect**2
        return int(np.ceil(n))

    def analyze_proportion(self, n_treat: int, conv_treat: int,
                          n_control: int, conv_control: int):
        """Analyze A/B test with binary outcome"""
        p_treat = conv_treat / n_treat
        p_control = conv_control / n_control

        # Pooled proportion
        p_pooled = (conv_treat + conv_control) / (n_treat + n_control)

        # Standard error
        se = np.sqrt(p_pooled * (1 - p_pooled) * (1/n_treat + 1/n_control))

        # Z-statistic and p-value
        z = (p_treat - p_control) / se
        p_value = 2 * (1 - stats.norm.cdf(abs(z)))

        # Confidence interval
        se_diff = np.sqrt(p_treat*(1-p_treat)/n_treat +
                         p_control*(1-p_control)/n_control)
        ci_lower = (p_treat - p_control) - self.z_alpha * se_diff
        ci_upper = (p_treat - p_control) + self.z_alpha * se_diff

        # Lift
        lift = (p_treat - p_control) / p_control if p_control > 0 else 0

        return {
            'treatment_rate': p_treat,
            'control_rate': p_control,
            'absolute_diff': p_treat - p_control,
            'relative_lift': lift,
            'z_statistic': z,
            'p_value': p_value,
            'ci_95': (ci_lower, ci_upper),
            'significant': p_value < self.alpha
        }

    def analyze_continuous(self, treatment: np.ndarray,
                          control: np.ndarray):
        """Analyze A/B test with continuous outcome"""
        # Welch's t-test (unequal variances)
        t_stat, p_value = stats.ttest_ind(treatment, control, equal_var=False)

        mean_treat = treatment.mean()
        mean_control = control.mean()
        diff = mean_treat - mean_control

        # Standard error of difference
        se = np.sqrt(treatment.var()/len(treatment) +
                    control.var()/len(control))

        ci_lower = diff - self.z_alpha * se
        ci_upper = diff + self.z_alpha * se

        return {
            'treatment_mean': mean_treat,
            'control_mean': mean_control,
            'difference': diff,
            'relative_lift': diff / mean_control if mean_control != 0 else 0,
            't_statistic': t_stat,
            'p_value': p_value,
            'ci_95': (ci_lower, ci_upper),
            'significant': p_value < self.alpha
        }


class VarianceReduction:
    """Variance reduction techniques"""

    @staticmethod
    def cuped(y_post: np.ndarray, y_pre: np.ndarray,
              treatment: np.ndarray):
        """CUPED: Controlled-experiment Using Pre-Experiment Data"""
        # Compute theta (regression coefficient)
        cov = np.cov(y_post, y_pre)[0, 1]
        var_pre = y_pre.var()
        theta = cov / var_pre if var_pre > 0 else 0

        # Adjusted outcome
        y_adjusted = y_post - theta * (y_pre - y_pre.mean())

        # Compare adjusted means
        treat_adj = y_adjusted[treatment == 1].mean()
        control_adj = y_adjusted[treatment == 0].mean()

        # Variance reduction
        original_var = y_post.var()
        adjusted_var = y_adjusted.var()
        reduction = 1 - adjusted_var / original_var

        return {
            'adjusted_diff': treat_adj - control_adj,
            'theta': theta,
            'variance_reduction': reduction
        }


# Example usage
np.random.seed(42)

# Sample size calculation
test = ABTest()
n_required = test.required_sample_size(
    baseline_rate=0.05,  # 5% baseline conversion
    mde=0.10  # 10% relative lift (0.5% absolute)
)
print(f"Required sample size per group: {n_required:,}")

# Simulate experiment
n_per_group = 50000
p_control = 0.05
p_treat = 0.052  # 4% lift

conv_control = np.random.binomial(n_per_group, p_control)
conv_treat = np.random.binomial(n_per_group, p_treat)

results = test.analyze_proportion(
    n_per_group, conv_treat, n_per_group, conv_control
)

print("\nExperiment Results:")
for key, value in results.items():
    if isinstance(value, float):
        print(f"  {key}: {value:.4f}")
    elif isinstance(value, tuple):
        print(f"  {key}: ({value[0]:.4f}, {value[1]:.4f})")
    else:
        print(f"  {key}: {value}")
```

## Multiple Testing

### Problem

Running 20 tests at α=0.05 means ~64% chance of at least one false positive.

### Solutions

**Bonferroni correction**: $\alpha_{adj} = \alpha / m$
- Conservative; controls family-wise error rate

**Benjamini-Hochberg (FDR)**:
- Controls false discovery rate
- Less conservative; appropriate for many tests

**Sequential testing**:
- Monitor results continuously
- Adjust thresholds to control error rate

## Variance Reduction

### CUPED

Use pre-experiment data to reduce variance:
$$\hat{Y}_{adj} = Y - \theta(X - \bar{X})$$

where $X$ is pre-period metric. Can reduce variance by 50%+.

### Stratification

Stratify randomization by high-variance predictors (device type, country). Ensures balance, reduces variance.

## Common Pitfalls

1. **Peeking**: Checking results repeatedly inflates false positive rate. Use sequential testing.

2. **Underpowered tests**: Too small → can't detect real effects. Always do power analysis.

3. **Network effects**: Users influence each other. Use cluster randomization.

4. **Novelty effects**: Initial results may not persist. Run longer or track over time.

5. **Segment fishing**: Testing many segments until one is significant. Correct for multiple comparisons.

## Summary

Rigorous A/B testing requires careful design and analysis. Key takeaways:

- Power analysis determines sample size before running
- Multiple testing requires correction
- Variance reduction (CUPED) makes tests more efficient

**Further Reading**:
- Kohavi, Tang & Xu, *Trustworthy Online Controlled Experiments*
- Deng et al., "Improving the Sensitivity of Online Controlled Experiments" (CUPED)
- Netflix Tech Blog on experimentation
