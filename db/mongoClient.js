const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
/* const dbName = 'test'; */
const dbName = 'user_details';
let db;

async function connectToMongo() {
  if (db) return db; // Retorna la conexión existente si ya está conectada

  try {
    const client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    console.log('Conectado a MongoDB');

    db = client.db(dbName);
    return db;
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    throw error;
  }
}

module.exports = {
  connectToMongo,
};
