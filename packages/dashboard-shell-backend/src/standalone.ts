import * as path from 'path';
import { createBackendServer } from './createServer';

const assemblerDir = process.env.ASSEMBLER_DIR || path.join(__dirname, '..');

createBackendServer({
  publicDir: path.join(assemblerDir, 'public'),
  assemblerDir,
}).catch((err) => {
  console.error('Failed to start backend server:', err);
  process.exit(1);
});
