const fs = require("node:fs");
const { inspect } = require("node:util");
const commander = require("commander");
const colors = require("ansi-colors");

const { log } = console;

const jsFiles = fs.readdirSync(__dirname);

const commands = [];

jsFiles.forEach((file) => {
  if (file !== "index.js" && file.match(/.js$/)) {
    const cmd = require(`./${file}`);
    commands.push(cmd);
  }
});

const formatter = (v) => {
  const o = inspect(v, {
    depth: 10,
    breakLength: 2,
    colors: true,
  });
  if (v instanceof Error) {
    log(colors.bgRed.whiteBright(o));
  } else {
    log(colors.whiteBright(o));
  }
};

module.exports = async (program) => {
  commands.forEach(({ name, description, options, runAction }) => {
    const cmd = new commander.Command(name);
    cmd.description(description);
    if (options) {
      options.forEach((opt) => {
        const optO = new commander.Option(opt.flags, opt.description);
        if (opt.default) {
          optO.default(opt.default);
        }
        if (opt.required) {
          cmd.requiredOption(opt.flags, opt.description, opt.default);
        } else {
          cmd.addOption(optO);
        }
      });
    }
    cmd.action(async (...args) => {
      try {
        await runAction({ formatter }, ...args);
      } catch (e) {
        log(e);
      }
    });
    program.addCommand(cmd);
  });

  program.parse(process.argv);
};
