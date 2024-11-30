module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/github',
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
  preset: 'angular',
  releaseRules: [
    { type: 'fix', release: 'patch' },
    { type: 'perf', release: 'patch' },
    { type: 'refactor', release: 'patch' },
    { type: 'feat', release: 'minor' },
    { type: 'BREAKING CHANGE', release: 'major' },
    { type: 'WIP', release: false },
    { type: 'docs', release: false },
    { type: 'style', release: false },
    { type: 'test', release: false },
    { type: 'chore', release: false },
  ],
  tagFormat: 'v${version}',
};
