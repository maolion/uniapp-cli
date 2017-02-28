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
    description: Chalk.grey(`\
\n
 ▄         ▄  ▄▄        ▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄ 
▐░▌       ▐░▌▐░░▌      ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
▐░▌       ▐░▌▐░▌░▌     ▐░▌ ▀▀▀▀█░█▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌
▐░▌       ▐░▌▐░▌▐░▌    ▐░▌     ▐░▌     ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌       ▐░▌
▐░▌       ▐░▌▐░▌ ▐░▌   ▐░▌     ▐░▌     ▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄█░▌
▐░▌       ▐░▌▐░▌  ▐░▌  ▐░▌     ▐░▌     ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
▐░▌       ▐░▌▐░▌   ▐░▌ ▐░▌     ▐░▌     ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀▀▀ 
▐░▌       ▐░▌▐░▌    ▐░▌▐░▌     ▐░▌     ▐░▌       ▐░▌▐░▌          ▐░▌          
▐░█▄▄▄▄▄▄▄█░▌▐░▌     ▐░▐░▌ ▄▄▄▄█░█▄▄▄▄ ▐░▌       ▐░▌▐░▌          ▐░▌          
▐░░░░░░░░░░░▌▐░▌      ▐░░▌▐░░░░░░░░░░░▌▐░▌       ▐░▌▐░▌          ▐░▌          
 ▀▀▀▀▀▀▀▀▀▀▀  ▀        ▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀         ▀  ▀            ▀           
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
        brief: 'Create and initialize a new project'
    },
    {
        name: 'update',
        alias: 'up',
        brief: 'Upgrade the framework'
    },
    {
        name: 'list',
        alias: 'ls',
        brief: 'Output list of supported frameworks'
    },
    {
        name: 'version',
        alias: 'v',
        brief: 'Output uniapp/frameworks version'
    }
];

/*

┌────────────────────────────────────────────┐
│ Update available: 1.11.0 (current: 1.10.2) │
│ Run npm install -g uniapp-cli to update.   │
└────────────────────────────────────────────┘
*/