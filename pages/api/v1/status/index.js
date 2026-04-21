import { createRouter } from 'next-connect';
import database from 'infra/database.js';
import controller from 'infra/controller';
import authorization from 'models/authorization';

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(getHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const updatedAt = new Date().toISOString();

  const dbVersionResult = await database.query('SHOW server_version;');
  const dbVersion = dbVersionResult.rows[0].server_version;

  const dbMaxConnectionsResult = await database.query('SHOW max_connections;');
  const dbMaxConnections = dbMaxConnectionsResult.rows[0].max_connections;

  const dbName = process.env.POSTGRES_DB;
  const dbOpenConnectionsResult = await database.query({
    text: 'SELECT count(*)::int FROM pg_stat_activity WHERE datname=$1;',
    values: [dbName],
  });
  const dbOpenConnections = dbOpenConnectionsResult.rows[0].count;

  const statusObject = {
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: dbVersion,
        max_connections: parseInt(dbMaxConnections),
        opened_connections: dbOpenConnections,
      },
    },
  };

  const userTryingToGet = request.context.user;
  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    'read:status',
    statusObject
  );

  return response.status(200).json(secureOutputValues);
}
