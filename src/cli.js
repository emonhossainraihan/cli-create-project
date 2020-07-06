import arg from 'arg';
import inquirer from 'inquirer';
import { createProject } from './main';
//! parse our arguments into an options object that we can work with
function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--git': Boolean,
      '--yes': Boolean,
      '--install': Boolean,
      '-g': '--git',
      '-y': '--yes',
      '-i': '--install',
    },
    {
      argv: rawArgs.slice(2),
    }
  );
  //* if we explicitly define type then it catch it's value unless push them _'s array
  return {
    skipPrompts: args['--yes'] || false,
    git: args['--git'] || false,
    template: args._[0],
    runInstall: args['--install'] || false,
  };
}

async function promptForMissingOptions(options) {
  const defaultTemplate = 'JavaScript';
  //* --yes flag won't ask question to pick choice hence return
  if (options.skipPrompts) {
    return {
      ...options,
      template: options.template || defaultTemplate,
    };
  }

  const questions = [];

  if (!options.template) {
    questions.push({
      type: 'list',
      name: 'template',
      message: 'Please choose which project template to use',
      choices: ['JavaScript', 'TypeScript'],
      default: defaultTemplate,
    });
  }

  if (!options.git) {
    questions.push({
      type: 'confirm',
      name: 'git',
      message: 'Initialize a git repository?',
      default: false,
    });
  }

  const answers = await inquirer.prompt(questions);

  return {
    ...options,
    template: options.template || answers.template,
    git: options.git || answers.git,
  };
}

//! parse our logic and then trigger business logic

export async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  options = await promptForMissingOptions(options);
  await createProject(options);
}
