const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { describe, test } = require('node:test');
const parser = require('../../lib/parser');

describe('parser tests', () => {
  test('parses coverage report correctly for exactly expected values with the parser', () => {
    const fixture = fs.readFileSync(path.join(__dirname, '../fixtures/success_01'), 'utf8');
    const output = parser(fixture, 80);

    const expected = {
      tests: '2 features, 38 tests',
      totalFailures: 0,
      totalCoverage: 80.43,
      summary: 'Finished in 0.06 seconds (0.03s async, 0.03s sync)',
      testsSuccess: true,
      randomizedSeed: 'Randomized with seed 188301',
      coverageSuccess: true,
      coverageTable: 'Percentage | Module\n' +
        '-----------|--------------------------\n' +
        '    25.00% | Fixture.DataCase\n' +
        '    50.00% | Fixture.Repo\n' +
        '    75.00% | Fixture.Application\n' +
        '    80.00% | FixtureWeb.Telemetry\n' +
        '   100.00% | Fixture\n' +
        '   100.00% | Fixture.Lists\n' +
        '   100.00% | Fixture.Math\n' +
        '   100.00% | Fixture.Strings\n' +
        '   100.00% | FixtureWeb\n' +
        '   100.00% | FixtureWeb.ConnCase\n' +
        '   100.00% | FixtureWeb.Endpoint\n' +
        '   100.00% | FixtureWeb.ErrorJSON\n' +
        '   100.00% | FixtureWeb.IndexController\n' +
        '   100.00% | FixtureWeb.Router\n' +
        '-----------|--------------------------\n' +
        '    80.43% | Total'
    };

    assert.deepEqual(output, expected);
  });

  test('parses coverage report correctly usual cases', () => {
    const fixturesDirectory = path.join(__dirname, '../fixtures');
    fs.readdirSync(fixturesDirectory).forEach(filename => {
      const file = path.join(fixturesDirectory, filename);
      const fixture = fs.readFileSync(file, 'utf8');
      const output = parser(fixture, 80);

      // Format for Elixir versions before 1.17
      const oldSeedFormat = /^Randomized with seed [0-9]+$/;

      // Format for Elixir versions 1.17 and later
      const newSeedFormat = /^Running ExUnit with seed: [0-9]+(?:, max_cases: [0-9]+)?$/;

      assert.ok(oldSeedFormat.test(output.randomizedSeed) || newSeedFormat.test(output.randomizedSeed));

      assert.ok(Number.isInteger(output.totalFailures));
      assert.equal(typeof output.totalCoverage, 'number');
    });
  });

  [
    {
      fixture: 'success_05',
      tests: '1 doctest, 1 test',
      totalFailures: 0,
    },
    {
      fixture: 'success_06',
      tests: '2 passed (1 doctest, 1 test)',
      totalFailures: 0,
    },
    {
      fixture: 'failure_03',
      tests: '1/2 passed (1/1 doctest, 0/1 test)',
      totalFailures: 1,
    },
  ].forEach(({ fixture, tests, totalFailures }) => {
    test(`parses ${fixture}`, () => {
      const output = parser(
        fs.readFileSync(path.join(__dirname, `../fixtures/${fixture}`), 'utf8'),
        90
      );

      assert.equal(output.tests, tests);
      assert.equal(output.totalFailures, totalFailures);
      assert.equal(output.testsSuccess, totalFailures === 0);
      assert.equal(output.totalCoverage, 100);
      assert.equal(output.coverageSuccess, true);
    });
  });

  test('derives Elixir 1.20 failures from the result fraction', () => {
    const fixture = fs
      .readFileSync(path.join(__dirname, '../fixtures/failure_03'), 'utf8')
      .replace('Failed: 1 test\n', '');
    const output = parser(fixture, 90);

    assert.equal(output.totalFailures, 1);
    assert.equal(output.testsSuccess, false);
  });

  test('parses coverage report correctly for unusual cases', () => {
    const fixture = '== Compilation error in file test/fixture/math_test.exs ==\n' +
      '** (TokenMissingError) test/fixture/math_test.exs:65:1: missing terminator: end (for "do" starting at line 1)\n' +
      '\n' +
      '    HINT: it looks like the "do" on line 5 does not have a matching "end"\n' +
      '\n' +
      '    (elixir 1.14.4) lib/kernel/parallel_compiler.ex:449: Kernel.ParallelCompiler.require_file/2\n' +
      '    (elixir 1.14.4) lib/kernel/parallel_compiler.ex:342: anonymous fn/5 in Kernel.ParallelCompiler.spawn_workers/7';

    const output = parser(fixture);

    assert.equal(output, "Error parsing coverage report");
  });
});
