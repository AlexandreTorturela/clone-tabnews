import { createRouter } from 'next-connect';
import controller from 'infra/controller.js';
import migrator from 'models/migrator.js';
import authorization from 'models/authorization';

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest('read:migration'), getHandler)
  .post(controller.canRequest('create:migration'), postHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const pendingMigrations = await migrator.listPendingMigrations();
  const userTryingToGet = request.context.user;
  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    'read:migration',
    pendingMigrations
  );
  return response.status(200).json(secureOutputValues);
}

async function postHandler(request, response) {
  const migratedMigrations = await migrator.runPendingMigrations();

  const userTryingToPost = request.context.user;
  const secureOutputValues = authorization.filterOutput(
    userTryingToPost,
    'read:migration',
    migratedMigrations
  );

  if (migratedMigrations.length > 0) {
    return response.status(201).json(secureOutputValues);
  }
  return response.status(200).json(secureOutputValues);
}
