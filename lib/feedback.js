const statusEmoji = (result) => (result ? ':white_check_mark:' : ':x:');

const buildComment = ({
  summary,
  randomizedSeed,
  tests,
  totalFailures,
  testsSuccess,
  coverageSuccess,
  totalCoverage,
  coverageThreshold,
  coverageTable,
}) => `
### Tests summary

${summary}
${randomizedSeed}

${statusEmoji(testsSuccess)} **${totalFailures} failures** (${tests})
${statusEmoji(coverageSuccess)} **${totalCoverage}% coverage (${coverageThreshold}% is the minimum)**

<details>
<summary>Coverage details</summary>

\`\`\`
${coverageTable}
\`\`\`

</details>
`;

const maybeCreateOrUpdateComment = async ({ actor, github, owner, repo, issueNumber, commentData }) => {
  if (actor === 'dependabot[bot]') return;
  if (!issueNumber) return;

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

module.exports = { buildComment, maybeCreateOrUpdateComment };
