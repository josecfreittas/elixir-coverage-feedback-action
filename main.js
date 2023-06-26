const { readFileSync } = require('fs');
const parsers = require('./lib/parsers');
const { maybeCreateOrUpdateComment } = require('./lib/feedback')

const parsedData = (coverageTool, coverageThreshold) => {
  const output = readFileSync('./coverage_report.log', { encoding: 'utf8', flag: 'r' });
  const outputParser = parsers[coverageTool] || parsers;
  return outputParser(output, coverageThreshold);
};

module.exports = async ({ core, actor, github, context, coverageTool, coverageThreshold, workingDirectory }) => {
  process.chdir(workingDirectory);

  const result = parsedData(coverageTool, coverageThreshold);
  if (result === 'Error parsing coverage report') return core.setFailed(result)

  await maybeCreateOrUpdateComment({
    actor,
    github,
    issueNumber: context.issue.number,
    repo: context.repo.repo,
    owner: context.repo.owner,
    commentData: { ...result, coverageThreshold }
  });

  if (!result.testsSuccess) return core.setFailed('Tests failed.');
  if (!result.coverageSuccess) return core.setFailed('Minimum coverage not reached.');
};
