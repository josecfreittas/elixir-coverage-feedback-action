const calculatedData = (data, coverageThreshold) => ({
  coverageSuccess: data.totalCoverage >= coverageThreshold,
  testsSuccess: data.totalFailures === 0,
});

const parsersConfig = {
  default: {
    pattern: /(.+?)(?=Finished)(.+sync\))\n([0-9]+ propert(?:ies|y), )?([0-9]+ feature[s]?, )?([0-9]+ doctest[s]?, )?([0-9]+ test[s]?, )([0-9]+ failure[s]?)(.+)(Randomized with seed [0-9]+)(.+)(Percentage \| Module.+)( [0-9]+\.[0-9]+%)( \| Total)/gs,
    mapGroupsToData: (groups) => ({
      summary: groups[2],
      propertyTests: parseInt(groups[3]) || 0,
      featureTests: parseInt(groups[4]) || 0,
      docTests: parseInt(groups[5]) || 0,
      totalTests: parseInt(groups[6]),
      totalFailures: parseInt(groups[7]),
      totalCoverage: parseFloat(groups[12]),
      randomizedSeed: groups[9],
      coverageTable: (groups[11] + groups[12] + groups[13]).trim(),
    }),
  },
  excoveralls: {
    pattern: /(.+?)(?=Finished)(.+sync\))\n([0-9]+ propert(?:ies|y), )?([0-9]+ feature[s]?, )?([0-9]+ doctest[s]?, )?([0-9]+ test[s]?, )([0-9]+ failure[s]?)(.+)(Randomized with seed [0-9]+)(.+)(\[TOTAL\][ ]+)([0-9]+\.[0-9]+%)(.+)/gs,
    mapGroupsToData: (groups) => ({
      summary: groups[2],
      propertyTests: parseInt(groups[3]) || 0, 
      featureTests: parseInt(groups[4]) || 0,
      docTests: parseInt(groups[5]) || 0,
      totalTests: parseInt(groups[6]),
      totalFailures: parseInt(groups[7]),
      totalCoverage: parseFloat(groups[12]),
      randomizedSeed: groups[9],
      coverageTable: (groups[10] + groups[11] + groups[12] + groups[13]).trim(),
    }),
  },
};

const parseData = (parserName, output, coverageThreshold) => {
  try {
    const parser = parsersConfig[parserName] || parsersConfig.default;
    parser.pattern.lastIndex = 0;
    const groups = parser.pattern.exec(output);

    const data = parser.mapGroupsToData(groups);
    return { ...data, ...calculatedData(data, coverageThreshold) };
  } catch (e) {
    return "Error parsing coverage report";
  }
};

module.exports = {
  default: (output, coverageThreshold) => parseData('default', output, coverageThreshold),
  excoveralls: (output, coverageThreshold) => parseData('excoveralls', output, coverageThreshold)
};
