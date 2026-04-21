import { createRouter } from 'next-connect';
import controller from 'infra/controller';
import user from 'models/user.js';
import session from 'models/session';
import authorization from 'models/authorization';

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest('read:session'), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const sessionToken = request.cookies.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken);
  const renewedSessionObject = await session.renew(sessionObject.id);
  controller.setSessionCookie(renewedSessionObject.token, response);

  const userFound = await user.findOneById(sessionObject.user_id);

  //Inserir cabeçalho de cache-control na resposta para que o navegador NÃO guarde em cache as informações do usuário,
  // evitando assim o retorno do status_code=304 (NOT MODIFIED), e consequentemente, não retornar a nova data de expiração
  //haja vista que estamos descumprindo a convenção de que um método GET não pode alterar os dados consultados,
  //mas nós estamos alterando o valor de `expired_at` e de `updated_at`
  response.setHeader(
    'Cache-Control',
    'no-store, no-cache, max-age=0, must-revalidate'
  );

  const userTryingToGet = request.context.user;
  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    'read:user:self',
    userFound
  );

  return response.status(200).json(secureOutputValues);
}
