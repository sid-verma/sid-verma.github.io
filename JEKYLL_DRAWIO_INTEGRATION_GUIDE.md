# Jekyll-DrawIO Integration Guide

## Overview

The `jekyll-drawio` plugin allows you to embed draw.io diagrams directly into your Jekyll blog posts. This guide explains how to integrate it into your site.

## Integration Steps

### 1. Add the Gem to Gemfile

Since your `Gemfile` uses `gemspec`, you have two options:

**Option A: Add to gemspec file** (Recommended if you maintain a gemspec)
- Edit `minimal-mistakes-jekyll.gemspec`
- Add `jekyll-drawio` to the dependencies

**Option B: Add directly to Gemfile** (Simpler, works for most Jekyll sites)
- Add the gem to your `Gemfile`:

```ruby
source "https://rubygems.org"
gemspec

group :jekyll_plugins do
  gem "jekyll-drawio"
end
```

### 2. Add Plugin to _config.yml

Add `jekyll-drawio` to your plugins list in `_config.yml`:

```yaml
plugins:
  - jekyll-paginate
  - jekyll-sitemap
  - jekyll-gist
  - jekyll-feed
  - jekyll-include-cache
  - jekyll-drawio  # Add this line
```

Also add it to the whitelist if you're using `--safe` mode:

```yaml
whitelist:
  - jekyll-paginate
  - jekyll-sitemap
  - jekyll-gist
  - jekyll-feed
  - jekyll-include-cache
  - jekyll-drawio  # Add this line
```

### 3. Install the Gem

Run:
```bash
bundle install
```

### 4. Create Diagrams Directory

Create a directory to store your draw.io files. Common locations:
- `/assets/diagrams/` (recommended)
- `/diagrams/`
- `/images/diagrams/`

### 5. Usage in Blog Posts

#### Basic Usage

```liquid
{% drawio path="assets/diagrams/my-diagram.drawio" page_number=0 height=400 %}
```

#### Parameters

- **`path`**: Relative path to the `.drawio` file (relative to site root)
- **`page_number`**: Page number in the draw.io file (starts from 0)
- **`height`**: Height of the embedded diagram in pixels

#### Example

```markdown
Here's how the RAG architecture works:

{% drawio path="assets/diagrams/rag-architecture.drawio" page_number=0 height=500 %}

The diagram above shows the complete RAG pipeline...
```

## Workflow Recommendations

### Creating Diagrams

1. **Create diagrams in draw.io**:
   - Use [app.diagrams.net](https://app.diagrams.net/) (formerly draw.io)
   - Create your diagram
   - Save as `.drawio` format (not PNG/SVG)

2. **Save to your diagrams directory**:
   - Save files to `assets/diagrams/` (or your chosen directory)
   - Use descriptive names: `rag-architecture.drawio`, `agent-loop.drawio`, etc.

3. **Embed in posts**:
   - Use the `{% drawio %}` tag with the relative path
   - Adjust `height` to fit your content

### Best Practices

1. **File Organization**:
   ```
   assets/
     diagrams/
       rag-architecture.drawio
       agent-loop.drawio
       ab-testing-workflow.drawio
   ```

2. **Naming Conventions**:
   - Use kebab-case: `rag-architecture.drawio`
   - Be descriptive: `evaluation-metrics-comparison.drawio`

3. **Version Control**:
   - Commit `.drawio` files to git (they're XML-based, text-friendly)
   - Don't commit generated images (if any)

4. **Multi-page Diagrams**:
   - If your draw.io file has multiple pages, use `page_number` parameter
   - Page 0 = first page, Page 1 = second page, etc.

## Example Integration

### Step 1: Update Gemfile

```ruby
source "https://rubygems.org"
gemspec

group :jekyll_plugins do
  gem "jekyll-drawio"
end
```

### Step 2: Update _config.yml

```yaml
plugins:
  - jekyll-paginate
  - jekyll-sitemap
  - jekyll-gist
  - jekyll-feed
  - jekyll-include-cache
  - jekyll-drawio

whitelist:
  - jekyll-paginate
  - jekyll-sitemap
  - jekyll-gist
  - jekyll-feed
  - jekyll-include-cache
  - jekyll-drawio
```

### Step 3: Create Directory Structure

```bash
mkdir -p assets/diagrams
```

### Step 4: Use in Blog Post

```markdown
---
title: "RAG: Retrieval-Augmented Generation"
---

Here's the RAG architecture:

{% drawio path="assets/diagrams/rag-architecture.drawio" page_number=0 height=500 %}

The diagram shows the complete pipeline...
```

## Troubleshooting

### Plugin Not Loading

1. **Check plugin is in _config.yml**: Ensure `jekyll-drawio` is in both `plugins:` and `whitelist:` sections
2. **Restart Jekyll**: After adding plugins, restart `jekyll serve`
3. **Check bundle**: Run `bundle install` to ensure gem is installed

### Diagram Not Rendering

1. **Check path**: Ensure path is relative to site root (e.g., `assets/diagrams/file.drawio`)
2. **Check file exists**: Verify the `.drawio` file exists at the specified path
3. **Check page_number**: If using multi-page diagrams, ensure `page_number` is correct (0-indexed)

### GitHub Pages Compatibility

**Note**: GitHub Pages runs in `--safe` mode, which restricts plugins. The `jekyll-drawio` plugin may not work on GitHub Pages unless:

1. You use GitHub Actions to build your site
2. You add the plugin to the whitelist (as shown above)
3. You verify GitHub Pages allows custom plugins

**Alternative**: If GitHub Pages doesn't support this plugin, you can:
- Export diagrams as SVG/PNG and embed them normally
- Use a CI/CD pipeline (GitHub Actions) to build locally and deploy

## Alternative: Using Mermaid Instead

If `jekyll-drawio` doesn't work for your setup, you're already using **Mermaid diagrams** effectively. Mermaid has advantages:

- ✅ Works natively in Jekyll (no plugin needed)
- ✅ Works on GitHub Pages
- ✅ Text-based (version control friendly)
- ✅ Already integrated in your posts

**Recommendation**: Continue using Mermaid for most diagrams, but consider `jekyll-drawio` for:
- Complex diagrams that are easier to create visually
- Diagrams that need frequent manual editing
- Legacy diagrams already in draw.io format

## Next Steps

1. ✅ Add gem to Gemfile
2. ✅ Update _config.yml
3. ✅ Run `bundle install`
4. ✅ Create `assets/diagrams/` directory
5. ✅ Test with a sample diagram
6. ✅ Add diagrams to your blog posts

Would you like me to:
1. Update your Gemfile and _config.yml files?
2. Create example diagrams for your posts?
3. Show you how to convert existing Mermaid diagrams to draw.io format?
