# Thermo House Platform - Manual de Funcionamiento

Plataforma híbrida de ventas diseñada para la automatización del proceso de cotización y gestión de leads para Thermo House México. Combina una herramienta de medición satelital con un potente panel administrativo.

## 🛠 Arquitectura Tecnológica
- **Core:** Next.js 14+ (App Router)
- **Base de Datos:** Supabase (PostgreSQL + RLS)
- **Geolocalización:** Google Maps JavaScript API (Medición Satelital)
- **UI/UX:** TailwindCSS + Framer Motion para animaciones premium.

---

## 📐 1. Flujo del Usuario (Cotizador Público)

El proceso de cotización se divide en tres pasos intuitivos:

### Paso 1: Medición Satelital
- El usuario ingresa su dirección y utiliza el mapa interactivo para delimitar su techo.
- La herramienta calcula automáticamente el área en m².
- El sistema detecta si la ubicación del usuario está dentro de las zonas de operación activa o si es una zona foránea (activando alertas de logística).

### Paso 2: Selección de Sistema
- El sistema filtra los productos adecuados según el tipo de techo (Concreto, Lámina o Mixto).
- Se presentan las opciones provenientes del **Catálogo Maestro** con sus beneficios técnicos detallados.

### Paso 3: Contacto y Reporte
- El usuario proporciona sus datos de contacto.
- Se genera una cotización inmediata mostrando el precio de Contado y 12 MSI.
- Los datos se vinculan automáticamente al Asesor asignado según la región.

---

## 💼 2. Panel de Administración (Management Suite)

Accesible vía `/admin`, centraliza toda la operación comercial.

### Sección: Leads (Gestión de Prospectos)
- **Vista Kanban / Listado:** Permite mover leads entre estados (Nuevo, Contactado, Visita Técnica, Cerrado).
- **Ficha del Cliente:**
    - Edición de áreas y ajustes técnicos.
    - Aplicación de **Cargos Logísticos** para zonas foráneas.
    - Generación de **Cotización PDF** profesional con membrete oficial.
- **Asignación:** Identifica qué asesor atendió a cada cliente.

### Sección: Productos (Catálogo Maestro)
- **Fichas Técnicas:** Define el ADN del producto (Nombre, ID interno, Grosor, Beneficio Principal y Orden de visualización).
- **Consistencia:** Todos los precios regionales se basan en estas fichas para asegurar que el marketing y la información técnica sean uniformes en todo el país.

### Sección: Precios (Tarifado Regional)
- Permite definir precios específicos de **Contado** y **MSI** por cada ciudad.
- Soporta el **Modo Legado** para transiciones suaves durante la carga de catálogo.

### Sección: Sedes (Locations)
- **Mérida (Base Central):** Configurada como la sede principal de operaciones. Es fija y no puede ser removida del sistema.
- **Zonas Regionales:** Permite abrir nuevas sucursales regionales con sus respectivos estados de cobertura.

### Sección: Configuración (Admin Only)
- Gestión de llaves de API (Google Maps) directamente desde la interfaz sin tocar el código.

---

## ⚡️ Operaciones Técnicas

### Gestión de Asesores
Los administradores pueden dar de alta nuevos asesores asignándoles una ciudad base. Esto permite que el sistema asigne leads geográficamente y que las cotizaciones incluyan el teléfono y correo profesional del asesor correcto.

### Sistema de Impresión
Las cotizaciones están optimizadas para impresión en tamaño **US Letter**. El sistema oculta automáticamente la interfaz del dashboard y aplica estilos limpios de reporte formal al enviar a imprimir (Cmd/Ctrl + P).

---

## 📄 Licencia y Propiedad
Propiedad privada de **Thermo House México**. Todos los derechos reservados.
