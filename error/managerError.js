const { createLogger } = require("@ssff/bootstrap");
let logger = createLogger("ManejoError:");

const error = async (err, resp) => {
  var codigo = err.error?.code || err.code || err.status || 500;
  var mensaje =
    err.message ||
    err.error?.message ||
    err.error ||
    err.errors?.map((e) => e.message) ||
    "Error en servicio";

  const error = {
    code: codigo,
    message: mensaje,
  };

  logger.error(JSON.stringify(error));
  resp.status(error.code).json(error);
};

const createError = (code, message) => {
  const error = {
    message,
    code
  };
  return error;
};

module.exports = {
  error,
  createError,
};
