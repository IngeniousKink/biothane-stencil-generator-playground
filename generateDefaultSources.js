const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Generates a list of source objects for .scad files.
 * @param {string} baseDir - The base directory to search for files.
 * @param {Array<string>} patterns - Glob patterns to match files.
 * @returns {Array<{path: string, content: string}>}
 */
function generateSources(baseDir, patterns) {
  const sources = [];

  for (const pattern of patterns) {
    const fullPattern = path.join(baseDir, pattern);
    const files = glob.sync(fullPattern);

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = `/${path.relative(baseDir, filePath)}`;
      sources.push({
        path: relativePath,
        content: content,
      });
    }
  }

  return sources;
}

/**
 * Main function to generate the sources array.
 */
function main() {
  const patterns = process.argv.slice(2);

  if (patterns.length === 0) {
    console.error("Usage: node generateSources.js <glob1> [<glob2> ...]");
    process.exit(1);
  }

  const baseDir = process.cwd();
  const sources = generateSources(baseDir, patterns);

  // Construct sources string
  const sourcesString = sources.map(source => {
    return `  {
    path: \`${source.path}\`,
    content: \`${source.content.replace(/`/g, '\`')}\`
  }`;
  }).join(',');

  // Construct the full TypeScript content
  const tsContent = `// Auto-generated TypeScript file
const sources = [
${sourcesString}
];

export default sources;
`;

  console.log(tsContent);
}

main();
