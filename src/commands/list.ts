import {
    command,
    metadata,
    Command,
    buildTableOutput,
    TableRow,
    TABLE_CAPTION_FLAG
} from 'clime';
import * as Chalk from 'chalk';

import { QMOX_CONF_PATH } from '../constants';

@command({
    brief: 'Output the frameworks of qmox supported'
})
export default class extends Command {
    @metadata
    execute() {
        let qmoxConf = require(QMOX_CONF_PATH);
        let tableRows: TableRow[] = [];

        tableRows.push([
            TABLE_CAPTION_FLAG, 
            Chalk.green('List of the qmox supported frameworks')
        ]);

        for (let frameworkInfo of qmoxConf.frameworks || []) {
            tableRows.push([
                Chalk.bold(frameworkInfo.name),
                frameworkInfo.description
            ]);
        }

        return buildTableOutput(tableRows, { indent: 2, spaces: ' - ' });
    }
}
