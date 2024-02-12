const fs = require('fs');
const path = require('path');
const glob = require('glob');
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

    expect(output).toEqual(expected);
  });

  test('parses coverage report correctly usual cases', () => {
    const files = glob.sync(path.join(__dirname, '../fixtures/*'));
    files.forEach(file => {
      const fixture = fs.readFileSync(file, 'utf8');
      const output = parser(fixture, 80);

      const summaryFormat = /^Finished in [0-9.]+ seconds \([0-9.]+s async, [0-9.]+s sync\)$/;
      expect(output.summary).toMatch(summaryFormat);

      const seedFormat = /^Randomized with seed [0-9]+$/;
      expect(output.randomizedSeed).toMatch(seedFormat);
      expect(Number.isInteger(output.totalFailures)).toBe(true);
      expect(typeof output.totalCoverage).toBe('number');
    });
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

    expect(output).toEqual("Error parsing coverage report");
  });
});
