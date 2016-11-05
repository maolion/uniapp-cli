import * as Path from 'path';
import { CLI, Shim } from 'clime';

let cli = new CLI('qmox', Path.join(__dirname, 'commands'));

export default cli;