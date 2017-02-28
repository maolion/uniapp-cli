import * as Path from 'path';

export const CWD = process.cwd();
export const UNIAPP_DIR = Path.resolve(__dirname, '../');
export const NODE_MODULES = Path.join(UNIAPP_DIR, 'node_modules');
export const UNIAPP_CONF_PATH = Path.join(UNIAPP_DIR, 'uniapp-conf.json');
export const UNIAPP_COMMANDS_ROOT = Path.join(UNIAPP_DIR, 'dist/commands')

export const LOCAL_UNIAPP_CONF_PATH = Path.join(CWD, 'uniapp-conf.json');
export const LOCAL_NODE_MODULES = Path.join(CWD, 'node_modules');
