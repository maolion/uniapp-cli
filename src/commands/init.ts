import {
    command,
    metadata,
    Command
} from 'clime';

@command({
    brief: 'create a project based on qmox'
})
export default class extends Command {
    @metadata
    execute() {
        return `bababbabba`;
    }
}
