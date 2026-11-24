---
title: "Online Bid Optimization: Real-Time Control for Advertising Markets"
date: 2025-08-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - ad-tech
  - bid-optimization
  - auctions
  - reinforcement-learning
---

> *"A budget is not just a constraint; it's a signal. It tells you that opportunity is scarce, and therefore, you must be picky."*

In [Deep Dive into Ad Systems](/posts/deep-dive-into-ad-systems/), we saw *how* ads are delivered. Now we ask *how much* to bid.
If you bid your true value on every query, you will likely exhaust your daily budget by 10 AM. This is suboptimal because you might miss cheaper/better opportunities at 8 PM.

This is **Online Bid Optimization**. It sits at the intersection of Control Theory and Convex Optimization.

---

## Chapter I: The Problem Statement

You have:
- Total Budget $B$.
- Unknown stream of queries $q_1, q_2, \dots$.
- For each query, a Value $v_i$ (predicted conversion value) and a Cost $c_i$ (what used to pay).

**Objective**: Maximize Total Value $\sum v_i x_i$ subject to $\sum c_i x_i \le B$, where $x_i \in \{0, 1\}$.

This is the **0/1 Knapsack Problem**, but online (we don't know future items).

---

## Chapter II: Multiplicative Pacing

The optimal solution to the continuous relaxation of the Knapsack problem is to pick items with the highest Value-to-Cost ratio.
In bidding terms, we "shade" our bid by a factor $\alpha \in [0, 1]$.

$$Bid_{shaded} = \alpha \times Valuation$$

- If $\alpha=1$: We bid aggressively. We win high-value auctions but spend fast.
- If $\alpha=0.5$: We bid conservatively. We only win auctions where we can get the item for half its value.

**The Goal**: Find the largest $\alpha$ such that we spend *exactly* our budget $B$ just as the day ends ($T=24h$).

---

## Chapter III: PID Controllers for Pacing

Since auction pressure fluctuates, a static $\alpha$ fails. We need a controller that adjusts $\alpha_t$ in real-time.

**Error Signal**:
$$e(t) = \text{TargetSpend}(t) - \text{ActualSpend}(t)$$

we use a **PID Controller**:
$$u(t) = K_p e(t) + K_i \int e(t) dt + K_d \frac{de(t)}{dt}$$

- **Proportional ($K_p$)**: Corrects current error.
- **Integral ($K_i$)**: Corrects accumulated drift (if we consistently underspend).
- **Derivative ($K_d$)**: Dampens oscillation.

### Implementation

```python
class PIDController:
    def __init__(self, kp, ki, kd, target_total, time_steps=24):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.target_rate = target_total / time_steps

        self.prev_error = 0
        self.integral = 0

    def update(self, current_spend, dt=1):
        # Calculate error: Positive if underspending
        error = self.target_rate * dt - current_spend

        # Proportional term
        p_term = self.kp * error

        # Integral term
        self.integral += error * dt
        i_term = self.ki * self.integral

        # Derivative term
        derivative = (error - self.prev_error) / dt
        d_term = self.kd * derivative

        self.prev_error = error

        # Output is the adjustment to the pacing multiplier
        adjustment = p_term + i_term + d_term
        return adjustment

# Simulating a day
budget = 1000
controller = PIDController(kp=0.001, ki=0.0001, kd=0.0005, target_total=budget)
alpha = 0.5 # Initial pacing multiplier

for hour in range(24):
    # Simulate market: Spend depends on alpha + random noise
    market_pressure = np.random.normal(100, 20)
    actual_spend = market_pressure * alpha

    # Update controller
    adj = controller.update(actual_spend)

    # Update alpha (clamped between 0.1 and 1.0)
    alpha = max(0.1, min(1.0, alpha + adj))

    print(f"Hour {hour}: Spend=${actual_spend:.2f}, New Alpha={alpha:.3f}")
```

---

## Chapter IV: Shadow Bidding (Exploration)

How do you know what would have happened if you bid differently?
**Shadow Bidding**.

For every auction, we log:
1. **Primary Bid**: The actual bid we submitted (e.g., \$5.00).
2. **Shadow Bids**: "What if we bid \$4.00? \$6.00?"

If we win with \$5.00, we check the second price (e.g., \$4.50).
- If Shadow Bid \$4.00 < \$4.50: We would have lost.
- If Shadow Bid \$6.00 > \$4.50: We would have won (same price).

This generates **Counterfactual Data** to train offline Reinforcement Learning models (like [Contextual Bandits](/posts/contextual-bandits/)).

---

## Chapter V: Multipoint Pacing (Smart Pacing)

Simple pacing assumes uniform demand. But 8 PM is more valuable than 3 AM.
Instead of smoothing *spend*, we should smooth *marginal ROI*.

$$ROI_{marginal}(t) = \lambda$$

We spend fast when opportunities are cheap, and slow when they are expensive, maintaining a constant marginal efficiency. This is the **Dual Primal** formulation of the budget constrained optimization.

---

## Summary

Bid optimization turns a binary "buy/no-buy" decision into a probabilistic portfolio management problem.
- **Pacing** ensures we stay in the game.
- **PID Controllers** handle the volatility.
- **Shadow Bidding** lets us learn without bankruptcy.

> *"The market can remain irrational longer than you can remain solvent."* — Keynes
> *"Unless you have a PID controller."* — Ad Tech Engineer
---
title: "Online Bid Optimization: Real-Time Control for Advertising Markets"
date: 2025-08-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - ad-tech
  - bid-optimization
  - auctions
  - reinforcement-learning
---
