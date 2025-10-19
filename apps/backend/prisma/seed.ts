import { prismaAdapter } from '../src/db/prisma-adapter.js';

const seed = async () => {
  await prismaAdapter.ensureDemoData();
  // eslint-disable-next-line no-console
  console.log('Database seeded with demo data.');
};

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
