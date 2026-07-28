#!/usr/bin/env python3
"""Fetch abstracts from Semantic Scholar API and update bib files."""

import re
import sys
import time
import urllib.request
import urllib.error

def parse_bib_entries(bib_content):
    """Parse bib file and return list of (key, entry_text, doi) tuples."""
    entries = []
    # Match @type{key, ... }
    pattern = r'(@\w+\{[^,]+,.*?)(?=\n@|\Z)'
    matches = re.findall(pattern, bib_content, re.DOTALL)
    for match in matches:
        key_match = re.match(r'@\w+\{([^,]+),', match)
        if key_match:
            key = key_match.group(1).strip()
            doi_match = re.search(r'doi\s*=\s*\{([^}]+)\}', match)
            doi = doi_match.group(1).strip() if doi_match else None
            has_abstract = bool(re.search(r'abstract\s*=\s*\{', match))
            entries.append((key, match, doi, has_abstract))
    return entries

def clean_abstract(text):
    """Clean LaTeX/HTML markup from abstract text."""
    if not text:
        return None
    # Remove inline-formula tags
    text = re.sub(r'<inline-formula>.*?</inline-formula>', '', text, flags=re.DOTALL)
    # Remove inline-graphic tags
    text = re.sub(r'<inline-graphic[^>]*/>', '', text)
    # Remove mml:math tags
    text = re.sub(r'<mml:math>.*?</mml:math>', '', text, flags=re.DOTALL)
    # Remove tex-math tags
    text = re.sub(r'<tex-math[^>]*>.*?</tex-math>', '', text, flags=re.DOTALL)
    # Remove alternatives tags
    text = re.sub(r'<alternatives>.*?</alternatives>', '', text, flags=re.DOTALL)
    # Remove other HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Remove LaTeX artifacts but keep x as multiplication sign
    text = text.replace(r'\times', 'x')
    text = text.replace('\\times', 'x')
    # Clean up multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def fetch_abstract(doi):
    """Fetch abstract from Semantic Scholar API."""
    url = f"https://api.semanticscholar.org/graph/v1/paper/DOI:{doi}?fields=abstract"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            import json
            data = json.loads(resp.read().decode())
            abstract = data.get('abstract', '')
            return clean_abstract(abstract)
    except Exception as e:
        print(f"  Error fetching {doi}: {e}")
        return None

def update_bib_file(filepath, skip_existing=True):
    """Update bib file with fetched abstracts."""
    with open(filepath, 'r') as f:
        content = f.read()

    entries = parse_bib_entries(content)
    updated_count = 0

    for key, entry_text, doi, has_abstract in entries:
        if skip_existing and has_abstract:
            print(f"  [{key}] Already has abstract, skipping")
            continue
        if not doi:
            print(f"  [{key}] No DOI, skipping")
            continue

        print(f"  [{key}] Fetching abstract for DOI:{doi}...")
        abstract = fetch_abstract(doi)
        time.sleep(1)  # Rate limit

        if abstract:
            # Escape special chars for bib
            abstract_escaped = abstract.replace('{', '\\{').replace('}', '\\}')
            # Insert abstract before closing }
            new_entry = entry_text.rstrip()
            if new_entry.endswith('}'):
                new_entry = new_entry[:-1].rstrip()
                if not new_entry.endswith(','):
                    new_entry += ','
                new_entry += f'\n  abstract    = {{{abstract_escaped}}}\n}}'
            content = content.replace(entry_text, new_entry)
            updated_count += 1
            print(f"    OK: {abstract[:80]}...")
        else:
            print(f"    No abstract found")

    with open(filepath, 'w') as f:
        f.write(content)

    print(f"\nUpdated {updated_count} entries in {filepath}")
    return updated_count

if __name__ == '__main__':
    bib_files = [
        '_bibliography/papers.bib',
        '_bibliography/selected.bib'
    ]

    skip = '--force' not in sys.argv

    for bib_file in bib_files:
        print(f"\nProcessing {bib_file}...")
        update_bib_file(bib_file, skip_existing=skip)
