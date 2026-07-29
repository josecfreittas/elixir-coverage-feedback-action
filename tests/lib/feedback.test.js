const assert = require('node:assert/strict');
const { beforeEach, describe, it, mock } = require('node:test');
const { buildComment, maybeCreateOrUpdateComment } = require('../../lib/feedback');

describe('feedback.js', () => {
  describe('buildComment', () => {
    it('should correctly format the comment', () => {
      const commentData = {
        summary: 'Finished in 0.05 seconds (0.03s async, 0.02s sync)',
        randomizedSeed: 1234,
        tests: '5 property tests, 20 feature tests, 10 doctests, 30 tests',
        totalFailures: 0,
        testsSuccess: true,
        coverageSuccess: true,
        totalCoverage: 100,
        coverageThreshold: 90,
        coverageTable: 'Some coverage data',
      };

      const expectedComment =
        '\n### Tests summary\n' +
        '\n' +
        'Finished in 0.05 seconds (0.03s async, 0.02s sync)\n' +
        '1234\n' +
        '\n' +
        ':white_check_mark: **0 failures** (5 property tests, 20 feature tests, 10 doctests, 30 tests)\n' +
        ':white_check_mark: **100% coverage (90% is the minimum)**\n' +
        '\n' +
        '<details>\n' +
        '<summary>Coverage details</summary>\n' +
        '\n' +
        '```\n' +
        'Some coverage data\n' +
        '```\n' +
        '\n' +
        '</details>\n';

      assert.equal(buildComment(commentData), expectedComment);
    });

    it('should correctly format the comment for failure scenario', () => {
      const commentData = {
        summary: 'Finished in 0.05 seconds (0.03s async, 0.02s sync)',
        randomizedSeed: 4321,
        tests: '5 property tests, 20 feature tests, 10 doctests, 30 tests',
        totalFailures: 7,
        testsSuccess: false,
        coverageSuccess: false,
        totalCoverage: 80,
        coverageThreshold: 90,
        coverageTable: 'Some coverage data',
      };
  
      const expectedComment =
        '\n### Tests summary\n' +
        '\n' +
        'Finished in 0.05 seconds (0.03s async, 0.02s sync)\n' +
        '4321\n' +
        '\n' +
        ':x: **7 failures** (5 property tests, 20 feature tests, 10 doctests, 30 tests)\n' +
        ':x: **80% coverage (90% is the minimum)**\n' +
        '\n' +
        '<details>\n' +
        '<summary>Coverage details</summary>\n' +
        '\n' +
        '```\n' +
        'Some coverage data\n' +
        '```\n' +
        '\n' +
        '</details>\n';
  
      assert.equal(buildComment(commentData), expectedComment);
    });
  });

  describe('maybeCreateOrUpdateComment', () => {
    let github;
    let params;

    beforeEach(() => {
      github = {
        rest: {
          issues: {
            listComments: mock.fn(),
            updateComment: mock.fn(),
            createComment: mock.fn(),
          },
        },
      };

      params = {
        actor: 'not-dependabot',
        github,
        owner: 'test',
        repo: 'test',
        issueNumber: 123,
        commentData: {},
      };
    });

    it('should call listComments and createComment if there is a new comment', async () => {
      github.rest.issues.listComments = mock.fn(async () => ({ data: [] }));

      await maybeCreateOrUpdateComment(params);
      assert.equal(github.rest.issues.listComments.mock.callCount(), 1);
      assert.equal(github.rest.issues.createComment.mock.callCount(), 1);
    });

    it('should call listComments and updateComment if the comment exists', async () => {
      github.rest.issues.listComments = mock.fn(async () => ({
        data: [{ id: 1, body: '### Tests summary' }],
      }));

      await maybeCreateOrUpdateComment(params);
      assert.equal(github.rest.issues.listComments.mock.callCount(), 1);
      assert.equal(github.rest.issues.updateComment.mock.callCount(), 1);
    });

    it('should not call listComments, createComment, or updateComment if issueNumber is invalid', async () => {
      params.issueNumber = null;

      await maybeCreateOrUpdateComment(params);
      assert.equal(github.rest.issues.listComments.mock.callCount(), 0);
      assert.equal(github.rest.issues.createComment.mock.callCount(), 0);
      assert.equal(github.rest.issues.updateComment.mock.callCount(), 0);
    });

    it('should not call listComments, createComment, or updateComment if actor is "dependabot[bot]"', async () => {
      params.actor = 'dependabot[bot]';

      await maybeCreateOrUpdateComment(params);
      assert.equal(github.rest.issues.listComments.mock.callCount(), 0);
      assert.equal(github.rest.issues.createComment.mock.callCount(), 0);
      assert.equal(github.rest.issues.updateComment.mock.callCount(), 0);
    });
  });
});
