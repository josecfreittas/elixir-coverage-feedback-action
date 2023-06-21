const parsers = {
  default: (output) => {
    const pattern =
      /(.+?)(?=Finished)(.+sync\))\n([0-9]+ features[s]?, )?([0-9]+ doctest[s]?, )?([0-9]+ test[s]?, )([0-9]+ failure[s]?)(.+)(Randomized with seed [0-9]+)(.+)(Percentage \| Module.+)( [0-9]+\.[0-9]+%)( \| Total)/gs;
    const groups = pattern.exec(output);

    return {
      summary: groups[2],
      featureTests: parseInt(groups[3]),
      docTests: parseInt(groups[4]),
      totalTests: parseInt(groups[5]),
      totalFailures: parseInt(groups[6]),
      totalCoverage: parseFloat(groups[11]),
      randomizedSeed: groups[8],
      coverageTable: groups[10] + groups[11] + groups[12],
    };
  },
  excoveralls: (output) => {
    const pattern =
      /(.+?)(?=Finished)(.+sync\))\n([0-9]+ features[s]?, )?([0-9]+ doctest[s]?, )?([0-9]+ test[s]?, )([0-9]+ failure[s]?)(.+)(Randomized with seed [0-9]+)(.+)(\[TOTAL\][ ]+)([0-9]+\.[0-9]+%)(.+)/gs;
    const groups = pattern.exec(output);

    return {
      summary: groups[2],
      featureTests: parseInt(groups[3]),
      docTests: parseInt(groups[4]),
      totalTests: parseInt(groups[5]),
      totalFailures: parseInt(groups[6]),
      totalCoverage: parseFloat(groups[11]),
      randomizedSeed: groups[8],
      coverageTable: groups[9] + groups[10] + groups[11] + groups[12],
    };
  },
};

const statusEmoji = (result) => (result ? ":white_check_mark:" : ":x:");

const buildComment = ({
  summary,
  randomizedSeed,
  testsSuccess,
  featureTests,
  docTests,
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

${statusEmoji(testsSuccess)} **${featureTests || 0} feature tests, ${docTests || 0} doctests, ${totalTests} tests, ${totalFailures} failures**
${statusEmoji(coverageSuccess)} **${totalCoverage}% coverage (${coverageThreshold}% is the minimum)**

<details>
<summary>Coverage details</summary>

\`\`\`
${coverageTable}
\`\`\`

</details>
`;

const maybeCreateOrUpdateComment = async ({ github, owner, repo, issueNumber, commentData }) => {
  const newComment = buildComment(commentData);

  const comments = await github.rest.issues.listComments({ owner, repo, issue_number: issueNumber });
  const comment = comments.data.find(comment => comment.body.includes('### Tests summary'));

  if (comment) {
    await github.rest.issues.updateComment({ owner, repo, comment_id: comment.id, body: newComment });
    return;
  }

  await github.rest.issues.createComment({
    issue_number: issueNumber,
    body: newComment,
    owner,
    repo,
  });
}

module.exports = async ({ core, actor, github, context, coverageTool, coverageThreshold, workingDirectory }) => {
  const fs = require("fs");

  process.chdir(workingDirectory);

  const output = fs.readFileSync("./coverage_report.log", { encoding: "utf8", flag: "r" });
  const outputParser = parsers[coverageTool] || parsers.default;
  const data = outputParser(output);

  const coverageSuccess = data.totalCoverage >= coverageThreshold;
  const testsSuccess = data.totalFailures === 0;

  const issueNumber = context.issue.number;

  if (actor !== 'dependabot[bot]' && issueNumber) {
    await maybeCreateOrUpdateComment({
      github,
      issueNumber,
      repo: context.repo.repo,
      owner: context.repo.owner,
      commentData: {
        ...data,
        coverageThreshold,
        coverageSuccess,
        testsSuccess,
      }
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
