const calculatedData = (data, coverageThreshold) => ({
  coverageSuccess: data.totalCoverage >= coverageThreshold,
  testsSuccess: data.totalFailures === 0,
});

// Used for Elixir <= 1.16
const oldParser = {
  pattern: /(.+?)(?=Finished)(.+sync\))\n(.*?)([0-9]+ failure[s]?)(.+)(Randomized with seed [0-9]+)(.+)(Percentage \| Module.+)( [0-9]+\.[0-9]+%)( \| Total)/gs,
  mapGroupsToData: (groups) => ({
    summary: groups[2],
    tests: groups[3].slice(0, -2),
    totalFailures: parseInt(groups[4]),
    totalCoverage: parseFloat(groups[9]),
    randomizedSeed: groups[6],
    coverageTable: (groups[8] + groups[9] + groups[10]).trim(),
  }),
};

// Used for Elixir >= 1.17
const newParser = {
  pattern: /(Running ExUnit with seed: [0-9]+, max_cases: [0-9]+\n)(.+?)(?=Finished)(Finished.+sync\))\n(.*?)([0-9]+ failure[s]?)(.+?)(Percentage \| Module.+)((?:\n.+)+\n-+\|-+\n\s+([0-9]+\.[0-9]+)%\s+\|\s+Total)/s,
  mapGroupsToData: (groups) => ({
    summary: groups[3],
    tests: groups[4].slice(0, -2),
    totalFailures: parseInt(groups[5]),
    totalCoverage: parseFloat(groups[9]),
    randomizedSeed: groups[1].trim(),
    coverageTable: groups[7] + groups[8],
  }),
};

const detectFormat = (output) => output.includes("Running ExUnit with seed:") ? "new" : "old";

const parseData = (output, coverageThreshold) => {
  const format = detectFormat(output);
  const parser = format === "new" ? newParser : oldParser;

  try {
    parser.pattern.lastIndex = 0;
    const groups = parser.pattern.exec(output);
    const data = parser.mapGroupsToData(groups);
    return { ...data, ...calculatedData(data, coverageThreshold) };
  } catch (e) {
    return "Error parsing coverage report";
  }
};

module.exports = parseData;
