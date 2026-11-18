/* AdminSeguro CTG - módulo genérico de tabla + formulario (conectado a API REST + MySQL) */
const Crud = (() => {
  const { esc, norm } = App;

  function init(cfg) {
    const root = document.getElementById('crud');
    const perm = App.perms(cfg.entity);
    let mode = 'new', editing = null;

    root.innerHTML = `
      <div class="toolbar">
        <label for="search">Buscar ${esc(cfg.singular)}:</label>
        <input type="search" id="search" placeholder="Escribe para filtrar…" autocomplete="off">
        ${cfg.filter ? `<select id="filter" aria-label="${esc(cfg.filter.label)}"><option value="">${esc(cfg.filter.label)}: todos</option>${cfg.filter.options.map(o => `<option>${esc(o)}</option>`).join('')}</select>` : ''}
        ${perm.create ? `<button class="btn" id="btnNew" type="button">+ Nuevo ${esc(cfg.singular)}</button>` : ''}
      </div>
      ${!perm.create && cfg.readOnlyNote ? `<p class="hint">${esc(cfg.readOnlyNote)}</p>` : ''}
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr>${cfg.columns.map(c => `<th scope="col">${esc(c.label)}</th>`).join('')}${cfg.noActions ? '' : '<th scope="col">Acciones</th>'}</tr></thead>
          <tbody id="tbody"></tbody>
        </table>
        <div class="empty" id="empty" hidden>No se encontraron registros.</div>
      </div>
      <p class="count" id="count"></p>
      <dialog id="modal" aria-labelledby="mTitle">
        <form id="form" novalidate>
          <div class="modal-head"><h2 id="mTitle"></h2><button class="x" type="button" id="mClose" aria-label="Cerrar">×</button></div>
          <div class="modal-body"><div class="grid2" id="fields"></div></div>
          <div class="modal-foot">
            <button class="btn ghost" type="button" id="mCancel">Cancelar</button>
            <button class="btn" type="submit" id="mSave">Guardar</button>
          </div>
        </form>
      </dialog>`;
    const $ = id => root.querySelector('#' + id);
    const tbody = $('tbody'), search = $('search'), filter = $('filter'), dlg = $('modal'), form = $('form'), fieldsBox = $('fields');

    const cell = (c, r, d) => c.render ? c.render(r, d) : r[c.key];
    function render() {
      const d = App.db(), q = norm(search.value), f = filter ? filter.value : '';
      let rows = (d[cfg.entity] || []).slice();
      if (cfg.sort) rows.sort(cfg.sort);
      rows = rows.filter(r => (!f || String(r[cfg.filter.key]) === f) && (!q || cfg.columns.some(c => norm(cell(c, r, d)).includes(q))));
      tbody.innerHTML = rows.map(r => {
        const tds = cfg.columns.map(c => {
          const v = esc(cell(c, r, d));
          return `<td data-label="${esc(c.label)}">${c.badge ? `<span class="badge b-${norm(cell(c, r, d))}">${v}</span>` : v}</td>`;
        }).join('');
        const del = perm.delete ? `<button class="btn sm danger" data-act="del" data-id="${r.id}" type="button">Eliminar</button>` : '';
        const act = cfg.noActions ? '' : `<td class="actions-td"><div class="actions">
            <button class="btn sm ghost" data-act="view" data-id="${r.id}" type="button">Ver</button>
            ${perm.edit ? `<button class="btn sm" data-act="edit" data-id="${r.id}" type="button">Editar</button>` : ''}${del}</div></td>`;
        return `<tr>${tds}${act}</tr>`;
      }).join('');
      $('empty').hidden = rows.length > 0;
      $('count').textContent = `${rows.length} de ${(d[cfg.entity] || []).length} registro(s)`;
    }

    const isReq = f => typeof f.required === 'function' ? f.required(mode) : !!f.required;
    const optsOf = f => (typeof f.options === 'function' ? f.options(App.db()) : f.options || []).map(o => typeof o === 'object' ? o : { value: o, label: o });

    function fieldHtml(f, rec) {
      let val = rec ? rec[f.name] : (typeof f.default === 'function' ? f.default() : f.default);
      if (f.type === 'password') val = '';
      if (f.type === 'date' && val) val = String(val).slice(0, 10);
      val = val ?? '';
      const dis = mode === 'view' ? 'disabled' : '';
      const ro = f.computed ? 'readonly' : '';
      const id = 'f_' + f.name;
      let ctl;
      if (f.type === 'select') {
        ctl = `<select id="${id}" name="${f.name}" ${dis}><option value="">Selecciona…</option>${optsOf(f).map(o => `<option value="${esc(o.value)}" ${String(o.value) === String(val) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
      } else if (f.type === 'textarea') {
        ctl = `<textarea id="${id}" name="${f.name}" rows="3" ${dis}>${esc(val)}</textarea>`;
      } else {
        const attrs = [f.min != null ? `min="${f.min}"` : '', f.max != null ? `max="${f.max}"` : '', f.notPast && mode !== 'view' ? `min="${App.today()}"` : '', f.placeholder ? `placeholder="${esc(f.placeholder)}"` : '', f.maxLength ? `maxlength="${f.maxLength}"` : ''].join(' ');
        ctl = `<input id="${id}" name="${f.name}" type="${f.computed ? 'text' : f.type || 'text'}" value="${esc(val)}" ${attrs} ${dis} ${ro} autocomplete="off">`;
      }
      return `<div class="field ${f.full ? 'full' : ''}" data-f="${f.name}"><label for="${id}">${esc(f.label)}${isReq(f) && mode !== 'view' ? ' *' : ''}</label>${ctl}<small class="err" id="e_${f.name}" role="alert"></small></div>`;
    }

    const getVals = () => {
      const v = {};
      cfg.fields.forEach(f => { const el = form.elements[f.name]; if (el) v[f.name] = el.value; });
      return v;
    };
    function recompute() {
      cfg.fields.filter(f => f.computed).forEach(f => { form.elements[f.name].value = f.compute(getVals(), App.db()); });
    }

    function validate(f, vals) {
      const raw = String(vals[f.name] ?? '').trim();
      if (isReq(f) && raw === '') return f.type === 'select' ? `Selecciona ${f.label.toLowerCase()}.` : `${f.label} es obligatorio.`;
      if (raw === '') return '';
      if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw)) return 'Ingresa un correo válido (ej. nombre@correo.com).';
      if (f.pattern && !f.pattern.test(raw)) return f.msg || 'Formato no válido.';
      if (f.minLength && raw.length < f.minLength) return `Debe tener al menos ${f.minLength} caracteres.`;
      if (f.type === 'number') {
        const n = Number(raw);
        if (isNaN(n)) return 'Ingresa un número válido.';
        if (f.integer && !Number.isInteger(n)) return 'Debe ser un número entero.';
        if (f.min != null && n < f.min) return `El valor mínimo es ${f.min}.`;
        if (f.max != null && n > f.max) return `El valor máximo es ${f.max}.`;
      }
      if (f.type === 'date' && f.notPast && raw < App.today()) return 'La fecha no puede ser anterior a hoy.';
      if (f.unique) {
        const dup = (App.db()[cfg.entity] || []).some(r => (!editing || r.id !== editing.id) && norm(r[f.name]) === norm(raw));
        if (dup) return `Ya existe un registro con ese ${f.label.toLowerCase()}.`;
      }
      if (f.validate) { const m = f.validate(raw, vals, App.db(), editing); if (m) return m; }
      return '';
    }
    function showErr(f, msg) {
      const box = fieldsBox.querySelector(`[data-f="${f.name}"]`);
      box.classList.toggle('invalid', !!msg);
      box.classList.toggle('valid', !msg && String(form.elements[f.name].value).trim() !== '');
      box.querySelector('.err').textContent = msg;
    }

    fieldsBox.addEventListener('focusout', e => {
      const f = cfg.fields.find(x => x.name === e.target.name); if (f && mode !== 'view') showErr(f, validate(f, getVals()));
    });
    fieldsBox.addEventListener('input', e => {
      const f = cfg.fields.find(x => x.name === e.target.name);
      if (f && fieldsBox.querySelector(`[data-f="${f.name}"]`).classList.contains('invalid')) showErr(f, validate(f, getVals()));
      recompute();
      if (cfg.onInput) cfg.onInput(e.target.name, form);
    });
    fieldsBox.addEventListener('change', recompute);

    function open(m, rec) {
      mode = m; editing = rec || null;
      $('mTitle').textContent = m === 'new' ? `Nuevo ${cfg.singular}` : m === 'edit' ? `Editar ${cfg.singular}` : `Detalle de ${cfg.singular}`;
      fieldsBox.innerHTML = cfg.fields.map(f => fieldHtml(f, rec)).join('');
      $('mSave').hidden = m === 'view';
      $('mCancel').textContent = m === 'view' ? 'Cerrar' : 'Cancelar';
      recompute();
      dlg.showModal();
      const first = form.elements[cfg.fields[0].name]; if (first && m !== 'view') first.focus();
    }
    const close = () => dlg.close();
    $('mClose').addEventListener('click', close);
    $('mCancel').addEventListener('click', close);
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });

    async function syncDb() {
      if (typeof App.reload === 'function') {
        await App.reload();
        return;
      }
      const r = await fetch('/api/bootstrap');
      if (r.ok) {
        const fresh = await r.json();
        Object.assign(App.db(), fresh);
      }
    }

    /* ---------- guardar en MySQL vía API ---------- */
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (mode === 'view') return;
      const vals = getVals(); let firstBad = null;
      cfg.fields.forEach(f => { const m = validate(f, vals); showErr(f, m); if (m && !firstBad) firstBad = f; });
      if (firstBad) { form.elements[firstBad.name].focus(); App.toast('Revisa los campos marcados en rojo.', 'error'); return; }

      const d = App.db();
      const payload = editing ? { ...editing } : {};
      cfg.fields.forEach(f => {
        if (f.computed) return;
        let v = String(vals[f.name]).trim();
        if (f.type === 'password' && editing && v === '') return;
        if (f.type === 'number' || f.numeric) v = v === '' ? null : Number(v);
        payload[f.name] = v;
      });
      if (cfg.beforeSave) cfg.beforeSave(payload, d, !editing);

      payload.usuario_accion = App.session();
      payload.detalle_log = cfg.label ? cfg.label(payload, d) : (payload.nombre || '');

      try {
        const url = editing ? `/api/${cfg.entity}/${editing.id}` : `/api/${cfg.entity}`;
        const method = editing ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
          App.toast(data.mensaje || data.error || 'Error al guardar en la base de datos.', 'error');
          return;
        }
        await syncDb();
        App.toast(editing ? `${cap(cfg.singular)} actualizado correctamente.` : `${cap(cfg.singular)} registrado correctamente.`);
        close();
        render();
      } catch (err) {
        console.error(err);
        App.toast('No se pudo conectar con el servidor.', 'error');
      }
    });
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

    /* ---------- eventos de la tabla (Eliminar en MySQL) ---------- */
    tbody.addEventListener('click', async e => {
      const b = e.target.closest('button[data-act]'); if (!b) return;
      const d = App.db(), rec = (d[cfg.entity] || []).find(r => r.id === Number(b.dataset.id)); if (!rec) return;
      if (b.dataset.act === 'view') open('view', rec);
      if (b.dataset.act === 'edit') open('edit', rec);
      if (b.dataset.act === 'del') {
        const block = cfg.canDelete ? cfg.canDelete(rec, d) : '';
        if (block) { App.toast(block, 'error'); return; }
        if (await App.confirmBox(`¿Seguro que deseas eliminar este ${cfg.singular}? Esta acción no se puede deshacer.`)) {
          try {
            const res = await fetch(`/api/${cfg.entity}/${rec.id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                usuario_accion: App.session(),
                detalle_log: cfg.label ? cfg.label(rec, d) : `ID ${rec.id}`
              })
            });
            const data = await res.json();
            if (!res.ok) {
              App.toast(data.mensaje || data.error || 'No se pudo eliminar el registro.', 'error');
              return;
            }
            await syncDb();
            App.toast(`${cap(cfg.singular)} eliminado.`);
            render();
          } catch (err) {
            console.error(err);
            App.toast('No se pudo conectar con el servidor.', 'error');
          }
        }
      }
    });
    search.addEventListener('input', render);
    if (filter) filter.addEventListener('change', render);
    const nb = $('btnNew'); if (nb) nb.addEventListener('click', () => open('new'));

    render();
    return { render, open };
  }
  return { init };
})();
