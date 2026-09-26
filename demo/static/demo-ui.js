// BAR BOX · demo interactiva: la página. Las reglas están en demo.js.
// Cada pantalla se dibuja de nuevo desde el estado; nada de innerHTML con
// texto de quien escribe: todo pasa por textContent.
(function () {
  'use strict';
  var D = window.BarboxDemo, CLAVE = 'barbox-demo-v2';
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
  function poner(el, hijos) {
    [].concat(hijos).forEach(function (x) {
      if (x == null || x === false || x === 0 || x === '') return;     // «lista.length && …» con lista vacía da 0
      if (Array.isArray(x)) poner(el, x);
      else el.appendChild(typeof x === 'object' ? x : document.createTextNode(String(x)));
    });
  }
  function decir(texto, malo) {
    aviso.textContent = texto;
    aviso.className = 'demo-aviso' + (malo ? ' malo' : '');
  }
  function hacer(f, bien) {
    try { var r = f(); decir(typeof bien === 'function' ? bien(r) : bien || ''); } catch (e) { decir(e.message, true); }
    guardar();
    pintar();
  }
  function ir(ruta) { location.hash = ruta; }
  function pesosDe(el) { var n = parseInt(String(el.value).replace(/\D/g, ''), 10); return isNaN(n) ? NaN : n * 100; }
  function neg() { return bar.negocio(); }
  function hud(titulo, derecha) { return h('div.hud', null, h('h1', { texto: titulo }), h('span.crece'), derecha && h('span.fecha', { texto: derecha })); }
  function fila(a, b, v) { return h('div.renglon', null, h('span.txt', null, h('b', { texto: a }), b && h('small', { texto: b })), h('span.val', { texto: v })); }
  function soloPara(que, titulo, texto) {
    return D.puede(bar.e.rol, que) ? null : [hud(titulo), h('p.nota', { texto: texto + ' Cambia de cargo arriba para probarlo.' })];
  }

  // --- Recorrido: el turno completo, paso a paso ---------------------------
  function inicio() {
    var hechos = D.HITOS.filter(function (x) { return bar.e.hitos[x[0]]; }).length;
    return [
      hud('RECORRIDO DE UN TURNO', hechos + ' de ' + D.HITOS.length + ' pasos'),
      h('section.panel', null, h('h2', { texto: '¿Qué negocio quieres probar?' }),
        h('p.pie', { texto: 'BAR BOX sirve para cualquier negocio que vende en puestos: mesas, sillas o cajas de mostrador. Cambiar de negocio empieza la demo de cero.' }),
        h('div.demo-negocios', null, Object.keys(D.NEGOCIOS).map(function (k) {
          var n = D.NEGOCIOS[k];
          return h('button.demo-negocio', { type: 'button', 'aria-pressed': bar.e.tipo === k ? 'true' : 'false', onclick: function () {
            if (bar.e.tipo === k) return;
            bar = new D.Bar(D.inicial(k)); guardar(); decir('Ahora estás en ' + n.nombre + ' (inventado).'); pintar();
          } }, h('b', { texto: n.tipo }), h('small', { texto: n.nombre + ' · ' + n.carta.length + ' productos o servicios' }));
        }))),
      h('section.panel', null, h('h2', { texto: 'Haz el turno' }),
        h('ol.demo-pasos', null, D.HITOS.map(function (x) {
          var hecho = !!bar.e.hitos[x[0]];
          return h('li' + (hecho ? '.hecho' : ''), null, h('span.demo-marca', { 'aria-hidden': 'true', texto: hecho ? '✓' : '' }),
            h('a', { href: '#/' + x[2], texto: x[1] }), hecho && h('span.visually', { texto: ' (hecho)' }));
        })),
        hechos === D.HITOS.length && h('p.nota', { texto: '¡Turno completo! Así se ve un día en BAR BOX: todo cuadra, todo queda con nombre y hora, y el dueño lo revisa en un minuto.' }),
        h('div.acciones', null,
          h('button.boton', { type: 'button', texto: 'Simular hora pico (12 ventas)', onclick: function () {
            hacer(function () { return bar.horaPico(12); }, function (n) { return n + ' ventas de ejemplo cobradas. Mira Caja y el Tablero.'; });
          } }),
          h('a.boton suave', { href: '#/' + (D.HITOS.filter(function (x) { return !bar.e.hitos[x[0]]; })[0] || ['', '', 'tablero'])[2], texto: 'Ir al siguiente paso' }))),
      h('p.nota', { texto: 'Todo es inventado y pasa en tu navegador. Las tarifas de impuesto son de ejemplo: cada negocio confirma las suyas con su contador.' })
    ];
  }

  // --- Puestos (mesas, sillas, cajas) --------------------------------------
  function mapa() {
    var q = bar.cuadre(), n = neg();
    return [
      hud(n.puesto.toUpperCase() + 'S', 'Vendido ' + D.pesos(q.vendido)),
      !bar.e.turno.abierto && h('p.nota', null, 'La caja está cerrada: ', h('a', { href: '#/caja', texto: 'ábrela' }), ' para poder vender.'),
      bar.e.salones.map(function (s) {
        var dim = bar.dimensiones(s.id);
        return h('section.salon', null, h('h2', { texto: s.nombre }),
          h('div.mapa', null, h('div.rejilla c' + dim.columnas + ' f' + dim.filas, null,
            bar.e.mesas.filter(function (m) { return m.salon === s.id; }).map(function (m) {
              var estado = bar.estadoMesa(m.id), total = bar.total(m.id);
              return h('a.mesa ' + estado + ' ' + m.forma + ' gx' + m.gx + ' gy' + m.gy,
                { href: '#/mesa/' + m.id, 'aria-label': m.nombre + ', ' + estado },
                h('span.pip', { 'aria-hidden': 'true' }), h('span.nombre', { texto: m.nombre }),
                estado === 'libre' ? h('span.puestos', { texto: 'libre' }) : h('span.cifra', { texto: D.pesos(total) }),
                h('span.estado', { texto: { libre: 'Libre', servida: 'Con pedido', cuenta: 'Pidió la cuenta', sentados: 'Atendiendo' }[estado] }));
            }))));
      }),
      h('p.nota', { texto: 'Toca un puesto libre y ' + n.verbo.toLowerCase() + ' algo: la cuenta se abre sola.' })
    ];
  }

  function formaDePago(total) {
    var filas = [0, 1, 2].map(function (i) {
      var medio = h('select', { 'aria-label': 'Forma de pago ' + (i + 1) }, D.MEDIOS.map(function (f) {
        return h('option', { value: f, texto: f[0].toUpperCase() + f.slice(1), selected: D.MEDIOS[i] === f });
      }));
      var monto = h('input', { inputmode: 'numeric', 'aria-label': 'Monto ' + (i + 1), value: i === 0 && total ? String(total / 100) : '',
                               placeholder: i === 0 ? '' : 'Opcional' });
      return { medio: medio, monto: monto, el: h('div.fila demo-pago', null, h('div', null, medio), h('div', null, monto)) };
    });
    return filas;
  }

  function mesa(id) {
    var m = bar.mesa(id), n = neg();
    if (!m) { ir('/mapa'); return []; }
    var c = bar.e.cuentas[id], total = bar.total(id), puedeCancelar = D.puede(bar.e.rol, 'cancelar');
    var grupos = {};
    bar.e.carta.forEach(function (i) { (grupos[i.categoria] = grupos[i.categoria] || []).push(i); });
    var pagos = formaDePago(total);
    var conPropina = h('input', { type: 'checkbox', id: 'propina' });
    var sugerida = Math.round(total * D.PROPINA / 100 / 100) * 100;
    var otras = bar.e.mesas.filter(function (x) { return x.id !== id; });
    var destino = h('select', { 'aria-label': 'Puesto destino' }, otras.map(function (x) {
      return h('option', { value: x.id, texto: x.nombre + (bar.e.cuentas[x.id] ? ' (tiene cuenta: se juntan)' : ' (libre)') });
    }));
    return [
      h('div.hud', null, h('a.volver', { href: '#/mapa', texto: '‹ ' + n.puesto + 's' }), h('h1', { texto: m.nombre.toUpperCase() }),
        h('span.crece'), h('span.fecha', { texto: c ? 'Cuenta #' + c.id + (c.pedida ? ' · pidió la cuenta' : '') : 'Libre' })),
      h('div.dos', null,
        h('section.panel', { id: 'carta' }, h('h2', { texto: 'Carta' }),
          h('p.pie', { texto: 'Un toque = uno. Descuenta su receta (insumos) del inventario y congela su costo.' }),
          Object.keys(grupos).map(function (g) {
            return [h('h3', { texto: g }), h('div.carta', null, grupos[g].map(function (i) {
              var rinde = bar.rinde(i);
              return h('form', null, h('button', { type: 'button', onclick: function () {
                hacer(function () { return bar.servir(id, i.id); }, function (faltan) {
                  return faltan && faltan.length ? 'Vendido sin existencia de ' + faltan.join(', ') + ': queda pendiente en Inventario.' : '';
                });
              } }, i.nombre, h('b', { texto: D.pesos(i.precio) }),
                h('small', { texto: rinde < 1 ? 'sin existencia: se vende y queda pendiente' : 'alcanza para ' + rinde + (i.cocina ? ' · preparación' : '') })));
            }))];
          })),
        h('section.panel', { id: 'cobro' }, h('h2', { texto: 'Cobrar' }),
          h('div.total', null, h('span', { texto: 'Total de la cuenta' }), h('strong', { texto: D.pesos(total) })),
          h('p.pie', { texto: 'Hasta 3 formas de pago. Para dividir, baja el primer monto y escribe el resto en otra línea.' }),
          pagos.map(function (p) { return p.el; }),
          h('label.casilla', null, conPropina, ' Propina voluntaria (' + D.PROPINA + ' %): ' + D.pesos(sugerida)),
          h('p.nota', { texto: 'La propina no suma a las ventas: es del equipo. Va por la primera forma de pago.' }),
          h('div.acciones', null,
            h('button.boton', { type: 'button', disabled: !total, texto: 'Cobrar ' + D.pesos(total), onclick: function () {
              hacer(function () {
                var lista = pagos.map(function (p) { return { medio: p.medio.value, monto: pesosDe(p.monto) || 0 }; });
                var r = bar.cobrar(id, lista, conPropina.checked, lista[0].medio);
                ir('/comprobante/' + r.id);
              });
            } }),
            c && h('button.boton suave', { type: 'button', texto: c.pedida ? 'Quitar: pidió la cuenta' : 'Marcar: pidió la cuenta',
              onclick: function () { hacer(function () { bar.pedirCuenta(id); }); } })))),
      c && h('section.panel', { id: 'detalle' }, h('h2', { texto: 'Lo pedido' }),
        !puedeCancelar && h('p.nota', { texto: 'Como ' + n.etiquetas[bar.e.rol].toLowerCase() + ' no puedes cancelar: se le pide al encargado o al dueño. Cambia de cargo arriba para probarlo.' }),
        c.renglones.filter(function (r) { return !r.retiro; }).map(function (r) {
          var clase = h('select', { 'aria-label': 'Qué pasó' }, Object.keys(D.RETIROS).map(function (k) { return h('option', { value: k, texto: D.RETIROS[k] }); }));
          var motivo = h('input', { placeholder: 'Motivo (queda con tu nombre)', maxlength: 120, 'aria-label': 'Motivo' });
          return [h('div.renglon', null, h('span.q', { texto: String(r.qty) }),
            h('span.txt', null, h('b', { texto: r.nombre }), h('small', { texto: D.pesos(r.precio) + ' · ' + r.hora + (r.estado === 'pendiente' ? ' · en preparación' : '') })),
            h('span.val', { texto: D.pesos(r.precio * r.qty) })),
            puedeCancelar && h('details.perdida', null, h('summary.nota', { texto: 'Cancelar ' + r.nombre }),
              h('div.fila', null, h('div', null, clase), h('div', null, motivo)),
              h('button.boton suave', { type: 'button', texto: 'Cancelar', onclick: function () {
                hacer(function () { bar.retirar(id, r.id, clase.value, motivo.value); }, 'Cancelado con motivo: le llega al dueño en su revisión.');
              } }))];
        }),
        c.renglones.some(function (r) { return r.retiro; }) && [h('h3', { texto: 'Retirado de la cuenta (no se borra)' }),
          c.renglones.filter(function (r) { return r.retiro; }).map(function (r) {
            return h('div.renglon', null, h('span.q', { texto: String(r.qty) }),
              h('span.txt', null, h('b', { texto: r.nombre }), h('small', { texto: D.RETIROS[r.retiro] + ' · ' + r.motivo + ' · ' + r.autor })),
              h('span.val', null, h('s', { texto: D.pesos(r.precio * r.qty) })));
          })],
        h('details', null, h('summary.nota', { texto: 'Pasar la cuenta a otro puesto' }), destino,
          h('button.boton suave', { type: 'button', texto: 'Pasar', onclick: function () {
            hacer(function () { bar.mover(id, destino.value); ir('/mesa/' + destino.value); });
          } })))
    ];
  }

  function comprobante(numero) {
    var r = bar.e.cobradas.filter(function (x) { return String(x.id) === numero; })[0], n = neg();
    if (!r) return [h('p.nota', { texto: 'Ese comprobante ya no está (se abrió otro turno).' }), h('a.boton', { href: '#/mapa', texto: 'Volver' })];
    var elegir = h('select', { 'aria-label': 'A nombre de' }, h('option', { value: '', texto: 'Consumidor final (hasta 5 UVT)' }),
      bar.e.clientes.map(function (k) { return h('option', { value: String(k.id), texto: k.nombre + ' · ' + k.doc + (k.dv ? '-' + k.dv : '') }); }));
    return [h('div.demo-ticket', null,
      h('p', null, h('b', { texto: n.nombre.toUpperCase() }), h('br'), 'Comprobante de venta #' + r.id, h('br'), r.mesa + ' · ' + r.hora),
      h('hr'), r.renglones.map(function (x) { return h('p.linea', null, h('span', { texto: x.qty + ' × ' + x.nombre }), h('span', { texto: D.pesos(x.precio * x.qty) })); }),
      h('hr'), h('p.linea', null, h('b', { texto: 'Total' }), h('b', { texto: D.pesos(r.total) })),
      r.pagos.map(function (p) { return h('p.linea', null, h('span', { texto: p.medio }), h('span', { texto: D.pesos(p.monto) })); }),
      r.propina ? h('p.linea', null, h('span', { texto: 'Propina voluntaria (' + r.medioPropina + ')' }), h('span', { texto: D.pesos(r.propina) })) : null,
      h('hr'), h('p.pequeno', { texto: 'No es factura electrónica. Atendió: ' + r.autor })),
      h('section.panel', null, h('h2', { texto: 'Factura electrónica' }),
        r.factura ? h('p', null, 'Ya tiene factura: ', h('a', { href: '#/factura/' + r.factura, texto: r.factura }))
        : D.puede(bar.e.rol, 'facturar') ? [
            h('p.pie', null, '¿El cliente la pide a su nombre? ', h('a', { href: '#/clientes', texto: 'Guarda su ficha' }), ' y elígelo aquí.'),
            elegir, h('div.acciones', null, h('button.boton', { type: 'button', texto: 'Emitir factura', onclick: function () {
              hacer(function () { var f = bar.facturar(r.id, elegir.value ? Number(elegir.value) : null); ir('/factura/' + f.numero); });
            } }))]
        : h('p.nota', { texto: 'La factura la emite el dueño o el encargado.' })),
      h('div.acciones', null, h('a.boton', { href: '#/mapa', texto: 'Volver a ' + n.puesto.toLowerCase() + 's' }))];
  }

  function factura(numero) {
    var f = bar.e.facturas.filter(function (x) { return x.numero === numero; })[0], n = neg();
    if (!f) return [h('p.nota', { texto: 'Esa factura no está.' })];
    return [h('div.demo-ticket', null,
      h('p.demo-sello', { texto: 'PRUEBAS · SIN VALIDEZ FISCAL' }),
      h('p', null, h('b', { texto: n.nombre.toUpperCase() }), h('br'), 'NIT 900.000.000-' + D.digito('900000000') + ' (ficticio)', h('br'),
        'Documento N.º ' + f.numero + ' · ' + f.hora),
      h('hr'), h('p', null, h('b', { texto: 'Adquirente' }), h('br'), f.comprador.nombre, h('br'), f.comprador.tipo + ' ' + f.comprador.doc,
        f.comprador.correo && [h('br'), f.comprador.correo]),
      h('hr'), f.lineas.map(function (l) { return h('p.linea', null, h('span', { texto: l.qty + ' × ' + l.nombre }), h('span', { texto: D.pesos(l.total) })); }),
      h('hr'), h('p.linea', null, h('span', { texto: 'Subtotal (base)' }), h('span', { texto: D.pesos(f.base) })),
      f.tarifas.filter(function (t) { return t.impuesto; }).map(function (t) {
        return h('p.linea', null, h('span', { texto: t.nombre }), h('span', { texto: D.pesos(t.impuesto) }));
      }),
      h('p.linea', null, h('b', { texto: 'Total' }), h('b', { texto: D.pesos(f.total) })),
      h('hr'), h('p.pequeno', { texto: 'CUFE: en la app lo calcula BAR BOX con la fórmula SHA-384 de la DIAN; aquí no. ' + f.estado + '.' })),
      h('section.panel', null, h('h2', { texto: 'Cómo es en la app' }),
        h('p', { texto: 'BAR BOX arma la factura (numeración de la resolución, impuestos, CUFE, XML y QR) y la entrega al proveedor tecnológico que el negocio contrate, que la firma y la manda a la DIAN. Sólo cuando la DIAN la acepta en producción dice «Factura electrónica de venta». Antes, siempre dice PRUEBAS.' })),
      corregir(f),
      h('div.acciones', null, h('a.boton', { href: '#/clientes', texto: 'Clientes y facturas' }))];
  }

  // Una factura aceptada no se borra: se corrige con nota crédito (sólo el dueño).
  function corregir(f) {
    var suyas = bar.e.notas.filter(function (n) { return n.factura === f.numero; });
    var lineas = bar.porAcreditar(f.numero), queda = lineas.some(function (l) { return l.queda > 0; });
    var lista = suyas.length ? suyas.map(function (n) {
      return h('div.renglon', null, h('span.txt', null, h('a', { href: '#/nota/' + n.numero, texto: n.numero }), h('small', { texto: n.nombreConcepto })),
        h('span.val', { texto: '− ' + D.pesos(n.total) }));
    }) : null;
    if (!queda) return h('section.panel', null, h('h2', { texto: 'Notas crédito' }), lista, h('p.nota', { texto: 'Ya se acreditó toda la factura.' }));
    if (!D.puede(bar.e.rol, 'notaCredito')) {
      return h('section.panel', null, h('h2', { texto: 'Notas crédito' }), lista,
        h('p.nota', { texto: 'Corregir una factura es sólo del dueño. Cambia de cargo arriba para probarlo.' }));
    }
    var concepto = h('select', { 'aria-label': 'Concepto' }, Object.keys(D.CONCEPTOS_NC).map(function (c) {
      return h('option', { value: c, texto: D.CONCEPTOS_NC[c] });
    }));
    var motivo = h('input', { placeholder: 'El cliente pidió la factura a nombre de su empresa', 'aria-label': 'Motivo' });
    var porcentaje = h('input', { inputmode: 'numeric', placeholder: 'o un % para todo (rebajas y descuentos)', 'aria-label': 'Porcentaje' });
    var campos = lineas.map(function (l) {
      return { l: l, u: h('input', { inputmode: 'numeric', placeholder: 'unidades', 'aria-label': 'Unidades a devolver de ' + l.nombre, disabled: l.qty <= l.ya }),
               v: h('input', { inputmode: 'numeric', placeholder: 'valor $', 'aria-label': 'Valor a acreditar de ' + l.nombre, disabled: !l.queda }) };
    });
    return h('section.panel', null, h('h2', { texto: 'Corregir con nota crédito' }), lista,
      h('p.pie', { texto: 'Anulación: todo lo que falte. Devolución parcial: unidades a su precio. Rebaja, ajuste o descuento: por valor o por porcentaje; no devuelven unidades. Nunca más de lo facturado.' }),
      concepto, motivo,
      campos.map(function (x) {
        return h('div.renglon', null, h('span.txt', null, h('b', { texto: x.l.nombre }),
          h('small', { texto: 'quedan ' + (x.l.qty - x.l.ya) + ' u · ' + D.pesos(x.l.queda) })), x.u, x.v);
      }),
      porcentaje,
      h('div.acciones', null, h('button.boton', { type: 'button', texto: 'Emitir nota crédito', onclick: function () {
        hacer(function () {
          var unidades = {}, valores = {};
          campos.forEach(function (x) {
            if (x.u.value.trim()) unidades[x.l.i] = Number(x.u.value.trim());
            if (x.v.value.trim()) valores[x.l.i] = pesosDe(x.v);
          });
          var n = bar.notaCredito(f.numero, { concepto: concepto.value, motivo: motivo.value, unidades: unidades,
                                               valores: valores, porcentaje: porcentaje.value });
          ir('/nota/' + n.numero);
          return n;
        }, function (n) { return n.numero + ' emitida por ' + D.pesos(n.total) + ' (pruebas).'; });
      } })));
  }

  function nota(numero) {
    var n = bar.e.notas.filter(function (x) { return x.numero === numero; })[0], negocio = neg();
    if (!n) return [h('p.nota', { texto: 'Esa nota no está.' })];
    return [h('div.demo-ticket', null,
      h('p.demo-sello', { texto: 'PRUEBAS · SIN VALIDEZ FISCAL' }),
      h('p', null, h('b', { texto: negocio.nombre.toUpperCase() }), h('br'), 'NIT 900.000.000-' + D.digito('900000000') + ' (ficticio)', h('br'),
        'Nota crédito N.º ' + n.numero + ' · ' + n.hora, h('br'), 'Corrige la factura ' + n.factura),
      h('hr'), h('p', null, h('b', { texto: n.nombreConcepto }), h('br'), n.motivo),
      h('hr'), h('p', null, h('b', { texto: 'Adquirente' }), h('br'), n.comprador.nombre, h('br'), n.comprador.tipo + ' ' + n.comprador.doc),
      h('hr'), n.lineas.map(function (l) {
        return h('p.linea', null, h('span', { texto: (l.porValor ? 'Rebaja · ' : l.qty + ' × ') + l.nombre }), h('span', { texto: D.pesos(l.total) }));
      }),
      h('hr'), h('p.linea', null, h('span', { texto: 'Subtotal (base)' }), h('span', { texto: D.pesos(n.base) })),
      h('p.linea', null, h('span', { texto: 'Impuestos' }), h('span', { texto: D.pesos(n.impuesto) })),
      h('p.linea', null, h('b', { texto: 'Total acreditado' }), h('b', { texto: D.pesos(n.total) })),
      h('hr'), h('p.pequeno', { texto: 'CUDE: en la app lo calcula BAR BOX (la fórmula del CUFE con el PIN del software); aquí no. ' + n.estado + '.' })),
      h('section.panel', null, h('h2', { texto: 'Cómo es en la app' }),
        h('p', { texto: 'La nota crédito referencia la factura (número, CUFE y fecha), sale en XML de la DIAN y se entrega al mismo proveedor tecnológico. No mueve caja ni inventario: si se devolvió plata, es un retiro de caja con su motivo.' })),
      h('div.acciones', null, h('a.boton', { href: '#/factura/' + n.factura, texto: 'Ver la factura' }))];
  }

  function clientes() {
    var no = soloPara('clientes', 'CLIENTES', 'Los datos de clientes los ven el dueño y el encargado, no el vendedor (Ley 1581).');
    if (no) return no;
    var tipo = h('select', { 'aria-label': 'Tipo de documento' }, h('option', { value: '31', texto: 'NIT' }), h('option', { value: '13', texto: 'Cédula' }));
    var doc = h('input', { inputmode: 'numeric', placeholder: '800197268', 'aria-label': 'Documento' });
    var nombre = h('input', { placeholder: 'Empresa Demo S.A.S.', 'aria-label': 'Nombre' });
    var correo = h('input', { type: 'email', placeholder: 'compras@empresa.co', 'aria-label': 'Correo' });
    var ciudad = h('input', { placeholder: 'Medellín', 'aria-label': 'Ciudad' });
    var dv = h('small', { texto: '' });
    doc.addEventListener('input', function () {
      try { dv.textContent = tipo.value === '31' && doc.value ? 'Dígito de verificación: ' + D.digito(doc.value.trim()) : ''; } catch (e) { dv.textContent = ''; }
    });
    return [hud('CLIENTES'),
      h('div.dos', null,
        h('section.panel', null, h('h2', { texto: 'Nuevo cliente' }),
          h('p.pie', { texto: 'Una vez guardado, la próxima factura es elegirlo. El dígito del NIT lo calcula BAR BOX.' }),
          tipo, doc, dv, nombre, correo, ciudad,
          h('div.acciones', null, h('button.boton', { type: 'button', texto: 'Guardar cliente', onclick: function () {
            hacer(function () { return bar.crearCliente({ tipo: tipo.value, doc: doc.value, nombre: nombre.value, correo: correo.value, ciudad: ciudad.value }); },
                  function (k) { return 'Guardado: ' + k.nombre + '. Ahora cobra una venta y emítele la factura desde el comprobante.'; });
          } }))),
        h('section.panel', null, h('h2', { texto: 'Guardados' }),
          bar.e.clientes.length ? bar.e.clientes.map(function (k) {
            return fila(k.nombre, (k.tipo === '31' ? 'NIT ' : 'C.C. ') + k.doc + (k.dv ? '-' + k.dv : '') + ' · ' + k.correo, '');
          }) : h('p.nota', { texto: 'Todavía ninguno.' }),
          h('h2', { texto: 'Facturas del turno' }),
          bar.e.facturas.length ? bar.e.facturas.map(function (f) {
            var notas = bar.e.notas.filter(function (n) { return n.factura === f.numero; }).map(function (n) { return n.numero; });
            return h('div.renglon', null, h('span.txt', null, h('a', { href: '#/factura/' + f.numero, texto: f.numero }),
              h('small', { texto: f.comprador.nombre + ' · pruebas' + (notas.length ? ' · notas ' + notas.reverse().join(', ') : '') })),
              h('span.val', { texto: D.pesos(f.total) }));
          }) : h('p.nota', { texto: 'Se emiten desde el comprobante de una venta cobrada.' })))];
  }

  function caja() {
    var q = bar.cuadre(), abierta = bar.e.turno.abierto;
    var clase = h('select', { 'aria-label': 'Qué pasó' }, h('option', { value: 'retiro', texto: 'Salió plata del cajón' }), h('option', { value: 'ingreso', texto: 'Entró plata al cajón' }));
    var monto = h('input', { inputmode: 'numeric', placeholder: 'Cuánto, en pesos', 'aria-label': 'Cuánto' });
    var motivo = h('input', { placeholder: 'Pagué el hielo / el domicilio', 'aria-label': 'Motivo' });
    var contado = h('input', { inputmode: 'numeric', placeholder: 'Lo que contaste, en pesos', 'aria-label': 'Contado' });
    var base = h('input', { inputmode: 'numeric', value: '200000', 'aria-label': 'Base' });
    return [
      hud('CAJA', abierta ? 'Turno #' + bar.e.turno.numero + ' abierto' : 'Caja cerrada'),
      abierta ? h('div.dos', null,
        h('section.panel', null, h('h2', { texto: 'Movimientos de caja' }),
          h('p.pie', { texto: 'Pagar un gasto, dejar un cambio: sin esto, el cuadre miente.' }), clase, monto, motivo,
          h('div.acciones', null, h('button.boton suave', { type: 'button', texto: 'Registrar', onclick: function () {
            hacer(function () { bar.moverCaja(clase.value, pesosDe(monto), motivo.value); });
          } })),
          bar.e.caja.map(function (m) { return fila(m.clase === 'retiro' ? 'Retiro' : 'Ingreso', m.motivo + ' · ' + m.autor, (m.clase === 'retiro' ? '− ' : '+ ') + D.pesos(m.monto)); })),
        h('section.panel', null, h('h2', { texto: 'Cuadre en vivo' }),
          fila('Base', 'con lo que abriste', D.pesos(q.base)),
          fila('Ventas en efectivo', q.cuentas + ' ventas cobradas', '+ ' + D.pesos(q.efectivo)),
          fila('Propinas en efectivo', 'no son venta: son del equipo', '+ ' + D.pesos(q.propinasEfectivo)),
          fila('Ingresos de caja', '', '+ ' + D.pesos(q.ingresos)),
          fila('Retiros de caja', '', '− ' + D.pesos(q.retiros)),
          h('div.total', null, h('span', { texto: 'Debe haber en el cajón' }), h('strong', { texto: D.pesos(q.esperado) })),
          h('p.nota', { texto: 'Tarjeta ' + D.pesos(q.tarjeta) + ' · transferencia ' + D.pesos(q.transferencia) + ': se cuadran contra el datáfono y el banco.' }),
          h('h2', { texto: 'Cerrar el turno' }),
          h('p.nota', { texto: 'Cuenta la plata antes de mirar el esperado. La diferencia se guarda tal cual, con tu nombre.' }),
          contado, h('div.acciones', null, h('button.boton riesgo', { type: 'button', texto: 'Cerrar caja', onclick: function () {
            hacer(function () { return bar.cerrarCaja(pesosDe(contado)); }, function (c) {
              return 'Turno cerrado. Diferencia ' + D.pesos(c.diferencia) + '. Ahora el dueño emite el informe diario en Contabilidad.';
            });
          } }))))
      : h('section.panel', null, h('h2', { texto: 'Abrir caja' }),
          bar.e.cierre && h('p.nota', { texto: 'Último cierre: esperado ' + D.pesos(bar.e.cierre.esperado) + ', contado ' + D.pesos(bar.e.cierre.contado) +
            ', diferencia ' + D.pesos(bar.e.cierre.diferencia) + ' (' + bar.e.cierre.autor + ').' }),
          h('label', { texto: 'Base (pesos en el cajón al abrir)' }), base,
          h('div.acciones', null, h('button.boton', { type: 'button', texto: 'Abrir caja', onclick: function () {
            hacer(function () { bar.abrirCaja(pesosDe(base)); }, 'Caja abierta. Ya se puede vender.');
          } })))
    ];
  }

  function inventario() {
    var costos = D.puede(bar.e.rol, 'costos'), contar = D.puede(bar.e.rol, 'conteo');
    return [hud('INVENTARIO'),
      bar.e.faltantes.length && h('section.panel revision pendiente', null, h('h2', { texto: 'Vendido sin existencia (pendiente)' }),
        h('p.pie', { texto: 'Se vendió aunque el sistema no tenía: la venta no se frena. Recibe la compra o cuenta el producto y se cierra solo.' }),
        bar.e.faltantes.map(function (f) { return fila(f.nombre, 'faltó a las ' + f.hora, D.cantidad(f.qty) + ' ' + f.unidad); })),
      h('section.panel', null, h('p.pie', { texto: 'Cada venta descuenta su receta. Contar lo caro cada semana es la única forma de ver la fuga.' }),
        h('div.tabla', null, h('table', null,
          h('tr', null, h('th', { texto: 'Producto' }), h('th', { texto: 'Existencia' }), h('th', { texto: 'Estado' }), costos && h('th', { texto: 'Costo' }),
            contar && h('th', { texto: 'Contar / recibir' })),
          bar.e.productos.map(function (p) {
            var estado = p.stock === 0 ? ['alarma', 'agotado'] : p.stock <= p.minimo ? ['oro', 'pedir'] : ['frio', 'bien'];
            var real = h('input', { inputmode: 'decimal', placeholder: 'hay…', 'aria-label': 'Cuánto hay de ' + p.nombre });
            var leer = function () { var v = parseFloat(String(real.value).replace(',', '.')); return isNaN(v) ? NaN : Math.round(v * 1000); };
            return h('tr', null, h('td', { texto: p.nombre }), h('td', { texto: D.cantidad(p.stock) + ' ' + p.unidad }),
              h('td', null, h('span.etiqueta ' + estado[0], { texto: estado[1] })), costos && h('td', { texto: D.pesos(p.costo) + '/' + p.unidad }),
              contar && h('td', null, real, h('button.boton suave', { type: 'button', texto: 'Contar', onclick: function () {
                hacer(function () { return bar.conteo(p.id, leer()); }, function (d) {
                  return d < 0 ? 'Faltó ' + D.cantidad(-d) + ' ' + p.unidad + ' de ' + p.nombre + ': es fuga, sale en el Tablero.' : d > 0 ? 'Sobró: revisa si faltó registrar una compra.' : 'Cuadró exacto.';
                });
              } }), h('button.boton suave', { type: 'button', texto: 'Llegó', onclick: function () {
                hacer(function () { bar.recibir(p.id, leer()); }, 'Compra registrada.');
              } })));
          }))),
        !costos && h('p.nota', { texto: 'El vendedor no ve costos ni cuenta la bodega: sólo el dueño y el encargado.' })),
      bar.e.conteos.length && h('section.panel', null, h('h2', { texto: 'Conteos' }),
        bar.e.conteos.map(function (c) {
          return fila(c.nombre, (c.delta < 0 ? 'faltó ' : c.delta > 0 ? 'sobró ' : 'cuadró ') + D.cantidad(Math.abs(c.delta)) + ' ' + c.unidad + ' · ' + c.autor + ' · ' + c.hora,
                      c.valor > 0 ? '− ' + D.pesos(c.valor) : D.pesos(-c.valor));
        }))];
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
    var no = soloPara('contabilidad', 'CONTABILIDAD', 'Sólo la ve el dueño.');
    if (no) return no;
    var nuevos = bar.e.retirados.slice(bar.e.revisado), por = {};
    bar.e.retirados.forEach(function (r) { por[r.nombre] = (por[r.nombre] || 0) + r.valor; });
    var filas = Object.keys(por).map(function (k) { return { nombre: k, valor: por[k] }; }).sort(function (a, b) { return b.valor - a.valor; }).slice(0, 4);
    var q = bar.cuadre(), rota = bar.verificarInformes();
    var puedeZ = bar.e.cierre && !bar.e.turno.abierto && !bar.e.cierre.informe;
    return [hud('CONTABILIDAD'),
      h('section.panel revision' + (nuevos.length ? ' pendiente' : ''), null, h('h2', { texto: 'Revisión del día' }),
        bar.e.cierre && h('p.nota', { texto: 'Último cierre: diferencia ' + D.pesos(bar.e.cierre.diferencia) + ' · vendido ' + D.pesos(bar.e.cierre.vendido) }),
        nuevos.length ? [nuevos.map(function (r) {
          return h('div.renglon', null, h('span.q', { texto: String(r.qty) }),
            h('span.txt', null, h('b', { texto: r.nombre + ' · ' + D.RETIROS[r.clase] }), h('small', { texto: r.motivo + ' · ' + r.autor + ' · ' + r.mesa + ' ' + r.hora })),
            h('span.val', { texto: D.pesos(r.valor) }));
        }), h('p.nota', { texto: 'En la app se marca con la clave de revisión del dueño, distinta de la de entrar.' }),
          h('button.boton suave', { type: 'button', texto: 'Marcar como leído', onclick: function () { hacer(function () { bar.e.revisado = bar.e.retirados.length; }); } })]
        : h('p.nota', { texto: 'Todo revisado. Cancela algo en un puesto y vuelve aquí.' })),
      h('section.panel', null, h('h2', { texto: 'Informe diario (Z)' }),
        h('p.pie', { texto: 'Uno por turno terminado, con número consecutivo. Cada informe lleva la huella del anterior: si alguien altera uno, la cadena lo delata.' }),
        puedeZ ? h('div.acciones', null, h('button.boton', { type: 'button', texto: 'Emitir informe del turno #' + bar.e.cierre.numero, onclick: function () {
          hacer(function () { return bar.informeDiario(); }, function (z) { return 'Informe N.º ' + z.numero + ' emitido. Ya no se puede cambiar.'; });
        } })) : h('p.nota', { texto: bar.e.turno.abierto ? 'Se emite al cerrar la caja.' : 'Este turno ya tiene su informe.' }),
        bar.e.informes.length && h('p', null, h('span.badge ' + (rota ? 'danger' : 'good'), { texto: rota ? 'Cadena rota en el N.º ' + rota : 'Cadena íntegra' })),
        bar.e.informes.map(function (z) {
          var d = z.datos;
          return fila('N.º ' + z.numero + ' · turno #' + d.turno, d.cuentas + ' ventas · neto ' + D.pesos(d.neto) + ' · impuestos ' + D.pesos(d.impuestos) +
                      ' · huella ' + z.huella, D.pesos(d.cobrado));
        })),
      h('section.panel', null, h('h2', { texto: 'Cancelado y cortesías' }),
        filas.length ? h('div.grafica-anillo', null, anillo(filas), h('ul.leyenda', null, filas.map(function (f, i) {
          return h('li', null, h('span.muestra serie-' + (i + 1), { 'aria-hidden': 'true' }), h('span', null, h('b', { texto: f.nombre }), ' · ' + D.pesos(f.valor)));
        }))) : h('p.nota', { texto: 'Nada cancelado todavía.' })),
      h('section.panel', null, h('h2', { texto: 'Propinas del turno' }),
        h('div.total', null, h('span', { texto: 'Total' }), h('strong', { texto: D.pesos(q.propinas) })),
        h('p.nota', { texto: 'En la app se reparten por porcentaje o por días × horas, al peso exacto.' }))];
  }

  function tablero() {
    var no = soloPara('tablero', 'TABLERO DEL DUEÑO', 'El tablero es sólo del dueño.');
    if (no) return no;
    var t = bar.tablero(), n = neg(), ref = n.referencia;
    bar.hito('tablero'); guardar();
    var gastos = h('input', { inputmode: 'numeric', value: String(t.gastosFijos / 100), 'aria-label': 'Gastos fijos del mes' });
    var tarjeta = function (titulo, valor, pie) { return h('article', null, h('span', { texto: titulo }), h('strong', { texto: valor }), h('p', { texto: pie })); };
    return [hud('TABLERO DEL DUEÑO', n.nombre),
      !t.cuentas && h('p.nota', null, 'Sin ventas todavía. ', h('a', { href: '#/inicio', texto: 'Simula una hora pico' }), ' o vende en un puesto.'),
      h('section.stats', { 'aria-label': 'Indicadores del turno' },
        tarjeta('Ingreso neto', D.pesos(t.neto), t.cuentas + ' venta(s) · con impuesto ' + D.pesos(t.cobrado)),
        tarjeta('Ticket promedio', t.ticket == null ? '—' : D.pesos(t.ticket), 'neto ÷ ventas'),
        tarjeta(n.costo, D.porcentaje(t.costoPct), D.pesos(t.costo) + ' a costo · referencia ' + ref[0] + '–' + ref[1] + ' %'),
        tarjeta('Fuga', D.pesos(t.fuga), D.porcentaje(t.fugaPct) + ' del costo · sale de los conteos'),
        tarjeta('Cortesías', D.porcentaje(t.cortesiasPct), D.pesos(t.cortesias) + ' a precio de venta')),
      h('p.nota', { texto: 'Las referencias son aproximadas, no metas: cada negocio calibra las suyas. El costo de cada venta queda congelado al venderla.' }),
      h('section.panel', null, h('h2', { texto: 'Ingeniería de menú' }),
        h('p.pie', { texto: 'Cada producto o servicio según cuánto se vende y cuánto deja por unidad (sin impuesto).' }),
        t.menu.length ? h('div.tabla', null, h('table', null,
          h('tr', null, h('th', { texto: 'Producto' }), h('th', { texto: 'Clase' }), h('th', { texto: 'Vendidos' }), h('th', { texto: 'Deja c/u' })),
          t.menu.map(function (f) {
            return h('tr', null, h('td', null, h('b', { texto: f.nombre })), h('td', null, D.CLASES[f.clase][0], h('br'), h('small', { texto: D.CLASES[f.clase][1] })),
              h('td', { texto: f.vendidos + ' (' + D.porcentaje(f.popularidad) + ')' }), h('td', { texto: D.pesos(f.margen) }));
          }))) : h('p.nota', { texto: 'Aparece con las primeras ventas.' })),
      h('section.panel', null, h('h2', { texto: 'Punto de equilibrio' }),
        t.equilibrio ? h('p', null, 'Para cubrir ' + D.pesos(t.gastosFijos) + ' de gastos fijos al mes hay que vender ', h('b', { texto: D.pesos(t.equilibrio) }),
          ' netos. Si este turno se repitiera 26 días: ', h('b', { texto: D.pesos(t.alMes) }), ' ',
          h('span.badge ' + (t.alMes >= t.equilibrio ? 'good' : 'danger'), { texto: t.alMes >= t.equilibrio ? 'por encima' : 'faltan ' + D.pesos(t.equilibrio - t.alMes) }))
        : h('p.nota', { texto: 'Aparece con las primeras ventas.' }),
        h('label', { texto: 'Gastos fijos del mes (arriendo, nómina, servicios…)' }), gastos,
        h('div.acciones', null, h('button.boton suave', { type: 'button', texto: 'Recalcular', onclick: function () {
          hacer(function () { var v = pesosDe(gastos); if (!(v >= 0)) throw new Error('Escribe los gastos en pesos.'); bar.e.gastosFijos = v; });
        } })))];
  }

  function plano() {
    var no = soloPara('plano', 'PLANO', 'Acomodar el plano es del dueño o del encargado.');
    if (no) return no;
    var elegida = plano.elegida;
    return [hud('PLANO DEL LOCAL'),
      h('p.nota', { texto: elegida ? 'Ahora toca la casilla donde va ' + bar.mesa(elegida).nombre + ' (sobre otro puesto, se cambian).' : 'Toca un puesto y luego la casilla donde está en tu local.' }),
      bar.e.salones.map(function (s) {
        var dim = bar.dimensiones(s.id), cols = Math.min(6, dim.columnas + 1), filas = Math.min(6, dim.filas + 1), celdas = [];
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
  var RUTAS = { inicio: inicio, mapa: mapa, mesa: mesa, comprobante: comprobante, factura: factura, nota: nota, clientes: clientes, caja: caja,
                inventario: inventario, contabilidad: contabilidad, tablero: tablero, plano: plano };
  var PESTANA = { mesa: 'mapa', comprobante: 'mapa', factura: 'clientes', nota: 'clientes' };

  function pintar() {
    var partes = (location.hash.replace(/^#\//, '') || 'inicio').split('/');
    var f = RUTAS[partes[0]] || inicio, n = neg();
    vista.textContent = '';
    poner(vista, f(partes[1]));
    var activa = PESTANA[partes[0]] || partes[0];
    Array.prototype.forEach.call(document.querySelectorAll('.demo-tabs a'), function (a) {
      a.setAttribute('aria-current', a.getAttribute('href') === '#/' + activa ? 'page' : 'false');
    });
    document.getElementById('tab-puestos').textContent = n.puesto + 's';
    document.getElementById('negocio').textContent = n.nombre + ' · ' + n.tipo;
    var rol = document.getElementById('rol');
    rol.textContent = '';
    Object.keys(n.etiquetas).forEach(function (k) { rol.appendChild(h('option', { value: k, texto: n.etiquetas[k], selected: bar.e.rol === k })); });
    feed.textContent = '';
    bar.e.avisos.forEach(function (a) {
      feed.appendChild(h('li', null, h('span.demo-num', { texto: '#' + a.n }), h('b', { texto: a.tipo }), ' ' + a.texto + ' · ' + a.hora));
    });
    if (!bar.e.avisos.length) feed.appendChild(h('li', { texto: 'Todavía nada. Abre la caja y vende algo.' }));
  }

  document.getElementById('rol').addEventListener('change', function (e) {
    hacer(function () { bar.e.rol = e.target.value; }, 'Ahora eres ' + neg().cargos[e.target.value] + '.');
  });
  document.getElementById('reiniciar').addEventListener('click', function () {
    bar = new D.Bar(D.inicial(bar.e.tipo)); plano.elegida = null; guardar(); decir('Demo reiniciada.'); ir('/inicio'); pintar();
  });
  window.addEventListener('hashchange', function () { decir(''); pintar(); });
  pintar();
})();
