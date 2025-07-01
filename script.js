document.addEventListener('DOMContentLoaded', () => {
    // ==================================================================================
    //  ¡ACCIÓN REQUERIDA!
    //  Pega aquí TU PROPIA URL de la aplicación web de Google Apps Script.
    // ==================================================================================
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxjMpjhymZBVTj2fwJ7lgf7uq2oJTuqTqs9L2jLOjRm1m_Bwm8BIiJQTWnfTzlBhoBp/exec';
    // ==================================================================================


    // --- Selectores de elementos y parámetros de URL ---
    const loader = document.getElementById('loader');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    const formContainer = document.getElementById('form-container');
    const urlParams = new URLSearchParams(window.location.search);
    const reporteId = urlParams.get('reporte');

    /**
     * Función central para comunicarse con el backend de Google Apps Script.
     * @param {string} action - El nombre de la función a ejecutar en el backend.
     * @param {object} payload - Los datos a enviar.
     * @returns {Promise<object>} - La respuesta del backend en formato JSON.
     */
    async function callGoogleScript(action, payload = {}) {
        // Esta comprobación se ha eliminado para evitar confusiones.
        // Asegúrate de que la URL de arriba sea la correcta.

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ action, payload }),
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`Error en la comunicación con el servidor: ${response.statusText}`);
        }
        return await response.json();
    }
    
    // --- Lógica de Inicialización ---
    if (document.getElementById('form-part1')) {
        initializePart1();
    } else if (document.getElementById('form-part2')) {
        loadPart2Data(reporteId);
    } else if (document.getElementById('form-part3')) {
        loadPart3Data(reporteId);
    }

    // --- Funciones de Ayuda (para mostrar mensajes y spinner) ---
    function showLoader() {
        if(loader) loader.style.display = 'block';
        if(formContainer) formContainer.style.display = 'none';
        if(successMessage) successMessage.style.display = 'none';
        if(errorMessage) errorMessage.style.display = 'none';
    }
    function showMessage(type, text) {
        const messageEl = type === 'success' ? successMessage : errorMessage;
        if (messageEl) {
            messageEl.innerHTML = text;
            messageEl.style.display = 'block';
        }
        if (loader) loader.style.display = 'none';
        if (type === 'error' && formContainer) formContainer.style.display = 'block';
    }

    // =================== PARTE 1: REPORTE DEL COLABORADOR ===================
    function initializePart1() {
        const canvas = document.getElementById('signature-pad');
        const signaturePad = new SignaturePad(canvas);
        document.getElementById('clear-signature').addEventListener('click', () => signaturePad.clear());

        document.getElementById('form-part1').addEventListener('submit', async (event) => {
            event.preventDefault();
            if (signaturePad.isEmpty()) {
                return alert("La firma del trabajador es obligatoria.");
            }
            showLoader();
            const formData = Object.fromEntries(new FormData(event.target).entries());
            formData.firma = signaturePad.toDataURL('image/png');

            try {
                const response = await callGoogleScript('processPart1', formData);
                if (response.success) {
                    showMessage('success', `¡Reporte enviado con éxito! Su número de reporte es: <strong>${response.reportId}</strong>. Por favor, guárdelo para futuras referencias.`);
                } else {
                    showMessage('error', `Error: ${response.error || 'Ocurrió un error desconocido.'}`);
                }
            } catch (error) {
                showMessage('error', error.message);
            }
        });
    }

    // =================== PARTE 2: INVESTIGACIÓN DEL JEFE ===================
    async function loadPart2Data(id) {
        if (!id) return showMessage('error', 'No se ha especificado un número de reporte. Por favor, acceda desde el enlace enviado a su correo.');
        document.getElementById('reporteId-part2').value = id;

        try {
            const response = await callGoogleScript('getReportData', { reportId: id });
            if (response.success) {
                const data = response.data;
                document.getElementById('info-part2').innerHTML = `
                    <strong>Reporte #:</strong> ${data.ReporteID}<br>
                    <strong>Colaborador:</strong> ${data.NombreCompleto || 'N/A'}<br>
                    <strong>Fecha del Reporte:</strong> ${new Date(data.Timestamp).toLocaleString('es-CR')}`;
            } else {
                showMessage('error', `Error: ${response.error || 'No se pudieron cargar los datos.'}`);
            }
        } catch (error) {
            showMessage('error', error.message);
        }

        document.getElementById('form-part2').addEventListener('submit', async (event) => {
            event.preventDefault();
            showLoader();
            const formData = Object.fromEntries(new FormData(event.target).entries());
            try {
                const response = await callGoogleScript('processPart2', formData);
                if (response.success) {
                    showMessage('success', 'Investigación enviada con éxito. Su aporte ha sido registrado. Ya puede cerrar esta ventana.');
                } else {
                    showMessage('error', `Error: ${response.error || 'No se pudo enviar la investigación.'}`);
                }
            } catch (error) {
                showMessage('error', error.message);
            }
        });
    }

    // =================== PARTE 3: ANÁLISIS TÉCNICO DE SST ===================
    async function loadPart3Data(id) {
        if (!id) return showMessage('error', 'No se ha especificado un número de reporte. Por favor, acceda desde el enlace enviado a su correo.');
        document.getElementById('reporteId-part3').value = id;

        try {
            const response = await callGoogleScript('getReportData', { reportId: id });
            if (response.success) {
                const data = response.data;
                document.getElementById('info-part3').innerHTML = `
                    <h4>Resumen del Reporte #${data.ReporteID}</h4>
                    <p><strong>Colaborador:</strong> ${data.NombreCompleto || 'N/A'} (${data.Cedula || 'N/A'})</p>
                    <p><strong>Investigación (Por qué):</strong> ${data.InvestigacionPorque || 'Pendiente'}</p>
                    <p><strong>Plan de Acción (Medidas):</strong> ${data.PlanAccionMedidas || 'Pendiente'}</p>`;
            } else {
                showMessage('error', `Error: ${response.error || 'No se pudieron cargar los datos.'}`);
            }
        } catch (error) {
            showMessage('error', error.message);
        }

        document.getElementById('form-part3').addEventListener('submit', async (event) => {
            event.preventDefault();
            showLoader();
            const formData = Object.fromEntries(new FormData(event.target).entries());
            try {
                const response = await callGoogleScript('processPart3AndGeneratePDF', formData);
                if (response.success) {
                    showMessage('success', `Proceso finalizado. El PDF ha sido generado y enviado por correo. <br><a href="${response.pdfUrl}" target="_blank" rel="noopener noreferrer">Ver PDF generado</a>`);
                } else {
                    showMessage('error', `Error: ${response.error || 'No se pudo finalizar el proceso.'}`);
                }
            } catch (error) {
                showMessage('error', error.message);
            }
        });
    }
});
