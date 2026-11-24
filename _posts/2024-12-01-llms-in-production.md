---
title: "LLMs in Production: From Prompting to Fine-Tuning at Scale"
date: 2024-12-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - llms
  - large-language-models
  - prompting
  - nlp
---

Large Language Models have transformed NLP, enabling capabilities that seemed impossible just years ago. But deploying LLMs in production requires understanding prompting strategies, fine-tuning approaches, and the engineering challenges of serving large models efficiently.

## Introduction and Motivation

The first LLM feature I helped ship \"worked\" in staging and demo environments—then promptly blew up in production. Latency doubled, costs spiked, and users found creative ways to elicit unsafe outputs the prompt never anticipated. We hadn't built the right observability, guardrails, or evaluation, because we were still thinking like people shipping small classifiers instead of **open-ended generative systems**.

GPT-4, Claude, Llama, and Gemini represent a paradigm shift. Instead of training task-specific models, we prompt general-purpose models or fine-tune them with minimal data. This changes how ML engineers approach NLP problems.

But LLMs come with challenges: high latency, expensive inference, hallucination risks, and prompt sensitivity. Understanding how to use them effectively is essential for modern ML practitioners—and most of the work is **systems, evaluation, and UX**, not clever prompts.

## The LLM Landscape

### Model Categories

**Proprietary APIs**: OpenAI GPT-4, Anthropic Claude, Google Gemini
- Easiest to start
- No infrastructure management
- Privacy and vendor lock-in concerns

**Open-Weight Models**: Llama, Mistral, Qwen
- Can self-host
- More control
- Infrastructure complexity

### Key Architectures

**Decoder-only transformers**: GPT-style, text completion
**Encoder-decoder**: T5-style, text-to-text

### Model Sizes

- **7-13B**: Runnable on single GPU
- **70B**: Multi-GPU, quantization helps
- **100B+**: Multi-node, expensive inference

## Prompting Strategies

### Zero-Shot

Direct instruction without examples:
```
Classify the sentiment of this review as positive, negative, or neutral:
"Great product, exactly what I needed!"
Sentiment:
```

### Few-Shot

Include examples in prompt:
```
Classify sentiment:
Review: "Terrible, broke after one day." → negative
Review: "It's okay, nothing special." → neutral
Review: "Amazing quality!" → positive
Review: "Great product, exactly what I needed!" →
```

### Chain of Thought (CoT)

Encourage step-by-step reasoning:
```
Question: If a train travels 120 miles in 2 hours, how fast is it going?
Let's think step by step:
1. Speed = Distance / Time
2. Distance = 120 miles
3. Time = 2 hours
4. Speed = 120 / 2 = 60 miles per hour
Answer: 60 mph
```

### ReAct (Reason + Act)

Interleave reasoning with tool use:
```
Question: What is the population of the capital of France?
Thought: I need to find the capital of France first.
Action: search("capital of France")
Observation: Paris is the capital of France.
Thought: Now I need to find the population of Paris.
Action: search("population of Paris")
Observation: The population of Paris is approximately 2.1 million.
Answer: 2.1 million
```

## Fine-Tuning Approaches

### Full Fine-Tuning

Update all parameters. Requires:
- Substantial compute
- Risk of catastrophic forgetting
- Best for significant domain shifts

### LoRA (Low-Rank Adaptation)

Train small adapter matrices:
$$W' = W + BA$$

where $B \in \mathbb{R}^{d \times r}$, $A \in \mathbb{R}^{r \times k}$, $r \ll \min(d, k)$.

Benefits:
- 10-100x fewer trainable parameters
- Can merge into base weights for inference

### QLoRA

LoRA with quantized base model:
- 4-bit quantization for base model
- Full precision for LoRA adapters
- Enables 70B fine-tuning on single GPU

## Practical Implementation

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from peft import LoraConfig, get_peft_model
import torch

# Load model (using smaller model for example)
model_name = "meta-llama/Llama-2-7b-hf"  # Requires access

# For demonstration, using a smaller model
model_name = "microsoft/DialoGPT-medium"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map="auto"
)

# Configure LoRA
lora_config = LoraConfig(
    r=16,                      # Rank
    lora_alpha=32,             # Scaling factor
    target_modules=["q_proj", "v_proj"],  # Which layers to adapt
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

# Apply LoRA
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()  # Shows dramatic reduction

# Inference with prompting
def generate_response(prompt: str, max_new_tokens: int = 100):
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=0.7,
            do_sample=True,
            top_p=0.9,
            pad_token_id=tokenizer.eos_token_id
        )

    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return response[len(prompt):]


# Structured output with function calling
import json

def extract_entities(text: str):
    """Extract named entities using LLM"""
    prompt = f"""Extract named entities from the following text.
Return a JSON object with keys: "people", "organizations", "locations".

Text: {text}

JSON:"""

    response = generate_response(prompt)

    try:
        entities = json.loads(response)
        return entities
    except json.JSONDecodeError:
        # Fallback parsing
        return {"error": "Failed to parse", "raw": response}


# Evaluation: measuring LLM performance
from sklearn.metrics import accuracy_score
import numpy as np

def evaluate_classification(model, test_data, labels):
    """Evaluate LLM on classification task"""
    predictions = []

    for text in test_data:
        prompt = f"Classify the sentiment as 'positive' or 'negative': {text}\nSentiment:"
        response = generate_response(prompt, max_new_tokens=10).strip().lower()

        # Parse response
        if 'positive' in response:
            predictions.append('positive')
        elif 'negative' in response:
            predictions.append('negative')
        else:
            predictions.append('unknown')

    # Calculate metrics
    valid_idx = [i for i, p in enumerate(predictions) if p != 'unknown']
    if valid_idx:
        valid_preds = [predictions[i] for i in valid_idx]
        valid_labels = [labels[i] for i in valid_idx]
        accuracy = accuracy_score(valid_labels, valid_preds)
        coverage = len(valid_idx) / len(predictions)
    else:
        accuracy = 0
        coverage = 0

    return {'accuracy': accuracy, 'coverage': coverage}
```

## A Realistic LLM Feature Architecture

Regardless of vendor or model, most production LLM features end up looking like this:

1. **Request layer**
   - Receives user input + context (auth, locale, product state)
2. **Guardrails & preprocessing**
   - PII scrubbing, input validation, safety filters
3. **Retrieval / tools (optional)**
   - Vector search, SQL, HTTP APIs, internal services
4. **Prompt construction**
   - System + developer + user messages, tool schemas
5. **Model invocation**
   - Choose model (size, provider), decoding parameters
6. **Post-processing**
   - JSON parsing, schema validation, truncation, redaction
7. **Logging & feedback**
   - Inputs, outputs, latency, cost, quality signals

Thinking in terms of this pipeline makes it easier to reason about **where** failures come from (prompt, retrieval, model, post-processing, or surrounding systems).

## Production Considerations

### Latency Optimization

- **Quantization**: 4-bit, 8-bit inference for open-weight models
- **Batching**: Group similar requests to amortize overhead
- **KV-cache**: Reuse past key/value states for multi-turn chats
- **Speculative decoding**: Use a small model to draft, a larger one to verify

### Cost Management

- **Token limits**: Truncate long histories and overlong documents
- **Caching**: Cache responses for deterministic prompts or common queries
- **Model selection**: Route to the **smallest model that meets quality bar**
- **Async processing**: Batch non-urgent jobs (e.g., summarizing logs overnight)

### Reliability

- **Hallucination mitigation**: Retrieval-augmented generation, constrained decoding, and explicit \"I don't know\" paths
- **Output validation**: JSON schema checks, regex validation, type coercion
- **Fallbacks**: Simpler models, templates, or rule-based logic when the LLM fails
- **Monitoring**: Latency, error rates, cost, and *quality* proxies (e.g., rejection rate, manual review flags)

## Evaluation

### Benchmarks
- MMLU: Multi-task language understanding
- HumanEval: Code generation
- TruthfulQA: Factual accuracy

### Task-Specific
- Classification: Accuracy, F1
- Generation: BLEU, ROUGE, human eval
- Retrieval: Recall, precision

## Common Failure Modes (and What to Do Instead)

1. **Unbounded prompts**
   - Symptom: Prompt templates accrete requirements until every call is 10k+ tokens.
   - Fixes:
     - Introduce **strict prompt budgets** per feature.
     - Factor out common instructions into system messages instead of repeating.

2. **Hallucinated structure**
   - Symptom: Model returns malformed JSON or fields that don't exist in your schema.
   - Fixes:
     - Use **function calling / tool schemas** where available.
     - Add robust JSON repair + schema validation layer.

3. **Silent prompt drift**
   - Symptom: A copy edit to the prompt or small model change regresses behavior.
   - Fixes:
     - Maintain a set of **golden test cases** and run them on every prompt/model change.
     - Version prompts and models; treat them like code.

4. **LLM overuse**
   - Symptom: Using an LLM where a regex, lookup table, or classifier would suffice; costs and latency are high with no real benefit.
   - Fixes:
     - Add a “**LLM or not?**” review step in your design process.
     - Whenever an LLM is used, document what simpler baselines were tried.

## Summary

LLMs enable powerful NLP with prompting and minimal fine-tuning. Key takeaways:

- Prompting strategies (few-shot, CoT, ReAct) dramatically affect performance and should be treated as part of the model design.
- LoRA/QLoRA enable efficient fine-tuning without full retrains, especially for domain adaptation.
- Production LLM systems are **pipelines**, not just model calls: guardrails, retrieval, evaluation, and monitoring matter as much as the base model.
- Cost, latency, and reliability constraints should drive model choice and architecture, not the other way around.

### Checklist: Shipping an LLM Feature Responsibly

Before you roll out a new LLM-powered feature to users, ask:

1. **Problem fit**
   - Is an LLM actually needed, or would a smaller model or heuristic suffice?

2. **Architecture**
   - Do you have a clear request → guardrail → retrieval → prompt → model → post-processing → logging pipeline?

3. **Evaluation**
   - Do you have:
     - Offline test cases?
     - A plan for online A/B metrics?
     - A process for human review of edge cases?

4. **Safety & compliance**
   - Are you handling PII correctly?
   - Do you have content and data usage policies enforced at the system level?

5. **Operations**
   - Are you monitoring latency, cost, and error rates?
   - Do you have a rollback plan if a new prompt/model misbehaves?

If the answer to several of these is \"no,\" you’re still at the **prototype** stage. Borrow a page from production systems like Pinterest’s: treat your LLM feature like any other critical service—with SLAs, guardrails, and a clear story about how it creates value.

**Further Reading**:
- Hu et al., "LoRA: Low-Rank Adaptation of Large Language Models"
- Wei et al., "Chain-of-Thought Prompting Elicits Reasoning"
- OpenAI Cookbook, Anthropic prompt engineering guide
