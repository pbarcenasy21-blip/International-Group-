const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function registrarHistorial(usuario_accion, accion, detalle) {
  try {
    await pool.query(
      'INSERT INTO historial (id_usuario, usuario, accion, detalle) VALUES (?, ?, ?, ?)',
      [usuario_accion?.id || null, usuario_accion?.nombre || 'Sistema', accion, detalle]
    );
  } catch (err) {
    console.error('Error historial:', err.message);
  }
}

// 0. CARGA INICIAL COMPLETA PARA EL FRONTEND
app.get('/api/bootstrap', async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT * FROM roles');
    const [usuarios] = await pool.query('SELECT id, nombre, usuario, correo, id_rol, estado FROM usuarios');
    const [clientes] = await pool.query('SELECT * FROM clientes');
    const [servicios] = await pool.query('SELECT * FROM servicios');
    const [inventario] = await pool.query('SELECT * FROM inventario');
    const [reservas] = await pool.query('SELECT * FROM reservas');
    const [historial] = await pool.query('SELECT * FROM historial ORDER BY fecha_hora DESC LIMIT 200');
    res.json({ roles, usuarios, clientes, servicios, inventario, reservas, historial });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// 1. LOGIN
app.post('/api/login', async (req, res) => {
  const { usuario, password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE LOWER(usuario) = LOWER(?) OR LOWER(correo) = LOWER(?)',
      [usuario.trim(), usuario.trim()]
    );
    if (rows.length === 0) return res.status(401).json({ ok: false, msg: 'Usuario o contraseña incorrectos.' });

    const u = rows[0];
    const esDemo = (u.usuario === 'admin' && password === 'Admin123') || (u.usuario === 'operador' && password === 'Operador123');
    const valido = esDemo || await bcrypt.compare(password, u.password_hash);

    if (!valido) return res.status(401).json({ ok: false, msg: 'Usuario o contraseña incorrectos.' });
    if (u.estado !== 'Activo') return res.status(403).json({ ok: false, msg: 'Tu cuenta está desactivada. Contacta al administrador.' });

    const sesion = { id: u.id, nombre: u.nombre, usuario: u.usuario, id_rol: u.id_rol };
    await registrarHistorial(sesion, 'Inicio de sesión', `El usuario ${u.usuario} ingresó al sistema`);
    res.json({ ok: true, usuario: sesion });
  } catch (error) {
    res.status(500).json({ ok: false, msg: 'Error en servidor: ' + error.message });
  }
});

// 2. CLIENTES
app.post('/api/clientes', async (req, res) => {
  const { nombre, documento, telefono, correo, fecha_registro, usuario_accion, detalle_log } = req.body;
  try {
    const [r] = await pool.query(
      'INSERT INTO clientes (nombre, documento, telefono, correo, fecha_registro) VALUES (?, ?, ?, ?, ?)',
      [nombre, documento, telefono, correo, fecha_registro || new Date().toISOString().slice(0, 10)]
    );
    await registrarHistorial(usuario_accion, 'Registro de cliente', detalle_log || nombre);
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    res.status(400).json({ mensaje: e.code === 'ER_DUP_ENTRY' ? 'Ya existe un cliente con ese documento.' : e.message });
  }
});

app.put('/api/clientes/:id', async (req, res) => {
  const { nombre, documento, telefono, correo, usuario_accion, detalle_log } = req.body;
  try {
    await pool.query('UPDATE clientes SET nombre=?, documento=?, telefono=?, correo=? WHERE id=?', [nombre, documento, telefono, correo, req.params.id]);
    await registrarHistorial(usuario_accion, 'Edición de cliente', detalle_log || nombre);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ mensaje: e.message });
  }
});

app.delete('/api/clientes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM clientes WHERE id=?', [req.params.id]);
    await registrarHistorial(req.body?.usuario_accion, 'Eliminación de cliente', req.body?.detalle_log || `ID ${req.params.id}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ mensaje: 'No se puede eliminar: tiene reservas asociadas.' });
  }
});

// 3. SERVICIOS
app.post('/api/servicios', async (req, res) => {
  const { nombre, descripcion, tipo, precio, estado, usuario_accion, detalle_log } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query('INSERT INTO servicios (nombre, descripcion, tipo, precio, estado) VALUES (?, ?, ?, ?, ?)', [nombre, descripcion, tipo, precio, estado || 'Activo']);
    await conn.query('INSERT INTO inventario (id_servicio, cantidad_disponible) VALUES (?, 0)', [r.insertId]);
    await conn.commit();
    await registrarHistorial(usuario_accion, 'Registro de servicio turístico', detalle_log || nombre);
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    await conn.rollback();
    res.status(400).json({ mensaje: e.message });
  } finally { conn.release(); }
});

app.put('/api/servicios/:id', async (req, res) => {
  const { nombre, descripcion, tipo, precio, estado, usuario_accion, detalle_log } = req.body;
  try {
    await pool.query('UPDATE servicios SET nombre=?, descripcion=?, tipo=?, precio=?, estado=? WHERE id=?', [nombre, descripcion, tipo, precio, estado, req.params.id]);
    await registrarHistorial(usuario_accion, 'Edición de servicio turístico', detalle_log || nombre);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ mensaje: e.message }); }
});

app.delete('/api/servicios/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM servicios WHERE id=?', [req.params.id]);
    await registrarHistorial(req.body?.usuario_accion, 'Eliminación de servicio turístico', req.body?.detalle_log || `ID ${req.params.id}`);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ mensaje: 'No se puede eliminar: tiene reservas asociadas.' }); }
});

// 4. INVENTARIO
app.post('/api/inventario', async (req, res) => {
  const { id_servicio, cantidad_disponible, usuario_accion, detalle_log } = req.body;
  try {
    const [r] = await pool.query('INSERT INTO inventario (id_servicio, cantidad_disponible) VALUES (?, ?)', [id_servicio, cantidad_disponible]);
    await registrarHistorial(usuario_accion, 'Registro de inventario', detalle_log || `Servicio ${id_servicio}`);
    res.status(201).json({ id: r.insertId });
  } catch (e) { res.status(400).json({ mensaje: e.code === 'ER_DUP_ENTRY' ? 'Este servicio ya tiene un registro en inventario.' : e.message }); }
});

app.put('/api/inventario/:id', async (req, res) => {
  const { id_servicio, cantidad_disponible, usuario_accion, detalle_log } = req.body;
  try {
    await pool.query('UPDATE inventario SET id_servicio=?, cantidad_disponible=? WHERE id=?', [id_servicio, cantidad_disponible, req.params.id]);
    await registrarHistorial(usuario_accion, 'Edición de inventario', detalle_log || `ID ${req.params.id}`);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ mensaje: e.sqlMessage || e.message }); }
});

app.delete('/api/inventario/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM inventario WHERE id=?', [req.params.id]);
    await registrarHistorial(req.body?.usuario_accion, 'Eliminación de inventario', req.body?.detalle_log || `ID ${req.params.id}`);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ mensaje: e.message }); }
});

// 5. RESERVAS (REGLA DE NEGOCIO CON TRIGGERS MYSQL)
app.post('/api/reservas', async (req, res) => {
  const { id_cliente, id_servicio, fecha, personas, estado, usuario_accion, detalle_log } = req.body;
  try {
    const [r] = await pool.query(
      'INSERT INTO reservas (id_cliente, id_servicio, id_usuario, fecha, personas, estado, precio_unitario, total) VALUES (?, ?, ?, ?, ?, ?, 0, 0)',
      [id_cliente, id_servicio, usuario_accion?.id || 1, fecha, personas, estado || 'Pendiente']
    );
    await registrarHistorial(usuario_accion, 'Registro de reserva', detalle_log || `Reserva #${r.insertId}`);
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    res.status(400).json({ mensaje: e.sqlState === '45000' ? e.sqlMessage : e.message });
  }
});

app.put('/api/reservas/:id', async (req, res) => {
  const { id_cliente, id_servicio, fecha, personas, estado, usuario_accion, detalle_log } = req.body;
  try {
    await pool.query(
      'UPDATE reservas SET id_cliente=?, id_servicio=?, fecha=?, personas=?, estado=? WHERE id=?',
      [id_cliente, id_servicio, fecha, personas, estado, req.params.id]
    );
    await registrarHistorial(usuario_accion, 'Edición de reserva', detalle_log || `Reserva #${req.params.id}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ mensaje: e.sqlState === '45000' ? e.sqlMessage : e.message });
  }
});

app.delete('/api/reservas/:id', async (req, res) => {
  try {
    const [[resv]] = await pool.query('SELECT * FROM reservas WHERE id=?', [req.params.id]);
    if (resv && resv.estado !== 'Cancelada') {
      await pool.query('UPDATE inventario SET cantidad_disponible = cantidad_disponible + ? WHERE id_servicio = ?', [resv.personas, resv.id_servicio]);
    }
    await pool.query('DELETE FROM reservas WHERE id=?', [req.params.id]);
    await registrarHistorial(req.body?.usuario_accion, 'Eliminación de reserva', req.body?.detalle_log || `Reserva #${req.params.id}`);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ mensaje: e.message }); }
});

// 6. USUARIOS
app.post('/api/usuarios', async (req, res) => {
  const { nombre, usuario, correo, password, id_rol, estado, usuario_accion, detalle_log } = req.body;
  try {
    const hash = await bcrypt.hash(password || 'Temp1234', 10);
    const [r] = await pool.query(
      'INSERT INTO usuarios (nombre, usuario, correo, password_hash, id_rol, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, usuario, correo, hash, id_rol, estado || 'Activo']
    );
    await registrarHistorial(usuario_accion, 'Registro de usuario', detalle_log || usuario);
    res.status(201).json({ id: r.insertId });
  } catch (e) { res.status(400).json({ mensaje: e.code === 'ER_DUP_ENTRY' ? 'El usuario o correo ya existe.' : e.message }); }
});

app.put('/api/usuarios/:id', async (req, res) => {
  const { nombre, usuario, correo, password, id_rol, estado, usuario_accion, detalle_log } = req.body;
  try {
    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE usuarios SET nombre=?, usuario=?, correo=?, password_hash=?, id_rol=?, estado=? WHERE id=?', [nombre, usuario, correo, hash, id_rol, estado, req.params.id]);
    } else {
      await pool.query('UPDATE usuarios SET nombre=?, usuario=?, correo=?, id_rol=?, estado=? WHERE id=?', [nombre, usuario, correo, id_rol, estado, req.params.id]);
    }
    await registrarHistorial(usuario_accion, 'Edición de usuario', detalle_log || usuario);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ mensaje: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Servidor AdminSeguro CTG activo en http://localhost:${PORT}`));