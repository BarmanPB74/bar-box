// BAR BOX · demo interactiva (vitrina pública). Datos inventados.
//
// Imita lo que hace la app real con un bar ficticio, «Bar La Esquina»:
// servir en una mesa descuenta la receta del inventario, cancelar exige
// motivo y cargo, cobrar deja comprobante, la caja cuadra sola y cada cambio
// sale en «Avisos en vivo» (lo que vería otro celular). Todo pasa en el
// navegador de quien la abre: nada se envía a ningún servidor. El estado se
// guarda en este navegador para que no se pierda al recargar.
//
// Dos partes: `Bar` (reglas, sin tocar la página; se prueba en node) y
// `pintar` (la página). Igual que en la app: el dinero en centavos enteros.
(function (raiz) {
  'use strict';

  // --- Datos iniciales ---------------------------------------------------
  function inicial() {
    return {
      rol: 'dueño', siguiente: 100, turno: { abierto: true, base: 20000000, numero: 12 },
      productos: [
        { id: 'club', nombre: 'Club Colombia', unidad: 'unidad', stock: 48000, minimo: 12000, costo: 260000 },
        { id: 'corona', nombre: 'Corona', unidad: 'unidad', stock: 14000, minimo: 12000, costo: 420000 },
        { id: 'aguardiente', nombre: 'Aguardiente', unidad: 'ml', stock: 3000000, minimo: 750000, costo: 4500 },
        { id: 'ron', nombre: 'Ron blanco', unidad: 'ml', stock: 1400000, minimo: 700000, costo: 6000 },
        { id: 'limon', nombre: 'Limón', unidad: 'unidad', stock: 30000, minimo: 10000, costo: 50000 },
        { id: 'coco', nombre: 'Crema de coco', unidad: 'ml', stock: 1500000, minimo: 500000, costo: 2200 },
        { id: 'papa', nombre: 'Papa criolla', unidad: 'g', stock: 3000000, minimo: 1000000, costo: 900 }
      ],
      carta: [
        { id: 1, nombre: 'Club Colombia', precio: 800000, categoria: 'Cervezas', receta: [['club', 1000]] },
        { id: 2, nombre: 'Corona', precio: 1200000, categoria: 'Cervezas', receta: [['corona', 1000]] },
        { id: 3, nombre: 'Aguardiente (trago)', precio: 900000, categoria: 'Licores', receta: [['aguardiente', 60000]] },
        { id: 4, nombre: 'Mojito', precio: 2000000, categoria: 'Cocteles', receta: [['ron', 60000], ['limon', 1000]] },
        { id: 5, nombre: 'Limonada de coco', precio: 1400000, categoria: 'Sin alcohol', receta: [['coco', 250000], ['limon', 1000]] },
        { id: 6, nombre: 'Papas criollas', precio: 1600000, categoria: 'Para picar', receta: [['papa', 300000]], cocina: true }
      ],
      salones: [{ id: 'terraza', nombre: 'Terraza', columnas: 3, filas: 2 }, { id: 'barra', nombre: 'Barra', columnas: 3, filas: 1 }],
      mesas: [
        { id: 't1', nombre: 'T1', salon: 'terraza', gx: 1, gy: 1, forma: 'cuadrada' },
        { id: 't2', nombre: 'T2', salon: 'terraza', gx: 2, gy: 1, forma: 'redonda' },
        { id: 't3', nombre: 'T3', salon: 'terraza', gx: 3, gy: 1, forma: 'cuadrada' },
        { id: 't4', nombre: 'T4', salon: 'terraza', gx: 1, gy: 2, forma: 'cuadrada' },
        { id: 't5', nombre: 'T5', salon: 'terraza', gx: 3, gy: 2, forma: 'redonda' },
        { id: 'b1', nombre: 'B1', salon: 'barra', gx: 1, gy: 1, forma: 'barra' },
        { id: 'b2', nombre: 'B2', salon: 'barra', gx: 2, gy: 1, forma: 'barra' },
        { id: 'b3', nombre: 'B3', salon: 'barra', gx: 3, gy: 1, forma: 'barra' }
      ],
      cuentas: {},           // mesa -> {id, renglones: [...], pedida}
      cobradas: [],          // {id, mesa, total, propina, pago, hora, renglones}
      caja: [],              // {clase: 'ingreso'|'retiro', monto, motivo, autor}
      retirados: [],         // {nombre, qty, valor, clase, motivo, autor, hora}
      avisos: [],            // lo que vería otro celular (F6)
      revisado: 0,           // cuántos retirados ya marcó leídos el dueño
      cierre: null           // último cierre de caja
    };
  }

  var NOMBRES = { 'dueño': 'Carolina (dueña)', bodega: 'Andrés (barista)', mesero: 'Sofía (mesera)' };
  var RETIROS = { no_servido: 'No se sirvió', merma: 'Merma', cortesia: 'Cortesía' };
  var PROPINA = 10;

  // --- Reglas (lo mismo que decide usuarios.puede en la app) ---------------
  var PERMISOS = {
    cancelar: ['dueño', 'bodega'], caja_cerrar: ['dueño', 'bodega'], caja_abrir: ['dueño', 'bodega'],
    plano: ['dueño', 'bodega'], contabilidad: ['dueño'], costos: ['dueño', 'bodega']
  };
  function puede(rol, que) { return (PERMISOS[que] || ['dueño']).indexOf(rol) >= 0; }

  function pesos(centavos) {
    var n = Math.round(Math.abs(centavos) / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (centavos < 0 ? '−$ ' : '$ ') + n;
  }
  function cantidad(milesimas) {
    var n = milesimas / 1000;
    return (Number.isInteger(n) ? n.toString() : n.toFixed(1).replace('.', ',')).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function hora() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  function Bar(estado) { this.e = estado || inicial(); }
  Bar.prototype = {
    producto: function (id) { return this.e.productos.filter(function (p) { return p.id === id; })[0]; },
    item: function (id) { return this.e.carta.filter(function (i) { return i.id === id; })[0]; },
    mesa: function (id) { return this.e.mesas.filter(function (m) { return m.id === id; })[0]; },
    autor: function () { return NOMBRES[this.e.rol]; },
    avisar: function (tipo, texto) {
      this.e.avisos.unshift({ n: this.e.siguiente++, tipo: tipo, texto: texto, hora: hora() });
      this.e.avisos = this.e.avisos.slice(0, 8);
    },
    rinde: function (item) {             // cuántas veces se puede servir con lo que hay
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
    servir: function (mesa, itemId) {
      if (!this.e.turno.abierto) throw new Error('La caja está cerrada: ábrela antes de vender.');
      var item = this.item(itemId), self = this;
      if (this.rinde(item) < 1) throw new Error('No alcanza el inventario para ' + item.nombre + '.');
      item.receta.forEach(function (l) { self.producto(l[0]).stock -= l[1]; });
      var c = this.e.cuentas[mesa] || (this.e.cuentas[mesa] = { id: this.e.siguiente++, renglones: [], pedida: false });
      c.renglones.push({ id: this.e.siguiente++, item: item.id, nombre: item.nombre, precio: item.precio, qty: 1,
                         estado: item.cocina ? 'pendiente' : 'entregado', hora: hora() });
      this.avisar('pedido_creado', this.mesa(mesa).nombre + ': ' + item.nombre + (item.cocina ? ' → cocina' : ''));
    },
    retirar: function (mesa, renglonId, clase, motivo) {
      if (!puede(this.e.rol, 'cancelar')) throw new Error('Cancelar es del dueño o del barista: pídeselo en la barra.');
      if (!RETIROS[clase]) throw new Error('Elige qué pasó.');
      if (!motivo || !motivo.trim()) throw new Error('Escribe el motivo: queda con tu nombre.');
      var r = this.e.cuentas[mesa].renglones.filter(function (x) { return x.id === renglonId; })[0], self = this;
      if (!r || r.retiro) throw new Error('Ese renglón ya se retiró.');
      if (clase === 'no_servido') {          // sólo lo que no se sirvió vuelve al inventario
        this.item(r.item).receta.forEach(function (l) { self.producto(l[0]).stock += l[1] * r.qty; });
      }
      r.retiro = clase; r.motivo = motivo.trim(); r.autor = this.autor();
      this.e.retirados.push({ nombre: r.nombre, qty: r.qty, valor: r.precio * r.qty, clase: clase,
                              motivo: r.motivo, autor: r.autor, hora: hora(), mesa: this.mesa(mesa).nombre });
      this.avisar('renglon_retirado', this.mesa(mesa).nombre + ': ' + r.nombre + ' · ' + RETIROS[clase]);
    },
    pedirCuenta: function (mesa) {
      var c = this.e.cuentas[mesa];
      c.pedida = !c.pedida;
      this.avisar('cuenta_pedida', this.mesa(mesa).nombre + (c.pedida ? ' pidió la cuenta' : ': sigue pidiendo'));
    },
    cobrar: function (mesa, pago, conPropina) {
      var total = this.total(mesa);
      if (!total) throw new Error('No hay nada que cobrar.');
      var propina = conPropina ? Math.round(total * PROPINA / 100 / 100) * 100 : 0;
      var c = this.e.cuentas[mesa];
      var recibo = { id: c.id, mesa: this.mesa(mesa).nombre, total: total, propina: propina, pago: pago,
                     hora: hora(), autor: this.autor(), renglones: this.vigentes(mesa) };
      this.e.cobradas.push(recibo);
      delete this.e.cuentas[mesa];
      this.avisar('cuenta_cobrada', recibo.mesa + ' cobrada: la mesa queda libre');
      return recibo;
    },
    mover: function (desde, hacia) {
      if (desde === hacia) throw new Error('Elige otra mesa.');
      var origen = this.e.cuentas[desde], destino = this.e.cuentas[hacia];
      if (!destino) {
        this.e.cuentas[hacia] = origen;
      } else {
        destino.renglones = destino.renglones.concat(origen.renglones);
      }
      delete this.e.cuentas[desde];
      this.avisar('cuenta_movida', this.mesa(desde).nombre + ' pasó a ' + this.mesa(hacia).nombre + (destino ? ' (se juntaron)' : ''));
    },
    moverCaja: function (clase, monto, motivo) {
      if (!(monto > 0)) throw new Error('Escribe cuánto.');
      if (!motivo || !motivo.trim()) throw new Error('Escribe el motivo.');
      this.e.caja.push({ clase: clase, monto: monto, motivo: motivo.trim(), autor: this.autor(), hora: hora() });
      this.avisar('caja_movimiento', 'Movimiento de caja: ' + clase);
    },
    cuadre: function () {
      var t = this.e.cobradas;
      var efectivo = t.filter(function (x) { return x.pago === 'efectivo'; });
      var suma = function (l, k) { return l.reduce(function (s, x) { return s + x[k]; }, 0); };
      var ingresos = suma(this.e.caja.filter(function (m) { return m.clase === 'ingreso'; }), 'monto');
      var retiros = suma(this.e.caja.filter(function (m) { return m.clase === 'retiro'; }), 'monto');
      var r = { base: this.e.turno.base, efectivo: suma(efectivo, 'total'), propinasEfectivo: suma(efectivo, 'propina'),
                propinas: suma(t, 'propina'), vendido: suma(t, 'total'), otros: suma(t, 'total') - suma(efectivo, 'total'),
                ingresos: ingresos, retiros: retiros, cuentas: t.length,
                abiertas: Object.keys(this.e.cuentas).length };
      r.esperado = r.base + r.efectivo + r.propinasEfectivo + r.ingresos - r.retiros;
      return r;
    },
    cerrarCaja: function (contado) {
      if (!puede(this.e.rol, 'caja_cerrar')) throw new Error('Cerrar la caja es del dueño o del barista.');
      var q = this.cuadre();
      if (q.abiertas) throw new Error('Hay ' + q.abiertas + ' cuenta(s) abierta(s): cóbralas antes de cerrar.');
      this.e.cierre = { numero: this.e.turno.numero, esperado: q.esperado, contado: contado, diferencia: contado - q.esperado,
                        vendido: q.vendido, propinas: q.propinas, autor: this.autor(), hora: hora() };
      this.e.turno.abierto = false;
      this.avisar('caja_cerrada', 'Turno #' + this.e.turno.numero + ' cerrado');
      return this.e.cierre;
    },
    abrirCaja: function (base) {
      if (!puede(this.e.rol, 'caja_abrir')) throw new Error('Abrir la caja es del dueño o del barista.');
      this.e.turno = { abierto: true, base: base, numero: this.e.turno.numero + 1 };
      this.e.cobradas = []; this.e.caja = [];
      this.avisar('caja_abierta', 'Turno #' + this.e.turno.numero + ' abierto');
    },
    colocar: function (mesaId, salon, gx, gy) {
      if (!puede(this.e.rol, 'plano')) throw new Error('Acomodar el plano es del dueño o del barista.');
      var m = this.mesa(mesaId);
      var otra = this.e.mesas.filter(function (x) { return x.salon === salon && x.gx === gx && x.gy === gy; })[0];
      if (otra) { otra.salon = m.salon; otra.gx = m.gx; otra.gy = m.gy; }       // se intercambian
      m.salon = salon; m.gx = gx; m.gy = gy;
      this.e.salones.forEach(function (s) {
        var suyas = this.e.mesas.filter(function (x) { return x.salon === s.id; });
        s.columnas = Math.max.apply(null, suyas.map(function (x) { return x.gx; }).concat([1]));
        s.filas = Math.max.apply(null, suyas.map(function (x) { return x.gy; }).concat([1]));
      }, this);
      this.avisar('mapa_cambiado', m.nombre + (otra ? ' cambió con ' + otra.nombre : ' cambió de lugar'));
    }
  };

  raiz.BarboxDemo = { Bar: Bar, inicial: inicial, puede: puede, pesos: pesos, cantidad: cantidad, RETIROS: RETIROS };
})(typeof window !== 'undefined' ? window : globalThis);
