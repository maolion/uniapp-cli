import * as Chalk from 'chalk';
import { exec } from './exec';

const DEPEND_TYPE_MAPPING: { [key: string]: string } = {
  normal: '--save',
  dev: '--save-dev',
  none: ''
};

export function installPackagesFromNPM(
  cwd: string, packages: string[], dependType: string = 'normal', showLog = false) {

  let putedNewLine = false;
  return exec('npm install', {
    cwd,
    args: [packages.join(' '), DEPEND_TYPE_MAPPING[dependType] || ''],
    log: data => {
      if (!putedNewLine) {
        process.stdout.write('\n');
        putedNewLine = true;
      }

      if (showLog) {
        process.stdout.write(data);
      }
    },
    errLog: data => {
      if (!putedNewLine) {
        process.stdout.write('\n');
        putedNewLine = true;
      }

      if (data.indexOf('npm ERR! ') > -1) {
        return process.stdout.write(Chalk.red(data));
      } else {
        return process.stdout.write(Chalk.yellow(data));
      }
    }
  });
}
