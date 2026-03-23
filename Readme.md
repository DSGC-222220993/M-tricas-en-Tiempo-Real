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

## Mis Métricas
<img width="854" height="341" alt="image" src="https://github.com/user-attachments/assets/4f58eed1-cf63-40eb-8422-09119665b69b" />
<img width="1014" height="247" alt="image" src="https://github.com/user-attachments/assets/829d42ad-79c0-4d85-a4ac-f2c7d76e0946" />
<img width="1031" height="323" alt="image" src="https://github.com/user-attachments/assets/43c2d8a5-dd4c-4b9f-910b-f2890d460b88" />

### Dashboard con gráficas
<img width="1135" height="878" alt="image" src="https://github.com/user-attachments/assets/dedb2365-1f17-4042-9764-15e1ce73b40f" />

### Explorador de archivos de VS Code
<img width="290" height="281" alt="image" src="https://github.com/user-attachments/assets/908fb0f7-3f49-4bed-b1aa-27f171b3073b" />

