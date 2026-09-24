# BAR BOX
### El oficio, bajo control.

Una herramienta para bares y cafés pequeños, hecha desde la barra: **mesas, caja,
inventario y costos** en un solo lugar, en el teléfono o en el computador del local,
y funciona sin internet.

**▶ [Ver la presentación y la demo](https://barmanpb74.github.io/bar-box/)** (datos ficticios)

## Una noche de servicio

| | |
|---|---|
| **Mapa de mesas** | Cada mesa dice si está libre, servida o pidió la cuenta. Un toque sirve un producto y abre la cuenta. |
| **Cuenta de la mesa** | Carta por categorías, lo servido y el cobro con propina sugerida voluntaria. |
| **Pre-cuenta y comprobante** | Tiquetes para impresora térmica de 58/80 mm, antes y después de cobrar. |
| **Caja con cuadre** | Base, ventas en efectivo, propinas y gastos: la app dice cuánto debe haber en el cajón. |
| **Inventario vivo** | Cada venta descuenta su receta; conteos, entradas y mermas quedan con quién y por qué. |
| **Costos y margen** | Costo de cada receta, margen por producto y valor de la bodega por categoría. |

## Cómo está hecho

- **Python, Flask y SQLite**: corre en un teléfono Android (Termux) o en un computador.
- **Sin dependencias en el navegador**: funciona sin internet.
- **Más de 300 pruebas automáticas** antes de guardar cada cambio.
- **Cargos**: dueño, barista y mesero, cada uno con lo suyo.
- **Dinero en centavos** y rastro de cada movimiento.

## Estado

Versión 0.7, en laboratorio y en camino a la primera prueba en un bar real. Todavía no
emite factura electrónica DIAN. **El código fuente es privado**; este repositorio
presenta el producto con datos ficticios.

---

Hecho por **BarmanPB74**, barman en Colombia que aprendió a programar para resolver su propio turno.
