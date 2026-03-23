document.addEventListener('DOMContentLoaded', () => {
// --- 1. CONSTANTES DE CONFIGURACIÓN (DEBEN IR AL PRINCIPIO) ---
    
    const ESTADOS_APROBADOS = [
        "COMPRA COMPLETADA",
        "EN PROCESO DE ADQUISICIÓN",
        "APROBADA-PENDIENTE DE COMPRA"
    ];

    const ESTADOS_RECHAZADOS = ["RECHAZADA"];

// --- 2. CONFIGURACIÓN INICIAL DE GRÁFICAS ---
    
    const completionChart = new Chart(document.getElementById('completionChart'), {
        type: 'bar',
        data: {
            labels: ['CET-115', 'CET-114', 'CET-113', 'CET-111', 'CET-110'],
            datasets: [{
                label: 'Días',
                data: [0.06, 0.06, 0.06, 0.06, 0.06],
                backgroundColor: '#38bdf8'
            }]
        },
        options: { scales: { y: { beginAtZero: true, grid: { color: '#1f2937' } } } }
    });

    const acceptanceChart = new Chart(document.getElementById('acceptanceChart'), {
        type: 'doughnut',
        data: {
            labels: ['Aprobadas', 'En proceso', 'Rechazadas'],
            datasets: [{
                data: [0, 0, 0], 
                backgroundColor: ['#3b82f6', '#4b5563', '#eab308'],
                borderWidth: 0
            }]
        }
    });

    const spendChart = new Chart(document.getElementById('spendChart'), {
        type: 'bar',
        data: {
            labels: ['Otro', 'Hardware', 'Servicio', 'Software'],
            datasets: [{
                label: 'Gasto ($)',
                data: [0, 0, 0, 0], 
                backgroundColor: '#34d399'
            }]
        },
        options: { indexAxis: 'x' }
    });

// --- 3. FUNCIONES DE CARGA DE DATOS ---

    async function fetchRealJiraData() {
        let completionData = [];
        let completionLabels = [];
        
        console.log("Iniciando actualización desde el Puente de Jira...");
        try {
            const response = await fetch('http://127.0.0.1:8000/jira/data');
            const data = await response.json();
            const issues = data.issues;

            let gastos = { "Otro": 0, "Hardware": 0, "Servicio": 0, "Software": 0 };
            let conteoAceptacion = { "Aprobadas": 0, "En proceso": 0, "Rechazadas": 0 };

            issues.forEach(issue => {
                // A. Lógica de Estados (Ratio de Aceptación)
                const estadoNombre = issue.fields.status.name.toUpperCase();
                if (ESTADOS_APROBADOS.includes(estadoNombre)) {
                    conteoAceptacion["Aprobadas"]++;
                } else if (ESTADOS_RECHAZADOS.includes(estadoNombre)) {
                    conteoAceptacion["Rechazadas"]++;
                } else {
                    conteoAceptacion["En proceso"]++;
                }

                // B. Lógica de Gastos (Spend)
                const monto = parseFloat(issue.fields.customfield_10140) || 0; 

                const catObj = issue.fields.customfield_10138;
                const categoria = (catObj && catObj.value) ? catObj.value : "Otro";

                if (gastos.hasOwnProperty(categoria)) {
                    gastos[categoria] += monto;
                } else {
                    gastos["Otro"] += monto;
                }

                const created = new Date(issue.fields.created);
                const resolved = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : null;

                if (resolved) {
                    const diffTime = Math.abs(resolved - created);
                    const diffDays = (diffTime / (1000 * 60 * 60 * 24)).toFixed(2);
                    // Ultimos 5 issues para la gráfica de Completion
                    if (completionLabels.length < 5) {
                        completionLabels.push(issue.key);
                        completionData.push(parseFloat(diffDays));
                    }
                }
            });

            // Actualizar gráficas
            spendChart.data.datasets[0].data = [
                gastos["Otro"], 
                gastos["Hardware"], 
                gastos["Servicio"], 
                gastos["Software"]
            ];
            spendChart.update();

            acceptanceChart.data.datasets[0].data = [
                conteoAceptacion["Aprobadas"],
                conteoAceptacion["En proceso"],
                conteoAceptacion["Rechazadas"]
            ];
            acceptanceChart.update();

            completionChart.data.labels = completionLabels;
            completionChart.data.datasets[0].data = completionData;
            completionChart.update();

            console.log("¡Tablero actualizado con datos reales de CET!");
        } catch (e) {
            console.error("Error al cargar datos reales:", e);
        }
    }

// --- 4. CONEXIÓN AL WEBSOCKET Y POLLING ---
    const socket = new WebSocket('ws://127.0.0.1:8000/ws/production');

    socket.onmessage = function(event) {
        const entry = JSON.parse(event.data);
        if (entry.type !== "replay_completed") {
            // Animación para mostrar que hay actividad
            acceptanceChart.update('none'); 
        }
    };

    fetchRealJiraData(); 
    setInterval(fetchRealJiraData, 60000); 
});