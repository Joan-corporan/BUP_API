// const path = require('path');

// const config = {
//   ROOT_DIR: __dirname,
//   URL_PORT: 8080,
//   URL_PATH: 'http://localhost',
//   BASE_VERSION: '',
//   CONTROLLER_DIRECTORY: path.join(__dirname, 'controllers'),
//   PROJECT_DIR: __dirname,
// };
// config.OPENAPI_YAML = path.join(config.ROOT_DIR, 'api', 'openapi.yaml');
// config.FULL_PATH = `${config.URL_PATH}:${config.URL_PORT}/${config.BASE_VERSION}`;
// config.FILE_UPLOAD_PATH = path.join(config.PROJECT_DIR, 'uploaded_files');

// module.exports = config;

const path = require('path');
const fs = require('fs');
const yaml = require('yaml');

// Load and parse the config.yaml file
const configFilePath = path.join(__dirname, 'config.yaml');
const file = fs.readFileSync(configFilePath, 'utf8');
const yamlConfig = yaml.parse(file);

// Default config values
const defaultConfig = {
  ROOT_DIR: __dirname,
  URL_PORT: 8080,
  URL_PATH: 'http://localhost',
  BASE_VERSION: '',
  CONTROLLER_DIRECTORY: path.join(__dirname, 'controllers'),
  PROJECT_DIR: __dirname,
};

// Merge the YAML config with the default config
const config = {
  ...defaultConfig,
  ...yamlConfig,
};

config.OPENAPI_YAML = path.join(config.ROOT_DIR, 'api', 'openapi.yaml');
config.FULL_PATH = `${config.URL_PATH}:${config.URL_PORT}/${config.BASE_VERSION}`;
config.FILE_UPLOAD_PATH = path.join(config.PROJECT_DIR, 'uploaded_files');

module.exports = config;
