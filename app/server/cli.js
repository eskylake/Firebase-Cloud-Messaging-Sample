#!/usr/bin/env node
/* eslint-disable node/shebang */

const commander = require("commander");
const chalk = require("chalk");

const cli = require("./cli/index");

(async () => {
  const program = new commander.Command();
  program.description(chalk`{cyan Command line interface}`);

  cli(program);
})();
