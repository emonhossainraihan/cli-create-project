import chalk from 'chalk';
import fs from 'fs';
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';

//! run external commands
//! trigger either yarn install or npm install
import execa from 'execa';
import Listr from 'listr';
import { projectInstall } from 'pkg-install';

const access = promisify(fs.access);
const copy = promisify(ncp);

//* copy templates
async function copyTemplateFiles(options) {
  return copy(options.templateDirectory, options.targetDirectory, {
    //* without overwritring
    clobber: false,
  });
}

//* handle git
async function initGit(options) {
  const result = await execa('git', ['init'], {
    cwd: options.targetDirectory,
  });
  if (result.failed) {
    return Promise.reject(new Error('Failed to initialize git'));
  }
  return;
}

export async function createProject(options) {
  options = {
    ...options,
    targetDirectory: options.targetDirectory || process.cwd(),
  };

  var templateDir = path.resolve(__dirname, '../templates', options.template);

  options.templateDirectory = templateDir;

  //* checking file exist or not
  fs.stat(options.templateDirectory, function (err, stat) {
    if (err == null) {
      console.log('Found template');
    } else if (err.code === 'ENOENT') {
      //* file does not exist
      console.log("Template didn't found");
    } else {
      console.log('Some other error: ', err.code);
    }
  });

  try {
    await access(templateDir, fs.constants.R_OK);
  } catch (err) {
    console.log(err);
    console.error('%s Invalid template name', chalk.red.bold('ERROR'));
    process.exit(1);
  }

  //* tasks summary
  const tasks = new Listr([
    {
      title: 'Copy project files',
      task: () => copyTemplateFiles(options),
    },
    {
      title: 'Initialize git',
      task: () => initGit(options),
      enabled: () => options.git,
    },
    {
      title: 'Install dependencies',
      task: () =>
        projectInstall({
          cwd: options.targetDirectory,
        }),
      skip: () =>
        !options.runInstall
          ? 'Pass --install to automatically install dependencies'
          : undefined,
    },
  ]);

  await tasks.run();

  console.log('%s Project ready', chalk.green.bold('DONE'));
  return true;
}
