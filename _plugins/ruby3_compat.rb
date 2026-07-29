# Restore File.exists? alias removed in Ruby 3.x
# Needed for jekyll-scholar 5.16.0 compatibility with Ruby 3.3
unless File.respond_to?(:exists?)
  class File
    class << self
      alias_method :exists?, :exist?
    end
  end
end
