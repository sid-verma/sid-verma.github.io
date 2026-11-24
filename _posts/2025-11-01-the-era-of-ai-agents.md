---
title: "The Era of AI Agents: From Chatbots to Systems That Act"
date: 2025-11-01
categories:
  - Artificial Intelligence
  - Machine Learning
tags:
  - agentic-ai
  - llm
  - agents
  - systems
---

> *"The future of AI isn't just generating text; it's doing work."*

For the past decade, AI has been a **function**: $y = f(x)$. Input image, output label. Input text, output translation.
But starting 2024, AI became a **system**. It can plan, use tools, and correct its mistakes.
This is the **Agentic Era**.

This post moves beyond LLMs (Large Language Models) to LAMs (Large Action Models).

> **Related reading**: This is the culmination of systems thinking from [Simplifying ML Systems](/posts/simplifying-ml-systems/) applied to generative AI.

---

## Chapter I: The Definition of an Agent

A Chatbot answers questions. An Agent achieves goals.

**Chatbot**: "How do I check the weather?" $\to$ "You can check weather.com."
**Agent**: "Check the weather in NYC and if it's raining, cancel my dinner reservation." $\to$ *Actually cancels the reservation via API.*

### The Agentic Loop
The core architecture is the **OODA Loop** (Observe, Orient, Decide, Act):
1. **Thought**: What do I need to do?
2. **Action**: Call a tool (Calculater, API, Bash).
3. **Observation**: Read the tool output.
4. **Repeat**: Until goal is met.

---

## Chapter II: The ReAct Pattern

Introduced in [Yao et al. (2022)](https://arxiv.org/abs/2210.03629), **ReAct** (Reasoning + Acting) is the "Hello World" of agents.

Instead of just acting or just reasoning, the model interleaves them.

**Prompt Template**:
```text
Question: [User Goal]
Thought: [What should I do first?]
Action: [Tool Name]
Observation: [Tool Output]
...
Final Answer: [Result]
```

### Python Implementation

```python
import openai

def simple_agent(question):
    messages = [
        {"role": "system", "content": "You are a helpful agent. Available tools: [calculate, search]."}
    ]
    messages.append({"role": "user", "content": question})

    while True:
        # 1. Thought (Model Decision)
        response = openai.ChatCompletion.create(model="gpt-4", messages=messages)
        text = response.choices[0].message['content']
        print(f"Agent: {text}")
        messages.append({"role": "assistant", "content": text})

        # 2. Check if done
        if "Final Answer:" in text:
            return text.split("Final Answer:")[1].strip()

        # 3. Action (Mock execution)
        if "Action: calculate" in text:
            expression = text.split("Action: calculate")[1].strip()
            observation = str(eval(expression)) # Risks! Use safe eval in prod
            print(f"Tool Output: {observation}")

            messages.append({"role": "user", "content": f"Observation: {observation}"})
```

---

## Chapter III: The Tool layer

Agents are only as good as their hands (tools).
Common tools:
1. **Search**: Google/Bing API for ground truth.
2. **Code Interpreter**: Python sandbox for math/data analysis.
3. **RAG (Retrieval)**: Access to private documents.

**The Interface Protocol**:
To use tools, the model often needs an explicit schema (like OpenAI Functions or Tool Use API). It outputs JSON:
`{"tool": "calculator", "args": {"expression": "2+2"}}`

---

## Chapter IV: Memory and State

LLMs are stateless. To be agents, they need **Memory**.

### Short-Term Memory
- The context window (128k tokens).
- Stores the immediate chain of thought.

### Long-Term Memory
- **Vector Stores** (Pinecone, Weaviate).
- "Procedural Memory": Storing successful plans to reuse later (Reflection).

The **MemGPT** architecture treats the context window as RAM and VectorDB as Hard Drive, paging information in and out.

---

## Chapter V: Multi-Agent Systems

One agent is good. A team is better.
In frameworks like **CrewAI** or **AutoGen**, agents specialize:
- **Researcher Agent**: Scours the web.
- **Writer Agent**: Synthesizes the draft.
- **Critique Agent**: Reviews the draft against guidelines.

They communicate via message passing, effectively simulating a human organization.

---

## Summary

We are moving from "Prompt Engineering" to "Flow Engineering".
The value is no longer just the model weights; it's the **State Machine** that wraps the model.

> *"The future of software is not writing code; it's defining goals."*
