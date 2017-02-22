import * as FS from 'fs';
import * as Path from 'path';
import { CLI, Shim } from 'clime';

import {
    CWD,
    UNIAPP_CONF_PATH,
    UNIAPP_COMMANDS_ROOT,

    LOCAL_NODE_MODULES,
    LOCAL_UNIAPP_CONF_PATH
} from './constants';

let roots = [
    {
        title: 'COMMANDS',
        dir: UNIAPP_COMMANDS_ROOT
    }
];

if (FS.existsSync(LOCAL_UNIAPP_CONF_PATH)) {
    let uniappConf = require(LOCAL_UNIAPP_CONF_PATH);
    let extendCommandsDir = uniappConf.framework  && Path.join(LOCAL_NODE_MODULES, uniappConf.framework, 'commands');
    
    if (extendCommandsDir && FS.existsSync(extendCommandsDir)) {
        roots.push({
            title: `EXTEND COMMANDS - for based ${uniappConf.framework} framework project`,
            dir: extendCommandsDir
        });
    }
}

let cli = new CLI('uniapp', roots);

export default cli;