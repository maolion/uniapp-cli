import * as FS from 'fs';
import * as Path from 'path';
import { CLI, Shim } from 'clime';

import {
    CWD,
    QMOX_CONF_PATH,
    QMOX_COMMANDS_ROOT,

    LOCAL_NODE_MODULES,
    LOCAL_QMOX_CONF_PATH
} from './constants';

let roots = [
    {
        title: 'COMMANDS',
        dir: QMOX_COMMANDS_ROOT
    }
];

if (FS.existsSync(LOCAL_QMOX_CONF_PATH)) {
    let qmoxConf = require(LOCAL_QMOX_CONF_PATH);
    let extendCommandsDir = qmoxConf.framework  && Path.join(LOCAL_NODE_MODULES, qmoxConf.framework, 'commands');
    
    if (extendCommandsDir && FS.existsSync(extendCommandsDir)) {
        roots.push({
            title: `EXTEND COMMANDS - for based ${qmoxConf.framework} framework project`,
            dir: extendCommandsDir
        });
    }
}

let cli = new CLI('qmox', roots);

export default cli;