# Draw.io Diagrams Creation Guide

This guide provides detailed instructions for creating draw.io diagrams for each blog post.

## Setup

1. **Access draw.io**: Go to [app.diagrams.net](https://app.diagrams.net/) (or use desktop app)
2. **Create diagrams directory**: Already created at `assets/diagrams/`
3. **Save format**: Always save as `.drawio` format (not PNG/SVG)

---

## Post 1: Evaluation Metrics for Ranking

### Diagram: "When to Use Which Metric" Decision Tree

**Purpose**: Help readers choose the right metric based on their use case.

**File**: `assets/diagrams/evaluation-metrics-decision-tree.drawio`

**Structure**:
```
Start: "What type of query?"
├─ Navigational (one answer) → MRR
├─ Informational (multiple relevant docs)
│  ├─ Binary relevance → MAP
│  └─ Graded relevance → NDCG
└─ E-commerce → NDCG + Revenue metrics
```

**Step-by-Step Creation**:

1. **Create new diagram**:
   - File → New → Blank Diagram
   - Choose "Flowchart" template

2. **Add decision nodes** (diamond shapes):
   - Insert → Shape → Flowchart → Decision
   - Label: "What type of query?"
   - Color: Light blue (#e3f2fd)

3. **Add outcome boxes** (rectangles):
   - Insert → Shape → Flowchart → Process
   - Labels:
     - "Navigational (one answer)"
     - "Informational (multiple docs)"
     - "E-commerce"
   - Colors: Light orange (#fff3e0)

4. **Add metric boxes** (rounded rectangles):
   - Insert → Shape → Flowchart → Predefined Process
   - Labels:
     - "MRR" (for navigational)
     - "MAP" (for binary informational)
     - "NDCG" (for graded informational)
     - "NDCG + Revenue" (for e-commerce)
   - Colors: Light green (#e8f5e9)

5. **Connect with arrows**:
   - Use connector tool
   - Add labels on arrows: "Yes", "No", "Binary", "Graded"

6. **Add styling**:
   - Decision nodes: Blue border, white fill
   - Process boxes: Orange border, white fill
   - Metric boxes: Green border, white fill
   - Font: Arial, 12pt
   - Make text bold for metrics

7. **Save**: File → Save As → `evaluation-metrics-decision-tree.drawio` → Save to `assets/diagrams/`

**Embed in post**:
```liquid
{% drawio path="assets/diagrams/evaluation-metrics-decision-tree.drawio" page_number=0 height=400 %}
```

---

## Post 2: RAG (Retrieval-Augmented Generation)

### Diagram: RAG Architecture Components

**Purpose**: Visualize the complete RAG system architecture.

**File**: `assets/diagrams/rag-architecture.drawio`

**Structure**:
```
User Query
    ↓
Query Encoder (Embedding Model)
    ↓
Vector Database (FAISS/Milvus)
    ↓
Top-K Documents Retrieved
    ↓
Context Formatter
    ↓
LLM (with Context)
    ↓
Grounded Response
```

**Step-by-Step Creation**:

1. **Create new diagram**: File → New → Blank Diagram → Choose "Architecture" template

2. **Add components** (rectangles with rounded corners):
   - Insert → Shape → General → Rounded Rectangle
   - Components:
     - "User Query" (top)
     - "Query Encoder" (Embedding Model)
     - "Vector Database" (FAISS/Milvus)
     - "Document Store" (side component)
     - "Top-K Documents"
     - "Context Formatter"
     - "LLM" (Large Language Model)
     - "Grounded Response" (bottom)

3. **Arrange vertically**:
   - Use alignment tools (Format → Align)
   - Center-align all components
   - Spacing: ~80px between components

4. **Add side component** (Document Store):
   - Place to the right of Vector Database
   - Connect with bidirectional arrow
   - Label: "Stores embeddings"

5. **Style components**:
   - **Input/Output**: Light blue (#e3f2fd) - User Query, Grounded Response
   - **Processing**: Light orange (#fff3e0) - Query Encoder, Context Formatter
   - **Storage**: Light purple (#f3e5f5) - Vector Database, Document Store
   - **Core**: Light green (#e8f5e9) - LLM
   - Add borders: 2px, dark gray
   - Font: Arial, 11pt

6. **Add arrows**:
   - Use connector tool (straight arrows)
   - Direction: Top to bottom
   - Arrow style: Filled arrowhead
   - Color: Dark gray (#333)

7. **Add labels on arrows**:
   - "Embed query"
   - "Similarity search"
   - "Retrieve top-K"
   - "Format context"
   - "Generate response"

8. **Add title**: Insert → Text → "RAG Architecture" (top, centered, bold, 16pt)

9. **Save**: `rag-architecture.drawio`

**Embed in post**:
```liquid
{% drawio path="assets/diagrams/rag-architecture.drawio" page_number=0 height=600 %}
```

---

## Post 3: Agentic AI

### Diagram: Agent Loop (Observe-Think-Act Cycle)

**Purpose**: Show the iterative agent loop with tool interactions.

**File**: `assets/diagrams/agent-loop.drawio`

**Structure**:
```
[Circular flow]
Observe → Think → Act → [Tools] → Observe → ...
```

**Step-by-Step Creation**:

1. **Create new diagram**: File → New → Blank Diagram → Choose "Circular" template

2. **Create circular flow**:
   - Insert → Shape → General → Circle (for each step)
   - Steps:
     - "Observe" (top)
     - "Think" (right)
     - "Act" (bottom)
   - Size: 120x120px each
   - Colors:
     - Observe: Light blue (#e3f2fd)
     - Think: Light orange (#fff3e0)
     - Act: Light green (#e8f5e9)

3. **Add tool box** (center):
   - Insert → Shape → General → Rectangle
   - Label: "Tools\n\n• Code Execution\n• Search\n• APIs\n• File Ops"
   - Position: Center of circle
   - Color: Light purple (#f3e5f5)
   - Size: 150x120px

4. **Connect with curved arrows**:
   - Insert → Connector → Curved Connector
   - Flow: Observe → Think → Act → Tools → (back to Observe)
   - Arrow style: Filled arrowhead
   - Color: Dark gray (#333)
   - Thickness: 2px

5. **Add feedback loop**:
   - From "Act" to "Observe" (curved arrow)
   - Label: "Feedback"
   - Style: Dashed line

6. **Add details**:
   - Under "Observe": "Receive task/feedback"
   - Under "Think": "Reason about next action"
   - Under "Act": "Execute tool or output"

7. **Add title**: "Agent Loop: Observe-Think-Act" (top, centered, bold, 16pt)

8. **Save**: `agent-loop.drawio`

**Alternative: Sequence Diagram Style**

If circular doesn't work well, use a horizontal sequence:

```
Observe → Think → Act → Tools → Observation → Think → ...
```

**Embed in post**:
```liquid
{% drawio path="assets/diagrams/agent-loop.drawio" page_number=0 height=500 %}
```

---

## Post 4: Lifetime Value Estimation

### Diagram: LTV Components and RFM Analysis

**Purpose**: Show the components of LTV and how RFM analysis works.

**File**: `assets/diagrams/ltv-components.drawio`

**Structure**:
```
LTV Components
├─ Frequency (How often?)
├─ Monetary (How much?)
└─ Retention (How long?)

RFM Analysis
├─ Recency Score (1-5)
├─ Frequency Score (1-5)
└─ Monetary Score (1-5)
    ↓
Customer Segment (e.g., 555 = Best)
```

**Step-by-Step Creation**:

1. **Create new diagram**: File → New → Blank Diagram

2. **Add LTV Components section** (left side):
   - Insert → Shape → General → Rounded Rectangle
   - Title: "LTV Components"
   - Three boxes below:
     - "Frequency\n(How often?)"
     - "Monetary\n(How much?)"
     - "Retention\n(How long?)"
   - Color: Light blue (#e3f2fd)
   - Arrange vertically

3. **Add RFM Analysis section** (right side):
   - Insert → Shape → General → Rounded Rectangle
   - Title: "RFM Analysis"
   - Three score boxes:
     - "Recency Score\n(1-5)"
     - "Frequency Score\n(1-5)"
     - "Monetary Score\n(1-5)"
   - Color: Light orange (#fff3e0)

4. **Add connection**:
   - Arrow from LTV Components to RFM Analysis
   - Label: "Quantify"

5. **Add Customer Segment box** (bottom):
   - Insert → Shape → General → Rounded Rectangle
   - Label: "Customer Segment\n(e.g., 555 = Best Customer)"
   - Color: Light green (#e8f5e9)
   - Connect from RFM Analysis with arrow

6. **Add formula box** (top center):
   - Insert → Shape → General → Rectangle
   - Label: "LTV = Σ (Margin × Retention^t) / (1 + Discount)^t"
   - Color: Light yellow (#fff9c4)
   - Position: Above components

7. **Style**:
   - Borders: 2px, dark gray
   - Font: Arial, 11pt
   - Bold titles

8. **Save**: `ltv-components.drawio`

**Embed in post**:
```liquid
{% drawio path="assets/diagrams/ltv-components.drawio" page_number=0 height=500 %}
```

---

## Post 5: A/B Testing Statistics

### Diagram: A/B Testing Workflow

**Purpose**: Show the complete A/B testing process from design to analysis.

**File**: `assets/diagrams/ab-testing-workflow.drawio`

**Structure**:
```
Design Experiment
    ↓
Power Analysis (Sample Size)
    ↓
Randomize Users
    ├─ Treatment Group
    └─ Control Group
    ↓
Collect Data
    ↓
Statistical Analysis
    ├─ Hypothesis Test
    ├─ Confidence Intervals
    └─ Effect Size
    ↓
Interpret Results
```

**Step-by-Step Creation**:

1. **Create new diagram**: File → New → Blank Diagram → Choose "Flowchart" template

2. **Add workflow boxes** (rectangles):
   - "Design Experiment" (top)
   - "Power Analysis" (Sample Size)
   - "Randomize Users"
   - "Collect Data"
   - "Statistical Analysis"
   - "Interpret Results" (bottom)

3. **Add split for groups**:
   - After "Randomize Users", add two parallel boxes:
     - "Treatment Group" (left)
     - "Control Group" (right)
   - Connect both to "Collect Data"

4. **Add analysis details** (under Statistical Analysis):
   - Three smaller boxes:
     - "Hypothesis Test"
     - "Confidence Intervals"
     - "Effect Size"
   - Arrange horizontally
   - Connect to "Interpret Results"

5. **Style**:
   - **Design/Planning**: Light blue (#e3f2fd)
   - **Execution**: Light orange (#fff3e0)
   - **Analysis**: Light purple (#f3e5f5)
   - **Results**: Light green (#e8f5e9)
   - Borders: 2px, dark gray
   - Font: Arial, 11pt

6. **Add arrows**:
   - Straight arrows, top to bottom
   - Filled arrowheads
   - Color: Dark gray (#333)

7. **Add title**: "A/B Testing Workflow" (top, centered, bold, 16pt)

8. **Save**: `ab-testing-workflow.drawio`

**Embed in post**:
```liquid
{% drawio path="assets/diagrams/ab-testing-workflow.drawio" page_number=0 height=600 %}
```

---

## General Design Guidelines

### Color Scheme (Consistent Across All Diagrams)

- **Input/Query**: Light blue (#e3f2fd)
- **Processing/Computation**: Light orange (#fff3e0)
- **Storage/Database**: Light purple (#f3e5f5)
- **Output/Results**: Light green (#e8f5e9)
- **Decision/Comparison**: Light yellow (#fff9c4)
- **Borders**: Dark gray (#333), 2px
- **Text**: Dark gray (#333), Arial font

### Typography

- **Titles**: Arial, 16pt, Bold
- **Component Labels**: Arial, 11-12pt, Regular
- **Arrow Labels**: Arial, 10pt, Italic
- **Formulas**: Courier New, 11pt

### Layout Principles

1. **Flow direction**: Top to bottom (or left to right for sequences)
2. **Spacing**: Minimum 60px between components
3. **Alignment**: Use alignment tools for clean layouts
4. **Grouping**: Related components should be visually grouped
5. **Balance**: Distribute elements evenly

### File Naming Convention

- Use kebab-case: `evaluation-metrics-decision-tree.drawio`
- Be descriptive: `rag-architecture.drawio`
- Include post topic: `agent-loop.drawio`

### Saving Checklist

- [ ] Saved as `.drawio` format (not PNG/SVG)
- [ ] Saved to `assets/diagrams/` directory
- [ ] File name follows naming convention
- [ ] Diagram fits within reasonable height (400-600px)
- [ ] All text is readable
- [ ] Colors are consistent with scheme

---

## Step-by-Step Workflow

### For Each Diagram:

1. **Plan the structure**:
   - Sketch on paper or whiteboard
   - Identify main components
   - Determine flow direction

2. **Create in draw.io**:
   - Open app.diagrams.net
   - Create new diagram
   - Add shapes and connectors
   - Apply styling

3. **Review and refine**:
   - Check readability
   - Verify flow makes sense
   - Ensure colors are consistent
   - Test at different zoom levels

4. **Save**:
   - File → Save As
   - Choose `.drawio` format
   - Save to `assets/diagrams/`
   - Use descriptive filename

5. **Test in Jekyll**:
   - Add `{% drawio %}` tag to post
   - Run `jekyll serve`
   - Verify diagram renders correctly
   - Adjust `height` parameter if needed

---

## Quick Reference: Embed Syntax

```liquid
{% drawio path="assets/diagrams/FILENAME.drawio" page_number=0 height=HEIGHT %}
```

**Parameters**:
- `path`: Relative path from site root
- `page_number`: 0 for first page (if multi-page diagram)
- `height`: Height in pixels (400-600 recommended)

**Example**:
```liquid
{% drawio path="assets/diagrams/rag-architecture.drawio" page_number=0 height=500 %}
```

---

## Troubleshooting

### Diagram Not Rendering

1. **Check path**: Ensure path is relative to site root
2. **Check file exists**: Verify `.drawio` file is in `assets/diagrams/`
3. **Check plugin**: Ensure `jekyll-drawio` is installed (`bundle install`)
4. **Restart Jekyll**: Restart server after adding plugin

### Diagram Too Large/Small

- Adjust `height` parameter in embed tag
- Recommended: 400-600px for most diagrams
- Very complex diagrams: up to 800px

### Colors Not Matching

- Use hex color codes provided in guide
- Use Format → Style → Fill Color in draw.io
- Save color scheme as template for reuse

---

## Next Steps

1. ✅ Configuration files updated
2. ✅ Diagrams directory created
3. ⏳ Create diagrams following this guide
4. ⏳ Embed diagrams in blog posts
5. ⏳ Test rendering in Jekyll

Would you like me to:
- Create template diagrams for you to customize?
- Provide more specific design details for any diagram?
- Help with draw.io-specific features (layers, groups, etc.)?
