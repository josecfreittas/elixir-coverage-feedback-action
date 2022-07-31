const fs = require("fs");
const coverageCacheDir = "elixir-coverage-feedback-action";

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

const coverageDiff = ({ runId, previousCoverage }, currentCoverage, defaultBranch, repoUrl) => {
  if (!previousCoverage) return "";

  const valueDiff = currentCoverage - previousCoverage;
  const diffEmoji = previousCoverage == currentCoverage ? ":ok:" : previousCoverage < currentCoverage ? ":arrow_up:" : ":arrow_down:";
  const diffLabel = valueDiff == 0 ? "remained the same" : valueDiff > 0 ? `increased (${valueDiff.toFixed(2)}%)` : `decreased (${valueDiff.toFixed(2)}%)`;

  return `${diffEmoji} **Overall coverage ${diffLabel} compared to the \`${defaultBranch}\` branch ([${previousCoverage}%]${repoUrl}/runs/${runId}))**`;
};

const buildComment = ({
  summary,
  randomizedSeed,
  testsSuccess,
  totalTests,
  totalFailures,
  coverageSuccess,
  totalCoverage,
  defaultBranch,
  repoUrl,
  previousCoverage,
  coverageThreshold,
  coverageTable,
}) => `
### Tests summary

${summary}
${randomizedSeed}

${statusEmoji(testsSuccess)} **${totalTests} tests, ${totalFailures} failures**
${statusEmoji(coverageSuccess)} **${totalCoverage}% coverage (${coverageThreshold}% is the minimum)**
${coverageDiff(previousCoverage, totalCoverage, defaultBranch, repoUrl)}

<details>
<summary>Coverage details</summary>

\`\`\`
${coverageTable}
\`\`\`

</details>
`;

const maybeCreateOrUpdateComment = async ({ github, owner, repo, issueNumber, commentData }) => {
  if (!issueNumber) {
    return;
  }

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
};

const retrievePreviousCoverage = async (defaultBranch, currentBranch, githubCache) => {
  if (defaultBranch === currentBranch) return;

  let previousCoverage;

  try {
    await githubCache.restoreCache([coverageCacheDir], coverageCacheDir);
    previousCoverage = JSON.parse(fs.readFileSync(`./${coverageCacheDir}/coverage`, "utf8"));
    console.log(`Previous coverage:`);
    console.log(previousCoverage);
  } catch { }

  return previousCoverage;
};

const saveCurrentCoverage = async (defaultBranch, currentBranch, github, owner, repo, githubCache, totalCoverage, runId) => {
  if (defaultBranch !== currentBranch) return;

  try {
    await github.rest.actions.deleteActionsCacheByKey({ owner, repo, coverageCacheDir });

    if (!fs.existsSync(`./${coverageCacheDir}`)) fs.mkdirSync(`./${coverageCacheDir}`);
    fs.writeFileSync(`./${coverageCacheDir}/coverage`, JSON.stringify({ runId, coverage: totalCoverage }));

    await githubCache.saveCache([coverageCacheDir], coverageCacheDir);
  } catch (error) { console.error(error) }
};

module.exports = async ({ core, github, runId, defaultBranch, currentBranch, githubCache, context, coverageTool, coverageThreshold }) => {

  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const output = fs.readFileSync("./coverage_report.log", { encoding: "utf8", flag: "r" });
  const outputParser = parsers[coverageTool] || parsers.default;
  const data = outputParser(output);

  const coverageSuccess = data.totalCoverage >= coverageThreshold;
  const testsSuccess = data.totalFailures === 0;

  const previousCoverage = await retrievePreviousCoverage(defaultBranch, currentBranch, githubCache);
  await saveCurrentCoverage(defaultBranch, currentBranch, github, owner, repo, githubCache, data.totalCoverage, runId);

  await maybeCreateOrUpdateComment({
    github,
    repo,
    owner,
    issueNumber: context.issue.number,
    commentData: {
      ...data,
      defaultBranch,
      repoUrl: `https://github.com/${repo}/${repo}`,
      previousCoverage,
      coverageThreshold,
      coverageSuccess,
      testsSuccess,
    }
  });

  if (!testsSuccess) {
    core.setFailed(`Tests failed.`);
    return;
  }


  if (!coverageSuccess) {
    core.setFailed(`Minimum coverage not reached.`);
    return;
  }
};
