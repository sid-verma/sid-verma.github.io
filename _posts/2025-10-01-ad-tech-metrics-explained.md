---
title: "Ad Tech Metrics Explained: CTR, CVR, ROAS, and Incrementality"
date: 2025-10-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - ad-tech
  - metrics
  - incrementality
  - measurement
---

> *"In God we trust. All others must bring data."* — W. Edwards Deming
> *"In Ad Tech we trust. All others must understand conversion lag."* — Anonymous

Ad Tech is notorious for its alphabet soup of acronyms. But these aren't just jargon—they are the physics of the marketplace.
Understanding **eCPM** is as vital to an ad engineer as $F=ma$ is to a physicist.

This post explains the key metrics, how they relate, and the statistical traps that ruin dashboards.

> **Related reading**: These metrics feed the [Online Bid Optimization](/posts/online-bid-optimization/) controllers.

---

## Chapter I: The Hierarchy of Metrics

Everything flows from the Auction to the Bank Account.

### 1. The Auction Currency: eCPM
**effective Cost Per Mille** (thousand impressions). This is the *only* thing the ad server cares about. It normalizes all bids (CPC, CPA, CPM) into a single revenue number for the publisher.

$$eCPM = \frac{Revenue}{Impressions} \times 1000$$

If Bidder A pays \$1.00 per Click with $1\%$ CTR:
$$eCPM = \$1.00 \times 0.01 \times 1000 = \$10.00$$

### 2. The Efficiency Metrics (Advertiser View)
- **CPC (Cost Per Click)**: $\frac{Spend}{Clicks}$. Measures "Traffic Cost".
- **CPA (Cost Per Action)**: $\frac{Spend}{Conversions}$. Measures "Acquisition Efficiency".
- **ROAS (Return On Ad Spend)**: $\frac{Revenue}{Spend}$. Measures "Business Value".
  - Good for e-commerce (Sales).
  - Target: $4.0x$ (spend \$1, make \$4).

### 3. The Supply Metrics (Publisher View)
- **Fill Rate**: $\frac{Ads Shown}{Ad Requests}$. "Did we waste the opportunity?"
- **Viewability**: % of ads actually seen by user (IAB standard: 50% pixels for 1s).

---

## Chapter II: The Lagged Conversion Trap

**Scenario**: You launch a campaign on Monday.
- Monday Spend: \$1000.
- Monday Revenue: \$500.
- **Monday ROAS**: $0.5x$ (Disaster!)

**Tuesday**: User who clicked Monday finally buys.
- Monday Revenue (updated): \$2000.
- **Monday ROAS**: $2.0x$ (Success!)

Most conversions happen days after the click. This is **Conversion Lag**.
If you optimize based on *today's* reported ROAS, you will kill your best campaigns because they haven't matured yet.

### The Solution: Cohort Analysis
Always analyze based on **Click Date**, not **Conversion Date**.

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def plot_cohort_roas(df):
    """
    df has columns: click_date, conversion_date, spend, revenue
    """
    # 1. Group Spend by Click Date
    daily_spend = df.groupby('click_date')['spend'].sum()

    # 2. Group Revenue by Click Date (Critical!)
    # Even if conversion happened 7 days later, it belongs to the click cohort
    daily_revenue = df.groupby('click_date')['revenue'].sum()

    # 3. Calculate Mature ROAS
    roas = daily_revenue / daily_spend

    return roas

# Simulating Lag
clicks = pd.date_range(start='2025-01-01', periods=10)
spend = np.random.uniform(1000, 2000, 10)
revenue_immediate = spend * 0.5
revenue_delayed = spend * 1.5 # Comes 3 days later

# If we looked at data on Day 1, we'd see 0.5 ROAS.
# If we looked on Day 5, the first cohort would show 2.0 ROAS.
```

---

## Chapter III: Attribution Windows

When does credit expire?
- **Click-Through Window**: 7 days (Standard). If I buy 8 days after clicking, ad gets 0 credit.
- **View-Through Window**: 1 day. If I saw the ad (didn't click) and bought tomorrow.

 **Trap**: "View-Through" is often 90% cannibalization.
See [Incrementality Testing at Scale](/posts/incrementality-testing-at-scale/) for why View-Through ROAS is usually a lie.

---

## Chapter IV: Simpson's Paradox in Ad Tech

**Aggregated data lies.**

| Device | Spend | Revenue | ROAS |
|--------|-------|---------|------|
| Android | \$100 | \$200 | 2.0 |
| iOS | \$1000 | \$1000 | 1.0 |
| **Total** | **\$1100** | **\$1200** | **1.09** |

If you optimize for "Total ROAS", you might cut Android budget because it's small, or cut iOS because it's inefficient.
But maybe Android users are just cheaper to acquire?

**Lesson**: Always slice metrics by **Dimension** (OS, Country, Placement) before making decisions.

---

## Summary

Metrics guide the algorithms.
- **eCPM** rules the auction.
- **ROAS** rules the budget.
- **Lag** rules the reality.

> *"If you torture the data long enough, it will confess."* — Ronald Coase
---
title: "Ad Tech Metrics Explained: CTR, CVR, ROAS, and Incrementality"
date: 2025-10-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - ad-tech
  - metrics
  - incrementality
  - measurement
---
