import retry from 'async-retry';

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

const orchestrator = {
  waitForAllServices,
};

export default orchestrator;
