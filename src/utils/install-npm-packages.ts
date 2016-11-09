import { exec } from './exec';

const DEPEND_TYPE_MAPPING: { [key: string]: string } = {
    normal: '--save',
    dev: '--save-dev',
    none: ''
}

export function installNPMPackages(cwd: string, packages: string[], dependType: string = 'normal') {
    return exec('npm install', {
        cwd,
        args: [ packages.join(' '), DEPEND_TYPE_MAPPING[dependType] || '' ]
    });
}
