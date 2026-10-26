require 'bibtex'

module PublicationFilters
  WEB_FIELDS = %i[abbr category selected preview bibtex_show corresponding corresponding_author html].freeze

  def publication_authors(bibtex, owner)
    entry = parse_publication(bibtex)
    authors = entry.author || []
    corresponding = entry[:corresponding_author].to_s.strip
    correspondents = corresponding.empty? ? [] : BibTeX::Names.parse(corresponding)
    raise ArgumentError, "#{entry.key}: invalid corresponding_author" if correspondents.nil?

    identities = authors.map { |name| author_identity(name) }
    correspondents.each do |name|
      unless identities.include?(author_identity(name))
        raise ArgumentError, "#{entry.key}: corresponding author #{name.display_order} is not in author"
      end
    end
    owner_names = BibTeX::Names.parse(owner.to_s) || []
    authors.map do |name|
      identity = author_identity(name)
      {
        'name' => name.convert(:latex).display_order,
        'self' => owner_names.any? { |person| author_identity(person) == identity },
        'corresponding' => correspondents.any? { |person| author_identity(person) == identity }
      }
    end
  end

  def publication_bibtex(bibtex)
    entry = parse_publication(bibtex)
    # Remove only website fields; preserve bibliographic fields and LaTeX braces.
    entry[:url] = entry[:html] if !entry.field?(:url) && entry.field?(:html)
    WEB_FIELDS.each { |field| entry.delete(field) if entry.field?(field) }
    %i[author editor].each do |field|
      next unless entry.field?(field)

      names = entry[field].map do |name|
        # Suffixes require the comma form to remain unambiguous in BibTeX.
        name.jr.to_s.empty? ? name.display_order : name.sort_order
      end
      entry.fields[field] = BibTeX::Value.new(names.join(" and\n                  "))
    end
    entry.to_s
  end

  private

  def parse_publication(bibtex)
    bibliography = BibTeX.parse(bibtex.to_s)
    raise ArgumentError, 'Expected one valid BibTeX entry' unless bibliography.errors.empty? && bibliography.entries.size == 1

    bibliography.entries.values.first
  end

  def author_identity(name)
    decoded = name.convert(:latex)
    [decoded.given, decoded.von, decoded.family, decoded.jr].map do |part|
      part.to_s.gsub(/[{}]/, '').strip.gsub(/\s+/, ' ').unicode_normalize(:nfc).downcase
    end
  end
end

Liquid::Template.register_filter(PublicationFilters)
