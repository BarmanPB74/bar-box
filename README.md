# BAR BOX
### El oficio, bajo control.

Una herramienta para negocios pequeños, hecha desde la barra: **ventas, caja,
inventario, costos y factura** en un solo lugar, en el teléfono o en el computador del local,
y funciona sin internet. Sirve para bares, cafés, tiendas de barrio o barberías: todo negocio
que vende en puestos (mesas, sillas o cajas) y gasta insumos.

**▶ [Probar un turno completo](https://barmanpb74.github.io/bar-box/demo/app.html)** en un bar, un café, un minimercado o una barbería inventados · [Presentación](https://barmanpb74.github.io/bar-box/)

## Un turno de servicio

| | |
|---|---|
| **Mapa de mesas** | Cada mesa dice si está libre, servida o pidió la cuenta. Un toque sirve un producto y abre la cuenta. |
| **Cuenta de la mesa** | Carta por categorías, lo servido y el cobro con propina sugerida voluntaria. |
| **Pre-cuenta y comprobante** | Tiquetes para impresora térmica de 58/80 mm, antes y después de cobrar. |
| **Caja con cuadre** | Base, ventas en efectivo, propinas y gastos: la app dice cuánto debe haber en el cajón. |
| **Inventario vivo** | Cada venta descuenta su receta; conteos, entradas y mermas quedan con quién y por qué. |
| **Costos y margen** | Costo de cada receta, margen por producto y valor de la bodega por categoría. |
| **Pago dividido** | Hasta tres formas de pago por cuenta; la caja cuadra cada medio. |
| **Vender sin existencia** | La venta no se frena; lo que faltaba queda pendiente de compra o conteo. |
| **Clientes y factura electrónica** | Ficha completa del cliente y factura con sus datos, lista para un proveedor tecnológico de la DIAN. Se corrige con nota crédito (anulación, devolución, rebaja, ajuste o descuento). |
| **Informe diario** | Uno por turno, consecutivo, con huella encadenada que delata cualquier cambio. |
| **Tablero del dueño** | Costo de venta, ticket, fuga por conteos, ingeniería de menú y punto de equilibrio. |

## Cómo está hecho

- **Python, Flask y SQLite**: corre en un teléfono Android (Termux) o en un computador.
- **Sin dependencias en el navegador**: funciona sin internet.
- **Más de 600 pruebas automáticas** antes de guardar cada cambio.
- **Cargos**: dueño, encargado y vendedor, cada uno con lo suyo.
- **Dinero en centavos** y rastro de cada movimiento.

## Estado

Versión 0.8, en laboratorio y en camino a la primera prueba en un negocio real. La factura
electrónica se arma completa y se entrega a un proveedor tecnológico; hasta que el negocio se
habilite ante la DIAN, sale marcada «PRUEBAS · SIN VALIDEZ FISCAL». **El código fuente es privado**; este repositorio
presenta el producto con datos ficticios.

---

Hecho por **BarmanPB74**, barman en Colombia que aprendió a programar para resolver su propio turno.
