// semantic-release versions the package from the conventional commit messages (ADR-015).
// The release writes its version into package.json and src/version.ts, and @semantic-release/git
// commits them, so that the tagged commit carries it. Publishing to npm is done by hand (ADR-010).
export default {
  branches: ["main", { name: "beta", prerelease: true }, { name: "alpha", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/changelog", { changelogFile: "CHANGELOG.md" }],
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
