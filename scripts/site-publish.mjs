// Builds the site and commits _site/ to the gh-pages branch, for publishing
// GitHub Pages from a branch instead of the Actions workflow in pages.yml.
// It only commits locally; push with `git push origin gh-pages` afterwards.
import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const branch = 'gh-pages';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const succeeds = (...args) => {
  try {
    execFileSync('git', args, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

if (git('status', '--porcelain')) {
  console.warn('Warning: working tree has uncommitted changes; they will be part of the published site.\n');
}

execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
execFileSync('npm', ['run', 'site'], { stdio: 'inherit' });

const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const source = git('rev-parse', '--short', 'HEAD');
const dir = await mkdtemp(join(tmpdir(), 'pickle-gh-pages-'));

try {
  // Start from the local branch, else the remote one, else a fresh orphan branch.
  if (!succeeds('rev-parse', '--verify', '--quiet', branch)) {
    if (succeeds('fetch', 'origin', `${branch}:${branch}`)) {
      console.log(`Fetched ${branch} from origin.`);
    }
  }

  if (succeeds('rev-parse', '--verify', '--quiet', branch)) {
    git('worktree', 'add', dir, branch);
  } else {
    git('worktree', 'add', '--detach', dir);
    git('-C', dir, 'checkout', '--orphan', branch);
  }

  for (const entry of await readdir(dir)) {
    if (entry !== '.git') await rm(join(dir, entry), { recursive: true, force: true });
  }
  await cp('_site', dir, { recursive: true });
  // Serve the files as-is instead of running them through Jekyll.
  await writeFile(join(dir, '.nojekyll'), '');

  git('-C', dir, 'add', '--all');
  if (git('-C', dir, 'status', '--porcelain')) {
    git('-C', dir, 'commit', '--quiet', '-m', `docs: publish site for v${version} (${source})`);
    console.log(`\nCommitted site for v${version} (${source}) to ${branch}.`);
    console.log(`Push it with: git push origin ${branch}`);
  } else {
    console.log(`\n${branch} is already up to date; nothing to commit.`);
  }
} finally {
  git('worktree', 'remove', '--force', dir);
}
