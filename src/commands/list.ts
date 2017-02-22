import {
    command,
    metadata,
    Command,
    buildTableOutput,
    TableRow,
    TableCaption
} from 'clime';
import * as Chalk from 'chalk';

import { UNIAPP_CONF_PATH } from '../constants';

@command({
    brief: 'Output the frameworks of qmox supported'
})
export default class extends Command {
    @metadata
    execute() {
        let qmoxConf = require(UNIAPP_CONF_PATH);
        let tableRows: TableRow[] = [];

        tableRows.push(new TableCaption(
            Chalk.green('List of the qmox supported frameworks')
        )); 

        for (let frameworkInfo of qmoxConf.frameworks || []) {
            tableRows.push([
                Chalk.bold(frameworkInfo.name),
                frameworkInfo.description
            ]);
        }

        return buildTableOutput(tableRows, { indent: 2, spaces: ' - ' });
    }
}
