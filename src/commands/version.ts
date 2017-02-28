import * as Path from 'path';

import {
    command,
    metadata,
    Command,
} from 'clime';

import { UNIAPP_DIR } from '../constants';

@command({
    brief: 'Output uniapp/frameworks version'
})
export default class extends Command {
    @metadata
    execute() {
        return require(Path.join(UNIAPP_DIR, 'package.json')).version;
    }
}
