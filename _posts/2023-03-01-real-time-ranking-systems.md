---
title: "Sub-Millisecond Decisions: Architecture of Real-Time Ranking Systems"
date: 2023-03-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - real-time-ml
  - systems
  - low-latency
  - ranking
---

Real-time ranking systems serve billions of personalized decisions daily with millisecond latency constraints. From ad auctions to search results, these systems combine ML sophistication with engineering excellence. This primer covers the architectures, optimizations, and trade-offs that make real-time ML possible.

## Introduction and Motivation

When you type a query, results appear in 200ms. That includes network round trips, query understanding, candidate retrieval, ranking, and rendering. The ML ranking model might have just 10-50ms. At Google's scale, this happens billions of times per day.

Building systems this fast requires co-designing ML and infrastructure. Model architecture, serving infrastructure, and engineering trade-offs all interact. Understanding these systems is essential for production ML engineers.

## System Architecture

### Two-Stage Retrieval + Ranking

```
Query → Retrieval (10ms) → Ranking (20ms) → Response
          ↓                    ↓
       1000 candidates     → 10-100 results
```

**Retrieval**: Fast, approximate. Get candidate set from billions.
- Inverted index (BM25)
- Approximate nearest neighbors (HNSW, ScaNN)
- Multiple retrieval sources (freshness, popularity, personalization)

**Ranking**: Accurate, expensive. Score and order candidates.
- Feature computation
- Model inference
- Business rules and filtering

### Feature Systems

Real-time features require specialized infrastructure:

**Precomputed features**: Batch computed, stored in key-value stores
- User history aggregations
- Item statistics
- Static embeddings

**Real-time features**: Computed at request time
- Query-document matching scores
- Session context
- Time-based features

**Feature serving**: Low-latency lookups
- Redis/Memcached for recent features
- Feature stores (Feast, Tecton)

## Optimization Techniques

### Model Optimization

**Quantization**: Reduce precision (float32 → int8)
- 4x memory reduction
- Faster SIMD operations
- Minor accuracy loss

**Pruning**: Remove unimportant weights
- Structured pruning (whole neurons)
- Unstructured pruning (individual weights)

**Distillation**: Train small student from large teacher
- Complex model for training
- Simple model for serving

**Architecture search**: Design efficient architectures
- MobileNet, EfficientNet principles
- Hardware-aware NAS

### Serving Optimization

**Batching**: Amortize fixed costs
- Collect requests, process together
- Trade latency for throughput

**Caching**: Reuse computation
- Embedding caches
- Partial score caches
- Request-level caching

**Early termination**: Stop when confident
- Skip remaining candidates if clear winner
- Cascade of increasingly expensive models

## Practical Implementation

```python
import numpy as np
import time
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class RankingConfig:
    retrieval_timeout_ms: float = 10
    ranking_timeout_ms: float = 30
    max_candidates: int = 1000
    top_k: int = 10

class RealTimeRanker:
    def __init__(self, config: RankingConfig):
        self.config = config
        self.retrieval_index = None  # ANN index
        self.ranking_model = None    # ML model
        self.feature_store = {}      # Feature cache

    def rank(self, query: str, user_id: str) -> List[Dict]:
        start = time.time()

        # Stage 1: Retrieval
        candidates = self._retrieve(query, user_id)
        retrieval_time = (time.time() - start) * 1000

        if retrieval_time > self.config.retrieval_timeout_ms:
            # Fallback to cached results
            candidates = self._get_fallback_candidates(query)

        # Stage 2: Feature computation
        features = self._compute_features(query, user_id, candidates)

        # Stage 3: Scoring with timeout
        scores = self._score_with_timeout(features)

        # Stage 4: Final ordering and filtering
        results = self._postprocess(candidates, scores)

        total_time = (time.time() - start) * 1000
        self._log_latency(retrieval_time, total_time)

        return results[:self.config.top_k]

    def _retrieve(self, query: str, user_id: str) -> List[str]:
        """Multi-source retrieval"""
        candidates = set()

        # Lexical retrieval (BM25)
        candidates.update(self._bm25_retrieve(query, limit=500))

        # Semantic retrieval (ANN)
        query_embedding = self._encode_query(query)
        candidates.update(self._ann_retrieve(query_embedding, limit=500))

        # Personalization source
        candidates.update(self._personalized_retrieve(user_id, limit=200))

        return list(candidates)[:self.config.max_candidates]

    def _compute_features(self, query: str, user_id: str,
                          candidates: List[str]) -> np.ndarray:
        """Batch feature computation"""
        # Precomputed features (fast lookup)
        user_features = self.feature_store.get(f"user:{user_id}",
                                                np.zeros(32))
        item_features = np.array([
            self.feature_store.get(f"item:{c}", np.zeros(64))
            for c in candidates
        ])

        # Real-time features (computed now)
        query_item_features = self._compute_query_item_features(
            query, candidates
        )

        # Concatenate
        user_broadcast = np.tile(user_features, (len(candidates), 1))
        return np.hstack([user_broadcast, item_features, query_item_features])

    def _score_with_timeout(self, features: np.ndarray) -> np.ndarray:
        """Score with early termination"""
        # In production: Use ONNX, TensorRT for optimized inference
        scores = self.ranking_model.predict(features)
        return scores

    def _postprocess(self, candidates: List[str],
                     scores: np.ndarray) -> List[Dict]:
        """Apply business rules and format response"""
        # Sort by score
        ranked_indices = np.argsort(scores)[::-1]

        results = []
        for idx in ranked_indices:
            results.append({
                'id': candidates[idx],
                'score': float(scores[idx])
            })

        return results

# Latency optimization: Async feature fetching
import asyncio

async def fetch_features_async(user_id: str, item_ids: List[str]):
    """Parallel feature fetching"""
    tasks = [
        fetch_user_features(user_id),
        *[fetch_item_features(item_id) for item_id in item_ids]
    ]
    results = await asyncio.gather(*tasks)
    return results[0], results[1:]
```

## Common Pitfalls and Best Practices

1. **P50 vs P99**: Optimize for tail latency, not average. Users experience P99.

2. **Cold cache misses**: First request for a user is slowest. Pre-warm caches.

3. **Feature freshness**: Stale features in real-time systems. Monitor feature age.

4. **Model-serving mismatch**: Training features differ from serving. Test parity.

5. **Cascading failures**: One slow component delays everything. Use timeouts and fallbacks.

## Real-World Architectures

- **Google**: Multi-stage retrieval, neural + LambdaMART hybrid ranking
- **Facebook**: Embedding-based retrieval, gradient boosting ranking
- **Pinterest**: GPU-based dense retrieval, lightweight ranking
- **Airbnb**: Multi-objective ranking with business rules

## Advanced Topics

### GPU Serving

For neural models:
- Batch requests for GPU efficiency
- TensorRT optimization
- Multi-model serving (Triton)

### Streaming Features

Real-time aggregations:
- Apache Kafka for event streams
- Apache Flink for stream processing
- Time-windowed features

### Progressive Loading

Show fast results first, improve:
- Initial ranking with cached scores
- Refined ranking as features arrive
- UI progressive enhancement

## Summary and Further Reading

Real-time ranking combines ML sophistication with systems engineering. Key takeaways:

- Two-stage retrieval + ranking for efficiency
- Pre-compute what you can; optimize what you can't
- Design for failures with timeouts and fallbacks

**Further Reading**:
- Covington et al., "Deep Neural Networks for YouTube Recommendations"
- Huang et al., "Embedding-based Retrieval in Facebook Search"
- Google research blog on ranking systems
