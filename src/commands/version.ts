import * as Path from 'path';

import {
    command,
    metadata,
    Command,
} from 'clime';

import { QMOX_DIR } from '../constants';

@command({
    brief: 'Output the qmox version'
})
export default class extends Command {
    @metadata
    execute() {
        return require(Path.join(QMOX_DIR, 'package.json')).version;
    }
}
