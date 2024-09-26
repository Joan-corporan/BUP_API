const { connectToMongo } = require('../db/mongoClient');

const connectToCollection = async (collectionName) => {
  const db = await connectToMongo();
  return db.collection(collectionName);
};

module.exports = { connectToCollection };
