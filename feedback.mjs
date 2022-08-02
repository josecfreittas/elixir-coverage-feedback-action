import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { setFailed } from "@actions/core";
import { restoreCache, saveCache } from "@actions/cache";
import { Octokit } from "@octokit/rest";
const octokit = new Octokit({ auth: process.env.github_token });

const cache_dir = "elixir-coverage-feedback-action";
const coverage_tool = process.env.coverage_tool;
const coverage_threshold = Number(process.env.coverage_threshold);
const default_branch = process.env.default_branch;
const current_branch = process.env.current_branch;
const run_id = process.env.run_id;
const repository = process.env.GITHUB_REPOSITORY;
const issue_number = 2;
const [owner, repo] = repository.split("/");

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

const coverageDiff = (previous_coverage, current_coverage) => {
  if (!previous_coverage) return "";

  const previous_value = previous_coverage.coverage;

  const valueDiff = current_coverage - previous_value;
  const diffEmoji = previous_value == current_coverage ? ":ok:" : previous_value < current_coverage ? ":arrow_up:" : ":arrow_down:";
  const diffLabel = valueDiff == 0 ? "remained the same" : valueDiff > 0 ? `increased (${valueDiff.toFixed(2)}%)` : `decreased (${valueDiff.toFixed(2)}%)`;

  return `${diffEmoji} **Overall coverage ${diffLabel} compared to the \`${default_branch}\` branch ([${previous_value}%](https://github.com/${repository}/runs/${runId}))**`;
};

const buildComment = ({
  summary,
  randomizedSeed,
  testsSuccess,
  totalTests,
  totalFailures,
  coverageSuccess,
  totalCoverage,
  previousCoverage,
  coverageTable,
}) => `
### Tests summary

${summary}
${randomizedSeed}

${statusEmoji(testsSuccess)} **${totalTests} tests, ${totalFailures} failures**
${statusEmoji(coverageSuccess)} **${totalCoverage}% coverage (${coverage_threshold}% is the minimum)**
${coverageDiff(previousCoverage, totalCoverage)}

<details>
<summary>Coverage details</summary>

\`\`\`
${coverageTable}
\`\`\`

</details>
`;

const maybeCreateOrUpdateComment = async (commentData) => {
  if (!issue_number) return;

  const body = buildComment(commentData);

  const comments = await octokit.rest.issues.listComments({ owner, repo, issue_number: issue_number });
  const comment = comments.data.find(comment => comment.body.includes('### Tests summary'));

  if (comment) {
    await octokit.rest.issues.updateComment({ owner, repo, comment_id: comment.id, body });
    return;
  }

  await octokit.rest.issues.createComment({
    issue_number,
    owner,
    repo,
    body,
  });
};

const retrievePreviousCoverage = async () => {
  if (default_branch === current_branch) return;

  let previousCoverage;

  try {
    await restoreCache([cache_dir], cache_dir);
    previousCoverage = JSON.parse(readFileSync(`./${cache_dir}/coverage`, "utf8"));
    console.log(`Previous coverage:`);
    console.log(previousCoverage);
  } catch { }

  return previousCoverage;
};

const saveCurrentCoverage = async (totalCoverage) => {
  if (default_branch !== current_branch) return;

  try {
    await octokit.rest.actions.deleteActionsCacheByKey({ owner, repo, cache_dir });

    if (!existsSync(`./${cache_dir}`)) mkdirSync(`./${cache_dir}`);
    writeFileSync(`./${cache_dir}/coverage`, JSON.stringify({ run_id, coverage: totalCoverage }));

    await saveCache([cache_dir], cache_dir);
  } catch (error) { console.error(error) }
};

const output = readFileSync("./coverage_report.log", { encoding: "utf8", flag: "r" });
const outputParser = parsers[coverage_tool] || parsers.default;
const data = outputParser(output);

const coverageSuccess = data.totalCoverage >= coverage_threshold;
const testsSuccess = data.totalFailures === 0;

const previousCoverage = await retrievePreviousCoverage();
await saveCurrentCoverage(data.totalCoverage);

await maybeCreateOrUpdateComment({
  commentData: {
    ...data,
    previousCoverage,
    coverageSuccess,
    testsSuccess,
  }
});

if (!testsSuccess) {
  setFailed(`Tests failed.`);
} else if (!coverageSuccess) {
  setFailed(`Minimum coverage not reached.`);
}
