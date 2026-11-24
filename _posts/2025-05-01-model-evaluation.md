---
title: "Beyond Accuracy: Comprehensive Model Evaluation for Production ML"
date: 2025-05-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - model-evaluation
  - metrics
  - mlops
  - machine-learning
---

Accuracy alone doesn't tell you if a model is production-ready. Class imbalance, calibration, fairness, latency, and robustness all matter. This primer covers the full spectrum of model evaluation—from offline metrics to online A/B tests—for building ML systems you can trust.

## Introduction and Motivation

"The model has 95% accuracy!" But what if 95% of examples are negative? What if it's confident but wrong? What if it works for men but not women? High accuracy can hide serious problems.

Comprehensive evaluation examines multiple dimensions: predictive performance, calibration, fairness, robustness, and computational efficiency. Only by understanding all these can you confidently deploy.

## Classification Metrics

### Beyond Accuracy

For binary classification with positive (P) and negative (N):

$$\text{Precision} = \frac{TP}{TP + FP}$$ (of predicted positives, how many correct?)

$$\text{Recall} = \frac{TP}{TP + FN}$$ (of actual positives, how many found?)

$$\text{F1} = \frac{2 \cdot \text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$$

### ROC and PR Curves

**ROC (Receiver Operating Characteristic)**: TPR vs. FPR at all thresholds
- AUC-ROC: Area under curve. Random = 0.5, perfect = 1.0

**Precision-Recall Curve**: Better for imbalanced data
- AUC-PR: More sensitive to improvements for rare positives

### Threshold Selection

Model outputs probabilities; you choose threshold:
- High precision need? Higher threshold.
- High recall need? Lower threshold.
- Business cost determines optimal point.

## Calibration

### What is Calibration?

A model is calibrated if predicted probability matches actual probability:
$$P(Y=1 | \hat{p} = 0.8) = 0.8$$

Overconfident: predicts 0.9 when actually 0.6
Underconfident: predicts 0.5 when actually 0.8

### Measuring Calibration

**Expected Calibration Error (ECE)**:
$$\text{ECE} = \sum_{b=1}^{B} \frac{n_b}{N} |acc(b) - conf(b)|$$

Bin predictions, compare average confidence to accuracy.

### Calibration Techniques

- **Platt scaling**: Fit logistic regression on validation set
- **Isotonic regression**: Non-parametric monotonic calibration
- **Temperature scaling**: Divide logits by temperature T

## Practical Implementation

```python
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, brier_score_loss,
    confusion_matrix, precision_recall_curve, roc_curve
)
from sklearn.calibration import calibration_curve
import matplotlib.pyplot as plt

class ModelEvaluator:
    """Comprehensive model evaluation"""

    def __init__(self, y_true, y_prob, threshold=0.5):
        self.y_true = np.array(y_true)
        self.y_prob = np.array(y_prob)
        self.threshold = threshold
        self.y_pred = (y_prob >= threshold).astype(int)

    def classification_metrics(self):
        """Standard classification metrics"""
        return {
            'accuracy': accuracy_score(self.y_true, self.y_pred),
            'precision': precision_score(self.y_true, self.y_pred),
            'recall': recall_score(self.y_true, self.y_pred),
            'f1': f1_score(self.y_true, self.y_pred),
            'auc_roc': roc_auc_score(self.y_true, self.y_prob),
            'auc_pr': average_precision_score(self.y_true, self.y_prob)
        }

    def calibration_metrics(self, n_bins=10):
        """Calibration assessment"""
        # ECE
        prob_true, prob_pred = calibration_curve(
            self.y_true, self.y_prob, n_bins=n_bins
        )

        # Brier score (lower is better)
        brier = brier_score_loss(self.y_true, self.y_prob)

        return {
            'brier_score': brier,
            'calibration_curve': (prob_true, prob_pred)
        }

    def threshold_analysis(self, thresholds=None):
        """Performance at different thresholds"""
        if thresholds is None:
            thresholds = np.linspace(0.1, 0.9, 9)

        results = []
        for t in thresholds:
            y_pred_t = (self.y_prob >= t).astype(int)
            results.append({
                'threshold': t,
                'precision': precision_score(self.y_true, y_pred_t, zero_division=0),
                'recall': recall_score(self.y_true, y_pred_t),
                'f1': f1_score(self.y_true, y_pred_t)
            })
        return results

    def subgroup_analysis(self, groups):
        """Fairness: metrics by subgroup"""
        results = {}
        for group_name, mask in groups.items():
            y_true_g = self.y_true[mask]
            y_prob_g = self.y_prob[mask]
            y_pred_g = self.y_pred[mask]

            if len(y_true_g) > 0 and sum(y_true_g) > 0:
                results[group_name] = {
                    'n': len(y_true_g),
                    'base_rate': y_true_g.mean(),
                    'precision': precision_score(y_true_g, y_pred_g, zero_division=0),
                    'recall': recall_score(y_true_g, y_pred_g, zero_division=0),
                    'auc': roc_auc_score(y_true_g, y_prob_g) if len(np.unique(y_true_g)) > 1 else None
                }
        return results


def plot_evaluation(evaluator):
    """Visualization of model evaluation"""
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))

    # ROC Curve
    fpr, tpr, _ = roc_curve(evaluator.y_true, evaluator.y_prob)
    axes[0, 0].plot(fpr, tpr)
    axes[0, 0].plot([0, 1], [0, 1], 'k--')
    axes[0, 0].set_xlabel('FPR')
    axes[0, 0].set_ylabel('TPR')
    axes[0, 0].set_title(f'ROC Curve (AUC={roc_auc_score(evaluator.y_true, evaluator.y_prob):.3f})')

    # PR Curve
    precision, recall, _ = precision_recall_curve(evaluator.y_true, evaluator.y_prob)
    axes[0, 1].plot(recall, precision)
    axes[0, 1].set_xlabel('Recall')
    axes[0, 1].set_ylabel('Precision')
    axes[0, 1].set_title(f'PR Curve (AP={average_precision_score(evaluator.y_true, evaluator.y_prob):.3f})')

    # Calibration curve
    prob_true, prob_pred = calibration_curve(evaluator.y_true, evaluator.y_prob, n_bins=10)
    axes[1, 0].plot(prob_pred, prob_true, 's-')
    axes[1, 0].plot([0, 1], [0, 1], 'k--')
    axes[1, 0].set_xlabel('Mean Predicted Probability')
    axes[1, 0].set_ylabel('Fraction of Positives')
    axes[1, 0].set_title('Calibration Curve')

    # Threshold analysis
    thresholds = np.linspace(0.1, 0.9, 17)
    metrics = evaluator.threshold_analysis(thresholds)
    axes[1, 1].plot([m['threshold'] for m in metrics], [m['precision'] for m in metrics], label='Precision')
    axes[1, 1].plot([m['threshold'] for m in metrics], [m['recall'] for m in metrics], label='Recall')
    axes[1, 1].plot([m['threshold'] for m in metrics], [m['f1'] for m in metrics], label='F1')
    axes[1, 1].set_xlabel('Threshold')
    axes[1, 1].set_ylabel('Metric')
    axes[1, 1].set_title('Threshold Analysis')
    axes[1, 1].legend()

    plt.tight_layout()
    return fig


# Example
np.random.seed(42)
n = 1000

# Simulated predictions
y_true = np.random.binomial(1, 0.3, n)  # 30% positive
y_prob = np.random.beta(2, 5, n) + 0.3 * y_true  # Correlated with truth
y_prob = np.clip(y_prob, 0, 1)

evaluator = ModelEvaluator(y_true, y_prob)

print("Classification Metrics:")
for k, v in evaluator.classification_metrics().items():
    print(f"  {k}: {v:.4f}")

print("\nCalibration:")
cal = evaluator.calibration_metrics()
print(f"  Brier Score: {cal['brier_score']:.4f}")
```

## Fairness Metrics

### Group Fairness

- **Demographic parity**: Equal positive rate across groups
- **Equalized odds**: Equal TPR and FPR across groups
- **Calibration by group**: Same calibration within each group

### Measuring Disparities

$$\text{Disparate Impact} = \frac{P(\hat{Y}=1|A=0)}{P(\hat{Y}=1|A=1)}$$

Rule of thumb: Disparate impact < 0.8 indicates bias.

## Production Monitoring

### Offline → Online Gap

Offline metrics don't always predict online performance:
- Feature drift
- Selection bias in training data
- Feedback loops

### Key Production Metrics

- **Prediction distribution**: Monitor for drift
- **Latency**: P50, P95, P99
- **Error rate**: Serving failures
- **Business metrics**: Revenue, engagement

## Summary

Comprehensive evaluation goes beyond accuracy. Key takeaways:

- Use precision, recall, and AUC for imbalanced classes
- Check calibration before trusting probabilities
- Analyze performance across subgroups for fairness
- Monitor continuously in production

**Further Reading**:
- Raschka, "Model Evaluation, Model Selection, and Algorithm Selection in ML"
- Guo et al., "On Calibration of Modern Neural Networks"
- Barocas, Hardt & Narayanan, *Fairness and Machine Learning*
