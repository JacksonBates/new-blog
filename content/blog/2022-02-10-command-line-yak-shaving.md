---
title: Command Line Yak Shaving
date: '2022-02-10T00:00:00.000Z'
tags:
  - noodling
description: Mastering the art of yak shaving one command line utility at a time.
rss_only: false
---

One of the impulses I love as a programmer is the occasional discovering of a minor irritation and then wondering if you can use some code / computer tool to solve it.

I don't know if it's a universal feeling amongst programmers, but I'd wager it's present to some degree in most of us.

Today I found myself clicking on the little red-circle-x in the top right corner of half a dozen open zsh terminals.

I have this habit of quickly spawning terminals with `ctrl + alt + T` to run quick tasks - editing a config in vim, running a script that toggles my monitor set up, that kind of thing. But I rarely close them when done.

Closing them means alt-tabbing to find them and then clicking them closed (or writing `exit` in them, usually).

So I started to wonder if it was possible to close all idle terminals in a single command.

Of course you can just kill the gnome-terminal-server process, but that will also kill things that are still running, like `yarn start`, `htop`, or anything else that persists in the foreground.

It took some exploration and bouncing ideas around with [Shane](https://twitter.com/SaturniusMons "") on Twitter, but I got there.

So to figure this out I did the following:

1. Spawn a bunch of terminals, some with programs running in foreground
2. View the processes and look for clues
3. Read the man page for ps to make sense of it
4. ???
5. Profit!

To test the terminals I spawned a few and ran `htop` in one of them. Easy.

This is some of the output from `ps a`:

```shell
1355005 pts / 1    Ss+ 0:00 - zsh
1355347 pts / 2    Ss  0:00 - zsh
1355733 pts / 2    S+  0:11 htop
1355745 pts / 3    Ss+ 0:00 - zsh
1356086 pts / 4    Ss  0:00 - zsh
1356594 pts / 4    R + 0:00 ps a
```

So my first attempt, inspired by Shane, was to `grep` for the running instances, `cut` the process ids, and then pipe those to the `kill -9` command.

I tried something like this:

`ps a | grep -e \-zsh | cut -d\ -f1 | xargs kill -9\`

Which is not half bad, but has some errors.

Firstly, what does that crap even mean?

`ps a` gives us the processes we saw above.

`grep` is a tool most command line users are familiar with - it allows us to search for a pattern in some text or output. In this case I piped the `ps` output to `grep` - the `|` character is the pipe; it passes the output of one command straight to the next one.

`grep` takes a pattern, which can be plain text, but in this instance I used the `-e` flag which means the pattern can be formatted as regex. I did this to escape the `-` character, which `grep` would read as a command flag otherwise.

Now `cut` is where you start to get into command line wizardry territory. (Not `awk` level wizardry, mind). It's simple, but it took me a few years before I started to learn about it and understand it's potential.

`cut` lets us cut out a part of a line according to a delimiter we set, and a field we specify. So in `cut -d\ -f1` I'm essentially saying use a single space as the delimiter and pick the first field, i.e. just the pid.

All of that together so far produces the following:

```shell
1355005
1355347
1355745
1356086
1356837
1357566
```

Nice!

Now, `xargs` is more wizardry, and where the real magic happens. `xargs`, which sounds like something a robot pirate might say, is used to build commands from standard input. Essentially we can take lines that are piped from another command and use the value as the parameter for another command.

So `...previous commands...| xargs kill -9` is like doing:

```shell
kill -9 1355005
kill -9 1355347
kill -9 1355745
kill -9 1356086
kill -9 1356837
kill -9 1357566
```

So why doesn't that work?

Well, firstly, grep has this annoying habit of showing up as a result in its own search:

```shell
1356837 pts/5    Ss     0:00 -zsh
1357838 pts/5    S+     0:00 grep --color=auto --exclude-dir=.bzr --exclude-dir=CVS --exclude-dir=.git --exclude-dir=.hg --exclude-dir=.svn --exclude-dir=.idea --exclude-dir=.tox -e -zsh
```

That last one is not a result we need.

So to get grep to filter itself out, you can pipe the result of the first grep to another grep that inverts its search results.

`grep -e \-zsh | grep -v grep`

The `grep -v grep` bit means find everything that doesn't contain the pattern 'grep'

So now we can try `ps a | grep -e \-zsh | grep -v grep | cut -d\ -f1 | xargs kill -9\`

This almost works...except it kills all the terminals, even the ones running `htop` or other process in the foreground.

Upon reading the man page for `ps` more closely, I found you can get a nicely formatted process tree like with `ps f` like this:

```shell
PID     TTY      STAT   TIME COMMAND
1356837 pts/5    Ss     0:00 -zsh
1357926 pts/5    R+     0:00  _ ps f
1356086 pts/4    Ss+    0:00 -zsh
1355745 pts/3    Ss+    0:00 -zsh
1355347 pts/2    Ss     0:00 -zsh
1355733 pts/2    S+     1:03  _ htop
1355005 pts/1    Ss+    0:00 -zsh
```

So now we can see that terminals running the command are identifiable in this view, at least. This also caused me to notice the STAT column. The idle terminals all had the same STAT in common: `Ss+`.

Again, reading the man page confirmed my suspicion:

PROCESS STATE CODES - truncated for our purposes...
S    interruptible sleep (waiting for an event to complete)
s    is a session leader

* is in the foreground process group

So `Ss+` shows us interruptible, foregrounded, session leaders. i.e. idle zsh sessions, not running anything, safe to kill.

With this, I amended the first `grep` pattern to include the `Ss+` string: `grep -e Ss+.*\-zsh`

Remember, `-e` means it's a regex pattern. So were looking for the literal characters Ss+, then the greedy wildcard `.*`, followed by the zsh bit from before.

Putting it all together:

`ps a | grep -e Ss+.*\-zsh | grep -v grep | xargs kill -9`

List processes, find the idle zsh terms, remove the reference to grep in the search output, and pipe it all the the kill command. `-9` is the signal to kill a process, by the way.

Does this work?

You betcha 😎

All that's left is to add that as an alias in the old .zshrc and call it a day.

`alias nozsh='ps a | grep -e Ss+.*\-zsh | grep -v grep | xargs kill -9'`

Now I just type `nozsh` in a terminal and it kills all the pointless terminals I have open, while keeping my dev server and anything else running.

Now, what was I supposed to be doing before I started shaving this yak?
