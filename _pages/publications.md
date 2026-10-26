---
permalink: /publications/
title: Full Publications
author_profile: true
---

<span class="anchor" id="publications"></span>

# 📝 Full Publications

<p class="publication-legend">* represents corresponding author</p>

<div class="publications publications-list">
{% bibliography --template bib_pub --group_by none %}
</div>

<nav class="pub-year-nav" id="pub-year-nav"></nav>

<script>
  (function() {
    function processPublications() {
      var container = document.querySelector('.publications-list');
      if (!container) return;
      if (container.dataset.processed) return;

      var ol = container.querySelector('ol.bibliography');
      if (!ol) return;
      var items = Array.prototype.slice.call(ol.querySelectorAll('li'));

      items.forEach(function(li) {
        var p = li.querySelector('p[data-category]');
        li.setAttribute('data-category', p ? p.getAttribute('data-category') : 'Other');
        li.setAttribute('data-year', p ? p.getAttribute('data-year') || 'Others' : 'Others');
      });

      ol.remove();
      renderGroups(container, items);
      container.dataset.processed = 'true';
    }

    function renderGroups(container, items) {
      container.querySelectorAll('h2.bibliography, ol.bibliography').forEach(function(el) { el.remove(); });

      var groups = [];
      var currentYear = null;
      items.forEach(function(li) {
        var year = li.getAttribute('data-year') || 'Others';
        if (year !== currentYear) {
          groups.push({ year: year, items: [] });
          currentYear = year;
        }
        groups[groups.length - 1].items.push(li);
      });

      var counter = 1;
      groups.forEach(function(g) {
        var h2 = document.createElement('h2');
        h2.className = 'bibliography';
        h2.textContent = g.year;
        h2.id = 'pub-year-' + g.year;
        container.appendChild(h2);
        if (window.registerFadeIn) window.registerFadeIn(h2);

        var newOl = document.createElement('ol');
        newOl.className = 'bibliography';
        newOl.setAttribute('start', counter);
        g.items.forEach(function(li) { newOl.appendChild(li); });
        container.appendChild(newOl);
        counter += g.items.length;
      });

      updateYearNav(groups);
    }

    function updateYearNav(groups) {
      var nav = document.getElementById('pub-year-nav');
      if (!nav) return;
      nav.innerHTML = '';
      groups.forEach(function(g) {
        if (/^\d{4}$/.test(g.year)) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = g.year;
          btn.addEventListener('click', function() {
            var target = document.getElementById('pub-year-' + g.year);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
          nav.appendChild(btn);
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', processPublications);
    } else {
      processPublications();
    }
  })();
</script>
