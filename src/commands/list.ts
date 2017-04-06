import {
    command,
    metadata,
    Command
} from 'clime';
import * as Chalk from 'chalk';

import {
    TableCaption,
    TableRow,
    buildTableOutput
} from '../util/format';

import { UNIAPP_CONF_PATH } from '../constants';

@command({
    brief: 'Output list of supported frameworks'
})
export default class extends Command {
    @metadata
    execute() {
        let uniappConf = require(UNIAPP_CONF_PATH);
        let tableRows: TableRow[] = [];

        tableRows.push(new TableCaption(
            Chalk.green('list of supported frameworks')
        ));

        for (let frameworkInfo of uniappConf.frameworks || []) {
            tableRows.push([
                Chalk.bold(frameworkInfo.name),
                frameworkInfo.description
            ]);
        }

        return buildTableOutput(tableRows, { indent: 2, spaces: ' - ' });
    }
}
