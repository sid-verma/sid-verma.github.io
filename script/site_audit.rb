#!/usr/bin/env ruby
# frozen_string_literal: true

require "cgi"
require "find"
require "set"
require "yaml"
require "date"

class SiteAudit
  SOURCE_SEARCH_BUDGET = 750_000
  BUILT_SEARCH_BUDGET = 750_000
  HOME_IMAGE_BUDGET = 1_200_000

  def initialize(root)
    @root = File.expand_path(root)
    @errors = []
    @warnings = []
    @infos = []
  end

  def run
    audit_curated_post_slugs
    audit_sequence_pages
    audit_assets
    audit_sass_partials
    audit_built_internal_links
    audit_built_feed_tags
    report
  end

  private

  def path(*parts)
    File.join(@root, *parts)
  end

  def rel(file)
    file.sub(%r{\A#{Regexp.escape(@root)}/?}, "")
  end

  def load_yaml(relative_path)
    file = path(relative_path)
    return [] unless File.exist?(file)

    YAML.load_file(file) || []
  rescue Psych::SyntaxError => e
    @errors << "#{relative_path}: YAML parse error: #{e.message}"
    []
  end

  def post_slugs
    @post_slugs ||= Dir[path("_posts", "*.{md,markdown}")].map do |file|
      File.basename(file).sub(/\A\d{4}-\d{2}-\d{2}-/, "").sub(/\.(md|markdown)\z/, "")
    end.to_set
  end

  def audit_curated_post_slugs
    {
      "_data/home_collections.yml" => load_yaml("_data/home_collections.yml"),
      "_data/sequences.yml" => load_yaml("_data/sequences.yml")
    }.each do |relative_path, groups|
      groups.each do |group|
        Array(group["posts"]).each do |slug|
          next if post_slugs.include?(slug)

          @errors << "#{relative_path}: '#{group['slug'] || group['title']}' references missing post slug '#{slug}'"
        end
      end
    end

    load_yaml("_data/spotlight.yml").each do |item|
      slug = item["post"]
      next if slug.nil? || post_slugs.include?(slug)

      @errors << "_data/spotlight.yml: '#{item['title'] || item['label']}' references missing post slug '#{slug}'"
    end
  end

  def audit_sequence_pages
    load_yaml("_data/sequences.yml").each do |sequence|
      slug = sequence["slug"]
      next unless slug

      file = path("_sequences", "#{slug}.md")
      @errors << "_data/sequences.yml: sequence '#{slug}' has no matching _sequences/#{slug}.md page" unless File.exist?(file)
    end
  end

  def audit_assets
    audit_size("assets/js/lunr/lunr-store.js", SOURCE_SEARCH_BUDGET, "source Lunr template")
    audit_size("_site/assets/js/lunr/lunr-store.js", BUILT_SEARCH_BUDGET, "built Lunr search store")
    audit_size("assets/images/home/renaissance-topic-sheet.jpg", HOME_IMAGE_BUDGET, "homepage atlas delivery image")

    dimensions = image_dimensions(path("assets/images/home/renaissance-topic-sheet.jpg"))
    if dimensions
      width, height = dimensions
      puts "asset: assets/images/home/renaissance-topic-sheet.jpg #{width}x#{height}"
    end
  end

  def audit_size(relative_path, budget, label)
    file = path(relative_path)
    return @warnings << "#{relative_path}: missing #{label}" unless File.exist?(file)

    size = File.size(file)
    puts "asset: #{relative_path} #{format_bytes(size)}"
    return unless size > budget

    @warnings << "#{relative_path}: #{label} is #{format_bytes(size)}, above #{format_bytes(budget)} budget"
  end

  def image_dimensions(file)
    return nil unless File.exist?(file)

    header = File.binread(file, 24)
    if header && header.start_with?("\x89PNG\r\n\x1A\n".b)
      return header.byteslice(16, 8).unpack("NN")
    end

    jpeg_dimensions(file)
  end

  def jpeg_dimensions(file)
    File.open(file, "rb") do |io|
      return nil unless io.read(2) == "\xFF\xD8".b

      until io.eof?
        marker_start = io.read(1)
        next unless marker_start == "\xFF".b

        marker = io.read(1)&.ord
        next if marker == 0xFF
        return nil if marker.nil? || marker == 0xD9 || marker == 0xDA

        length = io.read(2)&.unpack1("n")
        return nil unless length && length >= 2

        if (0xC0..0xC3).include?(marker)
          data = io.read(length - 2)
          return data.byteslice(1, 4).unpack("nn").reverse
        end

        io.seek(length - 2, IO::SEEK_CUR)
      end
    end

    nil
  end

  def audit_sass_partials
    imported = File.read(path("_sass/minimal-mistakes.scss")).scan(/@import\s+"([^"]+)"/).flatten.to_set
    reviewed_parked = {
      "_footer-enhanced.scss" => "parked enhancement; not imported to preserve current footer UI",
      "_glass-cards.scss" => "parked enhancement; archive rows now use lw-post-row styling",
      "_masthead-enhanced.scss" => "parked enhancement; lw-header replaces Minimal Mistakes masthead",
      "skins/_dark-premium.scss" => "parked alternate skin; active skin is lesswrong-hybrid"
    }

    reviewed_parked.each do |relative, note|
      file = path("_sass/minimal-mistakes", relative)
      next unless File.exist?(file)

      import_name = "minimal-mistakes/#{relative.sub(/\A_/, '').sub(/\.scss\z/, '')}"
      import_name = import_name.sub("/_", "/")
      next if imported.include?(import_name)

      @infos << "_sass/minimal-mistakes/#{relative}: #{note}"
    end
  end

  def audit_built_internal_links
    site_dir = path("_site")
    return @warnings << "_site: missing built output; run jekyll build before full audit" unless Dir.exist?(site_dir)

    Find.find(site_dir) do |file|
      next unless file.end_with?(".html")

      # JavaScript templates may contain src/href strings that are not actual
      # document links. Keep opening script tags (and their external src), but
      # exclude raw-text contents from this static HTML link audit.
      html = File.read(file).gsub(/(<script\b[^>]*>).*?<\/script\s*>/mi, '\1</script>')
      html.scan(/\s(?:href|src)=["']([^"']+)["']/i).flatten.each do |raw_url|
        audit_internal_url(file, raw_url)
      end
    end
  end

  def audit_internal_url(source_file, raw_url)
    url = CGI.unescapeHTML(raw_url).strip
    return if url.empty? || url.start_with?("#")
    return if url =~ /\A[a-z][a-z0-9+.-]*:/i || url.start_with?("//")
    return if url.start_with?("{{", "{%")

    path_part = url.split("#", 2).first.split("?", 2).first
    return if path_part.empty?

    target = if path_part.start_with?("/")
      path("_site", path_part.sub(%r{\A/+}, ""))
    else
      File.expand_path(path_part, File.dirname(source_file))
    end

    candidates = if File.extname(target).empty?
      [File.join(target, "index.html"), "#{target}.html", target]
    else
      [target]
    end

    return if candidates.any? { |candidate| File.exist?(candidate) }

    @errors << "#{rel(source_file)}: missing internal target '#{raw_url}'"
  end

  # Read the compiled attribute, not the Liquid source: HTML compression can
  # remove whitespace delimiters without producing a build error.
  def audit_built_feed_tags
    home = path("_site", "index.html")
    return unless File.exist?(home)

    expected = {}
    Dir[path("_posts", "*.{md,markdown}")].each do |file|
      front_matter = File.read(file)[/\A---\s*\n(.*?)\n---/m, 1]
      next unless front_matter

      data = YAML.safe_load(front_matter, permitted_classes: [Date, Time], aliases: true) || {}
      slug = data["slug"] || File.basename(file).sub(/\A\d{4}-\d{2}-\d{2}-/, "").sub(/\.(md|markdown)\z/, "")
      tags = data["tags"].is_a?(String) ? data["tags"].split : Array(data["tags"])
      expected[slug] = tags.map { |tag| tag.to_s.downcase.gsub(/[^[:alnum:]]+/, "-").sub(/\A-/, "").sub(/-\z/, "") }
    end

    rows = File.read(home).scan(/<article\b[^>]*\bdata-lw-post-row\b[^>]*>/i)
    @errors << "_site/index.html: no compiled homepage feed rows found" if rows.empty?
    rows.each do |row|
      slug = CGI.unescapeHTML(row[/\bdata-post-slug=["']([^"']*)["']/, 1].to_s)
      tags = CGI.unescapeHTML(row[/\bdata-tags=["']([^"']*)["']/, 1].to_s).split(/[\s,]+/)
      if !expected.key?(slug)
        @errors << "_site/index.html: feed row has unknown or missing data-post-slug '#{slug}'"
      elsif tags != expected[slug]
        @errors << "_site/index.html: '#{slug}' filter tags #{tags.inspect} do not match source #{expected[slug].inspect}"
      end
    end
    puts "feed: checked #{rows.length} compiled post tag lists against source front matter"
  end

  def format_bytes(size)
    return "#{size} B" if size < 1024
    return "#{(size / 1024.0).round(1)} KB" if size < 1_048_576

    "#{(size / 1_048_576.0).round(2)} MB"
  end

  def report
    @infos.each { |info| puts "INFO: #{info}" }
    @warnings.each { |warning| warn "WARN: #{warning}" }
    @errors.each { |error| warn "ERROR: #{error}" }

    if @errors.empty?
      puts "site audit passed with #{@warnings.length} warning(s)."
      true
    else
      warn "site audit failed with #{@errors.length} error(s) and #{@warnings.length} warning(s)."
      false
    end
  end
end

exit(SiteAudit.new(ARGV[0] || Dir.pwd).run ? 0 : 1)
