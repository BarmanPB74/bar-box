// BAR BOX · demo interactiva (vitrina pública). Datos y negocios inventados.
//
// Imita lo que hace la app real en un turno completo, para CUALQUIER negocio
// que vende en puestos: un bar (mesas), un café (mesas y para llevar), un
// minimercado (cajas de mostrador) o una barbería (sillas; los servicios
// gastan insumos igual que un coctel gasta ron). Todo pasa en el navegador de
// quien la abre: nada se envía a ningún servidor. El estado se guarda en este
// navegador para que no se pierda al recargar.
//
// Dos partes: `Bar` (reglas, sin tocar la página; se prueba en node) y
// demo-ui.js (la página). Igual que en la app: dinero en centavos enteros y
// cantidades en milésimas enteras. Nunca floats para plata.
(function (raiz) {
  'use strict';

  // --- Negocios de ejemplo -------------------------------------------------
  // productos: id, nombre, unidad, stock (milésimas), minimo, costo (centavos por unidad de medida)
  // carta: id, nombre, precio (centavos, con impuesto), categoria, impuesto, receta [[producto, milésimas]]
  // puestos: id, nombre, zona, gx, gy, forma
  var NEGOCIOS = {
    bar: {
      nombre: 'Bar La Esquina', tipo: 'Bar', puesto: 'Mesa', verbo: 'Servir', cliente: 'mesa',
      cargos: { 'dueño': 'Carolina (dueña)', bodega: 'Andrés (barista)', mesero: 'Sofía (mesera)' },
      etiquetas: { 'dueño': 'Dueña', bodega: 'Barista', mesero: 'Mesera' },
      costo: 'Costo de bebida', referencia: [18, 35],
      zonas: [{ id: 'terraza', nombre: 'Terraza' }, { id: 'barra', nombre: 'Barra' }],
      puestos: [['t1', 'T1', 'terraza', 1, 1, 'cuadrada'], ['t2', 'T2', 'terraza', 2, 1, 'redonda'], ['t3', 'T3', 'terraza', 3, 1, 'cuadrada'],
                ['t4', 'T4', 'terraza', 1, 2, 'cuadrada'], ['t5', 'T5', 'terraza', 3, 2, 'redonda'],
                ['b1', 'B1', 'barra', 1, 1, 'barra'], ['b2', 'B2', 'barra', 2, 1, 'barra'], ['b3', 'B3', 'barra', 3, 1, 'barra']],
      productos: [['club', 'Club Colombia', 'unidad', 48000, 12000, 260000], ['corona', 'Corona', 'unidad', 14000, 12000, 420000],
                  ['aguardiente', 'Aguardiente', 'ml', 3000000, 750000, 4500], ['ron', 'Ron blanco', 'ml', 1400000, 700000, 6000],
                  ['limon', 'Limón', 'unidad', 30000, 10000, 50000], ['coco', 'Crema de coco', 'ml', 1500000, 500000, 2200],
                  ['papa', 'Papa criolla', 'g', 3000000, 1000000, 900]],
      carta: [[1, 'Club Colombia', 800000, 'Cervezas', 'inc8', [['club', 1000]]], [2, 'Corona', 1200000, 'Cervezas', 'inc8', [['corona', 1000]]],
              [3, 'Aguardiente (trago)', 900000, 'Licores', 'inc8', [['aguardiente', 60000]]],
              [4, 'Mojito', 2000000, 'Cocteles', 'inc8', [['ron', 60000], ['limon', 1000]]],
              [5, 'Limonada de coco', 1400000, 'Sin alcohol', 'inc8', [['coco', 250000], ['limon', 1000]]],
              [6, 'Papas criollas', 1600000, 'Para picar', 'inc8', [['papa', 300000]], true]]
    },
    cafe: {
      nombre: 'Café El Molino', tipo: 'Café y panadería', puesto: 'Mesa', verbo: 'Servir', cliente: 'mesa',
      cargos: { 'dueño': 'Marta (dueña)', bodega: 'Julián (barista)', mesero: 'Camila (mesera)' },
      etiquetas: { 'dueño': 'Dueña', bodega: 'Barista', mesero: 'Mesera' },
      costo: 'Costo de producto', referencia: [25, 35],
      zonas: [{ id: 'salon', nombre: 'Salón' }, { id: 'llevar', nombre: 'Para llevar' }],
      puestos: [['m1', 'M1', 'salon', 1, 1, 'redonda'], ['m2', 'M2', 'salon', 2, 1, 'redonda'], ['m3', 'M3', 'salon', 3, 1, 'cuadrada'],
                ['m4', 'M4', 'salon', 1, 2, 'cuadrada'], ['l1', 'L1', 'llevar', 1, 1, 'barra'], ['l2', 'L2', 'llevar', 2, 1, 'barra']],
      productos: [['grano', 'Café en grano', 'g', 3000000, 1000000, 4000], ['leche', 'Leche', 'ml', 12000000, 4000000, 400],
                  ['choco', 'Chocolate de mesa', 'g', 1000000, 300000, 3000], ['bono', 'Pan de bono', 'unidad', 30000, 10000, 80000],
                  ['torta', 'Torta de zanahoria (porción)', 'unidad', 8000, 4000, 300000]],
      carta: [[1, 'Tinto', 250000, 'Café', 'inc8', [['grano', 8000]]], [2, 'Capuchino', 600000, 'Café', 'inc8', [['grano', 14000], ['leche', 150000]]],
              [3, 'Chocolate caliente', 500000, 'Bebidas', 'inc8', [['choco', 25000], ['leche', 200000]]],
              [4, 'Pan de bono', 250000, 'Panadería', 'inc8', [['bono', 1000]]],
              [5, 'Torta de zanahoria', 700000, 'Postres', 'inc8', [['torta', 1000]], true]]
    },
    tienda: {
      nombre: 'Minimercado Don Beto', tipo: 'Tienda / minimercado', puesto: 'Caja', verbo: 'Vender', cliente: 'venta',
      cargos: { 'dueño': 'Alberto (dueño)', bodega: 'Luisa (encargada)', mesero: 'Kevin (cajero)' },
      etiquetas: { 'dueño': 'Dueño', bodega: 'Encargada', mesero: 'Cajero' },
      costo: 'Costo de mercancía', referencia: [70, 85],
      zonas: [{ id: 'mostrador', nombre: 'Mostrador' }, { id: 'domicilios', nombre: 'Domicilios' }],
      puestos: [['c1', 'Caja 1', 'mostrador', 1, 1, 'barra'], ['c2', 'Caja 2', 'mostrador', 2, 1, 'barra'],
                ['d1', 'Domicilio 1', 'domicilios', 1, 1, 'cuadrada'], ['d2', 'Domicilio 2', 'domicilios', 2, 1, 'cuadrada']],
      productos: [['gaseosa', 'Gaseosa 400 ml', 'unidad', 60000, 24000, 230000], ['arroz', 'Arroz (libra)', 'unidad', 40000, 15000, 260000],
                  ['huevos', 'Huevos x 6', 'unidad', 20000, 10000, 520000], ['deter', 'Detergente 500 g', 'unidad', 6000, 6000, 600000],
                  ['aseo', 'Jabón de baño', 'unidad', 18000, 6000, 300000]],
      carta: [[1, 'Gaseosa 400 ml', 350000, 'Bebidas', 'iva19', [['gaseosa', 1000]]], [2, 'Arroz (libra)', 340000, 'Granos', 'excluido', [['arroz', 1000]]],
              [3, 'Huevos x 6', 750000, 'Lácteos y huevos', 'exento', [['huevos', 1000]]],
              [4, 'Detergente 500 g', 900000, 'Aseo', 'iva19', [['deter', 1000]]], [5, 'Jabón de baño', 450000, 'Aseo', 'iva19', [['aseo', 1000]]]]
    },
    barberia: {
      nombre: 'Barbería El Filo', tipo: 'Barbería / peluquería', puesto: 'Silla', verbo: 'Atender', cliente: 'silla',
      cargos: { 'dueño': 'Héctor (dueño)', bodega: 'Diana (encargada)', mesero: 'Brayan (barbero)' },
      etiquetas: { 'dueño': 'Dueño', bodega: 'Encargada', mesero: 'Barbero' },
      costo: 'Costo de insumos', referencia: [5, 15],
      zonas: [{ id: 'sillas', nombre: 'Sillas' }, { id: 'mostrador', nombre: 'Mostrador' }],
      puestos: [['s1', 'Silla 1', 'sillas', 1, 1, 'redonda'], ['s2', 'Silla 2', 'sillas', 2, 1, 'redonda'], ['s3', 'Silla 3', 'sillas', 3, 1, 'redonda'],
                ['v1', 'Venta', 'mostrador', 1, 1, 'barra']],
      productos: [['shampoo', 'Shampoo', 'ml', 5000000, 1000000, 3000], ['cuchilla', 'Cuchillas', 'unidad', 100000, 20000, 80000],
                  ['toalla', 'Toallas desechables', 'unidad', 200000, 50000, 30000], ['cera', 'Cera para peinar 100 g', 'unidad', 10000, 4000, 1200000]],
      carta: [[1, 'Corte', 2500000, 'Servicios', 'iva19', [['shampoo', 15000], ['toalla', 1000]]],
              [2, 'Barba', 1500000, 'Servicios', 'iva19', [['cuchilla', 1000], ['toalla', 1000]]],
              [3, 'Corte + barba', 3500000, 'Servicios', 'iva19', [['shampoo', 15000], ['cuchilla', 1000], ['toalla', 2000]]],
              [4, 'Cera para peinar', 2200000, 'Productos', 'iva19', [['cera', 1000]]]]
    }
  };

  // Tarifas (anexo técnico DIAN: 01 IVA, 04 impoconsumo). En la demo son ilustrativas.
  var IMPUESTOS = { iva19: ['IVA 19 %', 1900], iva5: ['IVA 5 %', 500], inc8: ['Impoconsumo 8 %', 800],
                    exento: ['IVA 0 % (exento)', 0], excluido: ['Excluido', 0] };
  var RETIROS = { no_servido: 'No se entregó', merma: 'Merma', cortesia: 'Cortesía' };
  var MEDIOS = ['efectivo', 'tarjeta', 'transferencia'];
  var PROPINA = 10;
  var UVT = 4979900;                      // UVT 2025 ($49.799); la app pide la del año
  var HITOS = [
    ['abrir', 'Abre la caja con la base del día', 'caja'],
    ['vender', 'Vende en un puesto: cada toque descuenta la receta del inventario', 'mapa'],
    ['cancelar', 'Cancela algo con motivo (el vendedor no puede: cambia de cargo)', 'mapa'],
    ['dividir', 'Cobra con pago dividido: parte en efectivo y parte con tarjeta', 'mapa'],
    ['factura', 'Guarda un cliente y emítele su factura electrónica (modo pruebas)', 'clientes'],
    ['conteo', 'Cuenta un producto en Inventario: la diferencia es la fuga', 'inventario'],
    ['cerrar', 'Cierra la caja contando el efectivo antes de mirar el esperado', 'caja'],
    ['z', 'Emite el informe diario del turno, con su huella encadenada', 'contabilidad'],
    ['tablero', 'Mira el Tablero del dueño: costo, ticket, fuga y menú', 'tablero']
  ];
  var CLASES = { estrella: ['Estrella', 'Se vende mucho y deja buen margen: cuídalo.'],
                 caballo: ['Caballo de batalla', 'Se vende mucho pero deja poco: revisa precio o costo.'],
                 rompecabezas: ['Rompecabezas', 'Deja buen margen pero se vende poco: recomiéndalo.'],
                 perro: ['Perro', 'Se vende poco y deja poco: piensa en sacarlo.'] };
  var PERMISOS = {
    cancelar: ['dueño', 'bodega'], caja_cerrar: ['dueño', 'bodega'], caja_abrir: ['dueño', 'bodega'],
    plano: ['dueño', 'bodega'], contabilidad: ['dueño'], tablero: ['dueño'], costos: ['dueño', 'bodega'],
    clientes: ['dueño', 'bodega'], facturar: ['dueño', 'bodega'], conteo: ['dueño', 'bodega'], notaCredito: ['dueño']
  };
  // Conceptos de nota crédito (anexo técnico DIAN, tabla 13.2.4). 2 y 1 por unidades; 3 a 6 por valor.
  var CONCEPTOS_NC = { '2': 'Anulación de la factura', '1': 'Devolución parcial', '3': 'Rebaja o descuento',
                       '4': 'Ajuste de precio', '5': 'Descuento comercial por pronto pago',
                       '6': 'Descuento comercial por volumen de ventas' };
  function puede(rol, que) { return (PERMISOS[que] || ['dueño']).indexOf(rol) >= 0; }

  function inicial(tipo) {
    var n = NEGOCIOS[tipo] ? tipo : 'bar', d = NEGOCIOS[n];
    return {
      version: 2, tipo: n, rol: 'dueño', siguiente: 100, hitos: {},
      turno: { abierto: false, base: 0, numero: 12 },
      productos: d.productos.map(function (p) { return { id: p[0], nombre: p[1], unidad: p[2], stock: p[3], minimo: p[4], costo: p[5] }; }),
      carta: d.carta.map(function (i) {
        return { id: i[0], nombre: i[1], precio: i[2], categoria: i[3], impuesto: i[4], receta: i[5], cocina: !!i[6] };
      }),
      salones: d.zonas.map(function (z) { return { id: z.id, nombre: z.nombre, columnas: 1, filas: 1 }; }),
      mesas: d.puestos.map(function (m) { return { id: m[0], nombre: m[1], salon: m[2], gx: m[3], gy: m[4], forma: m[5] }; }),
      cuentas: {}, cobradas: [], caja: [], retirados: [], avisos: [], revisado: 0, cierre: null,
      faltantes: [], conteos: [], clientes: [], facturas: [], notas: [], informes: [], consecutivo: 990000000,
      gastosFijos: 600000000, semilla: 7
    };
  }

  function pesos(centavos) {
    var n = Math.round(Math.abs(centavos) / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (centavos < 0 ? '−$ ' : '$ ') + n;
  }
  function cantidad(milesimas) {
    var n = milesimas / 1000;
    return (Number.isInteger(n) ? n.toString() : n.toFixed(1).replace('.', ',')).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function porcentaje(x) { return x == null ? '—' : Math.round(x * 100) + ' %'; }
  function hora() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  // Precio con impuesto -> [base, impuesto]; siempre suman el total (como domain.desglose).
  function desglose(total, codigo) {
    var tarifa = IMPUESTOS[codigo][1];
    var base = Math.floor((total * 10000 * 2 + (10000 + tarifa)) / ((10000 + tarifa) * 2));
    return [base, total - base];
  }
  // Dígito de verificación del NIT (módulo 11 de la DIAN), como domain.digito_verificacion.
  function digito(nit) {
    if (!/^\d{1,15}$/.test(nit)) throw new Error('NIT: sólo números, sin puntos ni dígito de verificación.');
    var pesosDv = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71], s = 0;
    nit.split('').reverse().forEach(function (d, i) { s += Number(d) * pesosDv[i]; });
    var r = s % 11;
    return String(r < 2 ? r : 11 - r);
  }
  // Huella de la demo (FNV-1a de 64 bits en dos mitades). La app usa SHA-256.
  function huella(texto) {
    var a = 0x811c9dc5, b = 0x01000193;
    for (var i = 0; i < texto.length; i++) {
      a = Math.imul(a ^ texto.charCodeAt(i), 16777619) >>> 0;
      b = Math.imul(b ^ texto.charCodeAt(texto.length - 1 - i), 16777619) >>> 0;
    }
    return ('0000000' + a.toString(16)).slice(-8) + ('0000000' + b.toString(16)).slice(-8);
  }

  function Bar(estado) {
    this.e = estado && estado.version === 2 ? estado : inicial(estado && estado.tipo);
    if (!this.e.notas) this.e.notas = [];              // demo guardada antes de las notas crédito
  }
  // Renglón de nota crédito por `valor` (centavos con impuesto); qty = unidades devueltas, 0 = rebaja
  // por valor. La base se reparte por el valor acumulado, como domain.acreditar: todas las notas de
  // un renglón suman justo su base y su impuesto.
  function acreditar(l, valor, qty) {
    if (!(valor > 0) || valor > l.queda) throw new Error(l.nombre + ': quedan ' + pesos(l.queda) + ' por acreditar.');
    var parte = function (v) { return Math.floor((l.base * v * 2 + l.total) / (l.total * 2)); };
    var base = parte(l.yaValor + valor) - parte(l.yaValor);
    return { renglon: l.i, nombre: l.nombre, qty: qty || 1, precio: qty ? l.precio : valor, base: base,
             impuesto: valor - base, total: valor, porValor: !qty };
  }
  Bar.prototype = {
    negocio: function () { return NEGOCIOS[this.e.tipo]; },
    producto: function (id) { return this.e.productos.filter(function (p) { return p.id === id; })[0]; },
    item: function (id) { return this.e.carta.filter(function (i) { return i.id === id; })[0]; },
    mesa: function (id) { return this.e.mesas.filter(function (m) { return m.id === id; })[0]; },
    autor: function () { return this.negocio().cargos[this.e.rol]; },
    hito: function (k) { this.e.hitos[k] = true; },
    avisar: function (tipo, texto) {
      this.e.avisos.unshift({ n: this.e.siguiente++, tipo: tipo, texto: texto, hora: hora() });
      this.e.avisos = this.e.avisos.slice(0, 8);
    },
    exigir: function (que, texto) { if (!puede(this.e.rol, que)) throw new Error(texto); },
    costoReceta: function (item) {
      var self = this;
      return item.receta.reduce(function (s, l) { return s + Math.round(l[1] * self.producto(l[0]).costo / 1000); }, 0);
    },
    rinde: function (item) {             // cuántas veces alcanza lo que hay
      var self = this;
      return Math.min.apply(null, item.receta.map(function (l) { return Math.floor(self.producto(l[0]).stock / l[1]); }));
    },
    vigentes: function (mesa) {
      var c = this.e.cuentas[mesa];
      return c ? c.renglones.filter(function (r) { return !r.retiro; }) : [];
    },
    total: function (mesa) {
      return this.vigentes(mesa).reduce(function (s, r) { return s + r.precio * r.qty; }, 0);
    },
    estadoMesa: function (mesa) {
      var c = this.e.cuentas[mesa];
      if (!c) return 'libre';
      if (c.pedida) return 'cuenta';
      return this.vigentes(mesa).length ? 'servida' : 'sentados';
    },
    // Se vende aunque falte inventario: baja a 0 (nunca negativo) y queda pendiente
    // de compra o conteo, como en la app (vender sin existencia).
    servir: function (mesa, itemId) {
      if (!this.e.turno.abierto) throw new Error('La caja está cerrada: ábrela antes de vender.');
      var item = this.item(itemId), self = this, faltan = [];
      var costo = this.costoReceta(item);                // el costo se congela al vender
      item.receta.forEach(function (l) {
        var p = self.producto(l[0]);
        if (p.stock < l[1]) {
          faltan.push(p.nombre);
          self.e.faltantes.push({ producto: p.id, nombre: p.nombre, qty: l[1] - p.stock, unidad: p.unidad, hora: hora() });
        }
        p.stock = Math.max(0, p.stock - l[1]);
      });
      var c = this.e.cuentas[mesa] || (this.e.cuentas[mesa] = { id: this.e.siguiente++, renglones: [], pedida: false });
      c.renglones.push({ id: this.e.siguiente++, item: item.id, nombre: item.nombre, precio: item.precio, qty: 1,
                         impuesto: item.impuesto, costo: costo, estado: item.cocina ? 'pendiente' : 'entregado', hora: hora() });
      this.hito('vender');
      this.avisar('pedido_creado', this.mesa(mesa).nombre + ': ' + item.nombre + (item.cocina ? ' → preparación' : ''));
      return faltan;
    },
    retirar: function (mesa, renglonId, clase, motivo) {
      this.exigir('cancelar', 'Cancelar es del dueño o del encargado: pídeselo.');
      if (!RETIROS[clase]) throw new Error('Elige qué pasó.');
      if (!motivo || !motivo.trim()) throw new Error('Escribe el motivo: queda con tu nombre.');
      var r = this.e.cuentas[mesa].renglones.filter(function (x) { return x.id === renglonId; })[0], self = this;
      if (!r || r.retiro) throw new Error('Ese renglón ya se retiró.');
      if (clase === 'no_servido') {          // sólo lo que no se entregó vuelve al inventario
        this.item(r.item).receta.forEach(function (l) { self.producto(l[0]).stock += l[1] * r.qty; });
      }
      r.retiro = clase; r.motivo = motivo.trim(); r.autor = this.autor();
      this.e.retirados.push({ nombre: r.nombre, qty: r.qty, valor: r.precio * r.qty, costo: r.costo * r.qty, clase: clase,
                              motivo: r.motivo, autor: r.autor, hora: hora(), mesa: this.mesa(mesa).nombre });
      this.hito('cancelar');
      this.avisar('renglon_retirado', this.mesa(mesa).nombre + ': ' + r.nombre + ' · ' + RETIROS[clase]);
    },
    pedirCuenta: function (mesa) {
      var c = this.e.cuentas[mesa];
      c.pedida = !c.pedida;
      this.avisar('cuenta_pedida', this.mesa(mesa).nombre + (c.pedida ? ' pidió la cuenta' : ': sigue pidiendo'));
    },
    // pagos: [{medio, monto}] que suman el total (hasta 3, sin repetir medio). La propina va aparte.
    cobrar: function (mesa, pagos, conPropina, medioPropina) {
      var total = this.total(mesa);
      if (!total) throw new Error('No hay nada que cobrar.');
      pagos = pagos.filter(function (p) { return p.monto > 0; });
      if (!pagos.length || pagos.length > 3) throw new Error('Entre 1 y 3 formas de pago.');
      var vistos = {};
      pagos.forEach(function (p) {
        if (MEDIOS.indexOf(p.medio) < 0) throw new Error('Forma de pago desconocida.');
        if (vistos[p.medio]) throw new Error('No repitas la forma de pago.');
        vistos[p.medio] = true;
      });
      var suma = pagos.reduce(function (s, p) { return s + p.monto; }, 0);
      if (suma !== total) throw new Error('Los pagos suman ' + pesos(suma) + ' y la cuenta es ' + pesos(total) + '.');
      var propina = conPropina ? Math.round(total * PROPINA / 100 / 100) * 100 : 0;
      if (propina && !vistos[medioPropina || pagos[0].medio]) throw new Error('La propina va por uno de los medios del pago.');
      var c = this.e.cuentas[mesa];
      var recibo = { id: c.id, mesa: this.mesa(mesa).nombre, total: total, propina: propina,
                     pagos: pagos, medioPropina: propina ? (medioPropina || pagos[0].medio) : null,
                     hora: hora(), autor: this.autor(), renglones: this.vigentes(mesa), factura: null };
      this.e.cobradas.push(recibo);
      delete this.e.cuentas[mesa];
      if (pagos.length > 1) this.hito('dividir');
      this.avisar('cuenta_cobrada', recibo.mesa + ' cobrada: queda libre');
      return recibo;
    },
    mover: function (desde, hacia) {
      if (desde === hacia) throw new Error('Elige otro puesto.');
      var origen = this.e.cuentas[desde], destino = this.e.cuentas[hacia];
      if (!destino) this.e.cuentas[hacia] = origen;
      else destino.renglones = destino.renglones.concat(origen.renglones);
      delete this.e.cuentas[desde];
      this.avisar('cuenta_movida', this.mesa(desde).nombre + ' pasó a ' + this.mesa(hacia).nombre + (destino ? ' (se juntaron)' : ''));
    },
    moverCaja: function (clase, monto, motivo) {
      if (!this.e.turno.abierto) throw new Error('La caja está cerrada.');
      if (!(monto > 0)) throw new Error('Escribe cuánto.');
      if (!motivo || !motivo.trim()) throw new Error('Escribe el motivo.');
      this.e.caja.push({ clase: clase, monto: monto, motivo: motivo.trim(), autor: this.autor(), hora: hora() });
      this.avisar('caja_movimiento', 'Movimiento de caja: ' + clase);
    },
    cuadre: function () {
      var t = this.e.cobradas, por = { efectivo: 0, tarjeta: 0, transferencia: 0 }, propinasEfectivo = 0;
      t.forEach(function (x) {
        x.pagos.forEach(function (p) { por[p.medio] += p.monto; });
        if (x.medioPropina === 'efectivo') propinasEfectivo += x.propina;
      });
      var suma = function (l, k) { return l.reduce(function (s, x) { return s + x[k]; }, 0); };
      var ingresos = suma(this.e.caja.filter(function (m) { return m.clase === 'ingreso'; }), 'monto');
      var retiros = suma(this.e.caja.filter(function (m) { return m.clase === 'retiro'; }), 'monto');
      var r = { base: this.e.turno.base, efectivo: por.efectivo, tarjeta: por.tarjeta, transferencia: por.transferencia,
                propinasEfectivo: propinasEfectivo, propinas: suma(t, 'propina'), vendido: suma(t, 'total'),
                ingresos: ingresos, retiros: retiros, cuentas: t.length, abiertas: Object.keys(this.e.cuentas).length };
      r.esperado = r.base + r.efectivo + r.propinasEfectivo + r.ingresos - r.retiros;
      return r;
    },
    abrirCaja: function (base) {
      this.exigir('caja_abrir', 'Abrir la caja es del dueño o del encargado.');
      if (this.e.turno.abierto) throw new Error('La caja ya está abierta.');
      if (!(base >= 0)) throw new Error('Escribe la base.');
      var numero = this.e.turno.numero + (this.e.cierre ? 1 : 0);
      this.e.turno = { abierto: true, base: base, numero: numero };
      this.e.cobradas = []; this.e.caja = [];
      this.hito('abrir');
      this.avisar('caja_abierta', 'Turno #' + numero + ' abierto');
    },
    cerrarCaja: function (contado) {
      this.exigir('caja_cerrar', 'Cerrar la caja es del dueño o del encargado.');
      if (!this.e.turno.abierto) throw new Error('La caja ya está cerrada.');
      if (!(contado >= 0)) throw new Error('Escribe lo que contaste en el cajón.');
      var q = this.cuadre();
      if (q.abiertas) throw new Error('Hay ' + q.abiertas + ' cuenta(s) abierta(s): cóbralas antes de cerrar.');
      this.e.cierre = { numero: this.e.turno.numero, esperado: q.esperado, contado: contado, diferencia: contado - q.esperado,
                        vendido: q.vendido, propinas: q.propinas, autor: this.autor(), hora: hora(), informe: false };
      this.e.turno.abierto = false;
      this.hito('cerrar');
      this.avisar('caja_cerrada', 'Turno #' + this.e.turno.numero + ' cerrado');
      return this.e.cierre;
    },
    // --- Inventario ---
    conteo: function (productoId, real) {
      this.exigir('conteo', 'Contar la bodega es del dueño o del encargado.');
      if (!(real >= 0)) throw new Error('Escribe cuánto hay de verdad.');
      var p = this.producto(productoId), delta = real - p.stock;
      var pendiente = this.e.faltantes.filter(function (f) { return f.producto === productoId; });
      this.e.faltantes = this.e.faltantes.filter(function (f) { return f.producto !== productoId; });   // el conteo lo cierra
      this.e.conteos.unshift({ producto: p.id, nombre: p.nombre, unidad: p.unidad, delta: delta,
                               valor: Math.round(-delta * p.costo / 1000), autor: this.autor(), hora: hora() });
      p.stock = real;
      this.hito('conteo');
      this.avisar('conteo', p.nombre + ': ' + (delta < 0 ? 'faltan ' : delta > 0 ? 'sobró ' : 'cuadró ') + cantidad(Math.abs(delta)) + ' ' + p.unidad +
                  (pendiente.length ? ' · se cerró lo vendido sin existencia' : ''));
      return delta;
    },
    recibir: function (productoId, qty) {
      this.exigir('conteo', 'Recibir mercancía es del dueño o del encargado.');
      if (!(qty > 0)) throw new Error('Escribe cuánto llegó.');
      var p = this.producto(productoId), cubre = 0;
      this.e.faltantes = this.e.faltantes.filter(function (f) {
        if (f.producto !== productoId) return true;
        cubre += f.qty; return false;
      });
      p.stock += Math.max(0, qty - cubre);        // lo vendido sin existencia se descuenta de lo que llega
      this.avisar('compra', p.nombre + ': llegaron ' + cantidad(qty) + ' ' + p.unidad + (cubre ? ' (cubre lo vendido sin existencia)' : ''));
    },
    // --- Clientes y factura electrónica (modo pruebas) ---
    crearCliente: function (datos) {
      this.exigir('clientes', 'Los clientes los manejan el dueño y el encargado (datos personales).');
      var tipo = datos.tipo, doc = String(datos.doc || '').trim(), nombre = String(datos.nombre || '').trim();
      var correo = String(datos.correo || '').trim();
      if (['13', '31'].indexOf(tipo) < 0) throw new Error('Elige cédula o NIT.');
      if (!/^\d{3,15}$/.test(doc)) throw new Error('Documento: sólo números, sin puntos.');
      if (!nombre) throw new Error('Escribe el nombre o la razón social.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) throw new Error('Correo: ahí le llega la factura.');
      if (this.e.clientes.some(function (k) { return k.tipo === tipo && k.doc === doc; })) throw new Error('Ese documento ya está guardado.');
      var k = { id: this.e.siguiente++, tipo: tipo, doc: doc, dv: tipo === '31' ? digito(doc) : '', nombre: nombre,
                correo: correo, ciudad: String(datos.ciudad || '').trim() };
      this.e.clientes.push(k);
      this.avisar('cliente', 'Cliente guardado: ' + nombre);
      return k;
    },
    facturar: function (reciboId, clienteId) {
      this.exigir('facturar', 'La factura la emite el dueño o el encargado.');
      var r = this.e.cobradas.filter(function (x) { return x.id === reciboId; })[0];
      if (!r) throw new Error('Esa venta ya no está en el turno.');
      if (r.factura) throw new Error('Esa venta ya tiene factura: una venta, una factura.');
      var k = clienteId ? this.e.clientes.filter(function (x) { return x.id === clienteId; })[0] : null;
      if (!k && r.total > 5 * UVT) throw new Error('La venta supera 5 UVT: la ley pide los datos del comprador.');
      var tarifas = {};
      var lineas = r.renglones.map(function (l) {
        var d = desglose(l.precio * l.qty, l.impuesto);
        var t = tarifas[l.impuesto] || (tarifas[l.impuesto] = { nombre: IMPUESTOS[l.impuesto][0], base: 0, impuesto: 0 });
        t.base += d[0]; t.impuesto += d[1];
        return { nombre: l.nombre, qty: l.qty, precio: l.precio, total: l.precio * l.qty, base: d[0], impuesto: d[1] };
      });
      var f = { numero: 'SETP' + this.e.consecutivo++, recibo: r.id, hora: hora(), lineas: lineas,
                tarifas: Object.keys(tarifas).map(function (c) { return tarifas[c]; }),
                base: lineas.reduce(function (s, l) { return s + l.base; }, 0),
                impuesto: lineas.reduce(function (s, l) { return s + l.impuesto; }, 0), total: r.total,
                comprador: k ? { nombre: k.nombre, doc: k.doc + (k.dv ? '-' + k.dv : ''), tipo: k.tipo === '31' ? 'NIT' : 'C.C.', correo: k.correo, ciudad: k.ciudad }
                             : { nombre: 'Consumidor final', doc: '222222222222', tipo: 'C.C.', correo: '', ciudad: '' },
                estado: 'Aceptada por el simulador (ambiente de pruebas)' };
      r.factura = f.numero;
      this.e.facturas.unshift(f);
      if (k) this.hito('factura');
      this.avisar('factura', f.numero + ' para ' + f.comprador.nombre + ' (pruebas)');
      return f;
    },
    // --- Nota crédito: la única forma de corregir una factura aceptada ---
    porAcreditar: function (numero) {
      var notas = this.e.notas.filter(function (n) { return n.factura === numero; });
      var f = this.e.facturas.filter(function (x) { return x.numero === numero; })[0];
      return f.lineas.map(function (l, i) {
        var ya = 0, yaValor = 0;
        notas.forEach(function (n) {
          n.lineas.forEach(function (x) { if (x.renglon === i) { yaValor += x.total; if (!x.porValor) ya += x.qty; } });
        });
        return { i: i, nombre: l.nombre, qty: l.qty, precio: l.precio || l.total / l.qty, total: l.total, base: l.base,
                 ya: ya, yaValor: yaValor, queda: l.total - yaValor };
      });
    },
    // datos: concepto, motivo, unidades {renglón: n}, valores {renglón: centavos}, porcentaje (3 a 6).
    notaCredito: function (numero, datos) {
      this.exigir('notaCredito', 'La nota crédito la emite sólo el dueño: devuelve plata de algo facturado.');
      var f = this.e.facturas.filter(function (x) { return x.numero === numero; })[0];
      if (!f) throw new Error('Esa factura no está.');
      var c = datos.concepto, motivo = String(datos.motivo || '').trim();
      if (!CONCEPTOS_NC[c]) throw new Error('Elige el concepto.');
      if (!motivo) throw new Error('Escribe el motivo: sale en la nota.');
      var pct = ['3', '4', '5', '6'].indexOf(c) >= 0 && String(datos.porcentaje || '').trim();
      if (pct && !(/^\d+$/.test(pct) && +pct >= 1 && +pct <= 100)) throw new Error('Porcentaje: un número entero de 1 a 100.');
      var renglones = [];
      this.porAcreditar(numero).forEach(function (l) {
        var r = null, n, v;
        if (c === '2') {                             // anulación: todo lo que falte
          n = l.qty - l.ya;
          if (l.queda) r = acreditar(l, l.queda, n && l.queda === l.precio * n ? n : 0);
        } else if (c === '1') {                      // devolución: unidades a su precio
          n = Number((datos.unidades || {})[l.i] || 0);
          if (!Number.isInteger(n) || n < 0) throw new Error(l.nombre + ': escribe cuántas unidades se devuelven.');
          if (n > l.qty - l.ya) throw new Error(l.nombre + ': quedan ' + (l.qty - l.ya) + ' unidades por devolver, no ' + n + '.');
          if (n && l.precio * n > l.queda) {
            throw new Error(l.nombre + ': ya tuvo rebaja y quedan ' + pesos(l.queda) + '; usa una rebaja por ese valor o la anulación.');
          }
          if (n) r = acreditar(l, l.precio * n, n);
        } else if (pct) {                            // 3 a 6 con porcentaje de lo que le quede
          v = Math.floor((l.queda * Number(pct) * 2 + 100) / 200);
          if (v) r = acreditar(l, v, 0);
        } else {                                     // 3 a 6 por valor
          v = (datos.valores || {})[l.i] || 0;
          if (isNaN(v)) throw new Error(l.nombre + ': escribe el valor en pesos.');
          if (v) r = acreditar(l, v, 0);
        }
        if (r) renglones.push(r);
      });
      if (!renglones.length) {
        throw new Error({ '2': 'No queda nada por acreditar en esta factura.',
                          '1': 'Escribe cuántas unidades se devuelven de al menos un producto.' }[c]
                        || 'Escribe el valor a acreditar de al menos un producto, o un porcentaje.');
      }
      var suma = function (k) { return renglones.reduce(function (s, x) { return s + x[k]; }, 0); };
      var nota = { numero: 'NC' + (this.e.notas.length + 1), factura: f.numero, concepto: c, nombreConcepto: CONCEPTOS_NC[c],
                   motivo: motivo, hora: hora(), lineas: renglones, base: suma('base'), impuesto: suma('impuesto'),
                   total: suma('total'), comprador: f.comprador, estado: 'Aceptada por el simulador (ambiente de pruebas)' };
      this.e.notas.unshift(nota);
      this.avisar('nota_credito', nota.numero + ' corrige ' + f.numero + ' por ' + pesos(nota.total) + ' (pruebas)');
      return nota;
    },
    // --- Informe diario («Z») ---
    informeDiario: function () {
      this.exigir('contabilidad', 'El informe diario lo emite el dueño.');
      var c = this.e.cierre;
      if (!c || this.e.turno.abierto) throw new Error('Primero cierra la caja: el informe es de un turno terminado.');
      if (c.informe) throw new Error('Ese turno ya tiene su informe: no se emite dos veces.');
      var t = this.tablero(), q = this.cuadre();
      var datos = { turno: c.numero, cuentas: q.cuentas, cobrado: q.vendido, neto: t.neto, impuestos: t.impuestos,
                    efectivo: q.efectivo, tarjeta: q.tarjeta, transferencia: q.transferencia, propinas: q.propinas,
                    cortesias: t.cortesias, anuladas: this.e.retirados.length };
      var previa = this.e.informes.length ? this.e.informes[0].huella : '0000000000000000';
      var z = { numero: this.e.informes.length + 1, datos: datos, previa: previa, hora: hora(),
                huella: huella(previa + JSON.stringify(datos)) };
      this.e.informes.unshift(z);
      c.informe = true;
      this.hito('z');
      this.avisar('informe_diario', 'Informe diario N.º ' + z.numero + ' emitido');
      return z;
    },
    verificarInformes: function () {
      var lista = this.e.informes.slice().reverse(), previa = '0000000000000000';
      for (var i = 0; i < lista.length; i++) {
        if (lista[i].previa !== previa || huella(previa + JSON.stringify(lista[i].datos)) !== lista[i].huella) return lista[i].numero;
        previa = lista[i].huella;
      }
      return 0;
    },
    // --- Tablero del dueño (C6) ---
    tablero: function () {
      var neto = 0, costo = 0, impuestos = 0, platos = {};
      this.e.cobradas.forEach(function (r) {
        r.renglones.forEach(function (l) {
          var d = desglose(l.precio * l.qty, l.impuesto);
          neto += d[0]; impuestos += d[1]; costo += l.costo * l.qty;
          var p = platos[l.nombre] || (platos[l.nombre] = { nombre: l.nombre, vendidos: 0, neto: 0, costo: 0 });
          p.vendidos += l.qty; p.neto += d[0]; p.costo += l.costo * l.qty;
        });
      });
      var servidoSinCobrar = this.e.retirados.filter(function (r) { return r.clase !== 'no_servido'; });
      costo += servidoSinCobrar.reduce(function (s, r) { return s + r.costo; }, 0);
      var cortesias = this.e.retirados.filter(function (r) { return r.clase === 'cortesia'; }).reduce(function (s, r) { return s + r.valor; }, 0);
      var cobrado = neto + impuestos, cuentas = this.e.cobradas.length;
      var fuga = this.e.conteos.reduce(function (s, c) { return s + c.valor; }, 0);
      var lista = Object.keys(platos).map(function (k) { return platos[k]; });
      var menu = [];
      if (lista.length) {
        var unidades = lista.reduce(function (s, p) { return s + p.vendidos; }, 0);
        var margenMedio = lista.reduce(function (s, p) { return s + p.neto - p.costo; }, 0) / unidades;
        menu = lista.map(function (p) {
          var pop = p.vendidos / unidades, mu = Math.floor((p.neto - p.costo) / p.vendidos);
          var clase = pop >= 0.7 / lista.length ? (mu >= margenMedio ? 'estrella' : 'caballo') : (mu >= margenMedio ? 'rompecabezas' : 'perro');
          return { nombre: p.nombre, vendidos: p.vendidos, popularidad: pop, margen: mu, deja: p.neto - p.costo, clase: clase };
        }).sort(function (a, b) {
          var o = Object.keys(CLASES);
          return o.indexOf(a.clase) - o.indexOf(b.clase) || b.deja - a.deja;
        });
      }
      var alMes = neto * 26;                       // si el turno se repite 26 días al mes
      var equilibrio = neto > costo && this.e.gastosFijos > 0 ? Math.ceil(this.e.gastosFijos * neto / (neto - costo)) : null;
      return { neto: neto, impuestos: impuestos, cobrado: cobrado, costo: costo, cuentas: cuentas,
               costoPct: neto ? costo / neto : null, ticket: cuentas ? Math.floor(neto / cuentas) : null,
               fuga: fuga, fugaPct: costo ? fuga / costo : null, cortesias: cortesias,
               cortesiasPct: cobrado + cortesias ? cortesias / (cobrado + cortesias) : null,
               menu: menu, gastosFijos: this.e.gastosFijos, equilibrio: equilibrio, alMes: alMes };
    },
    // --- Hora pico: llena el turno de ventas de ejemplo para ver el tablero con cifras ---
    azar: function (n) {                        // generador determinista (misma semilla, mismas ventas)
      this.e.semilla = (Math.imul(this.e.semilla, 1103515245) + 12345) >>> 0;
      return this.e.semilla % n;
    },
    horaPico: function (ventas) {
      if (!this.e.turno.abierto) throw new Error('Abre la caja primero: sin caja no se vende.');
      var libres = this.e.mesas.filter(function (m) { return !this.e.cuentas[m.id]; }, this);
      if (!libres.length) throw new Error('Todos los puestos están ocupados: cobra alguno primero.');
      var rol = this.e.rol, hechas = 0;
      for (var i = 0; i < ventas; i++) {
        var m = libres[i % libres.length], veces = 1 + this.azar(3);
        for (var j = 0; j < veces; j++) {
          // lo primero de la carta sale más (así la matriz del menú tiene de todo)
          var k = this.azar(10), idx = k < 4 ? 0 : k < 6 ? 1 : 2 + this.azar(this.e.carta.length - 2);
          this.servir(m.id, this.e.carta[Math.min(idx, this.e.carta.length - 1)].id);
        }
        var total = this.total(m.id), medio = MEDIOS[this.azar(3)];
        this.cobrar(m.id, [{ medio: medio, monto: total }], this.azar(2) === 0, medio);
        hechas++;
      }
      this.e.rol = rol;
      this.avisar('hora_pico', hechas + ' ventas de ejemplo cobradas');
      return hechas;
    },
    colocar: function (mesaId, salon, gx, gy) {
      this.exigir('plano', 'Acomodar el plano es del dueño o del encargado.');
      var m = this.mesa(mesaId);
      var otra = this.e.mesas.filter(function (x) { return x.salon === salon && x.gx === gx && x.gy === gy; })[0];
      if (otra) { otra.salon = m.salon; otra.gx = m.gx; otra.gy = m.gy; }       // se intercambian
      m.salon = salon; m.gx = gx; m.gy = gy;
      this.avisar('mapa_cambiado', m.nombre + (otra ? ' cambió con ' + otra.nombre : ' cambió de lugar'));
    },
    dimensiones: function (salon) {
      var suyas = this.e.mesas.filter(function (x) { return x.salon === salon; });
      return { columnas: Math.max.apply(null, suyas.map(function (x) { return x.gx; }).concat([1])),
               filas: Math.max.apply(null, suyas.map(function (x) { return x.gy; }).concat([1])) };
    }
  };

  raiz.BarboxDemo = { Bar: Bar, inicial: inicial, puede: puede, pesos: pesos, cantidad: cantidad, porcentaje: porcentaje,
                      desglose: desglose, digito: digito, huella: huella, NEGOCIOS: NEGOCIOS, IMPUESTOS: IMPUESTOS,
                      RETIROS: RETIROS, MEDIOS: MEDIOS, CONCEPTOS_NC: CONCEPTOS_NC, HITOS: HITOS, CLASES: CLASES, UVT: UVT, PROPINA: PROPINA };
})(typeof window !== 'undefined' ? window : globalThis);
