const parseData = (output, coverageThreshold) => {
  const lines = output.split('\n');
  const summaryIndex = lines.findIndex(line => line.startsWith('Finished '));
  const testResult = lines.slice(summaryIndex + 1).find(line => line.trim());
  const randomizedSeed = lines.find(line =>
    line.startsWith('Randomized with seed ') ||
    line.startsWith('Running ExUnit with seed:')
  );
  const coverageStart = lines.findIndex(line => line.includes('Percentage | Module'));
  const coverageEnd = lines.findIndex((line, index) =>
    index >= coverageStart && /\|\s*Total\s*\|?$/.test(line)
  );
  const totalCoverage = lines[coverageEnd]?.match(/^\|?\s*([0-9.]+)%\s*\|\s*Total\s*\|?$/)?.[1];

  if (
    summaryIndex < 0 ||
    !testResult ||
    !randomizedSeed ||
    coverageStart < 0 ||
    coverageEnd < 0 ||
    !totalCoverage
  ) {
    return 'Error parsing coverage report';
  }

  const isResultFormat = testResult.startsWith('Result: ');
  const resultMatch = testResult.match(/^Result: (?:([0-9]+)\/([0-9]+)|[0-9]+) passed/);
  const failureMatch = testResult.match(/([0-9]+) failures?/);

  if (isResultFormat && !resultMatch) return 'Error parsing coverage report';
  if (!isResultFormat && !failureMatch) return 'Error parsing coverage report';

  let totalFailures = 0;
  if (isResultFormat && resultMatch[2]) {
    totalFailures = parseInt(resultMatch[2]) - parseInt(resultMatch[1]);
  }
  if (!isResultFormat) totalFailures = parseInt(failureMatch[1]);
  const tests = isResultFormat
    ? testResult.slice('Result: '.length)
    : testResult.replace(/, [0-9]+ failures?.*$/, '');

  return {
    summary: lines[summaryIndex],
    tests,
    totalFailures,
    totalCoverage: parseFloat(totalCoverage),
    randomizedSeed,
    coverageTable: lines.slice(coverageStart, coverageEnd + 1).join('\n'),
    testsSuccess: totalFailures === 0,
    coverageSuccess: parseFloat(totalCoverage) >= coverageThreshold,
  };
};

module.exports = parseData;
