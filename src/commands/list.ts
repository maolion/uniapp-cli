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
    brief: '输出 uniapp 已支持的模块列表'
})
export default class extends Command {
    @metadata
    execute() {
        let qmoxConf = require(UNIAPP_CONF_PATH);
        let tableRows: TableRow[] = [];

        tableRows.push(new TableCaption(
            Chalk.green('uniapp 提供的框架模块列表')
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
