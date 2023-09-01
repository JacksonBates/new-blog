---
title: 'Fixing the fatal: not a git repository error on terminal start-up'
date: '2023-08-31T14:00:00.000Z'
tags:
  - noodling
---

I tiny paper cut I've had for a while is that every time I start up the terminal (iTerm2, to be exact), I get a pesky error message before I've even done anything:

`fatal: not a git repository (or any of the parent directories): .git`

I use oh-my-zsh and I was aware it was somewhat related to that, but when I decided to dig into it the actual cause was my own trying to be clever.

The reason you see this error message usually is that you are trying to run a git related command in a directory that doesn't have a `.git` directory in it.

Launching straight into your $HOME directory, which is hopefully not a git repo in its own right, and running `git status` for example would show this same error.

If you see it on terminal start up, it means that something in the background is trying to call a git function. Likely candidates are your `.bashrc` or `.zshrc` depending on what you prefer.

The culprit in may case was a little alias I'd added which deletes all local git branches except the `master` branch and whatever current branch I'm on:

`alias branch-prune="git branch -D $(git branch | grep -v 'master\|*')"`

The real problem here is `$(git ...)` which use command substitution to fill in the details of the branches I want to delete. The command substitution runs the git command, even when only used in an alias...which I didn't realise!

To fix this, I added the same logic but as a little function (in a small custom plugin for Oh My Zsh instead):

```shell
function branch-prune() {
  3   git branch - D $(git branch | grep - v 'master\|*')
  4
}
```

This does the same thing, but only runs the offending command substitution when I need it, not on start up.
