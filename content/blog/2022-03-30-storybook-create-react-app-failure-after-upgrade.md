---
title: Storybook Create React App Failure After Upgrade
permalink: storybook-create-react-app-webpack-problems
date: "2022-03-30"
tags:
  - post-mortem
description:
  Fixing Storybook issues caused by upgrading Create React App and having
  Webpack 5 errors.
rss_only: false
---

This is one of those short but hard won posts where I had to fix a bug but the solution wasn't online.

Hopefully it helps someone with the same problem.

## TL;DR

Upgrade Webpack in Storybook

AND

Upgrade "@storybook/preset-create-react-app" addon.

## Problem

Storybook / Chromatic was failing after an upgrade of Create React App, from `react-scripts` v4 to v5 specifically.

The initial error messages looked like this:

```sh
info => Using default Webpack4 setup

ERR! WebpackOptionsValidationError: Invalid configuration object. Webpack has been initialised using a configuration object that does not match the API schema.

ERR! - configuration.module.rules\[5\].oneOf\[9\].type should be one of these:

ERR! "javascript/auto" | "javascript/dynamic" | "javascript/esm" | "json" | "webassembly/experimental"
```

...with much more besides.

## Solutions

Various GitHub issue and Stack Overflow threads (and the Storybook upgrade documentation) point to the issue being that Create React App v5 uses Webpack 5, and Storybook should be upgraded accordingly.

This means adding a Storybook Webpack 5 helpers:

```sh
yarn add @storybook/builder-webpack5 @storybook/manager-webpack5 --dev
    # Or
npm install @storybook/builder-webpack5 @storybook/manager-webpack5 --save-dev
```

and adding to the `.storybook/main.js` file:

```js
module.exports = {
	core: {
		builder: "webpack5",
	},
};
```

Mine ended up looking like this, including other plugins, ymmv:

```js
module.exports = {
	core: {
		builder: "webpack5",
	},
	stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
	addons: [
		"@storybook/addon-links",
		"@storybook/addon-essentials",
		"@storybook/preset-create-react-app",
		"@storybook/addon-a11y",
	],
};
```

To some extent this works, many online threads end here assuming all was fixed. Not for me, but we got a new error message at least!

```sh
info => Using default Webpack5 setup
ERR! ValidationError: Invalid configuration object. Webpack has been initialized using a configuration object that does not match the API schema.
ERR!  - configuration.module.rules[4] should be one of these:
ERR!    ["..." | object { assert?, compiler?, dependency?, descriptionData?, enforce?, exclude?, generator?, include?, issuer?, issuerLayer?, layer?, loader?, mimetype?, oneOf?, options?, parser?, realResource?, resolve?, resource?, resourceFragment?, resourceQuery?, rules?, scheme?, sideEffects?, test?, type?, use? }, ...]
```

Similar error, but at least it's complaining from Webpack 5 instead of 4 now.

The final fix in my case was ensuring my `"@storybook/preset-create-react-app"` was up to date.

I upgraded that from `3.2.1` to `4.1.0` and that was enough to get Storybook building again.
