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
        brief: '创建/初始一个新的项目'
    },
    {
        name: 'update',
        alias: 'up',
        brief: '更新项目模块依赖'
    },
    {
        name: 'list',
        alias: 'ls',
        brief: '输出 uniapp 已支持的模块列表'
    },
    {
        name: 'version',
        alias: 'v',
        brief: '输出当前 uniapp 版本号'
    }
];

/*

┌────────────────────────────────────────────┐
│ Update available: 1.11.0 (current: 1.10.2) │
│ Run npm install -g qmox to update.         │
└────────────────────────────────────────────┘
*/