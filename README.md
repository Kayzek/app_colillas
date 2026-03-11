# 📄 Colillas Pro

**Gestión Profesional y Descarga Masiva de Nómina Odoo**

[![Electron](https://img.shields.io/badge/Electron-2B2E3A?style=for-the-badge&logo=electron&logoColor=9FEAF9)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![MUI](https://img.shields.io/badge/Material--UI-0081CB?style=for-the-badge&logo=material-ui&logoColor=white)](https://mui.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

---

## 🌟 Descripción

**Colillas Pro** es una solución de escritorio potente y refinada diseñada para departamentos de RRHH y contabilidad que operan con **Odoo**. Permite la descarga masiva y simplificada de recibos de nómina (colillas) mediante un flujo de trabajo optimizado y una interfaz de usuario moderna.

---

## ✨ Características Principales

*   **🔒 Login Inteligente**: Autenticación directa con tus credenciales de Odoo con opción de "Recordar Usuario".
*   **🏢 Soporte Multi-compañía**: Cambio dinámico entre distintas entidades legales configuradas en tu instancia.
*   **🔍 Filtrado Secuencial Inteligente**: Interfaz guiada (Empresa > Año > Mes) que bloquea selecciones erróneas y asegura que siempre encuentres el lote correcto.
*   **🌓 Modo Oscuro/Claro**: Sistema de temas adaptativo para reducir la fatiga visual durante jornadas extensas.
*   **📂 Descarga Masiva en PDF**: Generación y exportación de colillas de pago y aguinaldos en alta definición directamente desde los reportes técnicos de Odoo.
*   **🎨 Diseño Premium**: Construido con Material UI siguiendo principios de diseño moderno, con transiciones suaves y micro-animaciones.

---

## 🛠️ Stack Tecnológico

*   **Core**: [Electron](https://www.electronjs.org/) (Aplicación de escritorio nativa).
*   **Frontend**: [React.js](https://reactjs.org/) con [Vite](https://vitejs.dev/).
*   **UI/UX**: [Material UI (MUI)](https://mui.com/) con sistema de temas personalizado.
*   **Comunicación**: XML-RPC para datos de negocio y API HTTP (Axios) para streaming de reportes PDF.

---

## 🚀 Instalación y Uso

### Prerrequisitos
*   [Node.js](https://nodejs.org/) (Versión 16 o superior recomendada).

### Configuración del Entorno
Crea un archivo `.env` en la raíz del proyecto con los datos de tu instancia de Odoo:

```env
# URL base de tu servidor Odoo
ODOO_URL=https://tu-empresa.odoo.com

# Nombre de la base de datos
ODOO_DB=tu_db_produccion

# (Opcional) Nombres técnicos de reportes si usas personalizados
ODOO_REPORT_PAGO=hr_payroll.report_pago_custom
ODOO_REPORT_AGUINALDO=hr_payroll.report_aguinaldo_custom
```

### Comandos
1.  **Instalar dependencias**:
    ```bash
    npm install
    ```
2.  **Modo Desarrollo**:
    ```bash
    npm run electron:dev
    ```
3.  **Generar Ejecutable (.exe)**:
    ```bash
    npm run dist
    ```

---

## 📂 Estructura del Proyecto

*   `/electron`: Lógica del proceso principal, comunicación con Odoo y gestión de ventanas.
*   `/src`: Código fuente de React (Componentes, Contextos y UI).
*   `/src/theme.js`: Sistema de diseño global y paleta de colores.
*   `/public`: Recursos estáticos y branding oficial.

---

## 🛡️ Seguridad

La aplicación utiliza **Context Isolation** en Electron y no almacena contraseñas de forma local de manera persistente (excepto el nombre de usuario si se solicita). Todas las peticiones viajan de forma segura hacia tu instancia de Odoo configurada.

---

## 📝 Notas de Versión
*   **v1.0.0**: Implementación inicial con React + Vite.
*   **v2.0.0**: Añadido modo oscuro, filtros secuenciales y rediseño de UI "Colillas Pro".

---
*Desarrollado para la eficiencia. Potenciado por Odoo.*