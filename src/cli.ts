import 'source-map-support/register';

import { CLI, Shim } from 'clime';
import * as FS from 'fs';
import * as Path from 'path';

import {
  CWD,
  LOCAL_NODE_MODULES,
  LOCAL_UNIAPP_CONF_PATH,
  UNIAPP_COMMANDS_ROOT,
  UNIAPP_CONF_PATH
} from './constants';

let roots = [
  {
    label: 'SUBCOMMANDS',
    path: UNIAPP_COMMANDS_ROOT
  }
];

if (FS.existsSync(LOCAL_UNIAPP_CONF_PATH)) {
  let uniappConf = require(LOCAL_UNIAPP_CONF_PATH);
  let extendCommandsDir = uniappConf.framework && Path.join(LOCAL_NODE_MODULES, uniappConf.framework, 'commands');

  if (extendCommandsDir && FS.existsSync(extendCommandsDir)) {
    roots.push({
      label: `EXTEND SUBCOMMANDS - for based ${uniappConf.framework} framework project`,
      path: extendCommandsDir
    });
  }
}

let cli = new CLI('uniapp', roots);

export default cli;
