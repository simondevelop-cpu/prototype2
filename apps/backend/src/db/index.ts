import { config } from '../config.js';
import type { DatabaseAdapter } from './adapter.js';
import { memoryAdapter } from './memory.js';
import { prismaAdapter } from './prisma-adapter.js';

export const db: DatabaseAdapter = config.disableDb ? memoryAdapter : prismaAdapter;

export type { DatabaseAdapter } from './adapter.js';
