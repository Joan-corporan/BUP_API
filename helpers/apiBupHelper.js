const { config } = require("@ssff/bootstrap");
const axios = require("axios");
const { timeout } = config.instaxios;
const { createError } = require("../error/managerError");

const post = async (logger, url, request, header) => {
  logger.info("Invocando servicio POST");
  logger.info(`URL -> ${url}`);
  const response = await axios
    .post(url, request, {
      headers: header,
      timeout,
    })
    .then((res) => {
      return getData(logger, res);
    })
    .catch((e) => {
      throw getError(logger, e);
    });
  return response;
};

const get = async (logger, url, header) => {
  logger.info("Invocando servicio GET");
  logger.info(`URL -> ${url}`);
  const response = await axios
    .get(url, {
      headers: header,
      timeout,
    })
    .then((res) => {
      return getData(logger, res);
    })
    .catch((e) => {
      throw getError(logger, e);
    });
  return response;
};

const delet = async (logger, url, header) => {
  logger.info("Invocando servicio DELETE");
  logger.info(`URL -> ${url}`);
  const response = await axios
    .delete(url, {
      headers: header,
      timeout,
    })
    .then((res) => {
      return getData(logger, res);
    })
    .catch((e) => {
      throw getError(logger, e);
    });
  return response;
};

const put = async (logger, url, request, header) => {
  logger.info("Invocando servicio PUT");
  logger.info(`URL -> ${url}`);
  const response = await axios
    .put(url, request, {
      headers: header,
      timeout,
    })
    .then((res) => {
      return getData(logger, res);
    })
    .catch((e) => {
      throw getError(logger, e);
    });
  return response;
};

const getPdf = async (logger, url) => {
  logger.info("Invocando servicio PDF");
  logger.info(`URL -> ${url}`);
  const response = axios({
    url,
    responseType: "arraybuffer",
    responseEncoding: "binary",
    headers: {
      "Content-Type": "application/pdf",
    },
  })
    .then((res) => {
      return getData(logger, res);
    })
    .catch((e) => {
      throw getError(logger, e);
    });
  return response;
};

//FUNCIÓN PARA RETORNAR LA INFORMACIÓN
function getData(logger, res) {
  logger.info(`Status -> ${res.status}`);
  if (res.status === 204) {
    throw createError(204, "Sin Contenido");
  }
  return res.data;
}

//FUNCIÓN PARA MOSTRAR ERROR
function getError(logger, e) {
  logger.error(`Error -> ${JSON.stringify(e)}`);
  var msg = isNaN(e.code)
    ? (e.response?.data?.message ?? e.message) || ""
    : e.message;
  var codigo = isNaN(e.code || e.response.status)
    ? 500
    : e.code || e.response.status;
  logger.error(`Mensaje Error -> ${codigo} - ${msg}`);

  return createError(codigo, msg);
}

module.exports = { post, get, put, delet, getPdf };
