const { config, createLogger } = require("@ssff/bootstrap");
const Controller = require("./controller");
const bupService = require("../services/bupService");
const logger = createLogger("bupController");
const { connectToMongo } = require('../db/mongoClient');
const { log } = require("winston");



const getContactDetails = async (request, response, next) => {
  try {
    logger.info("Inicio getContactDetails");
    await Controller.handleRequest(
      request,
      response,
      bupService.getContactDetails
    );
  } catch (error) {
    next(error);
  } finally {
    logger.info("Fin getContactDetails");
  }
};


const postContactDetailsInfo = async (request, response, next) => {
  try {
    logger.info("Inicio postContactDetailsInfo");
    await Controller.handleRequest(
      request,
      response,
      bupService.postContactDetailsInfo
    );
  } catch (error) {
    next(error);
  } finally {
    logger.info("Fin postContactDetailsInfo");
  }
};

const putContactDetailsInfo = async (request, response, next) => {
  try {
    logger.info("Inicio putContactDetailsInfo");
    await Controller.handleRequest(
      request,
      response,
      bupService.putContactDetailsInfo
    );
  } catch (error) {
    next(error);
  } finally {
    logger.info("Fin putContactDetailsInfo");
  }
};


module.exports = {
  getContactDetails,
  postContactDetailsInfo,
  putContactDetailsInfo,
};
