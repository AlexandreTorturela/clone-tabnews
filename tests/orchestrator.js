import retry from 'async-retry';
import database from 'infra/database.js';
import migrator from 'models/migrator.js';

async function waitForAllServices() {
  await waitForWebServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch('http://localhost:3000/api/v1/status');
      if (response.status != 200) {
        throw Error();
      }
      //await response.json();
      //const responseBody = response.json();
      //console.log('endpoint api/v1/status: response.status=' + response.status);
      //console.log('endpoint api/v1/status: response.json=' + responseBody.response);
    }
  }
}

async function clearDatabase() {
  await database.query('drop schema public cascade; create schema public;');
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
};

export default orchestrator;
