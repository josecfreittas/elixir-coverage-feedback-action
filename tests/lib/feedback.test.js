const { buildComment, maybeCreateOrUpdateComment } = require('../../lib/feedback');
const fetchMock = require('jest-fetch-mock');
const { GitHub } = require('@actions/github');

jest.mock('@actions/github', () => ({
  GitHub: jest.fn().mockImplementation(() => ({
    rest: {
      issues: {
        listComments: jest.fn(),
        updateComment: jest.fn(),
        createComment: jest.fn(),
      },
    },
  })),
}));

describe('feedback.js', () => {
  beforeEach(() => fetchMock.resetMocks());

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

      expect(buildComment(commentData)).toEqual(expectedComment);
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
  
      expect(buildComment(commentData)).toEqual(expectedComment);
    });
  });

  describe('maybeCreateOrUpdateComment', () => {
    let github;
    let params;

    beforeEach(() => {
      github = new GitHub();

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
      github.rest.issues.listComments.mockResolvedValueOnce({ data: [] });

      await maybeCreateOrUpdateComment(params);
      expect(github.rest.issues.listComments).toHaveBeenCalledTimes(1);
      expect(github.rest.issues.createComment).toHaveBeenCalledTimes(1);
    });

    it('should call listComments and updateComment if the comment exists', async () => {
      github.rest.issues.listComments.mockResolvedValueOnce({ data: [{ id: 1, body: '### Tests summary' }] });

      await maybeCreateOrUpdateComment(params);
      expect(github.rest.issues.listComments).toHaveBeenCalledTimes(1);
      expect(github.rest.issues.updateComment).toHaveBeenCalledTimes(1);
    });

    it('should not call listComments, createComment, or updateComment if issueNumber is invalid', async () => {
      params.issueNumber = null;

      await maybeCreateOrUpdateComment(params);
      expect(github.rest.issues.listComments).not.toHaveBeenCalled();
      expect(github.rest.issues.createComment).not.toHaveBeenCalled();
      expect(github.rest.issues.updateComment).not.toHaveBeenCalled();
    });

    it('should not call listComments, createComment, or updateComment if actor is "dependabot[bot]"', async () => {
      params.actor = 'dependabot[bot]';

      await maybeCreateOrUpdateComment(params);
      expect(github.rest.issues.listComments).not.toHaveBeenCalled();
      expect(github.rest.issues.createComment).not.toHaveBeenCalled();
      expect(github.rest.issues.updateComment).not.toHaveBeenCalled();
    });
  });
});
