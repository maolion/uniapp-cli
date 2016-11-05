import {
    command,
    param,
    Command,
    UsageError
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
export default class extends Command {
    execute(
        @param({
        })
        subcommand: string
    ) {
        if (!subcommand) {
            return cli.getHelp();
        }

        throw new UsageError('.....', {
            getHelp() {
                return cli.getHelp();
            }
        });
    }
}

export const subcommands = [
    {
        name: 'init',
        brief: 'create a project based on qmox'
    }
];
