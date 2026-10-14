// semantic-release versions the package from the conventional commit messages (ADR-015), with the
// same rules and release notes as https://github.com/smarter-sh/smarter-chat's. It runs on each push
// to main, and to alpha and beta, whose releases are prereleases (.github/workflows/pushMain.yml).
// The release writes its version into package.json and src/version.ts, and @semantic-release/git
// commits them, so that the tagged commit carries it. Publishing to npm is done by hand, with
// `make release` (ADR-010).
export default {
  branches: ["main", { name: "beta", prerelease: true }, { name: "alpha", prerelease: true }],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { type: "docs", release: false },
          { type: "test", release: false },
          { type: "style", release: false },
          { type: "refactor", release: false },
        ],
        parserOpts: {
          noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES"],
        },
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            { type: "feat", section: "Features", hidden: false },
            { type: "fix", section: "Bug Fixes", hidden: false },
            { type: "refactor", section: "Refactoring", hidden: false },
            { type: "perf", section: "Performance", hidden: false },
          ],
        },
      },
    ],
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
        changelogTitle: `# Change Log\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).\n\n`,
      },
    ],
    [
      "@semantic-release/exec",
      {
        prepareCmd:
          "npm version --no-git-tag-version --allow-same-version ${nextRelease.version} && " +
          "printf '// DO NOT EDIT.\\n// Managed via automated CI/CD in release.config.js.\\n/** The SDK'\"'\"'s version. */\\nexport const VERSION = \"%s\";\\n' '${nextRelease.version}' > src/version.ts",
      },
    ],
    "@semantic-release/github",
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json", "package-lock.json", "src/version.ts"],
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
};
