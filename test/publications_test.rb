require 'liquid'
require_relative '../_plugins/publication_filters'

filters = Object.new.extend(PublicationFilters)
def check(condition, message)
  raise message unless condition
end

bib = <<~'BIB'
  @article{DBLP:journals/tc/Example25,
    author = {Yi Bian and Fangyu Zheng and Yi Bianjun},
    title = {{NTT}: Test & comparison},
    journal = {{IEEE} Transactions on Computers},
    year = {2025},
    doi = {10.1234/test},
    selected = {true},
    corresponding_author = {Yi Bian and Fangyu Zheng},
    corresponding = {true},
    abbr = {TC},
    category = {System},
    preview = {test.svg},
    bibtex_show = {true},
    html = {https://doi.org/10.1234/test},
    bibsource = {dblp computer science bibliography}
  }
BIB
authors = filters.publication_authors(bib, 'Yi Bian')
check(authors.map { |a| a['self'] } == [true, false, false], 'Owner matching must be exact')
check(authors.map { |a| a['corresponding'] } == [true, true, false], 'Multiple corresponding authors must work')
comma_bib = bib.sub('Yi Bian and Fangyu Zheng and Yi Bianjun', 'Bian, Yi and Zheng, Fangyu and Bianjun, Yi')
check(filters.publication_authors(comma_bib, 'Bian, Yi') == authors, 'Both standard name formats must agree')

no_corresponding = bib.sub('corresponding_author = {Yi Bian and Fangyu Zheng},', '')
check(filters.publication_authors(no_corresponding, 'Yi Bian').none? { |a| a['corresponding'] }, 'No inference from legacy corresponding=true')
begin
  filters.publication_authors(bib.sub('corresponding_author = {Yi Bian and Fangyu Zheng}', 'corresponding_author = {Unknown Person}'), 'Yi Bian')
  raise 'Unknown corresponding author should fail'
rescue ArgumentError => e
  check(e.message.include?('not in author'), 'Expected a useful validation error')
end

export = filters.publication_bibtex(bib)
parsed = BibTeX.parse(export)
check(parsed.errors.empty? && parsed.entries.size == 1, 'Export must parse as BibTeX')
entry = parsed['DBLP:journals/tc/Example25']
check(entry && entry.title.to_s == '{NTT}: Test & comparison', 'Keep key and protected capitalization')
check((entry.fields.keys & PublicationFilters::WEB_FIELDS).empty?, 'Strip website-only fields')
check(entry[:bibsource].to_s == 'dblp computer science bibliography', 'Keep DBLP metadata')
check(entry[:url].to_s == 'https://doi.org/10.1234/test', 'Convert legacy html to standard url')
check(export.include?('author = {Yi Bian and'), 'Export must use given-name-first author syntax')
check(filters.publication_authors(export, 'Yi Bian').map { |a| a['name'] } == authors.map { |a| a['name'] }, 'Names must survive export')

complex = <<~'BIB'
  @article{complex,
    author = {Ludwig van Beethoven and Smith, Jr., John and {Research and Development Group}},
    title = {Test}, year = {2026}
  }
BIB
check(filters.publication_authors(filters.publication_bibtex(complex), 'Yi Bian').map { |a| a['name'] } == filters.publication_authors(complex, 'Yi Bian').map { |a| a['name'] }, 'Preserve particles, suffixes and corporate authors')

source = File.read(File.expand_path('../_bibliography/papers.bib', __dir__))
check(!source.start_with?('---'), 'Bibliography must not contain YAML front matter')
library = BibTeX.parse(source)
check(library.errors.empty?, 'Production bibliography must parse')
library.entries.each_value do |paper|
  filters.publication_authors(paper.to_s, 'Yi Bian')
  clean = BibTeX.parse(filters.publication_bibtex(paper.to_s))[paper.key]
  check(clean.author.map(&:to_s) == paper.author.map(&:to_s), "Author order changed for #{paper.key}")
  check(clean.title.to_s == paper.title.to_s, "Title changed for #{paper.key}")
end
puts "Publication checks passed (#{library.entries.size} real entries, name matching, multiple correspondents, clean export)."
