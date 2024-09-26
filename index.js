// index.js

const { createLogger, loadConfig, config } = require('@ssff/bootstrap');
const { connectToMongo } = require('./db/mongoClient');
let logger = createLogger('controller');

/* var apm = require('elastic-apm-node').start({
  serviceName: config.application.name,
  secretToken: config.apm.secretToken,
  serverUrl: config.apm.serverUrl,
  environment: config.apm.environment,
  //serverTimeout: "3s"
}); */

loadConfig(async () => {
  const path = require('path');

  logger.info(`esta aplicacion se llama ${config.application.name}`);
  logger.info(`el contextPath es ${config.server.contextPath}`);
  logger.info(`el puerto es ${config.server.port}`);

  Object.assign(config, {
    ROOT_DIR: __dirname,
    URL_PORT: config.server.port,
    URL_PATH: 'http://localhost',
    BASE_VERSION: config.server.contextPath,
    CONTROLLER_DIRECTORY: path.join(__dirname, 'controllers'),
    PROJECT_DIR: __dirname,
  });
  config.OPENAPI_YAML = path.join(config.ROOT_DIR, 'api', 'openapi.yaml');
  config.FULL_PATH = `${config.URL_PATH}:${config.URL_PORT}${config.BASE_VERSION}`;
  config.FILE_UPLOAD_PATH = path.join(config.PROJECT_DIR, 'uploaded_files');
  const ExpressServer = require('./expressServer');

  try {
    // Esperar a que MongoDB se conecte
    const db = await connectToMongo();
    logger.info('Conexión a MongoDB establecida');

    // Obtener la colección "BUP_CONTACT_DETAIL"
    const users = await db.collection('BUP_CONTACT_DETAIL').find({}).toArray();
    const launchServer = async () => {
      try {
        logger.info('port: ' + config.URL_PORT);
        logger.info('yamel: ' + config.OPENAPI_YAML);
        this.expressServer = new ExpressServer(config.URL_PORT, config.OPENAPI_YAML);
        this.expressServer.launch();
        logger.info('Express server running');
      } catch (error) {
        logger.error('Express Server failure', error.message);
        await this.close();
      }
    };

    launchServer().catch(e => logger.error(e));
  } catch (error) {
    logger.error('Error durante la inicialización:', error);
  }
});
