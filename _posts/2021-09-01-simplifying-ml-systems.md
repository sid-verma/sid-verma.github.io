---
title: "Simplicity in Scale: Designing ML Systems That Actually Work in Production"
date: 2021-09-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - ml-systems
  - production-ml
  - mlops
  - engineering
---

The gap between ML research and production systems is vast. Complex models that shine in papers often fail in production. This primer covers principles for building ML systems that are maintainable, debuggable, and actually deliver business value—lessons learned from scaling ML at major tech companies.

## Introduction and Motivation

A PhD student can train a model; shipping it to production is different. You need monitoring, retraining pipelines, rollback mechanisms, feature stores, and debugging tools. Most ML projects fail not because the model was wrong, but because the system wasn't designed for production.

The most impactful ML systems are often surprisingly simple. Complexity has costs: harder to debug, slower to iterate, more failure modes. This post shares principles for building ML systems that work.

## Intuition and Core Concepts

**ML System ≠ ML Model**: The model is often <5% of the code. Infrastructure dominates:
- Data pipelines
- Feature engineering
- Training infrastructure
- Serving systems
- Monitoring & alerting

**Technical debt in ML**: Research code becomes legacy fast. Configurations sprawl. Feature engineering becomes unmaintainable.

**Simplicity principle**: The best ML system is the simplest one that solves your business problem.

## Key Principles

### 1. Start with Baselines

Before neural networks, try:
- Heuristics (hand-coded rules)
- Linear models
- Gradient boosting

Often 80% of value comes from 20% of complexity.

### 2. Features > Algorithms

Good features matter more than model choice:
- Invest in feature engineering
- Build feature pipelines before model pipelines
- Feature stores enable reuse

### 3. Iterate Quickly

Speed of iteration beats model sophistication:
- Simple models ship faster
- Faster experiments → more learning
- Avoid premature optimization

### 4. Design for Failure

ML systems fail silently:
- Data distribution shifts
- Features become stale
- Model performance degrades

Build monitoring and alerting from day one.

## Practical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ML System Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │   Data   │───▶│ Feature  │───▶│  Model   │              │
│  │ Pipeline │    │  Store   │    │ Training │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│       │              │              │                       │
│       ▼              ▼              ▼                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Data    │    │ Feature  │    │  Model   │              │
│  │ Quality  │    │ Serving  │    │ Serving  │              │
│  │ Checks   │    └──────────┘    └──────────┘              │
│  └──────────┘         │              │                      │
│                       ▼              ▼                       │
│                  ┌──────────────────────┐                   │
│                  │   Prediction API     │                   │
│                  └──────────────────────┘                   │
│                           │                                  │
│                           ▼                                  │
│                  ┌──────────────────────┐                   │
│                  │ Monitoring & Logging │                   │
│                  └──────────────────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Example

```python
class SimplifiedMLSystem:
    """Example of a well-structured ML system"""

    def __init__(self, config):
        self.config = config
        self.model = None
        self.feature_pipeline = None
        self.metrics = MetricsCollector()

    def build_features(self, raw_data):
        """Feature engineering - often the most important part"""
        features = {}

        # Simple, interpretable features
        features['user_age_days'] = (now() - raw_data['signup_date']).days
        features['activity_count_7d'] = raw_data['activity_count_7d']
        features['is_premium'] = int(raw_data['subscription_type'] == 'premium')

        # Log transform for skewed features
        features['log_revenue'] = np.log1p(raw_data['total_revenue'])

        # Fill missing with explicit defaults
        for key in features:
            if pd.isna(features[key]):
                features[key] = self.config['defaults'][key]
                self.metrics.increment('feature_missing', tags={'feature': key})

        return features

    def train(self, training_data):
        """Training with logging and validation"""
        # Feature pipeline
        X = self.build_features(training_data)
        y = training_data['label']

        # Train-validation split
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Simple model - start here!
        self.model = LogisticRegression(
            C=self.config['regularization'],
            max_iter=1000
        )
        self.model.fit(X_train, y_train)

        # Validation metrics
        val_preds = self.model.predict_proba(X_val)[:, 1]
        auc = roc_auc_score(y_val, val_preds)

        # Log everything
        self.metrics.log('training_auc', auc)
        self.metrics.log('training_samples', len(y_train))
        self.metrics.log('model_version', self.config['version'])

        print(f"Validation AUC: {auc:.4f}")
        return auc

    def predict(self, features):
        """Prediction with monitoring"""
        start_time = time.time()

        try:
            # Feature processing
            X = self.build_features(features)

            # Prediction
            pred = self.model.predict_proba(X)[:, 1]

            # Log latency
            latency_ms = (time.time() - start_time) * 1000
            self.metrics.histogram('prediction_latency_ms', latency_ms)

            # Log prediction distribution (for monitoring drift)
            self.metrics.histogram('prediction_score', pred.mean())

            return pred

        except Exception as e:
            self.metrics.increment('prediction_error', tags={'type': str(type(e))})
            # Fallback to baseline
            return self.config['fallback_prediction']

    def validate_data(self, data):
        """Data quality checks - critical for production"""
        issues = []

        # Check for missing required fields
        for field in self.config['required_fields']:
            if field not in data.columns:
                issues.append(f"Missing field: {field}")

        # Check for unexpected nulls
        null_rate = data.isnull().mean()
        for col, rate in null_rate.items():
            if rate > self.config['max_null_rate']:
                issues.append(f"High null rate in {col}: {rate:.2%}")

        # Check for distribution drift
        for col in self.config['monitored_columns']:
            if col in data.columns:
                current_mean = data[col].mean()
                expected_mean = self.config['expected_means'][col]
                if abs(current_mean - expected_mean) > self.config['drift_threshold']:
                    issues.append(f"Distribution drift in {col}")

        return issues
```

## Common Pitfalls and Best Practices

1. **Premature optimization**: Don't use deep learning if logistic regression works. Complexity has maintenance cost.

2. **Ignoring data problems**: Most ML failures are data failures. Invest in data quality.

3. **No monitoring**: Models degrade silently. Monitor predictions, features, and outcomes.

4. **Training-serving skew**: Features computed differently in training vs. serving. Use same code paths.

5. **No rollback plan**: When (not if) things break, how do you revert?

## Real-World Applications

- **Fraud detection**: Start with rules, add ML for edge cases
- **Search ranking**: BM25 baseline, add ML reranking
- **Recommendations**: Popularity baseline, then personalization
- **Ads**: Linear models often beat neural at scale

## Advanced Topics

### Feature Stores

Centralized feature management:
- Consistent features across training/serving
- Feature reuse across teams
- Point-in-time correctness

### ML Pipelines

Orchestrated workflows (Airflow, Kubeflow):
- Automated retraining
- Model validation gates
- Gradual rollout

### A/B Testing ML

Can't trust offline metrics alone:
- Shadow deployments
- Interleaving experiments
- Multi-armed bandits for exploration

## Summary and Further Reading

Simple ML systems outperform complex ones more often than not. Key takeaways:

- Start with simple baselines; add complexity only when needed
- Invest in monitoring, data quality, and feature engineering
- Design for failure and iteration speed

**Further Reading**:
- Sculley et al., "Hidden Technical Debt in Machine Learning Systems" (NIPS 2015)
- Polyzotis et al., "Data Management Challenges in Production Machine Learning"
- Google's "Rules of Machine Learning"
