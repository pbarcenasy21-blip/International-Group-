/* AdminSeguro CTG - núcleo del prototipo (frontend)
 * Los datos se guardan en localStorage SOLO para esta entrega.
 * En la cuarta entrega se reemplazan por llamadas a la API (Node.js + MySQL). */
const App = (() => {
  const DB_KEY = 'asctg_db_v1', SES_KEY = 'asctg_session_v1', FLASH = 'asctg_flash';
  const ROLES = { 1: 'Administrador', 2: 'Trabajador autorizado' };
  let memDb = null, memSes = null;

  /* ---------- utilidades ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const fmtDate = s => { if (!s) return ''; const [y, m, d] = String(s).slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
  const fmtDateTime = iso => { try { return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return iso; } };
  const fmtMoney = n => '$ ' + Number(n || 0).toLocaleString('es-CO');

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return k === DB_KEY ? memDb : null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { if (k === DB_KEY) memDb = v; } }
  };
  const sess = {
    get() { try { return sessionStorage.getItem(SES_KEY); } catch (e) { return memSes; } },
    set(v) { try { sessionStorage.setItem(SES_KEY, v); } catch (e) { memSes = v; } },
    del() { try { sessionStorage.removeItem(SES_KEY); } catch (e) { memSes = null; } }
  };

  /* ---------- datos de ejemplo (siguen el modelo E-R del documento) ---------- */
  function seed() {
    const iso = n => new Date(Date.now() - n * 3600e3).toISOString();
    return {
      roles: [{ id: 1, nombre_rol: 'Administrador' }, { id: 2, nombre_rol: 'Trabajador autorizado' }],
      usuarios: [
        { id: 1, nombre: 'Administrador General', usuario: 'admin', correo: 'admin@internationalgroup.co', password: 'Admin123', id_rol: 1, estado: 'Activo' },
        { id: 2, nombre: 'Laura Mendoza', usuario: 'operador', correo: 'laura@internationalgroup.co', password: 'Operador123', id_rol: 2, estado: 'Activo' },
        { id: 3, nombre: 'Carlos Pérez', usuario: 'cperez', correo: 'carlos@internationalgroup.co', password: 'Carlos123', id_rol: 2, estado: 'Inactivo' }
      ],
      clientes: [
        { id: 1, nombre: 'María Fernanda Ruiz', documento: '1045123456', telefono: '3001234567', correo: 'mfruiz@correo.com', fecha_registro: addDays(-30) },
        { id: 2, nombre: 'John Smith', documento: 'P98234571', telefono: '3157778899', correo: 'john.smith@mail.com', fecha_registro: addDays(-20) },
        { id: 3, nombre: 'Andrés Castillo', documento: '73150987', telefono: '3205551122', correo: 'acastillo@correo.com', fecha_registro: addDays(-12) },
        { id: 4, nombre: 'Sofía Herrera', documento: '1129876543', telefono: '3112223344', correo: 'sherrera@correo.com', fecha_registro: addDays(-6) },
        { id: 5, nombre: 'Marie Dubois', documento: 'FR7721903', telefono: '3169990011', correo: 'marie.d@mail.com', fecha_registro: addDays(-2) }
      ],
      servicios: [
        { id: 1, nombre: 'Tour Islas del Rosario', descripcion: 'Día de playa y snorkel en las Islas del Rosario, con almuerzo.', tipo: 'Tour', precio: 180000, estado: 'Activo' },
        { id: 2, nombre: 'City Tour Ciudad Amurallada', descripcion: 'Recorrido guiado a pie por el centro histórico y Getsemaní.', tipo: 'Tour', precio: 65000, estado: 'Activo' },
        { id: 3, nombre: 'Playa Blanca (Barú)', descripcion: 'Excursión de día completo a Playa Blanca.', tipo: 'Excursión', precio: 120000, estado: 'Activo' },
        { id: 4, nombre: 'Chiva Rumbera', descripcion: 'Recorrido nocturno en chiva con música en vivo.', tipo: 'Excursión', precio: 55000, estado: 'Activo' },
        { id: 5, nombre: 'Transporte aeropuerto - hotel', descripcion: 'Traslado privado desde el aeropuerto Rafael Núñez.', tipo: 'Transporte', precio: 45000, estado: 'Inactivo' }
      ],
      inventario: [
        { id: 1, id_servicio: 1, cantidad_disponible: 24, fecha_actualizacion: iso(30) },
        { id: 2, id_servicio: 2, cantidad_disponible: 15, fecha_actualizacion: iso(28) },
        { id: 3, id_servicio: 3, cantidad_disponible: 30, fecha_actualizacion: iso(20) },
        { id: 4, id_servicio: 4, cantidad_disponible: 40, fecha_actualizacion: iso(10) },
        { id: 5, id_servicio: 5, cantidad_disponible: 0, fecha_actualizacion: iso(5) }
      ],
      reservas: [
        { id: 1, id_cliente: 1, id_servicio: 1, fecha: addDays(3), personas: 2, estado: 'Confirmada', total: 360000 },
        { id: 2, id_cliente: 2, id_servicio: 2, fecha: addDays(5), personas: 3, estado: 'Pendiente', total: 195000 },
        { id: 3, id_cliente: 3, id_servicio: 3, fecha: addDays(7), personas: 4, estado: 'Confirmada', total: 480000 },
        { id: 4, id_cliente: 4, id_servicio: 4, fecha: addDays(10), personas: 2, estado: 'Pendiente', total: 110000 },
        { id: 5, id_cliente: 5, id_servicio: 1, fecha: addDays(12), personas: 1, estado: 'Cancelada', total: 180000 }
      ],
      historial: [
        { id: 1, id_usuario: 1, usuario: 'Administrador General', accion: 'Datos de ejemplo', detalle: 'Se cargaron los datos de demostración', fecha_hora: iso(48) }
      ]
    };
  }

  function db() {
    let raw = store.get(DB_KEY), d = null;
    try { d = raw ? JSON.parse(raw) : null; } catch (e) { d = null; }
    if (!d) { d = seed(); save(d); }
    return d;
  }
  function save(d) { store.set(DB_KEY, JSON.stringify(d)); }
  function resetDemo() { save(seed()); }
  function nextId(arr) { return arr.reduce((m, r) => Math.max(m, r.id), 0) + 1; }

  /* ---------- sesión y permisos ---------- */
  const session = () => { try { return JSON.parse(sess.get()); } catch (e) { return null; } };

  function login(usuario, password) {
    const u = db().usuarios.find(x => norm(x.usuario) === norm(usuario) || norm(x.correo) === norm(usuario));
    if (!u || u.password !== password) return { ok: false, msg: 'Usuario o contraseña incorrectos.' };
    if (u.estado !== 'Activo') return { ok: false, msg: 'Tu cuenta está desactivada. Contacta al administrador.' };
    sess.set(JSON.stringify({ id: u.id, nombre: u.nombre, usuario: u.usuario, id_rol: u.id_rol }));
    log('Inicio de sesión', `El usuario ${u.usuario} ingresó al sistema`);
    return { ok: true };
  }
  function logout() { log('Cierre de sesión', 'El usuario cerró sesión'); sess.del(); location.href = 'index.html'; }

  // Matriz de permisos por rol (RNF-02)
  const PERMS = {
    1: { clientes: 'cre', reservas: 'cre', servicios: 'cre', inventario: 'cre', usuarios: 'ce', historial: '' },
    2: { clientes: 'ce', reservas: 'ce', servicios: '', inventario: '', usuarios: '', historial: '' }
  };
  function perms(entity) {
    const s = session(), p = (s && PERMS[s.id_rol] && PERMS[s.id_rol][entity]) || '';
    return { create: p.includes('c'), edit: p.includes('e'), delete: p.includes('r') };
    // 'c' = crear, 'e' = editar, 'r' = remover
  }

  function log(accion, detalle) {
    const s = session(), d = db();
    d.historial.push({ id: nextId(d.historial), id_usuario: s ? s.id : null, usuario: s ? s.nombre : 'Sistema', accion, detalle, fecha_hora: new Date().toISOString() });
    save(d);
  }

  /* ---------- menú y layout ---------- */
  const MENU = [
    { key: 'dashboard', label: 'Inicio', href: 'dashboard.html', icon: '🏠', roles: [1, 2] },
    { key: 'clientes', label: 'Clientes', href: 'clientes.html', icon: '👥', roles: [1, 2] },
    { key: 'reservas', label: 'Reservas', href: 'reservas.html', icon: '🗓️', roles: [1, 2] },
    { key: 'servicios', label: 'Servicios turísticos', href: 'servicios.html', icon: '🧭', roles: [1, 2] },
    { key: 'inventario', label: 'Inventario', href: 'inventario.html', icon: '📦', roles: [1, 2] },
    { key: 'usuarios', label: 'Usuarios y permisos', href: 'usuarios.html', icon: '🔐', roles: [1] },
    { key: 'historial', label: 'Historial de actividad', href: 'historial.html', icon: '📜', roles: [1] }
  ];

  function init(key, title) {
    const s = session();
    if (!s) { location.replace('index.html'); return null; }
    const item = MENU.find(m => m.key === key);
    if (item && !item.roles.includes(s.id_rol)) {
      try { sessionStorage.setItem(FLASH, 'No tienes permiso para acceder a esa sección.'); } catch (e) { }
      location.replace('dashboard.html'); return null;
    }
    const content = document.getElementById('page-content');
    const nav = MENU.filter(m => m.roles.includes(s.id_rol))
      .map(m => `<a href="${m.href}" ${m.key === key ? 'aria-current="page"' : ''}><span aria-hidden="true">${m.icon}</span>${m.label}</a>`).join('');
    const shell = document.createElement('div');
    shell.className = 'shell';
    shell.innerHTML = `
      <aside class="sidebar" id="sidebar" aria-label="Menú principal">
        <div class="brand">AdminSeguro CTG<small>International Group</small></div>
        <nav class="nav">${nav}</nav>
        <div class="side-foot">
          <div class="who"><strong>${esc(s.nombre)}</strong><span>${ROLES[s.id_rol]}</span></div>
          <button class="btn sm block" id="btnLogout" type="button">Cerrar sesión</button>
        </div>
      </aside>
      <div class="overlay" id="overlay"></div>
      <div class="main-wrap">
        <header class="topbar">
          <button class="menu-btn" id="menuBtn" type="button" aria-label="Abrir menú" aria-controls="sidebar" aria-expanded="false">☰</button>
          <h1>${esc(title || (item && item.label) || '')}</h1>
          <span class="chip">${ROLES[s.id_rol]}</span>
        </header>
        <main class="content" id="main"></main>
      </div>`;
    document.body.appendChild(shell);
    document.getElementById('main').appendChild(content);

    const sb = document.getElementById('sidebar'), ov = document.getElementById('overlay'), mb = document.getElementById('menuBtn');
    const toggle = open => { sb.classList.toggle('open', open); ov.classList.toggle('show', open); mb.setAttribute('aria-expanded', open); };
    mb.addEventListener('click', () => toggle(!sb.classList.contains('open')));
    ov.addEventListener('click', () => toggle(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
    document.getElementById('btnLogout').addEventListener('click', logout);

    let flash = null; try { flash = sessionStorage.getItem(FLASH); sessionStorage.removeItem(FLASH); } catch (e) { }
    if (flash) toast(flash, 'error');
    return s;
  }

  /* ---------- toast y confirmación ---------- */
  function toast(msg, type = 'ok') {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast ' + type; t.textContent = msg; box.appendChild(t);
    setTimeout(() => t.remove(), 3800);
  }

  function confirmBox(msg, okText = 'Eliminar') {
    return new Promise(res => {
      const d = document.createElement('dialog');
      d.innerHTML = `<div class="modal-head"><h2>Confirmar acción</h2></div>
        <div class="modal-body"><p>${esc(msg)}</p></div>
        <div class="modal-foot"><button class="btn ghost" data-v="0" type="button">Cancelar</button><button class="btn danger" data-v="1" type="button">${esc(okText)}</button></div>`;
      document.body.appendChild(d);
      d.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (b) { d.close(); d.remove(); res(b.dataset.v === '1'); } });
      d.addEventListener('cancel', () => { d.remove(); res(false); });
      d.showModal();
    });
  }

  return { ROLES, esc, norm, today, addDays, fmtDate, fmtDateTime, fmtMoney, db, save, resetDemo, nextId, session, login, logout, perms, log, init, toast, confirmBox, MENU };
})();
