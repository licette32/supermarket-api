const express = require('express');
const app = express();

//--> Importo el archivo de conexion y desconexion a la BD
const { connectToMongoDB, disconnectToMongoDB } = require('./mongodb.js');
//<--

//--> Middleware que setea charset=utf-8, -g (para todos los endpoint de la app)
app.use((req, res, next) =>{
    res.header("Content-Type", "application/json; charset=utf-8");
    next();
});
//<--

//--> Requiero dotenv
require('dotenv').config();
//<--

const PORT = process.env.PORT || 3000;

//--> Middleware
app.use(express.json());
//<--

//Ruta Home
app.get('/', (req, res) => {
    res.status(200).end("🛒 Bienvenido a APImarket 🛒");
});
//<--

//Traigo toda mi coleccón (Productos) de mi BD (Supermercado)- Ruta /productos, no olvidar desconectar la BD
app.get('/productos', async (req, res) => {
    //conecto con la BDs
    const client = await connectToMongoDB();
    
    // Valido la conexión
    if(!client) {
        res.status(500).send('Error de conexión');
        return
    }
    try{
        // trigo mi set de datos
        const db = client.db('Supermercado');
        // busco
        const productos = await db.collection('Productos').find().toArray();
        // devuelvo 
        res.json(productos);
    }
    // por si salta algún error sorpresa...
    catch (error) {
        res.status(500).send('No puedo mostrar los productos.');
    }
    // me aseguro de desconectarme de la BDs
    finally{
        // No olvidar desconectarse
        await disconnectToMongoDB();
    }
});
//<--

//Busco por codigo de producto
app.get('/productos/:cod', async (req, res) => {
    // capturo el parametro
    const productoId = parseInt(req.params.cod);
    if(isNaN(productoId) || (productoId<= 0)){
        res.status(400).send('Código de producto inválido');
        return
    }
    //conecto con la BD
    client = await connectToMongoDB();
    
    // conecto con mi set de datos
    const db = client.db('Supermercado');
    
    // busco el documento con codigo = productoId
    const producto = await db.collection('Productos').findOne({ codigo: productoId });
    
    // No olvidarme de desconectar
    await disconnectToMongoDB();
    if(!producto){
        res.status(404).send('Producto inexistente');
        return
    } else{
        // devuelvo el producto encontrado
        res.json(producto);
    }
});
//<--

//Busco por categoría
app.get('/categoria/:cat', async (req, res) => {
    
    // capturo el parametro
    const nameParam = req.params.cat;
    console.log(nameParam);
    
    //valido que no sea vacio
    if(!nameParam || nameParam.trim().length === 0){
        res.status(400).send('Categoría invalida');
        return
    }
    
    //conecto con la BD
    client = await connectToMongoDB();
    // traigo mi set de datos
    const db = client.db('Supermercado');
    
    // busco el documento con categorias que comiencen o sean iguales a nameParam
    const lista = await db.collection('Productos').find( {categoria: { $regex: `^${nameParam}`, $options: 'i' } }).toArray();
    console.log(lista);

    // No olvidarme de desconectar
    await disconnectToMongoDB();
    
    if(lista.length === 0){
        res.status(404).send('Categoría no encontrada');
        return
    }

    // devuelvo los productos de una o varias categoria/s determinada/s.
    res.json(lista);

});
//<--

//Ruta /precio/:precio
app.get('/precio/:precio', async (req, res) => {
    
    // capturo el parametro
    const precioParam = parseFloat(req.params.precio);
    console.log(precioParam);
    
    //validamos precioParam
    if(isNaN(precioParam) || precioParam < 0){
        res.status(400).send('Precio invalido');
        return;
    }

    //conecto con la BD
    client = await connectToMongoDB();
    
    // conecto con mi set de datos
    const db = client.db('Supermercado');
    
    // busco el documento productos con precio mayor o igual a precioParam
    const listadoPrecios = await db.collection('Productos').find( {precio: { $gte: precioParam } }).toArray();
    console.log(listadoPrecios);
    
    // No olvidarme de desconectar
    await disconnectToMongoDB();
    if(listadoPrecios.length === 0){
        res.status(404).send('Precio no encontrado');
        return
    } else{
        // devuelvo el/los nombre/s de el/los producto/s encontrado/s
        res.json(listadoPrecios);
    }
});
//<--

// Método POST
app.post('/productos', async (req, res) =>{
    
    const nuevoProducto = req.body;

    // Validacion de lo que vino el el body
    if (!nuevoProducto){
        return res.status(400).send('Error en el formato envado');
    }
     //aca salió ayudin del curso jajaj
     // valido la estructura del body para no enviar cualquier cosa a la BDs
    const { codigo, nombre, precio, categoria } = nuevoProducto;
    
    if(
        typeof codigo !== 'number' || codigo <=0 ||
        typeof nombre !== 'string' || nombre.trim().length === 0 ||
        typeof precio !== 'number' || precio < 0||
        typeof categoria !== 'string' || categoria.trim().length === 0
    ) {
        return res.status(400).send("Tipo o tipos de datos inválidos");
    }

    // Validación de conexion con la BD
    const client = await connectToMongoDB();
    if( !client ){
        return res.status(500).send('Error al conectarse con la BDs');
    }

    const collection = client.db('Supermercado').collection('Productos');

    //verifico si existe el código de producto
    const isExist = await collection.findOne({ codigo });
    if(isExist){
        return res.status(409).send('El código del producto ya existe');
    }

    collection.insertOne(nuevoProducto)
    .then(() => { 
        console.log('Nuevo producto agregado');
        res.status(201).send(nuevoProducto);
    })
    .catch(error => {
        console.error(error);
        res.status(500).send("error inesperado");
    })
    .finally(() => {client.close()});
});
//<--

// Método PUT
app.put('/productos/:cod', async (req, res)=>{
    
    const cod =  parseInt(req.params.cod);
    const nuevoDato = req.body;
    console.log(nuevoDato);
    
    if(!nuevoDato){
        return res.status(400).send('Error en el formato de datos recibido');
    }
    //validacion de la estructura
    const { codigo, nombre, precio, categoria } = nuevoDato;
    
    if(
        typeof codigo !== 'number' || codigo <=0 ||
        typeof nombre !== 'string' || nombre.trim().length === 0 ||
        typeof precio !== 'number' || precio < 0||
        typeof categoria !== 'string' || categoria.trim().length === 0
    ) {
        return res.status(400).send("Tipo o tipos de datos inválidos o faltan dantos, recuerde que debe ingresar TODA la información del documento");
    }
    //valido conexión
    const client = await connectToMongoDB();
    if(!client){
        return res.status(500).send('Error de conexión');
    }
    //trigo mi collection 
    const collection = client.db('Supermercado').collection('Productos');
    
    // busco el documento con codigo = productoId
    const producto = await collection.findOne({ codigo: cod });
    console.log('Producto encontrado: ' + producto);

    //si no existe el producto a modificar
    if(!producto){
        client.close();
        return res.status(404).send('El producto a modificar no existe');
    } 

    //actualizo el producto
    collection.replaceOne(
        { codigo: parseInt(cod) }, nuevoDato)
        .then(()=>{console.log('Producto modificado con éxito');
                res.status(200).send(nuevoDato);
        })
        .catch((error) => {
            res.status(500).json({description: 'Error al modificar el producto'});
        })
        .finally(() =>{
            client.close();
        });
});
//<--

// Método PATCH
app.patch('/productos/:cod', async (req, res)=>{
    
    const cod =  parseInt(req.params.cod);
    const nuevoDato = req.body;
    console.log(nuevoDato);
    
    if(!nuevoDato){
        return res.status(400).send('Error en el formato de datos recibido');
    }
    //valido lo que viene en el body
    if (nuevoDato.codigo !== undefined && (typeof nuevoDato.codigo !== 'number' || nuevoDato.codigo <=0)){
        return res.status(400).send('Codigo invalido');
    }
    if (nuevoDato.nombre !== undefined && (typeof nuevoDato.nombre !== 'string' || nuevoDato.nombre.trim().length === 0)){
        return res.status(400).send('Nombre invalido');
    }
    if (nuevoDato.precio !== undefined && (typeof nuevoDato.precio !== 'number' || nuevoDato.precio < 0)){
        return res.status(400).send('Precio invalido');
    }
    if (nuevoDato.categoria !== undefined && (typeof nuevoDato.categoria !== 'string' || nuevoDato.categoria.trim().length === 0)){
        return res.status(400).send('Categoria inválida');
    }

    const client = await connectToMongoDB();
    if(!client){
        return res.status(500).send('Error de conexión');
    }

    const collection = client.db('Supermercado').collection('Productos');

    // busco el documento con codigo = productoId
    const producto = await collection.findOne({ codigo: cod });
    
    //si no existe el producto a modificar
    if(!producto){
        client.close();
        return res.status(404).send('El producto a modificar no existe');
    } 
    //actualizo el producto
    collection.updateOne(
        { codigo: parseInt(cod) }, { $set: nuevoDato })
        .then(()=>{console.log('Producto modificado con éxito');
                res.status(200).send(nuevoDato);
        })
        .catch((error) => {
            res.status(500).json({description: 'Error al modificar el producto'});
        })
        .finally(() =>{
            client.close();
        });
});
//<--


// Método DELETE
app.delete('/productos/:cod', async (req, res)=>{
    const codigo =  parseInt(req.params.cod);
    
    if(isNaN(codigo) || codigo <= 0){
        return res.status(400).send('El formato es erroneo o inváñido')
    }

    const client = await connectToMongoDB();

    if(!client){
        return res.status(500).send('Error de conexión');
    }

    client.connect()
    .then( () =>{
        const collection = client.db('Supermercado').collection('Productos');
        return collection.deleteOne({ codigo: parseInt(codigo)});
    })
    .then((resultado) => {
        if (resultado.deletedCount === 0){
            res.status(404).send('No se encontro el codigo ingresado');
        }
        else{   
            res.status(204).send('Producto Eliminado');
            console.log('Producto eliminado');
        }
    })
    .catch((error) =>{
        console.error(error);
        res.status(500).send('Se produjo un error al intentar eliminar el productoa');
    })
    .finally(()=>{
        client.close();
    });
});
//<--

// Middleware para manejar rutas no encontradas (404)
app.use((req, res, next) =>{
    res.status(404).send('La página que busca no existe.');
});
//<--

//Módulo de escucha
app.listen(
    PORT, () =>{
        console.log(`Servidor en puerto http://localhost:${PORT}`);
    }
);
//<--