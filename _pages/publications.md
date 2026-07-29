---
permalink: /publications/
title: Full Publications
author_profile: true
---

<span class="anchor" id="publications"></span>

# 📝 Full Publications

<div class="publications publications-list">
{% bibliography --template bib_pub --group_by none %}
</div>

<nav class="pub-year-nav" id="pub-year-nav"></nav>

<script>
  (function() {
    var venueMap = {
      'CCS':    { ccf: 'A' },
      'ICPP':   { ccf: 'B' },
      'ICPADS': { ccf: 'C' },
      'TC':     { ccf: 'A' },
      'TCHES':  { ccf: 'B'}
    };

    function makeBadge(cls, text) {
      return '<span class="ccf-badge ' + cls + '">' + text + '</span>';
    }

    function classify(abbr) {
      var info = venueMap[abbr];
      if (!info) return '';
      var badges = '';
      if (info.ccf)  badges += makeBadge('ccf-' + info.ccf.toLowerCase(),  'CCF-' + info.ccf);
      if (info.jcr)  badges += makeBadge('jcr-' + info.jcr.toLowerCase(),  info.jcr);
      return badges;
    }

    var allItems = [];

    function processPublications() {
      var container = document.querySelector('.publications-list');
      if (!container) return;
      if (container.dataset.processed) return;

      var ol = container.querySelector('ol.bibliography');
      if (!ol) return;
      var items = Array.prototype.slice.call(ol.querySelectorAll('li'));

      items.forEach(function(li) {
        var p = li.querySelector('p[data-category]');
        var span = li.querySelector('span[id]');
        var category = p ? p.getAttribute('data-category') : 'Other';
        li.setAttribute('data-category', category);

        if (!span) return;
        var abbrEl = li.querySelector('.badge');
        var abbr = abbrEl ? abbrEl.textContent.trim() : '';
        var abbrHtml = abbrEl ? '<span class="ccf-badge ccf-abbr">' + abbr + '</span>' : '';
        if (abbrEl) {
          abbrEl.remove();
          if (p.firstChild && p.firstChild.nodeType === 3) p.removeChild(p.firstChild);
        }

        var html = span.innerHTML;
        html = html.replace(/Yi Bian/g, '<u><strong style="color:#01369f;background:#eef3fc;padding:0 2px;">Yi Bian</strong></u>');
        var badges = abbrHtml + classify(abbr);
        if (html.match(/doi:\s*((10\.[0-9]{4,}[^\s,)]+))/)) {
          html = html.replace(/doi:\s*((10\.[0-9]{4,}[^\s,)]+))/g, function(match, doi) {
            doi = doi.replace(/[.;]+$/, '');
            return 'doi: <a href="https://doi.org/' + doi + '" target="_blank" rel="noopener noreferrer">' + doi + '</a>&nbsp;&nbsp;' + badges;
          });
        } else {
          html += '&nbsp;&nbsp;' + badges;
        }
        span.innerHTML = html;

        var id = span.id || '';
        var m = id.match(/(\d{4})/);
        var year = m ? m[1] : 'Others';
        li.setAttribute('data-year', year);
      });

      allItems = items;

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
