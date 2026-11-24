---
title: "Randomized Control Trials in Marketing: Measuring True Incrementality"
date: 2025-01-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - ad-tech
  - incrementality
  - randomized-control-trials
  - causal-inference
---

> *"Half the money I spend on advertising is wasted; the trouble is I don't know which half."*
> — **John Wanamaker** (19th Century Retailer)

In digital advertising, this quote is optimistically outdated. With attribution models often claiming credit for users who would have converted anyway, it's possible *nearly all* your ad spend is wasted.

To separate **correlation** (user saw ad and bought) from **causation** (user bought *because* they saw ad), we need the rigor of clinical trials applied to advertising: The Marketing RCT.

> **Related reading**: This is the practical application of [Instrumental Variables](/posts/instrumental-variables/) and [Double Machine Learning](/posts/double-machine-learning/).

---

## Chapter I: The Fundamental Problem

Why can't we just compare `Conversion Rate (Saw Ad)` vs `Conversion Rate (No Ad)`?

Because of **Selection Bias**.
Algorithms target people *likely to buy*.
- Group A (Saw Ad): People who love shoes.
- Group B (No Ad): People who hate shoes.

If Group A buys more shoes, is it the ad, or did they just like shoes?

$$E[Y | T=1] - E[Y | T=0] = \underbrace{ATT}_{\text{True Effect}} + \underbrace{Bias}_{\text{Selection}}$$

To zero out the Bias, we must randomize.

---

## Chapter II: The Placebo Ad (PSA) Approach

The "Classical" RCT approach:
1. Identify a target audience.
2. Randomize them 50/50.
3. Show **Treatment Group** the real ad (e.g., Nike).
4. Show **Control Group** a "Placebo" ad (e.g., Charity/Red Cross).

**Pros**: Perfect counterfactual. We know exactly who is in the control group (those who saw the charity ad).
**Cons**:
- **Cost**: You pay for the charity impressions.
- **Opportunity Cost**: You waste inventory.
- **AdAuction Bias**: The charity ad might win different auctions than the Nike ad (lower bid), so the populations aren't exactly comparable.

---

## Chapter III: Ghost Ads

Google and Facebook solved the cost problem with **Ghost Ads**.

### The Mechanism
1. The ad platform holds an auction.
2. If your ad wins, the platform flips a coin *before* showing the ad.
   - **Head (Treatment)**: Show your ad. Tag user "Saw Ad".
   - **Tails (Control)**: Suppress your ad. Show the *next highest bidder's* ad. **Log a "Ghost Impression"**.

Crucially, we now have a control group of users who *would have seen* your ad, but didn't. And we didn't pay for a charity ad.

### The Analysis

We compare the conversion rates of the **Exposed** vs **Ghost Exposed**.

$$Lift = \frac{CVR_{T} - CVR_{C}}{CVR_{C}}$$

```python
import numpy as np
import scipy.stats as stats

def analyze_ghost_experiment(treatment_conv, treatment_n, control_conv, control_n):
    """
    Analyzes a Ghost Ad experiment.

    Args:
        treatment_conv: Number of conversions in treatment
        treatment_n: Total ghost/actual impressions in treatment
        control_conv: Number of conversions in control
        control_n: Total ghost impressions in control
    """
    p_t = treatment_conv / treatment_n
    p_c = control_conv / control_n

    lift = (p_t - p_c) / p_c

    # Z-test for proportions
    p_pooled = (treatment_conv + control_conv) / (treatment_n + control_n)
    se = np.sqrt(p_pooled * (1 - p_pooled) * (1/treatment_n + 1/control_n))
    z_score = (p_t - p_c) / se
    p_value = (1 - stats.norm.cdf(abs(z_score))) * 2

    return lift, p_value

# Example
# Treatment: 50,000 users saw ad, 500 converted (1%)
# Control: 50,000 users logged ghost impression, 450 converted (0.9%)
lift, p = analyze_ghost_experiment(500, 50000, 450, 50000)
print(f"Incremental Lift: {lift:.2%}")
print(f"P-value: {p:.4f}")
# Incremental Lift: 11.11%
# P-value: 0.13 (Not significant!)
```

---

## Chapter IV: Intent-to-Treat (ITT)

Sometimes we can't track "Ghost Impressions". For example, in email marketing, we can randomize the *list* but we can't force people to open the email.

We analyze based on assignment, not exposure.

- **ITT Effect**: Effect of *assigning* someone to the ad group.
- **LATE (Local Average Treatment Effect)**: Effect on those who actually saw it.

$$LATE = \frac{ITT}{\text{Compliance Rate}}$$

If valid assignment increased sales by $10 (ITT), but only $50\%$ of people opened the email (Compliance):
$$LATE = \$10 / 0.5 = \$20$$
Every *opened* email generated $20.

---

## Chapter V: Geo-Experiments (GeoX)

When digital tracking fails (e.g., TV ads, privacy changes, cookies dying), we return to geography.

### The Design
1. Divide country into 100 markets (DMA - Designated Market Areas).
2. Build a **Synthetic Control** for your treatment regions.
3. Shut off ads in Control regions ("Dark/Holdout").
4. Blast ads in Treatment regions.

### Time-Based Regression (TBR)
We predict what the revenue in Treatment regions *would have been* using the Control regions.

$$Y_{treat}(t) = \beta_0 + \beta_1 Y_{control}(t) + \epsilon$$

Train on pre-test period. Predict for test period. The difference is lift.

```python
import pandas as pd
from sklearn.linear_model import LinearRegression

class GeoLift:
    def __init__(self, df, treat_geo, control_geos, date_col, metric_col):
        self.data = df
        self.treat = treat_geo
        self.controls = control_geos
        self.model = LinearRegression()

    def fit_predict(self, test_start_date):
        # Pre-test data
        pre_data = self.data[self.data['date'] < test_start_date]

        X_pre = pre_data[self.controls].sum(axis=1).values.reshape(-1, 1)
        y_pre = pre_data[self.treat].values

        self.model.fit(X_pre, y_pre)
        r2 = self.model.score(X_pre, y_pre)

        # Test period
        test_data = self.data[self.data['date'] >= test_start_date]
        X_test = test_data[self.controls].sum(axis=1).values.reshape(-1, 1)
        y_actual = test_data[self.treat].values

        y_pred = self.model.predict(X_test)

        incremental = (y_actual - y_pred).sum()
        lift = incremental / y_pred.sum()

        return lift, r2

# Note: In production, use Facebook's GeoLift R package or Google's CausalImpact
```

---

## Chapter VI: The Hierarchy of Evidence

Not all "lift" numbers are created equal.

1. **Ghost Ads / PSA RCTs**: Gold standard. User-level precision.
2. **Geo-Experiments**: Silver standard. Robust to cookie loss, but high variance.
3. **Observational Methods (matching)**: Bronze. Good for directional checks.
4. **Last-Touch Attribution**: Garbage. Ignores causality completely.

### When to use what?
- **Retargeting**: Must use RCT (Ghost Ads). Selection bias is huge here (retargeting users who just visited cart).
- **Brand Awareness (TV/Youtube)**: Geo-Experiments.
- **Search Ads**: Incrementality is usually low (cannibalization of organic SEO). Test via GeoX or Paid Search Holdouts.

---

## Summary

In modern marketing, "Data-Driven" isn't enough. You must be "Evidence-Based".
Data says the ad drove sales (correlation). Evidence says the ad *caused* sales (causality).

Without RCTs, you are likely paying rent for customers you already own.

> *"If you cannot measure it, you cannot improve it."* — Lord Kelvin
> *"If you measure it wrong, you will improve the wrong thing."* — Modern Corollary
