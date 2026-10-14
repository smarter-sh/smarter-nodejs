# Contributing

This repository is released under the GNU Affero General Public License v3, and
follows a standard GitHub development process. We use the GitHub tracker for
issues, and merge pull requests into the `alpha` branch, from which they are
promoted to `beta` and `main`.

## Project Structure

The Smarter Node.js SDK, written in TypeScript: the client and its transport in
`src/core/`, one module per resource family in `src/resources/`, the models in
`src/models/` (the SAM types in `src/models/sam/` are generated), and the tests
in `test/`. The architecture decisions are in [doc/adr/](../doc/adr/), and
[CLAUDE.md](../CLAUDE.md) and [skills/](../skills/) describe how the repository
is developed, for people and for AI coding agents.

## How to Contribute

1. **Fork the Repository**, and clone it locally. Run `make init`.
2. **Create a Branch** for each issue you work on.
3. **Make Your Changes**, following an existing pattern, the ADRs, and the
   behavior of the [Python SDK](https://github.com/smarter-sh/smarter-python),
   which is the reference implementation. Add tests, and run `make test`.
4. **Commit Your Changes** with [Conventional Commits](https://www.conventionalcommits.org/)
   messages, which semantic-release reads to version the package. The
   pre-commit hooks check the code and the messages.
5. **Push Your Changes** to your fork, and **Submit a Pull Request**.

## Code of Conduct

We expect all contributors to follow our code of conduct. Please read our
[Code of Conduct](../CODE_OF_CONDUCT.md) for details.

Thank you for considering contributing to our project!
