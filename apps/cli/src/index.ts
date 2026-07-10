import { Command } from 'commander';
import { registerScan } from './commands/scan.js';
import { registerDoctor } from './commands/doctor.js';
import { registerFix } from './commands/fix.js';
import { registerBackup } from './commands/backup.js';
import { registerRestore } from './commands/restore.js';
import { registerVerify } from './commands/verify.js';
import { registerProfiles } from './commands/profiles.js';
import { registerTokens } from './commands/tokens.js';
import { registerMcp } from './commands/mcp.js';
import { registerHistory } from './commands/history.js';
import { registerSync } from './commands/sync.js';
import { registerSkills, registerAgents } from './commands/managers.js';
import { CEM_VERSION } from './version.js';

const program = new Command();

program
  .name('cem')
  .description(
    'Claude Environment Manager — backup, restore, manage and migrate Claude Code environments.\n' +
      'CEM only reads documented local files and never modifies Claude Code itself.',
  )
  .version(CEM_VERSION, '-v, --version', 'Print the CEM version');

registerScan(program);
registerDoctor(program);
registerFix(program);
registerBackup(program);
registerRestore(program);
registerVerify(program);
registerProfiles(program);
registerSkills(program);
registerAgents(program);
registerTokens(program);
registerMcp(program);
registerHistory(program);
registerSync(program);

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
