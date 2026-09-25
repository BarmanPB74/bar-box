// BAR BOX · demo interactiva: la página. Las reglas están en demo.js.
// Cada pantalla se dibuja de nuevo desde el estado; nada de innerHTML con
// texto de quien escribe: todo pasa por textContent.
(function () {
  'use strict';
  var D = window.BarboxDemo, CLAVE = 'barbox-demo-v1';
  var bar = new D.Bar(cargar()), vista = document.getElementById('vista');
  var aviso = document.getElementById('aviso'), feed = document.getElementById('feed');

  function cargar() {
    try { var t = localStorage.getItem(CLAVE); return t ? JSON.parse(t) : null; } catch (e) { return null; }
  }
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(bar.e)); } catch (e) { /* sin almacenamiento */ } }

  // h('div.clase', {atributo: valor, onclick: f}, hijos...)
  function h(etiqueta, attrs) {
    var partes = etiqueta.split('.'), el = document.createElement(partes[0] || 'div');
    if (partes.length > 1) el.className = partes.slice(1).join(' ');
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === false || v == null) return;
      if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
      else if (k === 'texto') el.textContent = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    poner(el, Array.prototype.slice.call(arguments, 2));
    return el;
  }
  // Agrega hijos a cualquier profundidad de listas; salta null y false.
  function poner(el, hijos) {
    [].concat(hijos).forEach(function (x) {
      if (x == null || x === false) return;
      if (Array.isArray(x)) poner(el, x);
      else el.appendChild(typeof x === 'string' ? document.createTextNode(x) : x);
    });
  }
  function decir(texto, malo) {
    aviso.textContent = texto;
    aviso.className = 'demo-aviso' + (malo ? ' malo' : '');
  }
  function hacer(f) {
    try { f(); decir(''); } catch (e) { decir(e.message, true); }
    guardar();
    pintar();
  }
  function ir(ruta) { location.hash = ruta; }

  // --- Pantallas ---------------------------------------------------------
  function mapa() {
    var q = bar.cuadre();
    return [
      h('div.hud', null, h('h1', { texto: 'MAPA DE MESAS' }), h('span.crece'),
        h('span.fecha', null, 'Vendido hoy ', h('b', { texto: D.pesos(q.vendido) }), h('br'),
          bar.e.turno.abierto ? 'Turno #' + bar.e.turno.numero + ' abierto' : 'Caja cerrada')),
      !bar.e.turno.abierto && h('p.nota', { texto: 'La caja está cerrada: ábrela en «Caja» para poder vender.' }),
      bar.e.salones.map(function (s) {
        return h('section.salon', null, h('h2', { texto: s.nombre }),
          h('div.mapa', null, h('div.rejilla c' + s.columnas + ' f' + s.filas, null,
            bar.e.mesas.filter(function (m) { return m.salon === s.id; }).map(function (m) {
              var estado = bar.estadoMesa(m.id), total = bar.total(m.id);
              return h('a.mesa ' + estado + ' ' + m.forma + ' gx' + m.gx + ' gy' + m.gy,
                { href: '#/mesa/' + m.id, 'aria-label': m.nombre + ', ' + estado },
                h('span.pip', { 'aria-hidden': 'true' }), h('span.nombre', { texto: m.nombre }),
                estado === 'libre' ? h('span.puestos', { texto: 'libre' }) : h('span.cifra', { texto: D.pesos(total) }),
                h('span.estado', { texto: { libre: 'Libre', servida: 'Servida', cuenta: 'Pidió la cuenta', sentados: 'Sentados' }[estado] }));
            }))));
      }),
      h('p.nota', { texto: 'Toca una mesa libre y sirve algo de la carta: la cuenta se abre sola.' })
    ];
  }

  function mesa(id) {
    var m = bar.mesa(id);
    if (!m) { ir('/mapa'); return []; }
    var c = bar.e.cuentas[id], total = bar.total(id), puedeCancelar = D.puede(bar.e.rol, 'cancelar');
    var grupos = {};
    bar.e.carta.forEach(function (i) { (grupos[i.categoria] = grupos[i.categoria] || []).push(i); });
    var pago = h('select', { id: 'pago', 'aria-label': 'Forma de pago' },
      ['efectivo', 'tarjeta', 'transferencia'].map(function (f) { return h('option', { value: f, texto: f[0].toUpperCase() + f.slice(1) }); }));
    var conPropina = h('input', { type: 'checkbox', id: 'propina' });
    var sugerida = Math.round(total * 10 / 100 / 100) * 100;
    var otras = bar.e.mesas.filter(function (x) { return x.id !== id; });
    var destino = h('select', { 'aria-label': 'Mesa destino' }, otras.map(function (x) {
      return h('option', { value: x.id, texto: x.nombre + (bar.e.cuentas[x.id] ? ' (tiene cuenta: se juntan)' : ' (libre)') });
    }));
    return [
      h('div.hud', null, h('a.volver', { href: '#/mapa', texto: '‹ Mapa' }), h('h1', { texto: 'MESA ' + m.nombre }),
        h('span.crece'), h('span.fecha', { texto: c ? 'Cuenta #' + c.id + (c.pedida ? ' · pidió la cuenta' : '') : 'Libre' })),
      h('div.dos', null,
        h('section.panel', { id: 'carta' }, h('h2', { texto: 'Carta' }), h('p.pie', { texto: 'Un toque = un servido. Descuenta su receta del inventario.' }),
          Object.keys(grupos).map(function (g) {
            return [h('h3', { texto: g }), h('div.carta', null, grupos[g].map(function (i) {
              var rinde = bar.rinde(i);
              return h('form', null, h('button', { type: 'button', disabled: rinde < 1, onclick: function () { hacer(function () { bar.servir(id, i.id); }); } },
                i.nombre, h('b', { texto: D.pesos(i.precio) }),
                h('small', { texto: rinde < 1 ? 'agotado' : 'quedan para ' + rinde + (i.cocina ? ' · cocina' : '') })));
            }))];
          })),
        h('section.panel', { id: 'cobro' }, h('h2', { texto: 'Pagar' }),
          h('div.total', null, h('span', { texto: 'Total de la cuenta' }), h('strong', { texto: D.pesos(total) })),
          h('label', { for: 'pago', texto: 'Forma de pago' }), pago,
          h('label.casilla', null, conPropina, ' Propina sugerida (10 %): ' + D.pesos(sugerida)),
          h('p.nota', { texto: 'La propina es voluntaria: pregúntale al cliente. No suma a las ventas.' }),
          h('div.acciones', null,
            h('button.boton', { type: 'button', disabled: !total, texto: 'Cobrar ' + D.pesos(total), onclick: function () {
              hacer(function () { var r = bar.cobrar(id, pago.value, conPropina.checked); ir('/comprobante/' + r.id); });
            } }),
            c && h('button.boton suave', { type: 'button', texto: c.pedida ? 'Quitar: pidió la cuenta' : 'Marcar: pidió la cuenta',
              onclick: function () { hacer(function () { bar.pedirCuenta(id); }); } })))),
      c && h('section.panel', { id: 'detalle' }, h('h2', { texto: 'Lo servido' }),
        !puedeCancelar && h('p.nota', { texto: 'Como mesera no puedes cancelar: se le pide al barista o al dueño. Cambia de cargo arriba para probarlo.' }),
        c.renglones.filter(function (r) { return !r.retiro; }).map(function (r) {
          var clase = h('select', { 'aria-label': 'Qué pasó' }, Object.keys(D.RETIROS).map(function (k) { return h('option', { value: k, texto: D.RETIROS[k] }); }));
          var motivo = h('input', { placeholder: 'Motivo (queda con tu nombre)', maxlength: 120, 'aria-label': 'Motivo' });
          return [h('div.renglon', null, h('span.q', { texto: String(r.qty) }),
            h('span.txt', null, h('b', { texto: r.nombre }), h('small', { texto: D.pesos(r.precio) + ' · ' + r.hora + (r.estado === 'pendiente' ? ' · en cocina' : '') })),
            h('span.val', { texto: D.pesos(r.precio * r.qty) })),
            puedeCancelar && h('details.perdida', null, h('summary.nota', { texto: 'Cancelar ' + r.nombre }),
              h('div.fila', null, h('div', null, clase), h('div', null, motivo)),
              h('button.boton suave', { type: 'button', texto: 'Cancelar', onclick: function () {
                hacer(function () { bar.retirar(id, r.id, clase.value, motivo.value); });
              } }))];
        }),
        c.renglones.some(function (r) { return r.retiro; }) && [h('h3', { texto: 'Retirado de la cuenta' }),
          c.renglones.filter(function (r) { return r.retiro; }).map(function (r) {
            return h('div.renglon', null, h('span.q', { texto: String(r.qty) }),
              h('span.txt', null, h('b', { texto: r.nombre }), h('small', { texto: D.RETIROS[r.retiro] + ' · ' + r.motivo + ' · ' + r.autor })),
              h('span.val', null, h('s', { texto: D.pesos(r.precio * r.qty) })));
          })],
        h('details', null, h('summary.nota', { texto: 'Pasar la cuenta a otra mesa' }), destino,
          h('button.boton suave', { type: 'button', texto: 'Pasar', onclick: function () {
            hacer(function () { bar.mover(id, destino.value); ir('/mesa/' + destino.value); });
          } })))
    ];
  }

  function comprobante(numero) {
    var r = bar.e.cobradas.filter(function (x) { return String(x.id) === numero; })[0];
    if (!r) return [h('p.nota', { texto: 'Ese comprobante ya no está (se abrió otro turno).' }), h('a.boton', { href: '#/mapa', texto: 'Volver al mapa' })];
    return [h('div.demo-ticket', null,
      h('p', null, h('b', { texto: 'BAR LA ESQUINA' }), h('br'), 'Comprobante de venta #' + r.id, h('br'), 'Mesa ' + r.mesa + ' · ' + r.hora),
      h('hr'), r.renglones.map(function (x) { return h('p.linea', null, h('span', { texto: x.qty + ' × ' + x.nombre }), h('span', { texto: D.pesos(x.precio * x.qty) })); }),
      h('hr'), h('p.linea', null, h('b', { texto: 'Total' }), h('b', { texto: D.pesos(r.total) })),
      r.propina ? h('p.linea', null, h('span', { texto: 'Propina voluntaria' }), h('span', { texto: D.pesos(r.propina) })) : null,
      h('p.linea', null, h('span', { texto: 'Pago' }), h('span', { texto: r.pago })),
      h('hr'), h('p.pequeno', { texto: 'No es factura electrónica. Atendió: ' + r.autor })),
      h('div.acciones', null, h('a.boton', { href: '#/mapa', texto: 'Volver al mapa' }))];
  }

  function caja() {
    var q = bar.cuadre(), abierta = bar.e.turno.abierto;
    var clase = h('select', { 'aria-label': 'Qué pasó' }, h('option', { value: 'retiro', texto: 'Salió plata del cajón' }), h('option', { value: 'ingreso', texto: 'Entró plata al cajón' }));
    var monto = h('input', { inputmode: 'numeric', placeholder: 'Cuánto, en pesos', 'aria-label': 'Cuánto' });
    var motivo = h('input', { placeholder: 'Pagué el hielo', 'aria-label': 'Motivo' });
    var contado = h('input', { inputmode: 'numeric', placeholder: 'Lo que contaste, en pesos', 'aria-label': 'Contado' });
    var base = h('input', { inputmode: 'numeric', value: '200000', 'aria-label': 'Base' });
    var fila = function (a, b, v) { return h('div.renglon', null, h('span.txt', null, h('b', { texto: a }), h('small', { texto: b })), h('span.val', { texto: v })); };
    var numero = function (el) { return parseInt(el.value.replace(/\D/g, ''), 10) * 100; };
    return [
      h('div.hud', null, h('h1', { texto: 'CAJA' }), h('span.crece'), h('span.fecha', { texto: abierta ? 'Turno #' + bar.e.turno.numero + ' abierto' : 'Caja cerrada' })),
      abierta ? h('div.dos', null,
        h('section.panel', null, h('h2', { texto: 'Movimientos de caja' }),
          h('p.pie', { texto: 'Pagar el hielo, dejar un cambio: sin esto, el cuadre miente.' }), clase, monto, motivo,
          h('div.acciones', null, h('button.boton suave', { type: 'button', texto: 'Registrar', onclick: function () {
            hacer(function () { bar.moverCaja(clase.value, numero(monto), motivo.value); });
          } })),
          bar.e.caja.map(function (m) { return fila(m.clase === 'retiro' ? 'Retiro' : 'Ingreso', m.motivo + ' · ' + m.autor, (m.clase === 'retiro' ? '− ' : '+ ') + D.pesos(m.monto)); })),
        h('section.panel', null, h('h2', { texto: 'Cuadre en vivo' }),
          fila('Base', 'con lo que abriste', D.pesos(q.base)),
          fila('Ventas en efectivo', q.cuentas + ' cuentas cobradas', '+ ' + D.pesos(q.efectivo)),
          fila('Propinas en efectivo', 'no son venta: son del equipo', '+ ' + D.pesos(q.propinasEfectivo)),
          fila('Ingresos de caja', '', '+ ' + D.pesos(q.ingresos)),
          fila('Retiros de caja', '', '− ' + D.pesos(q.retiros)),
          h('div.total', null, h('span', { texto: 'Debe haber en el cajón' }), h('strong', { texto: D.pesos(q.esperado) })),
          h('p.nota', { texto: 'Tarjeta y transferencia: ' + D.pesos(q.otros) + ' (no están en el cajón).' }),
          h('h2', { texto: 'Cerrar el turno' }),
          h('p.nota', { texto: 'Cuenta la plata antes de mirar el esperado. La diferencia se guarda tal cual.' }),
          contado, h('div.acciones', null, h('button.boton riesgo', { type: 'button', texto: 'Cerrar caja', onclick: function () {
            hacer(function () { bar.cerrarCaja(numero(contado)); });
          } }))))
      : h('section.panel', null, h('h2', { texto: 'Abrir caja' }),
          bar.e.cierre && h('p.nota', { texto: 'Último cierre: esperado ' + D.pesos(bar.e.cierre.esperado) + ', contado ' + D.pesos(bar.e.cierre.contado) +
            ', diferencia ' + D.pesos(bar.e.cierre.diferencia) + ' (' + bar.e.cierre.autor + ').' }),
          h('label', { texto: 'Base (pesos en el cajón al abrir)' }), base,
          h('div.acciones', null, h('button.boton', { type: 'button', texto: 'Abrir caja', onclick: function () { hacer(function () { bar.abrirCaja(numero(base)); }); } })))
    ];
  }

  function inventario() {
    var costos = D.puede(bar.e.rol, 'costos');
    return [h('div.hud', null, h('h1', { texto: 'INVENTARIO' })),
      h('section.panel', null, h('p.pie', { texto: 'Cada venta descuenta su receta. Sírvele algo a una mesa y vuelve aquí.' }),
        h('div.tabla', null, h('table', null,
          h('tr', null, h('th', { texto: 'Producto' }), h('th', { texto: 'Existencia' }), h('th', { texto: 'Estado' }), costos && h('th', { texto: 'Costo' })),
          bar.e.productos.map(function (p) {
            var estado = p.stock === 0 ? ['alarma', 'agotado'] : p.stock <= p.minimo ? ['oro', 'pedir'] : ['frio', 'bien'];
            return h('tr', null, h('td', { texto: p.nombre }), h('td', { texto: D.cantidad(p.stock) + ' ' + p.unidad }),
              h('td', null, h('span.etiqueta ' + estado[0], { texto: estado[1] })), costos && h('td', { texto: D.pesos(p.costo) + '/' + p.unidad }));
          }))),
        !costos && h('p.nota', { texto: 'La mesera no ve costos: sólo el dueño y el barista.' }))];
  }

  function anillo(filas) {
    var total = filas.reduce(function (s, f) { return s + f.valor; }, 0), r = (100 / (2 * Math.PI)).toFixed(4), inicio = 0;
    var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 42 42'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Cancelado y cortesías por producto');
    var circulo = function (clase, dash, offset) {
      var c = document.createElementNS(ns, 'circle');
      [['class', clase], ['cx', 21], ['cy', 21], ['r', r], ['fill', 'none'], ['stroke-width', 5]].forEach(function (a) { c.setAttribute(a[0], a[1]); });
      if (dash) { c.setAttribute('stroke-dasharray', dash); c.setAttribute('stroke-dashoffset', offset); }
      return c;
    };
    svg.appendChild(circulo('pista'));
    filas.forEach(function (f, i) {
      var largo = f.valor * 100 / total, trazo = Math.max(largo - (filas.length > 1 ? 0.8 : 0), 0.4);
      var c = circulo('serie-' + (i + 1), trazo.toFixed(2) + ' ' + (100 - trazo).toFixed(2), (25 - inicio).toFixed(2));
      var t = document.createElementNS(ns, 'title'); t.textContent = f.nombre + ': ' + D.pesos(f.valor); c.appendChild(t);
      svg.appendChild(c); inicio += largo;
    });
    return svg;
  }

  function contabilidad() {
    if (!D.puede(bar.e.rol, 'contabilidad')) return [h('div.hud', null, h('h1', { texto: 'CONTABILIDAD' })),
      h('p.nota', { texto: 'Sólo la ve el dueño. Cambia de cargo arriba.' })];
    var nuevos = bar.e.retirados.slice(bar.e.revisado), por = {};
    bar.e.retirados.forEach(function (r) { por[r.nombre] = (por[r.nombre] || 0) + r.valor; });
    var filas = Object.keys(por).map(function (k) { return { nombre: k, valor: por[k] }; }).sort(function (a, b) { return b.valor - a.valor; }).slice(0, 4);
    var q = bar.cuadre();
    return [h('div.hud', null, h('h1', { texto: 'CONTABILIDAD' })),
      h('section.panel revision' + (nuevos.length ? ' pendiente' : ''), null, h('h2', { texto: 'Revisión del día' }),
        bar.e.cierre && h('p.nota', { texto: 'Último cierre: diferencia ' + D.pesos(bar.e.cierre.diferencia) + ' · vendido ' + D.pesos(bar.e.cierre.vendido) }),
        nuevos.length ? [nuevos.map(function (r) {
          return h('div.renglon', null, h('span.q', { texto: String(r.qty) }),
            h('span.txt', null, h('b', { texto: r.nombre + ' · ' + D.RETIROS[r.clase] }), h('small', { texto: r.motivo + ' · ' + r.autor + ' · ' + r.mesa + ' ' + r.hora })),
            h('span.val', { texto: D.pesos(r.valor) }));
        }), h('p.nota', { texto: 'En la app real se marca con la clave de revisión del dueño, distinta de la de entrar.' }),
          h('button.boton suave', { type: 'button', texto: 'Marcar como leído', onclick: function () { hacer(function () { bar.e.revisado = bar.e.retirados.length; }); } })]
        : h('p.nota', { texto: 'Todo revisado. Cancela algo en una mesa y vuelve aquí.' })),
      h('section.panel', null, h('h2', { texto: 'Cancelado y cortesías' }),
        filas.length ? h('div.grafica-anillo', null, anillo(filas), h('ul.leyenda', null, filas.map(function (f, i) {
          return h('li', null, h('span.muestra serie-' + (i + 1), { 'aria-hidden': 'true' }), h('span', null, h('b', { texto: f.nombre }), ' · ' + D.pesos(f.valor)));
        }))) : h('p.nota', { texto: 'Nada cancelado todavía.' })),
      h('section.panel', null, h('h2', { texto: 'Propinas del turno' }),
        h('div.total', null, h('span', { texto: 'Total' }), h('strong', { texto: D.pesos(q.propinas) })),
        h('p.nota', { texto: 'En la app se reparten por porcentaje o por días × horas, al peso exacto.' }))];
  }

  function plano() {
    if (!D.puede(bar.e.rol, 'plano')) return [h('div.hud', null, h('h1', { texto: 'PLANO' })), h('p.nota', { texto: 'Acomodar el plano es del dueño o del barista.' })];
    var elegida = plano.elegida;
    return [h('div.hud', null, h('h1', { texto: 'PLANO DE LA SALA' })),
      h('p.nota', { texto: elegida ? 'Ahora toca la casilla donde va ' + bar.mesa(elegida).nombre + ' (sobre otra mesa, se cambian).' : 'Toca una mesa y luego la casilla donde está en tu local.' }),
      bar.e.salones.map(function (s) {
        var cols = Math.min(6, s.columnas + 1), filas = Math.min(6, s.filas + 1), celdas = [];
        for (var y = 1; y <= filas; y++) for (var x = 1; x <= cols; x++) celdas.push([x, y]);
        return [h('h3.plano-titulo', { texto: s.nombre }), h('div.mapa', null, h('div.plano c' + cols, null, celdas.map(function (p) {
          var m = bar.e.mesas.filter(function (z) { return z.salon === s.id && z.gx === p[0] && z.gy === p[1]; })[0];
          return h('button.celda ' + (m ? 'ficha ' + m.forma : 'libre') + ' gx' + p[0] + ' gy' + p[1], {
            type: 'button', 'aria-pressed': m && m.id === elegida ? 'true' : false, texto: m ? m.nombre : '',
            'aria-label': m ? m.nombre : 'Casilla libre ' + p[0] + ',' + p[1],
            onclick: function () {
              if (elegida && (!m || m.id !== elegida)) { plano.elegida = null; hacer(function () { bar.colocar(elegida, s.id, p[0], p[1]); }); }
              else if (m) { plano.elegida = m.id === elegida ? null : m.id; pintar(); }
            } });
        })))];
      })];
  }

  // --- Marco -----------------------------------------------------------
  var RUTAS = { mapa: mapa, mesa: mesa, comprobante: comprobante, caja: caja, inventario: inventario, contabilidad: contabilidad, plano: plano };

  function pintar() {
    var partes = (location.hash.replace(/^#\//, '') || 'mapa').split('/');
    var f = RUTAS[partes[0]] || mapa;
    vista.textContent = '';
    poner(vista, f(partes[1]));
    Array.prototype.forEach.call(document.querySelectorAll('.demo-tabs a'), function (a) {
      a.setAttribute('aria-current', a.getAttribute('href') === '#/' + partes[0] ? 'page' : 'false');
    });
    document.getElementById('rol').value = bar.e.rol;
    feed.textContent = '';
    bar.e.avisos.forEach(function (a) {
      feed.appendChild(h('li', null, h('span.demo-num', { texto: '#' + a.n }), h('b', { texto: a.tipo }), ' ' + a.texto + ' · ' + a.hora));
    });
    if (!bar.e.avisos.length) feed.appendChild(h('li', { texto: 'Todavía nada. Sirve algo en una mesa.' }));
  }

  document.getElementById('rol').addEventListener('change', function (e) { hacer(function () { bar.e.rol = e.target.value; }); });
  document.getElementById('reiniciar').addEventListener('click', function () {
    bar = new D.Bar(); plano.elegida = null; guardar(); decir('Demo reiniciada.'); ir('/mapa'); pintar();
  });
  window.addEventListener('hashchange', function () { decir(''); pintar(); });
  pintar();
})();
