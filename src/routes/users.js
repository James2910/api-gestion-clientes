const express = require('express');
const router = express.Router();
const mysql = require('mysql');

// Configuración de la conexión MySQL
const conexion = mysql.createConnection({
    host: 'localhost',
    database: 'gestionclientes',
    user: 'root',
    password: ''
});



// Ruta para insertar un nuevo cliente
router.post('/add', (req, res) => {
    const { Documento, Nombre, Apellido1, Apellido2, Direccion, Telefono, CorreoElectronico, Ciudad, CondicionPagoID, ValorCupo, MedioPagoID, Estado } = req.body;
    
    // Validaciones del servidor
    if (!Documento || !Nombre || !Apellido1 || !Direccion || !Telefono || !CorreoElectronico || !Ciudad || !CondicionPagoID) {
        return res.status(400).send('Todos los campos obligatorios deben ser completados');
    }

    // Validación de longitud de los campos
    if (Documento.trim().length > 20 || Nombre.trim().length > 100 || Apellido1.trim().length > 100 || Apellido2.trim().length > 100) {
        return res.status(400).send('El documento no puede exceder 20 caracteres y los nombres/apellidos no pueden exceder 100 caracteres');
    }

    // Validar formato del correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(CorreoElectronico)) {
        return res.status(400).send('El formato del correo electrónico no es válido');
    }

    // Validación de la ciudad (solo permite ciudades predefinidas)
    const validCiudades = ['Bucaramanga', 'Piedecuesta', 'Floridablanca', 'Girón'];
    if (!validCiudades.includes(Ciudad)) {
        return res.status(400).send('La ciudad seleccionada no es válida');
    }

    // Validación de la condición de pago
    if (CondicionPagoID === 1 && (!MedioPagoID || ValorCupo)) {
        return res.status(400).send('Si la condición de pago es Contado, debe seleccionar un medio de pago y no ingresar valor de cupo');
    }
    if (CondicionPagoID === 2 && (!ValorCupo || MedioPagoID)) {
        return res.status(400).send('Si la condición de pago es Crédito, debe ingresar un valor de cupo y no seleccionar un medio de pago');
    }

    // Insertar cliente si todas las validaciones pasan
    const query = `INSERT INTO Clientes 
                   (Documento, Nombre, Apellido1, Apellido2, Direccion, Telefono, CorreoElectronico, Ciudad, CondicionPagoID, ValorCupo, MedioPagoID, FechaHoraCreacion)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    
    conexion.query(query, [Documento, Nombre, Apellido1, Apellido2, Direccion, Telefono, CorreoElectronico, Ciudad, CondicionPagoID, ValorCupo || null, MedioPagoID || null], (error, _results) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error al agregar el cliente');
        }
        res.status(200).send('Cliente agregado correctamente');
    });
});


//Ruta para obtener la lista de los clientes
router.get('/clientList', (_req, res) => {
    const query = `SELECT C.Documento, C.Nombre, C.Apellido1, C.Apellido2, C.Direccion, C.Telefono, C.CorreoElectronico, C.Ciudad,	CP.Nombre AS CondicionPago, C.ValorCupo, MP.Nombre AS MedioPago, C.Estado
        FROM Clientes C
        INNER JOIN condicion_pago CP ON C.CondicionPagoID = CP.ID
        LEFT JOIN medio_pago MP ON C.MedioPagoID = MP.ID`;
    conexion.query(query, (error, results) => {
        if (error) {
            console.error('Error al obtener la lista de clientes:', error);
            res.status(500).json({ message: 'Error al obtener la lista de clientes' });
        } else {
            res.status(200).json(results);
        }
    });
});

//Ruta para obtener la información de un cliente
router.get('/client/:Documento', (req, res) => {
    const Documento = req.params.Documento;

    const query = `SELECT C.Documento, C.Nombre, C.Apellido1, C.Apellido2, C.Direccion, C.Telefono, C.CorreoElectronico, C.Ciudad,	CP.ID AS CondicionPago, C.ValorCupo, MP.ID AS MedioPago, C.Estado
        FROM Clientes C
        INNER JOIN condicion_pago CP ON C.CondicionPagoID = CP.ID
        LEFT JOIN medio_pago MP ON C.MedioPagoID = MP.ID
        WHERE C.Documento = ?`;
    
    conexion.query(query, [Documento], (error, results) => {
        if (error) {
            console.error('Error en la consulta:', error);
            res.status(500).json({ message: 'Error en la consulta' });
        } else {
            if (results.length > 0) {
                // Usuario encontrado, enviar información del usuario
                console.log(results[0])
                const userData = results[0];
                res.status(200).json(userData);
            } else {
                // No se encontró un usuario con el ID proporcionado
                res.status(404).json({ message: 'Usuario no encontrado' });
            }
        }
    });
});

// Ruta para actualizar la información del cliente
router.post('/clientUpdate/:Documento', (req, res) => {
    const Documento = req.params.Documento;
    const {
        Nombre,
        Apellido1,
        Apellido2,
        Direccion,
        Telefono,
        Ciudad,
        ValorCupo,
        Estado
    } = req.body;

    // Validación de campos obligatorios
    if (!Nombre || !Apellido1 || !Apellido2 || !Direccion || !Telefono || !Ciudad || typeof Estado === 'undefined') {
        return res.status(400).json({ message: 'Todos los campos obligatorios deben estar completos' });
    }

    // Consulta SQL para actualizar, omitiendo los campos no actualizables
    const query = `UPDATE Clientes
                   SET Nombre = ?, Apellido1 = ?, Apellido2 = ?, Direccion = ?, Telefono = ?, Ciudad = ?, ValorCupo = ?, Estado = ?
                   WHERE Documento = ?`;

    conexion.query(query, [Nombre, Apellido1, Apellido2, Direccion, Telefono, Ciudad, ValorCupo, Estado, Documento], (error, results) => {
        if (error) {
            console.error('Error en la actualización:', error);
            res.status(500).json({ message: 'Error al actualizar el cliente' });
        } else {
            if (results.affectedRows > 0) {
                res.status(200).json({ message: 'Cliente actualizado correctamente' });
            } else {
                res.status(404).json({ message: 'Cliente no encontrado' });
            }
        }
    });
});





// exportamos los endpoints
module.exports = router;