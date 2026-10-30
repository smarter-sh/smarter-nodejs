SHELL := /bin/bash
# The developer's shell may export NODE_ENV=production, which makes npm skip devDependencies.
NPM_INSTALL := npm install --include=dev
# pre-commit runs from a Python virtual environment in venv/, made by make python-init.
PYTHON := python3.13
PRE_COMMIT := venv/bin/pre-commit

.PHONY: all init clean build test coverage test-live lint typecheck pre-commit-init pre-commit-run python-init contracts sam-models reference release help

all: help

init:
	$(NPM_INSTALL)
	$(MAKE) python-init

# Creates venv/ with pre-commit, and installs the pre-commit and commit-msg hooks. See .pre-commit-config.yaml.
python-init:
	$(PYTHON) -m venv venv
	venv/bin/pip install --upgrade pip
	venv/bin/pip install -r requirements/local.txt
	$(PRE_COMMIT) install

clean:
	rm -rf node_modules dist build coverage venv

build:
	npm run build
	npm pack --dry-run
	npx publint

test:
	npx vitest run

coverage:
	npx vitest run --coverage

# Test the SDK against a running Smarter platform, e.g. the local one:
# SMARTER_BASE_URL=http://localhost:9357 SMARTER_API_KEY=... make test-live
# These prompt an LLMClient, which makes billable LLM requests.
test-live:
	SMARTER_TEST_LIVE=true npx vitest run test/live

typecheck:
	npx tsc --noEmit

lint:
	$(PRE_COMMIT) run --all-files

pre-commit-init:
	$(PRE_COMMIT) install
	$(PRE_COMMIT) autoupdate

pre-commit-run:
	$(PRE_COMMIT) run --all-files

# Copy the platform's api contracts from ../smarter: the chat and journal contracts, the SAM schemas
# and examples, and the api's OpenAPI document. A ref reads them at a commit or tag, e.g.
# make contracts SMARTER_REF=v0.22.2
contracts:
	scripts/sync-contracts.sh ../smarter $(SMARTER_REF)

# Regenerate src/models/sam/ from the platform's committed JSON Schemas.
sam-models: contracts
	npm run sam-models

# The api reference, into the platform's Sphinx docs in ../smarter.
reference:
	npm run reference

# Publish the npm package, @smarter.sh/api (https://www.npmjs.com/package/@smarter.sh/api), by hand,
# once the tests pass. pushMain.yml publishes every release on its own: this is only for when it
# can't, e.g. the package's very first version, before its trusted publisher can be configured on
# npmjs.com. Run it on main, after semantic-release has versioned the release and you have pulled its
# commit. prepublishOnly builds dist/ first. npm reads the token of an account that may publish to
# the @smarter.sh scope from .npmrc (gitignored) or ~/.npmrc.
release: test build
	git rev-parse --abbrev-ref HEAD | grep '^main$$' || (echo 'Not on main branch, aborting' && exit 1)
	npm publish --access public

help:
	@echo '===================================================================='
	@echo 'init          - install the dependencies and the pre-commit hooks'
	@echo 'python-init   - create venv/ with pre-commit, and install the pre-commit and commit-msg hooks'
	@echo 'clean         - delete node_modules, venv/ and the build output'
	@echo 'build         - build dist/, and check the package'
	@echo 'test          - run the unit tests'
	@echo 'coverage      - run the unit tests with coverage'
	@echo 'test-live     - test against a running Smarter platform (SMARTER_BASE_URL, SMARTER_API_KEY)'
	@echo 'typecheck     - type-check the source and the tests'
	@echo 'lint          - run every pre-commit hook on every file'
	@echo 'contracts     - copy the api contracts, SAM schemas and OpenAPI document from ../smarter'
	@echo 'sam-models    - copy the contracts, and regenerate the SAM types from their schemas'
	@echo 'reference     - generate the api reference into ../smarter/docs'
	@echo 'release       - run the tests, then publish the package to npm'
	@echo '===================================================================='
