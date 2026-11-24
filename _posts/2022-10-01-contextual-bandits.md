---
title: "Contextual Bandits: The Exploration-Exploitation Frontier for Personalization"
date: 2022-10-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - contextual-bandits
  - exploration-exploitation
  - reinforcement-learning
  - personalization
---

Contextual bandits solve the exploration-exploitation dilemma in personalization. Unlike A/B tests that commit to fixed treatments, bandits adapt allocation based on observed rewards. They power adaptive recommendations, personalized treatments, and dynamic pricing across tech platforms.

## Introduction and Motivation

How do you recommend content when you don't know what works? Show what's worked before (exploit) or try new options (explore)? Pure exploitation misses better alternatives. Pure exploration wastes resources. Bandits balance this trade-off optimally.

Contextual bandits extend multi-armed bandits by using context (user features, time, location) to personalize decisions. They're the bridge between supervised learning (predict from features) and reinforcement learning (sequential decisions with delayed rewards).

## Intuition and Core Concepts

**The bandit problem**: Choose from K actions, observe reward for chosen action only. Goal: maximize cumulative reward.

**Context**: User features, item features, situational factors that inform which action is best.

**Key challenge**: Observed rewards are biased—we only see outcomes for actions we took. "What would have happened if we'd shown a different item?"

**Regret**: Difference between optimal policy and our policy:
$$\text{Regret}_T = \sum_{t=1}^T \mathbb{E}[r_t^* - r_t]$$

Good algorithms have sublinear regret: $O(\sqrt{T})$ or $O(\log T)$.

## Mathematical Foundations

### Contextual Bandit Setting

At each round $t$:
1. Observe context $x_t \in \mathcal{X}$
2. Choose action $a_t \in \{1, ..., K\}$
3. Observe reward $r_t = r(x_t, a_t) + \epsilon_t$

Goal: Learn policy $\pi: \mathcal{X} \rightarrow \{1, ..., K\}$ that maximizes expected reward.

### Linear Bandits

Assume linear reward:
$$\mathbb{E}[r | x, a] = x_a^T \theta_a$$

where $x_a$ is feature vector for action $a$ and $\theta_a$ is unknown parameter.

### Upper Confidence Bound (UCB)

Optimism in the face of uncertainty. Choose action with highest:
$$a_t = \arg\max_a \hat{\mu}_a + \beta \cdot \hat{\sigma}_a$$

where $\hat{\mu}_a$ is estimated mean, $\hat{\sigma}_a$ is uncertainty, $\beta$ controls exploration.

### Thompson Sampling

Bayesian approach: sample from posterior of each action's mean:
$$\tilde{\theta}_a \sim P(\theta_a | \text{history})$$
$$a_t = \arg\max_a x_t^T \tilde{\theta}_a$$

Naturally balances exploration (high variance) and exploitation (high mean).

## Key Algorithms and Methods

### ε-Greedy

Simplest approach:
- With probability $1-\epsilon$: choose best action (exploit)
- With probability $\epsilon$: choose random action (explore)

Simple but inefficient—explores uniformly regardless of uncertainty.

### LinUCB

Linear reward model with UCB exploration:
$$a_t = \arg\max_a x^T\hat{\theta}_a + \alpha\sqrt{x^T A_a^{-1} x}$$

where $A_a = \sum_t x_t x_t^T$ (for action $a$) and $\hat{\theta}_a = A_a^{-1} b_a$.

### Thompson Sampling for Contextual Bandits

```python
# Maintain posterior for each action's parameters
# At each round:
for a in actions:
    theta_sample = sample_from_posterior(a)
    expected_reward[a] = context @ theta_sample
choose action with max expected_reward
observe reward
update posterior
```

### Neural Bandits

Use neural networks for reward prediction:
- **Neural UCB**: Uncertainty from ensemble or dropout
- **Neural TS**: Approximate posterior with variational inference

## Practical Implementation

```python
import numpy as np
from scipy import stats

class LinUCB:
    """Linear UCB for contextual bandits"""

    def __init__(self, n_actions, n_features, alpha=1.0):
        self.n_actions = n_actions
        self.alpha = alpha

        # Initialize sufficient statistics
        self.A = [np.eye(n_features) for _ in range(n_actions)]
        self.b = [np.zeros(n_features) for _ in range(n_actions)]

    def choose_action(self, context):
        """Select action using UCB"""
        context = np.array(context)
        ucb_values = []

        for a in range(self.n_actions):
            A_inv = np.linalg.inv(self.A[a])
            theta_hat = A_inv @ self.b[a]

            mean = context @ theta_hat
            uncertainty = self.alpha * np.sqrt(context @ A_inv @ context)
            ucb = mean + uncertainty
            ucb_values.append(ucb)

        return np.argmax(ucb_values)

    def update(self, action, context, reward):
        """Update model with observed reward"""
        context = np.array(context)
        self.A[action] += np.outer(context, context)
        self.b[action] += reward * context


class ThompsonSamplingLinear:
    """Thompson Sampling with linear rewards"""

    def __init__(self, n_actions, n_features, sigma=1.0):
        self.n_actions = n_actions
        self.sigma = sigma

        # Prior: N(0, I) for each action
        self.A = [np.eye(n_features) for _ in range(n_actions)]
        self.b = [np.zeros(n_features) for _ in range(n_actions)]

    def choose_action(self, context):
        """Sample from posterior and choose best"""
        context = np.array(context)
        sampled_rewards = []

        for a in range(self.n_actions):
            A_inv = np.linalg.inv(self.A[a])
            theta_hat = A_inv @ self.b[a]

            # Sample from posterior
            theta_sample = np.random.multivariate_normal(
                theta_hat, self.sigma**2 * A_inv
            )
            sampled_reward = context @ theta_sample
            sampled_rewards.append(sampled_reward)

        return np.argmax(sampled_rewards)

    def update(self, action, context, reward):
        context = np.array(context)
        self.A[action] += np.outer(context, context)
        self.b[action] += reward * context


# Simulation
np.random.seed(42)
n_actions = 3
n_features = 5
n_rounds = 1000

# True parameters (unknown to agent)
true_theta = [np.random.randn(n_features) for _ in range(n_actions)]

# Initialize agents
linucb = LinUCB(n_actions, n_features, alpha=0.5)
ts = ThompsonSamplingLinear(n_actions, n_features)

cumulative_regret_ucb = 0
cumulative_regret_ts = 0

for t in range(n_rounds):
    context = np.random.randn(n_features)

    # True expected rewards
    true_rewards = [context @ theta for theta in true_theta]
    best_action = np.argmax(true_rewards)

    # LinUCB
    action_ucb = linucb.choose_action(context)
    reward_ucb = true_rewards[action_ucb] + np.random.randn() * 0.1
    linucb.update(action_ucb, context, reward_ucb)
    cumulative_regret_ucb += true_rewards[best_action] - true_rewards[action_ucb]

    # Thompson Sampling
    action_ts = ts.choose_action(context)
    reward_ts = true_rewards[action_ts] + np.random.randn() * 0.1
    ts.update(action_ts, context, reward_ts)
    cumulative_regret_ts += true_rewards[best_action] - true_rewards[action_ts]

print(f"LinUCB cumulative regret: {cumulative_regret_ucb:.2f}")
print(f"Thompson Sampling cumulative regret: {cumulative_regret_ts:.2f}")
```

## Common Pitfalls and Best Practices

1. **Delayed rewards**: Bandits assume immediate feedback. Long delays complicate credit assignment.

2. **Non-stationarity**: Reward distributions change. Use windowing or discounting.

3. **Correlated actions**: Many actions? Use action embeddings or hierarchical bandits.

4. **Offline evaluation**: Can't replay history with different policy. Use inverse propensity scoring.

5. **Computational cost**: Many actions + real-time decisions = optimization challenge.

## Real-World Applications

- **Recommendations**: Personalized content/product selection
- **A/B testing**: Adaptive allocation to winning variants
- **Advertising**: Creative selection, bid optimization
- **Dynamic pricing**: Price experimentation
- **Clinical trials**: Adaptive treatment allocation

## Advanced Topics

### Off-Policy Evaluation

Estimate policy value from logged data:
$$\hat{V}(\pi) = \frac{1}{n}\sum_t \frac{\pi(a_t|x_t)}{\mu(a_t|x_t)} r_t$$

where $\mu$ is logging policy (inverse propensity weighting).

### Batch Bandits

Update policy on batches rather than every observation:
- Reduces computational cost
- Enables parallelism
- Trade-off: less adaptive

### Constrained Bandits

Maximize reward subject to constraints (fairness, budget):
$$\max \mathbb{E}[r(a)] \quad \text{s.t.} \quad \mathbb{E}[c(a)] \leq B$$

## Summary and Further Reading

Contextual bandits optimally balance exploration and exploitation using context. Key takeaways:

- UCB uses optimism; Thompson Sampling uses posterior sampling
- Linear models (LinUCB) are practical and analyzable
- Off-policy evaluation enables learning from logged data

**Further Reading**:
- Lattimore & Szepesvári, *Bandit Algorithms*
- Li et al., "A Contextual-Bandit Approach to Personalized News Article Recommendation"
- Chapelle & Li, "An Empirical Evaluation of Thompson Sampling" (NIPS 2011)
