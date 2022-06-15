const parsers = {
  default: (output) => {
    const pattern =
      /(.+?)(?=Finished)(.+sync\))(\n[0-9]+ test[s]?, )([0-9]+ failure[s]?)(.+)(Randomized with seed [0-9]+)(.+)(Percentage \| Module.+)( [0-9]+\.[0-9]+%)( \| Total)/gs;
    const groups = pattern.exec(output);

    return {
      summary: groups[2],
      totalTests: parseInt(groups[3]),
      totalFailures: parseInt(groups[4]),
      totalCoverage: parseFloat(groups[9]),
      randomizedSeed: groups[6],
      coverageTable: groups[8] + groups[9] + groups[10],
    };
  },
  excoveralls: (output) => {
    const pattern =
      /(.+?)(?=Finished)(.+sync\))(\n[0-9]+ test[s]?, )([0-9]+ failure[s]?)(.+)(Randomized with seed [0-9]+)(.+)(\[TOTAL\][ ]+)([0-9]+\.[0-9]+%)(.+)/gs;
    const groups = pattern.exec(output);

    return {
      summary: groups[2],
      totalTests: parseInt(groups[3]),
      totalFailures: parseInt(groups[4]),
      totalCoverage: parseFloat(groups[9]),
      randomizedSeed: groups[6],
      coverageTable: groups[7] + groups[8] + groups[9] + groups[10],
    };
  },
};

const statusEmoji = (result) => (result ? ":white_check_mark:" : ":x:");

const buildComment = ({
  summary,
  randomizedSeed,
  testsSuccess,
  totalTests,
  totalFailures,
  coverageSuccess,
  totalCoverage,
  coverageThreshold,
  coverageTable,
}) => `
### Tests summary

${summary}
${randomizedSeed}

${statusEmoji(testsSuccess)} **${totalTests} tests, ${totalFailures} failures**
${statusEmoji(coverageSuccess)} **${totalCoverage}% coverage (${coverageThreshold}% is the minimum)**

<details>
<summary>Coverage details</summary>

\`\`\`
${coverageTable}
\`\`\`

</details>
`;

module.exports = async ({ core, github, context, coverageTool, coverageThreshold }) => {
  const fs = require("fs");

  const output = fs.readFileSync("./coverage_report.log", { encoding: "utf8", flag: "r" });
  const outputParser = parsers[coverageTool] || parsers.default;
  const data = outputParser(output);

  const coverageSuccess = data.totalCoverage >= coverageThreshold;
  const testsSuccess = data.totalFailures === 0;

  const comment = buildComment({
    ...data,
    coverageThreshold,
    coverageSuccess,
    testsSuccess,
  });

  if (context.issue.number) {
    await github.rest.issues.createComment({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: comment,
    });
  }

  if (!testsSuccess) {
    core.setFailed(`Tests failed.`);
    return;
  }

  if (!coverageSuccess) {
    core.setFailed(`Minimum coverage not reached.`);
    return;
  }
};
