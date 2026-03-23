# Dashboard de Compras TI - Proyecto CET

Este proyecto es un sistema de monitoreo que integra datos de **Jira Software** y una simulación de producción mediante **WebSockets**.

### Lo que incluye:
* **Backend (Python):** Servidor API que consulta Jira de forma segura y gestiona WebSockets.
* **Seguridad:** Uso de archivos `.env` para proteger el API Token de Atlassian.
* **Frontend:** Dashboard dinámico con gráficas de barras y dona (Chart.js).
* **Métricas:** Gasto por categoría, estado de aprobación y tiempos de resolución.

### Instrucciones rápidas:
1. Instalar dependencias: `pip install aiohttp python-dotenv`
2. Configurar el archivo `.env` con tus credenciales.
3. Ejecutar: `python production_replay.py`
4. Abrir `index.html` en el navegador.

### Dashboard con gráficas
<img width="1147" height="940" alt="image" src="https://github.com/user-attachments/assets/3621364f-ece2-4c40-92fc-9f291de261e1" />
