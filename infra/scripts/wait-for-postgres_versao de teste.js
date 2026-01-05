const { exec } = require('node:child_process');

async function checkPostgres() {
  let res;
  exec('docker exec postgres-dev pg_isready --host localhost', handleReturn);

  function handleReturn(error, stdout) {
    res = stdout.search('accepting connections');
  }

  console.log('res=' + res);

  return res;
}

process.stdout.write('\n\n🔴 Aguardando Postgres aceitar conexões');

do {
  const res = await checkPostgres();
  process.stdout.write('.');
} while (checkPostgres() == -1);
console.log('\n🟢 Postgres está pronto e aceitando conexões!\n');
