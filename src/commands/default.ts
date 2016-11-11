import {
    command,
    param,
    Command,
    UsageError,
    HelpInfo,
    Printable
} from 'clime';

import * as Chalk from 'chalk';
import cli from '../cli';

@command({
    description: Chalk.white(`\
 _______  __   __  _______  __   __ 
|       ||  |_|  ||       ||  |_|  |
|   _   ||       ||   _   ||       |
|  | |  ||       ||  | |  ||       |
|  |_|  ||       ||  |_|  | |     | 
|      | | ||_|| ||       ||   _   |
|____||_||_|   |_||_______||__| |__|                                          
`) 
})
export default class CommandEntry extends Command {
    execute(
        @param({
        })
        command: string
    ) {
        if (!command) {
            return this.getHelp();
        }

        throw new UsageError(`command not found: ${command}`, {
            getHelp() {
                return cli.getHelp();
            }
        });
    }

    async getHelp(): Promise<Printable> {
        let info = new HelpInfo();
        let description = await cli.getHelpDescription();
        let subcommandHelpInfo = await cli.getHelp(false);

        info.buildDescription(description);
        info.buildTextsForParamsAndOptions(CommandEntry);

        return {
            print: async (stdout, stderr) => {
                stderr.write(`${info.text}\n${subcommandHelpInfo.text}\n`);
            }
        };
    }
}

export const subcommands = [
    {
        name: 'init',
        brief: 'Initialization a project based on qmox framework'
    },
    {
        name: 'update',
        alias: 'up',
        brief: 'Update qmox framework modules'
    },
    {
        name: 'list',
        alias: 'ls',
        brief: 'Output the frameworks of qmox supported'
    },
    {
        name: 'version',
        alias: 'v',
        brief: 'Output the qmox version'
    }
];
