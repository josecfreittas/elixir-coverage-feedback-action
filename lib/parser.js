const calculatedData = (data, coverageThreshold) => ({
  coverageSuccess: data.totalCoverage >= coverageThreshold,
  testsSuccess: data.totalFailures === 0,
});

// Used for Elixir <= 1.16
const parser16 = {
  pattern:
    /(.+?)(?=Finished)(.+sync\))\n(.*?)([0-9]+ failure[s]?)(.+)(Randomized with seed [0-9]+)(.+)(Percentage \| Module.+)( [0-9]+\.[0-9]+%)( \| Total)/gs,
  mapGroupsToData: (groups) => ({
    summary: groups[2],
    tests: groups[3].slice(0, -2),
    totalFailures: parseInt(groups[4]),
    totalCoverage: parseFloat(groups[9]),
    randomizedSeed: groups[6],
    coverageTable: (groups[8] + groups[9] + groups[10]).trim(),
  }),
};

// Used for Elixir 1.17 <= x < 1.19
const parser17 = {
  pattern:
    /(Running ExUnit with seed: [0-9]+, max_cases: [0-9]+\n\n)(.+?)(?=Finished)(Finished.+sync\))\n(.*?)([0-9]+ failure[s]?)(.+?)(Percentage \| Module.+)((?:\n.+)+\n-+\|-+\n\s+([0-9]+\.[0-9]+)%\s+\|\s+Total)/s,
  mapGroupsToData: (groups) => ({
    summary: groups[3],
    tests: groups[4].slice(0, -2),
    totalFailures: parseInt(groups[5]),
    totalCoverage: parseFloat(groups[9]),
    randomizedSeed: groups[1].trim(),
    coverageTable: groups[7] + groups[8],
  }),
};

// Used for Elixir >= 1.19
const parser19 = {
  pattern:
    /(Running ExUnit with seed: [0-9]+, max_cases: [0-9]+\n\n)(.+?)\n(?=Finished)(Finished.+sync\))\n(.*?)([0-9]+ failure[s]?)(.+?)\n\n.+?\n\n(\| Percentage \| Module.+)((?:\n.+)+\n\|-+\|-+\|\n\|\s+([0-9]+\.[0-9]+)%\s+\|\s+Total)/s,
  mapGroupsToData: (groups) => ({
    summary: groups[3],
    tests: groups[4].slice(0, -2),
    totalFailures: parseInt(groups[5]),
    totalCoverage: parseFloat(groups[9]),
    randomizedSeed: groups[1].trim(),
    coverageTable: groups[7] + groups[8],
  }),
};

const detectFormat = (output) =>
  output.includes("| Percentage")
    ? "19"
    : output.includes("Running ExUnit with seed:")
      ? "17"
      : "16";

const parseData = (output, coverageThreshold) => {
  const format = detectFormat(output);
  const parser =
    format === "19" ? parser19 : format === "17" ? parser17 : parser16;

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
