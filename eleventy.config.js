module.exports = function (eleventyConfig) {
  // Static assets: copied through untouched into _site/
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/customers");
  eleventyConfig.addPassthroughCopy("src/audio");
  eleventyConfig.addPassthroughCopy("src/videos");
  eleventyConfig.addPassthroughCopy({ "src/favicon.ico": "favicon.ico" });

  // robots.txt / _headers: not present in this repo yet. Add a passthrough
  // copy line here (eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });)
  // if/when either file is added under src/.

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    // Nunjucks for everything — no Markdown needed on this site.
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "html"],
  };
};
