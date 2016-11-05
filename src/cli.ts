import * as FS from 'fs';
import * as Path from 'path';
import { CLI, Shim } from 'clime';

const LOCAL_QMOX_CONF_PATH  = Path.join(process.cwd(), 'qmox-conf.json');

let roots = [
    {
        title: 'COMMANDS',
        dir: Path.join(__dirname, 'commands')
    }
];

if (FS.existsSync(LOCAL_QMOX_CONF_PATH)) {
    let qmoxConf = require(LOCAL_QMOX_CONF_PATH);
    let extendCommandsDir = Path.join(process.cwd(), 'node_modules', qmoxConf.framework, 'commands');

    if (FS.existsSync(extendCommandsDir)) {
        roots.push({
            title: `EXTEND COMMANDS - for based ${qmoxConf.framework} framework project`,
            dir: extendCommandsDir
        });
    }
}

let cli = new CLI('qmox', roots);

export default cli;