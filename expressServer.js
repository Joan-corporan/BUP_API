const http = require("http");
const fs = require("fs");
const path = require("path");
const swaggerUI = require("swagger-ui-express");
const jsYaml = require("js-yaml");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const OpenApiValidator = require("express-openapi-validator");
const {
  config,
  createLogger,
  correlationMiddleware,
  metricsMiddleware,
} = require("@ssff/bootstrap");


const logger = createLogger("base-unica-personas");
const managerError = require("./error/managerError");

class ExpressServer {
  constructor(port, openApiYaml) {
    this.port = port;
    this.app = express();
    this.openApiPath = openApiYaml;
    try {
      this.schema = jsYaml.safeLoad(fs.readFileSync(openApiYaml));
    } catch (e) {
      logger.error("failed to start Express Server", e.message);
    }
    this.setupMiddleware();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cookieParser());
    this.app.get(config.server.contextPath + "/openapi", (req, res) =>
      res.sendFile(path.join(__dirname, "api", "openapi.yaml"))
    );
    this.app.use(
      config.server.contextPath + "/swagger-ui.html",
      swaggerUI.serve,
      swaggerUI.setup(this.schema)
    );
    this.app.use(correlationMiddleware);
    this.app.use(metricsMiddleware);
    this.app.use(
      OpenApiValidator.middleware({
        apiSpec: this.openApiPath,
        operationHandlers: path.join(__dirname),
        fileUploader: { dest: config.FILE_UPLOAD_PATH },
      })
    );
    this.app.use((err, req, res, next) => {
      managerError.error(err, res, req, next);
    });
  }

  launch() {
    http.createServer(this.app).listen(this.port);
    console.log(`Listening on port ${this.port}`);
  }

  async close() {
    if (this.server !== undefined) {
      await this.server.close();
      console.log(`Server on port ${this.port} shut down`);
    }
  }
}

module.exports = ExpressServer;
