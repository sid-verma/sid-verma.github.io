/**
 * Custom JS - AI/ML Engineering Blog
 * Particles.js · LW nav/search · Reader · Scroll-spy · Progress bar · Copy button
 */

// ============================================================
// 1. Particles.js initialisation (homepage hero)
// ============================================================
(function () {
  var target = document.getElementById('particles-js');
  if (!target) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function initParticles() {
    if (typeof particlesJS === 'undefined') return;
    particlesJS('particles-js', {
    particles: {
      number:      { value: 80, density: { enable: true, value_area: 800 } },
      color:       { value: '#58a6ff' },
      shape:       { type: 'circle' },
      opacity:     { value: 0.5, random: true, anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false } },
      size:        { value: 3, random: true, anim: { enable: false } },
      line_linked: { enable: true, distance: 150, color: '#58a6ff', opacity: 0.2, width: 1 },
      move:        { enable: true, speed: 1.5, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: { enable: true, mode: 'grab' },
        onclick: { enable: true, mode: 'push' },
        resize:  true
      },
      modes: {
        grab: { distance: 200, line_linked: { opacity: 0.5 } },
        push: { particles_nb: 4 }
      }
    },
    retina_detect: true
    });
  }

  if (typeof particlesJS !== 'undefined') {
    initParticles();
    return;
  }

  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js';
  script.async = true;
  script.onload = initParticles;
  document.head.appendChild(script);
})();

// ============================================================
// 2. Reading progress bar
// ============================================================
(function () {
  var bar = document.getElementById('reading-progress');
  var article = document.querySelector('.page__content');
  if (!bar || !article) return;
  var ticking = false;

  function updateProgress() {
    var rect = article.getBoundingClientRect();
    var header = document.querySelector('.lw-header');
    var top = header ? header.getBoundingClientRect().height : 0;
    var available = window.innerHeight - top;
    var max = rect.height - available;
    var pct = max > 0 ? ((top - rect.top) / max) * 100 : (rect.bottom <= window.innerHeight ? 100 : 0);
    bar.style.width = Math.max(0, Math.min(pct, 100)) + '%';
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    (window.requestAnimationFrame || window.setTimeout)(updateProgress);
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  window.addEventListener('load', updateProgress);
  if ('ResizeObserver' in window) new ResizeObserver(updateProgress).observe(article);
  updateProgress();
})();

// ============================================================
// 3. Mobile navigation drawer
// ============================================================
(function () {
  var toggle = document.querySelector('.lw-nav-toggle');
  var nav = document.getElementById('lw-left-nav');
  if (!toggle || !nav) return;
  var mobile = window.matchMedia('(max-width: 1199px)');

  function setNavOpen(isOpen, restoreFocus) {
    isOpen = isOpen && mobile.matches;
    document.body.classList.toggle('lw-nav-open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    nav.inert = mobile.matches && !isOpen;
    if (nav.inert) nav.setAttribute('aria-hidden', 'true');
    else nav.removeAttribute('aria-hidden');
    if (restoreFocus && mobile.matches) toggle.focus();
  }

  toggle.addEventListener('click', function () {
    setNavOpen(!document.body.classList.contains('lw-nav-open'));
  });

  nav.addEventListener('click', function (event) {
    if (event.target.closest('a')) {
      setNavOpen(false);
    }
  });

  document.addEventListener('click', function (event) {
    if (!document.body.classList.contains('lw-nav-open')) return;
    if (nav.contains(event.target) || toggle.contains(event.target)) return;
    setNavOpen(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && document.body.classList.contains('lw-nav-open')) {
      setNavOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('lw:search-open', function () { setNavOpen(false, false); });
  function syncViewport() { setNavOpen(false, nav.contains(document.activeElement)); }
  if (mobile.addEventListener) mobile.addEventListener('change', syncViewport);
  else mobile.addListener(syncViewport);
  syncViewport();
})();

// ============================================================
// 4. LessWrong-style search overlay
// ============================================================
(function () {
  var overlay = document.getElementById('lw-search-overlay');
  var openButton = document.querySelector('.lw-search-toggle');
  var closeButton = document.querySelector('.lw-search-close');
  if (!overlay || !openButton) return;

  var input = overlay.querySelector('#search');
  var previousFocus = null;
  var previousOverflow = '';
  var background = [];
  var results = overlay.querySelector('#results');
  var status = overlay.querySelector('[data-search-status]');
  var focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function openSearch() {
    if (overlay.classList.contains('is-open')) return;
    previousFocus = document.activeElement;
    document.dispatchEvent(new Event('lw:search-open'));
    if (previousFocus && previousFocus.closest('[inert]')) previousFocus = openButton;
    // Inert siblings at every ancestor level without hiding the dialog itself.
    background = [];
    var branch = overlay;
    while (branch.parentElement && branch !== document.body) {
      Array.prototype.forEach.call(branch.parentElement.children, function (sibling) {
        if (sibling !== branch && !sibling.inert) { sibling.inert = true; background.push(sibling); }
      });
      branch = branch.parentElement;
    }
    overlay.inert = false;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    openButton.setAttribute('aria-expanded', 'true');
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (input) {
      input.removeAttribute('tabindex');
      input.focus();
    }
    updateSearchStatus();
  }

  function closeSearch() {
    if (!overlay.classList.contains('is-open')) return;
    background.forEach(function (node) { node.inert = false; });
    background = [];
    var restore = previousFocus && previousFocus.isConnected && !previousFocus.closest('[inert]') ? previousFocus : openButton;
    restore.focus();
    overlay.inert = true;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    openButton.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = previousOverflow;
    if (input) input.setAttribute('tabindex', '-1');
  }

  openButton.addEventListener('click', openSearch);
  if (closeButton) closeButton.addEventListener('click', closeSearch);

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) closeSearch();
  });

  document.addEventListener('keydown', function (event) {
    var tag = event.target.tagName;
    var isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable;
    if (event.key === '/' && !isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      openSearch();
    }
    if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeSearch();
    }
    if (event.key === 'Tab' && overlay.classList.contains('is-open')) {
      var focusable = Array.prototype.slice.call(overlay.querySelectorAll(focusableSelector))
        .filter(function (item) { return item.offsetParent !== null; });
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !overlay.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !overlay.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  overlay.setAttribute('aria-hidden', 'true');
  overlay.inert = true;
  openButton.setAttribute('aria-expanded', 'false');
  function updateSearchStatus() {
    if (!status || !input || !results) return;
    var query = input.value.trim();
    results.hidden = !query;
    if (typeof window.idx === 'undefined') {
      status.textContent = document.readyState === 'complete' ? 'Search is unavailable. Please try reloading the page.' : 'Loading search…';
    } else if (!query) status.textContent = 'Search titles, topics, and article text.';
    else {
      var count = results.querySelectorAll('.list__item').length;
      status.textContent = count ? count + (count === 1 ? ' result' : ' results') : 'No results. Try another word or a broader topic.';
    }
  }
  if (results && 'MutationObserver' in window) new MutationObserver(updateSearchStatus).observe(results, { childList: true });
  if (input) input.addEventListener('input', function () { if (!input.value.trim()) updateSearchStatus(); });
  window.addEventListener('load', updateSearchStatus);
})();

// ============================================================
// 5. Homepage tag filter and load more
// ============================================================
(function () {
  var feed = document.querySelector('[data-lw-post-list]');
  if (!feed) return;
  var rows = Array.prototype.slice.call(feed.querySelectorAll('[data-lw-post-row]'));
  var filters = Array.prototype.slice.call(document.querySelectorAll('[data-filter-tag]'));
  var loadMore = document.querySelector('[data-lw-load-more]');
  var feedStatus = document.querySelector('[data-lw-feed-status]');
  var empty = document.querySelector('[data-lw-feed-empty]');
  if (!rows.length) return;

  var visibleLimit = 12;
  var activeTag = 'all';

  function applyFeedState() {
    var visibleCount = 0;
    rows.forEach(function (row) {
      var rowTags = (row.getAttribute('data-tags') || '').split(/\s+/);
      var matches = activeTag === 'all' || rowTags.indexOf(activeTag) !== -1;
      visibleCount += matches ? 1 : 0;
      row.classList.toggle('is-hidden', !matches || visibleCount > visibleLimit);
      row.hidden = !matches || visibleCount > visibleLimit;
    });
    if (loadMore) {
      loadMore.hidden = visibleCount <= visibleLimit;
    }
    if (empty) empty.hidden = visibleCount !== 0;
    if (feedStatus) feedStatus.textContent = 'Showing ' + Math.min(visibleLimit, visibleCount) + ' of ' + visibleCount + (activeTag === 'all' ? ' posts.' : ' matching posts.');
  }

  filters.forEach(function (filter) {
    filter.addEventListener('click', function () {
      activeTag = filter.getAttribute('data-filter-tag');
      visibleLimit = 12;
      filters.forEach(function (item) {
        item.classList.remove('is-active');
        item.setAttribute('aria-pressed', 'false');
      });
      filter.classList.add('is-active');
      filter.setAttribute('aria-pressed', 'true');
      applyFeedState();
    });
  });

  if (loadMore) {
    loadMore.addEventListener('click', function () {
      visibleLimit += 12;
      applyFeedState();
    });
  }

  applyFeedState();
  filters.forEach(function (filter) {
    filter.setAttribute('aria-pressed', filter.classList.contains('is-active') ? 'true' : 'false');
  });
})();

// ============================================================
// 6. Best-of homepage collection slider
// ============================================================
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-home-tab]'));
  var collections = Array.prototype.slice.call(document.querySelectorAll('[data-home-collection]'));
  var catalog = document.querySelector('.lw-bestof-catalog');
  if (!tabs.length || !collections.length) return;

  function setActive(slug) {
    tabs.forEach(function (tab) {
      var isActive = tab.getAttribute('data-home-tab') === slug;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function activate(slug, shouldScroll) {
    if (slug === 'all') {
      setActive('all');
      if (shouldScroll && catalog) {
        catalog.scrollTo({ left: 0, behavior: 'auto' });
      }
      return;
    }

    var target = collections.filter(function (section) { return section.getAttribute('data-home-collection') === slug; })[0];
    if (!target) return;
    setActive(slug);
    if (shouldScroll) {
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      catalog.scrollTo({ left: catalog.scrollLeft + target.getBoundingClientRect().left - catalog.getBoundingClientRect().left, behavior: reduced ? 'auto' : 'smooth' });
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var slug = tab.getAttribute('data-home-tab');
      activate(slug, true);
      if (history.replaceState) {
        history.replaceState(null, '', window.location.pathname + window.location.search + (slug === 'all' ? '' : '#' + encodeURIComponent(slug)));
      }
    });
  });

  if (catalog) catalog.addEventListener('scroll', function () {
    var edge = catalog.getBoundingClientRect().left;
    var nearest = collections.reduce(function (best, section) {
      return Math.abs(section.getBoundingClientRect().left - edge) < Math.abs(best.getBoundingClientRect().left - edge) ? section : best;
    });
    setActive(nearest.getAttribute('data-home-collection'));
  }, { passive: true });
  function applyHash() {
    var slug;
    try { slug = decodeURIComponent(window.location.hash.slice(1)); } catch (error) { return; }
    if (slug) activate(slug, true);
    else setActive(collections[0].getAttribute('data-home-collection'));
  }
  window.addEventListener('hashchange', applyHash);
  window.addEventListener('load', applyHash);
  window.addEventListener('resize', function () {
    var selected = tabs.filter(function (tab) { return tab.classList.contains('is-active'); })[0];
    if (selected) activate(selected.getAttribute('data-home-tab'), true);
  });
  applyHash();
})();

// ============================================================
// 7. Post reader
// ============================================================
(function () {
  var reader = document.querySelector('[data-reader]');
  var content = document.querySelector('.page__content');
  if (!reader || !content) return;

  var synth = window.speechSynthesis;
  var Utterance = window.SpeechSynthesisUtterance;
  var toggle = reader.querySelector('[data-reader-toggle]');
  var stop = reader.querySelector('[data-reader-stop]');
  var label = reader.querySelector('[data-reader-label]');
  var rate = reader.querySelector('[data-reader-rate]');
  var status = reader.querySelector('[data-reader-status]');
  var icon = toggle ? toggle.querySelector('i') : null;
  var chunks = [];
  var index = 0;
  var active = false;
  var generation = 0;
  var paused = false;

  if (!synth || !Utterance || !toggle) {
    if (toggle) {
      toggle.disabled = true;
      toggle.title = 'Speech playback is not available in this browser';
    }
    if (status) status.textContent = 'Unavailable';
    return;
  }

  function textChunks(text) {
    var parts = [];
    var clean = text.replace(/\s+/g, ' ').trim();
    while (clean.length > 280) {
      var cut = clean.lastIndexOf(' ', 280);
      if (cut < 180) cut = 280;
      parts.push(clean.slice(0, cut).trim());
      clean = clean.slice(cut).trim();
    }
    if (clean) parts.push(clean);
    return parts;
  }

  function collectChunks() {
    var collected = [];
    var buffer = '';
    function flush() { textChunks(buffer).forEach(function (part) { collected.push(part); }); buffer = ''; }
    function visit(node) {
      if (node.nodeType === 3) { buffer += node.textContent; return; }
      if (node.nodeType !== 1 || node.matches('pre, code, .highlight, .toc, .footnotes, nav, button, script, style, [data-reader], [aria-hidden="true"]')) return;
      var block = /^(H[1-6]|P|LI|BLOCKQUOTE|DIV|UL|OL|BR)$/.test(node.tagName);
      if (block) flush();
      Array.prototype.forEach.call(node.childNodes, visit);
      if (block) flush();
    }
    visit(content);
    flush();
    return collected;
  }

  function setState(state) {
    if (label) label.textContent = state;
    toggle.setAttribute('aria-label', state === 'Listen' ? 'Read post aloud' : state + ' reading');
    toggle.title = toggle.getAttribute('aria-label');
    if (icon) {
      icon.classList.toggle('fa-play', state !== 'Pause');
      icon.classList.toggle('fa-pause', state === 'Pause');
    }
  }

  function updateStatus() {
    if (!status) return;
    status.textContent = chunks.length ? Math.min(index + 1, chunks.length) + '/' + chunks.length : '';
  }

  function finish() {
    generation += 1;
    active = false;
    paused = false;
    index = 0;
    setState('Listen');
    if (status) status.textContent = '';
    if (stop) stop.hidden = true;
  }

  function speakNext() {
    if (!active || index >= chunks.length) {
      finish();
      return;
    }

    var utterance = new Utterance(chunks[index]);
    var token = generation;
    utterance.rate = rate ? Number(rate.value) : 1;
    utterance.onend = function () {
      if (token !== generation || !active) return;
      index += 1;
      updateStatus();
      speakNext();
    };
    utterance.onerror = function () { if (token === generation) finish(); };
    updateStatus();
    synth.speak(utterance);
  }

  function start() {
    chunks = collectChunks();
    if (!chunks.length) {
      if (status) status.textContent = 'No text';
      return;
    }
    generation += 1;
    synth.cancel();
    active = true;
    paused = false;
    index = 0;
    setState('Pause');
    if (stop) stop.hidden = false;
    speakNext();
  }

  toggle.addEventListener('click', function () {
    if (!active) {
      start();
      return;
    }
    if (paused) {
      paused = false;
      synth.resume();
      setState('Pause');
    } else {
      paused = true;
      synth.pause();
      setState('Resume');
    }
  });

  if (stop) {
    stop.addEventListener('click', function () {
      finish();
      synth.cancel();
    });
  }

  if (rate) {
    rate.addEventListener('change', function () {
      if (!active) return;
      generation += 1;
      synth.cancel();
      paused = false;
      setState('Pause');
      speakNext();
    });
  }

  window.addEventListener('beforeunload', function () {
    finish();
    synth.cancel();
  });
})();

// ============================================================
// 8. Code block copy button
// ============================================================
(function () {
  document.querySelectorAll('div.highlight pre, pre.highlight').forEach(function (pre) {
    var code = pre.querySelector('code');
    var source = code ? code.textContent : pre.textContent;
    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    pre.style.position = 'relative';
    pre.appendChild(btn);
    var feedback = document.createElement('span');
    feedback.className = 'sr-only';
    feedback.setAttribute('role', 'status');
    pre.parentNode.insertBefore(feedback, pre.nextSibling);
    var reset;

    btn.addEventListener('click', function () {
      var text = code ? code.textContent : source;
      clearTimeout(reset);
      var copy = navigator.clipboard && window.isSecureContext
        ? navigator.clipboard.writeText(text)
        : new Promise(function (resolve, reject) {
            var area = document.createElement('textarea');
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.position = 'fixed';
            area.style.top = '-9999px';
            document.body.appendChild(area);
            area.select();
            try {
              document.execCommand('copy') ? resolve() : reject();
            } catch (error) {
              reject(error);
            } finally {
              document.body.removeChild(area);
              btn.focus();
            }
          });

      copy.then(function () {
        btn.textContent = 'Copied! ✓';
        feedback.textContent = 'Code copied to clipboard.';
        reset = setTimeout(function () {
          btn.textContent = 'Copy';
          feedback.textContent = '';
        }, 2000);
      }).catch(function () {
        btn.textContent = 'Try again';
        feedback.textContent = 'Could not copy. Select the code and copy it manually.';
      });
    });
  });
})();

// ============================================================
// 9. TOC scroll-spy
// ============================================================
(function () {
  var headings = document.querySelectorAll('.page__content h1[id], .page__content h2[id], .page__content h3[id]');
  var tocLinks = document.querySelectorAll('.toc__menu a');
  if (!headings.length || !tocLinks.length) return;
  var scheduled = false;
  function updateToc() {
    scheduled = false;
    var header = document.querySelector('.lw-header');
    var offset = (header ? header.getBoundingClientRect().height : 56) + 32;
    var current = headings[0];
    headings.forEach(function (heading) { if (heading.getBoundingClientRect().top <= offset) current = heading; });
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) current = headings[headings.length - 1];
    tocLinks.forEach(function (link) {
      var selected = link.hash === '#' + current.id || link.hash === '#' + encodeURIComponent(current.id);
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', function () {
    if (!scheduled) { scheduled = true; window.requestAnimationFrame(updateToc); }
  }, { passive: true });
  window.addEventListener('resize', updateToc);
  window.addEventListener('load', updateToc);
  updateToc();
})();

// ============================================================
