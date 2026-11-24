---
title: "Funnel Tradeoffs in Advertising: Optimizing Awareness, Conversion, and Retention"
date: 2025-12-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - ad-tech
  - funnel-optimization
  - measurement
  - incrementality
---

> *"Performance marketing harvests existing demand. Brand marketing creates future demand. If you only harvest, you will starve."*

A common tragedy in Ad Tech:
1. CFO joins. Demands $ROAS \ge 4.0$.
2. Marketing team cuts TV, YouTube, and "Brand Awareness" because they have low ROAS.
3. They shift budget to "Retargeting" (showing shoes to people who just looked at shoes).
4. **Short term**: ROAS skyrockets to $8.0$.
5. **Long term**: New user growth flatlines. The brand dies.

This post explores the **Upper Funnel vs Lower Funnel** problem and how to solve it mathematically.

> **Related reading**: This connects [Incrementality Testing](/posts/incrementality-testing-at-scale/) with the strategic budgeting discussed in [Online Bid Optimization](/posts/online-bid-optimization/).

---

## Chapter I: The Funnel Physics

The funnel is a flow metrics problem.

- **Upper Funnel (Awareness)**: Low Probability of Conversion (pCVR), High Volume.
- **Lower Funnel (Conversion)**: High pCVR, Low Volume.

**The Trap**: Last-Touch Attribution gives 100% credit to the Lower Funnel (Search/Retargeting).
The Upper Funnel (which introduced the user to the brand) gets 0 credit.

---

## Chapter II: The "Performance Performance" vs "Brand Performance"

We need to split metrics.

| Stage | Metric | Measurement |
|-------|--------|-------------|
| **Lower Funnel** | CPA, ROAS | Attribution / Click Cookies |
| **Upper Funnel** | Lift in Search Volume, Brand Lift | Geo-Experiments / Surveys |

**The Correlation**:
$$Volume(Search) \propto Spend(Brand, t-30 \text{days})$$
There is a lag. Spending on TV today increases Google Search volume next month.

---

## Chapter III: Modeling the Tradeoff

We can model the total system revenue as a coupled differential equation or a multi-stage regression.

$$NewUsers_t = \alpha \cdot BrandSpend_t + \beta \cdot NewUsers_{t-1}$$
$$Conversions_t = \gamma \cdot NewUsers_t \cdot PerfSpend_t$$

If $BrandSpend \to 0$, then $NewUsers \to 0$. Eventually $Conversions \to 0$, no matter how high $PerfSpend$ is.

### Optimization with MMM
Marketing Mix Modeling (MMM) estimates the $\alpha$ and $\gamma$ parameters without needing user-level tracking.

---

## Chapter IV: Python Simulator

Let's simulate the creating vs harvesting dynamic.

```python
import numpy as np
import matplotlib.pyplot as plt

def simulate_business(weeks=52, brand_budget=1000, perf_budget=1000):
    # Initial State
    awareness_pool = 10000
    revenue = []

    for w in range(weeks):
        # 1. Brand Marketing feeds the Awareness Pool
        # Cost per Reach = $0.10
        new_aware = (brand_budget / 0.10)
        # Decay: 10% of people forget the brand every week
        awareness_pool = awareness_pool * 0.9 + new_aware

        # 2. Performance Marketing harvests the Awareness Pool
        # Conversion Rate depends of Performance Spend
        cvr = min(0.05, perf_budget / 100000)
        conversions = awareness_pool * cvr

        # Revenue ($50 per sale)
        rev = conversions * 50
        revenue.append(rev)

    return revenue

# Scenario A: Balanced
rev_balanced = simulate_business(brand_budget=5000, perf_budget=5000)

# Scenario B: All Performance (Harvest Strategy)
rev_harvest = simulate_business(brand_budget=0, perf_budget=10000)

plt.plot(rev_balanced, label='Balanced')
plt.plot(rev_harvest, label='All Performance')
plt.legend()
plt.title("The Death Spiral of Pure Performance")
plt.ylabel("Revenue")
plt.xlabel("Week")
# Result: 'All Performance' wins for 5 weeks, then crashes as awareness pool drains.
```

---

## Chapter V: Agentic Optimization

In the [Agentic Era](/posts/the-era-of-ai-agents/), we don't just set static budgets.
An **Allocator Agent** monitors the "Health of the Funnel".

- **Signal**: "Brand Search Volume is down 10% YoY."
- **Action**: "Shift 20% of budget from Retargeting to Youtube Reach campaigns."

This is **Full-Funnel Automation**.

---

## Summary

The job of the CMO (and the algorithm) is to balance **Efficiency** (ROAS) and **Growth** (Reach).
- Too much Efficiency = Shrinking Business.
- Too much Growth = Bankruptcy.
- The Sweet Spot = Using MMM to fund the top of the funnel just enough to feed the bottom.

> *"Don't eat your seed corn."*
---
title: "Funnel Tradeoffs in Advertising: Optimizing Awareness, Conversion, and Retention"
date: 2025-12-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - ad-tech
  - funnel-optimization
  - measurement
  - incrementality
---
