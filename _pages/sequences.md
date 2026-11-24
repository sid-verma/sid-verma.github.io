---
title: "Sequences"
permalink: /sequences/
layout: default
author_profile: false
---

<div id="main" role="main">
  <section class="archive lw-sequence-page">
    <h1 id="page-title" class="page__title">Sequences</h1>
    <div class="lw-sequence-index">
      {% for sequence in site.data.sequences %}
        <article class="lw-sequence-card">
          <h2><a href="{{ '/sequences/' | append: sequence.slug | append: '/' | relative_url }}">{{ sequence.title }}</a></h2>
          <p>{{ sequence.description }}</p>
          <div class="lw-sequence-card__meta">{{ sequence.posts | size }} posts</div>
        </article>
      {% endfor %}
    </div>
  </section>
</div>
