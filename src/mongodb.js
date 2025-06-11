//--> Ref a dotenv y config
const dotenv = require('dotenv');
        dotenv.config();
//<--

//--> Referencia a Driver mongodb
const { MongoClient } = require('mongodb');
//<--

//--> Instanciar la URI de config
const URI = process.env.MONGODB_URLSTRING;
const client = new MongoClient(URI);
//<--

//--> f(x) connectToMongo
async function connectToMongoDB() {
    try{
        await client.connect();
        console.log('Conectado a MongoDB');
        return client;
    }
    catch (error){
        console.error('Error al conectar a MongoDB', error);
    }
    
} 
//<--

//--> f(x) disconnectToMongo
async function disconnectToMongoDB() {
    try{
        await client.close();
        console.log('Desconectado de MongoDB');
    }
    catch (error)
    {
        console.error('Error al desconectar de MongoDB: ', error);
    }
}
//<--

//--> Exportamos ambas funciones para poder trabajarlas desde la app ppal
module.exports = { connectToMongoDB, disconnectToMongoDB }
//<--