const { readFileSync, writeFileSync, existsSync } = require('fs');
const { maybeCreateOrUpdateComment } = require('./lib/feedback')
const parser = require('./lib/parser');

const parsedData = (coverageThreshold) => {
  const output = readFileSync('./coverage_report.log', { encoding: 'utf8', flag: 'r' });
  return parser(output, coverageThreshold);
};

const getCachedCoverage = () => {
  if (existsSync('.coverage-cache')) {
    return JSON.parse(readFileSync('.coverage-cache', 'utf8'));
  }
  return null;
};

const setCachedCoverage = (coverage) => {
  writeFileSync('.coverage-cache', JSON.stringify(coverage));
};

module.exports = async ({ core, actor, github, context, coverageThreshold, workingDirectory }) => {
  process.chdir(workingDirectory);

  const result = parsedData(coverageThreshold);
  if (result === 'Error parsing coverage report') return core.setFailed(result)

  const cachedCoverage = getCachedCoverage();

  console.log("cachedCoverage vvvvvvv:");
  console.log(cachedCoverage);

  // Cache the current coverage
  setCachedCoverage({ commit: context.sha, coverage: result.totalCoverage });

  let comparisonMessage = '';
  if (cachedCoverage) {
    const difference = result.totalCoverage - cachedCoverage.coverage;
    comparisonMessage = `\nCoverage change: ${difference.toFixed(2)}% (compared to commit ${cachedCoverage.commit.substring(0, 7)})`;
  }

  await maybeCreateOrUpdateComment({
    actor,
    github,
    issueNumber: context.issue.number,
    repo: context.repo.repo,
    owner: context.repo.owner,
    commentData: { ...result, coverageThreshold, comparisonMessage }
  });

  if (!result.testsSuccess) return core.setFailed('Tests failed.');
  if (!result.coverageSuccess) return core.setFailed('Minimum coverage not reached.');
};
