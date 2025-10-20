import { config } from './config.js';
import { db } from './db/index.js';
import { createServer } from './server.js';

const bootstrap = async () => {
  await db.ensureDemoData();
  const app = createServer();
  const port = config.port;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Canadian Insights API listening on port ${port}`);
  });
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', error);
  process.exit(1);
});
