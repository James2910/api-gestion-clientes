const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');
const morgan = require('morgan')

const app = express();
const port = 3001; // Puerto para el servidor backend

app.use(cors());
app.use(bodyParser.json());

app.use(morgan("dev"))

// Conexión a la base de datos MySQL
const conexion = mysql.createConnection({
    host: 'localhost',
    database: 'gestionclientes',
    user: 'root',
    password: ''
});

conexion.connect(function(error) {
    if (error) {
        throw error;
    } else {
        console.log('Conexión exitosa');
    }
});

// Rutas
const usersRouter = require('./src/routes/users');
app.use('/users', usersRouter);

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});