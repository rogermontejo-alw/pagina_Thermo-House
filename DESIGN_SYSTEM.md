# Thermo House - Visual DNA & Design System
> Documento vivo de referencia visual basado en assets aprobados.

## 1. Paleta de Colores (Extracción)

### Marca Principal
- **Primary Orange (Acción/CTA):** `#F97316` (Tailwind `orange-500`)
  - *Uso:* Botones principales, números de pasos, destacados de texto.
- **Primary Navy (Identidad/Headers):** `#0F172A` (Tailwind `slate-900`)
  - *Uso:* Fondos de secciones Hero, Footers, Títulos principales en fondo claro.

### Secundarios y Funcionales
- **Action Teal (Mantenimiento):** `#14B8A6` (Tailwind `teal-500`)
  - *Uso:* Botón específico "Schedule Maintenance".
- **Success Green:** `#22C55E` (Tailwind `green-500`)
  - *Uso:* Iconos de validación (checks), bullets de beneficios.
- **Error Red:** `#EF4444` (Tailwind `red-500`)
  - *Uso:* Iconos de negación (X), tablas comparativas.

### Neutros
- **Background Light:** `#F8FAFC` (Tailwind `slate-50`)
  - *Uso:* Fondo general de secciones claras.
- **Card Background:** `#F1F5F9` (Tailwind `slate-100`) o `#FFFFFF` (White) con sombra.
  - *Uso:* Tarjetas de servicios, contenedores de información.
- **Text Body:** `#475569` (Tailwind `slate-600`)
  - *Uso:* Párrafos descriptivos, textos secundarios.
- **Border/Divider:** `#E2E8F0` (Tailwind `slate-200`)
  - *Uso:* Líneas divisorias en tablas y tarjetas.

---

## 2. Tipografía

- **Familia:** Sans Serif geométrica/humanista (Probable: `Inter`, `Manrope` o `DM Sans`).
- **Jerarquía:**
  - **H1 / Hero Title:** ExtraBold / Bold. Color Blanco (sobre oscuro) o Navy (sobre claro). Tamaño masivo para impacto.
  - **H2 / Section Title:** Bold. Color Navy.
  - **H3 / Card Title:** SemiBold. Color Navy.
  - **Body Text:** Regular. Color Slate-600. Leíble, buen tracking.
  - **Button Text:** Medium/SemiBold.

---

## 3. Componentes UI (Atributos Físicos)

### Botones
- **Radio de Borde (Border Radius):** `rounded-lg` (aprox. 8px).
  - *Nota:* No usar pill-shape (redondo completo) excepto si se especifica en un contexto muy particular. Las imágenes muestran rectángulos redondeados constantes.
- **Padding:** Generoso horizontalmente. Aprox `px-6 py-3`.
- **Estilos:**
  - *Primary:* Fondo Orange, Texto Blanco.
  - *Dark:* Fondo Navy, Texto Blanco (ej. "Get a Free Quote" en nav, "Contact Us").
  - *Ghost/Light:* Fondo Slate-200, Texto Navy (ej. "Learn More").

### Tarjetas (Cards)
- **Radio de Borde:** `rounded-2xl` (aprox. 16px - 20px). Se ven más redondeadas que los botones.
- **Sombra:** Sutil, difusa (`shadow-md` o `shadow-lg` suave).
- **Background:** Generalmente White sobre fondo Slate-50, o Slate-100 sobre fondo White.

### Tablas (Comparativa)
- **Header:** Fondo Navy, Texto Blanco.
- **Filas:** Fondo blanco con bordes divisores sutiles (`border-b`).
- **Alineación:** Texto izquierda, Iconos/Valores centrados o alineados coherentemente.

---

## 4. Reglas de Composición
- **Espaciado:** "Aireado". Mucho whitespace entre secciones. `gap-8` o `gap-12` entre grid items. `py-20` o más para padding vertical de secciones.
- **Iconografía:** Estilo línea (outline) o duotono simple. Enmarcados a veces en círculos o escudos.

---

*> Este documento debe ser consultado antes de crear cualquier nuevo componente para asegurar consistencia con las imágenes Image 0, 1, 2, 3, y 4.*
