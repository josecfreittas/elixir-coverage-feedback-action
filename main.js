const { readFileSync } = require('fs');
const parser = require('./lib/parser');
const { maybeCreateOrUpdateComment } = require('./lib/feedback')

const parsedData = (coverageThreshold) => {
  const output = readFileSync('./coverage_report.log', { encoding: 'utf8', flag: 'r' });
  return parser(output, coverageThreshold);
};

module.exports = async ({ core, actor, github, context, coverageThreshold, workingDirectory }) => {
  process.chdir(workingDirectory);

  const result = parsedData(coverageThreshold);
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
