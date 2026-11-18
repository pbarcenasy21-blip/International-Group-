/* AdminSeguro CTG - núcleo del sistema conectado a API REST (Node.js + MySQL) */
const App = (() => {
  const SES_KEY = 'asctg_session_v1', FLASH = 'asctg_flash';
  const ROLES = { 1: 'Administrador', 2: 'Trabajador autorizado' };
  let memSes = null;
  let cache = { roles: [], usuarios: [], clientes: [], servicios: [], inventario: [], reservas: [], historial: [] };

  /* ---------- utilidades ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const fmtDate = s => { if (!s) return ''; const [y, m, d] = String(s).slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
  const fmtDateTime = iso => { try { return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return iso; } };
  const fmtMoney = n => '$ ' + Number(n || 0).toLocaleString('es-CO');

  const sess = {
    get() { try { return sessionStorage.getItem(SES_KEY); } catch (e) { return memSes; } },
    set(v) { try { sessionStorage.setItem(SES_KEY, v); } catch (e) { memSes = v; } },
    del() { try { sessionStorage.removeItem(SES_KEY); } catch (e) { memSes = null; } }
  };

  /* ---------- sincronización con MySQL vía /api/bootstrap ---------- */
  const db = () => cache;
  function save() { /* persistencia gestionada en MySQL por la API */ }
  function nextId(arr) { return (arr || []).reduce((m, r) => Math.max(m, r.id), 0) + 1; }

  async function reload() {
    const res = await fetch('/api/bootstrap');
    if (res.ok) {
      cache = await res.json();
    }
    return cache;
  }

  /* ---------- sesión y permisos ---------- */
  const session = () => { try { return JSON.parse(sess.get()); } catch (e) { return null; } };

  async function login(usuario, password) {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return { ok: false, msg: data.msg || 'Usuario o contraseña incorrectos.' };
      }
      sess.set(JSON.stringify(data.usuario));
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: 'No se pudo conectar con el servidor.' };
    }
  }

  function logout() {
    sess.del();
    location.href = 'index.html';
  }

  // Matriz de permisos por rol (RNF-02)
  const PERMS = {
    1: { clientes: 'cre', reservas: 'cre', servicios: 'cre', inventario: 'cre', usuarios: 'ce', historial: '' },
    2: { clientes: 'ce', reservas: 'ce', servicios: '', inventario: '', usuarios: '', historial: '' }
  };
  function perms(entity) {
    const s = session(), p = (s && PERMS[s.id_rol] && PERMS[s.id_rol][entity]) || '';
    return { create: p.includes('c'), edit: p.includes('e'), delete: p.includes('r') };
  }

  function log() { /* registrado directamente por el backend en MySQL */ }

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

  async function init(key, title) {
    const s = session();
    if (!s) { location.replace('index.html'); return null; }
    const item = MENU.find(m => m.key === key);
    if (item && !item.roles.includes(s.id_rol)) {
      try { sessionStorage.setItem(FLASH, 'No tienes permiso para acceder a esa sección.'); } catch (e) { }
      location.replace('dashboard.html'); return null;
    }

    await reload();

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

  return { ROLES, esc, norm, today, addDays, fmtDate, fmtDateTime, fmtMoney, db, save, reload, nextId, session, login, logout, perms, log, init, toast, confirmBox, MENU };
})();
