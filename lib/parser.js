const calculatedData = (data, coverageThreshold) => ({
  coverageSuccess: data.totalCoverage >= coverageThreshold,
  testsSuccess: data.totalFailures === 0,
});

const parser = {
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

const parseData = (output, coverageThreshold) => {
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
