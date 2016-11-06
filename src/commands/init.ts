import {
    command,
    metadata,
    Command
} from 'clime';
import * as Inquirer from 'inquirer';

import { QMOX_CONF_PATH } from '../constants';

@command({
    brief: 'Initialization a project based on qmox framework'
})
export default class extends Command {
    @metadata
    execute() {
        
    }
}
