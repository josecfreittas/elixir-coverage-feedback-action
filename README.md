# Elixir coverage feedback comment
This action gets the output of `mix test --cover`, treats it, and creates a feedback message in the pull request of origin. It also checks if the coverage reaches the minimum configured in the action, and exits with an error if it doesn't.

![image](https://user-images.githubusercontent.com/10376340/200857131-94cb2147-d703-4965-be5c-6cd6521826da.png#gh-light-mode-only)
![image](https://user-images.githubusercontent.com/10376340/200857627-8232b1de-fcbe-4b68-9f30-df2b89b61ccf.png#gh-dark-mode-only)

## Inputs
The action accepts the following inputs:

- `github_token` (required): GitHub token to be able to create/edit comments on PRs.
- `coverage_threshold` (optional): Coverage threshold percentage. Default is 90.
- `working_directory` (optional): Working directory for the Elixir project. Default is the root directory (".").


## Example of a complete test workflow using the action
`.github/workflows/test.yml`

```yaml
on:
  pull_request:
  push:
    branches:
      - main

jobs:
  test:
    name: Tests & Checks
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    env:
      MIX_ENV: test

    services:
      db:
        image: postgres:15-alpine
        ports: ["5432:5432"]
        env:
          POSTGRES_DB: project_test
          POSTGRES_USER: project
          POSTGRES_PASSWORD: mycoolpassword

    steps:
      - uses: actions/checkout@v4

      - name: Setup Erlang and Elixir
        uses: erlef/setup-beam@v1.17
        with:
          elixir-version: "1.16.0-otp-26"
          otp-version: "26.0"

      - name: Mix and build cache
        uses: actions/cache@v4
        with:
          path: |
            deps
            _build
          key: ${{ runner.os }}-mix-${{ hashFiles('**/mix.lock') }}
          restore-keys: ${{ runner.os }}-mix-

      - name: Get dependencies
        run: mix deps.get

      - name: Code analyzers
        run: |
          mix format --check-formatted
          mix compile --warnings-as-errors

      - name: Tests & Coverage
        uses: josecfreittas/elixir-coverage-feedback-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          coverage_threshold: 80
          # working_directory: ./your_project_directory
```
