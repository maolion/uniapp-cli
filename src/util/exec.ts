import * as ChildProcess from 'child_process';

export type WriteHandler = (data: string) => any;

export interface ExecuteOptions {
    log?: WriteHandler;
    errLog?: WriteHandler;
    args?: string[];
    cwd?: string;
    catchOutput?: boolean;
}

export function exec(execute: string, options: ExecuteOptions = {}) {
    let log = options.log;
    let errLog = options.errLog;
    let cache = '';
    
    return new Promise((resolve, reject) => {
        let instance = ChildProcess.exec(
            execute + (options.args ?  ' ' + options.args.join(" ") : ""), 
            {
                cwd: options.cwd || process.cwd()
            },
            function(err) {
                
            }
        );

        instance.stdout.on('data', function(data: Buffer) {
            let dataContent = data.toString("utf8");

            if (options.catchOutput) {
                cache += dataContent; 
            }

            log && log(dataContent);
        });

        if (errLog) {
            instance.stderr.on('data', function(data: Buffer) {
                errLog && errLog(data.toString("utf8"));
            });
        }

        instance.on('exit', function(code: number, signal: any) {
            if (code !=0 ) {
                reject(code);
                return;
            }

            resolve({ code, output: cache });
        });
    });
}