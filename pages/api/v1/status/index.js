import database from 'infra/database.js';
import { InternalServerError } from 'infra/errors';

async function status(request, response) {
  try {
    const updatedAt = new Date().toISOString();

    const dbVersionResult = await database.query('SHOW server_version;');
    const dbVersion = dbVersionResult.rows[0].server_version;

    const dbMaxConnectionsResult = await database.query(
      'SHOW max_connections;'
    );
    const dbMaxConnections = dbMaxConnectionsResult.rows[0].max_connections;

    const dbName = process.env.POSTGRES_DB;
    const dbOpenConnectionsResult = await database.query({
      text: 'SELECT count(*)::int FROM pg_stat_activity WHERE datname=$1;',
      values: [dbName],
    });
    const dbOpenConnections = dbOpenConnectionsResult.rows[0].count;

    response.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          version: dbVersion,
          max_connections: parseInt(dbMaxConnections),
          opened_connections: dbOpenConnections,
        },
      },
    });
  } catch (error) {
    const publicErrorObject = new InternalServerError({
      cause: error,
    });
    console.log('\n Erro do catch dentro do controller:');
    console.error(publicErrorObject);
    response.status(500).json(publicErrorObject);
  }
}

export default status;
