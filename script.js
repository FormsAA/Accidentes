// Espera a que todo el contenido de la página se cargue antes de ejecutar el script
document.addEventListener('DOMContentLoaded', () => {

    // --- Selectores de Elementos Comunes ---
    const loader = document.getElementById('loader');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    const formContainer = document.getElementById('form-container');

    // --- Leer Parámetros de la URL para saber en qué página estamos ---
    const urlParams = new URLSearchParams(window.location.search);
    const reporteId = urlParams.get('reporte');

    // --- Lógica de Inicialización ---
    // Determina qué formulario cargar según el elemento que encuentre en la página.
    if (document.getElementById('form-part1')) {
        initializePart1();
    } else if (document.getElementById('form-part2')) {
        loadPart2Data(reporteId);
    } else if (document.getElementById('form-part3')) {
        loadPart3Data(reporteId);
    }

    // --- Funciones de Ayuda ---
    function showLoader() {
        if(loader) loader.style.display = 'block';
        if(formContainer) formContainer.style.display = 'none';
        if(successMessage) successMessage.style.display = 'none';
        if(errorMessage) errorMessage.style.display = 'none';
    }

    function showMessage(type, text) {
        if (type === 'success') {
            if(successMessage) {
                successMessage.innerHTML = text;
                successMessage.style.display = 'block';
            }
        } else {
            if(errorMessage) {
                errorMessage.innerHTML = '<strong>Error:</strong> ' + text;
                errorMessage.style.display = 'block';
            }
            if(formContainer) formContainer.style.display = 'block'; // Mostrar el formulario de nuevo si hay error
        }
        if(loader) loader.style.display = 'none';
    }

    // Ya no se necesita la lógica para los selects de ubicación.

    // =================== PARTE 1: INICIALIZACIÓN Y ENVÍO ===================
    function initializePart1() {
        const canvas = document.getElementById('signature-pad');
        const signaturePad = new SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)' });

        document.getElementById('clear-signature').addEventListener('click', () => signaturePad.clear());

        // Las siguientes líneas se eliminaron ya que no se usan los selects
        // populateProvincias('provinciaHabitacion', 'cantonHabitacion', 'distritoHabitacion');
        // populateProvincias('provinciaAccidente', 'cantonAccidente', 'distritoAccidente');

        document.getElementById('form-part1').addEventListener('submit', event => {
            event.preventDefault();
            if (signaturePad.isEmpty()) {
                alert("La firma del trabajador es obligatoria.");
                return;
            }
            showLoader();
            const formData = Object.fromEntries(new FormData(event.target).entries());
            formData.firma = signaturePad.toDataURL('image/png');

            google.script.run
                .withSuccessHandler(response => {
                    if (response.success) {
                        showMessage('success', `¡Reporte enviado con éxito! Su número de reporte es: <strong>${response.reportId}</strong>. Por favor, guárdelo para futuras referencias.`);
                    } else {
                        showMessage('error', response.error);
                    }
                })
                .withFailureHandler(error => showMessage('error', error.message))
                .processPart1(formData);
        });
    }

    // =================== PARTE 2: CARGA DE DATOS Y ENVÍO ===================
    function loadPart2Data(id) {
        if (!id) {
            showMessage('error', 'No se ha especificado un número de reporte. Por favor, acceda desde el enlace enviado a su correo.');
            return;
        }
        document.getElementById('reporteId-part2').value = id;
        google.script.run
            .withSuccessHandler(response => {
                if (response.success) {
                    const data = response.data;
                    document.getElementById('info-part2').innerHTML = `
                        <strong>Reporte #:</strong> ${data.ReporteID}<br>
                        <strong>Colaborador:</strong> ${data.NombreCompleto || 'N/A'}<br>
                        <strong>Fecha del Accidente:</strong> ${new Date(data.Timestamp).toLocaleString('es-CR')}
                    `;
                } else {
                    showMessage('error', response.error);
                }
            })
            .getReportData(id);

        document.getElementById('form-part2').addEventListener('submit', event => {
            event.preventDefault();
            showLoader();
            const formData = Object.fromEntries(new FormData(event.target).entries());
            google.script.run
                .withSuccessHandler(response => {
                    if(response.success){
                        showMessage('success', 'Investigación enviada con éxito. Su aporte ha sido registrado. Ya puede cerrar esta ventana.');
                    } else {
                        showMessage('error', response.error);
                    }
                })
                .withFailureHandler(error => showMessage('error', error.message))
                .processPart2(formData);
        });
    }

    // =================== PARTE 3: CARGA DE DATOS Y FINALIZACIÓN ===================
    function loadPart3Data(id) {
        if (!id) {
            showMessage('error', 'No se ha especificado un número de reporte. Por favor, acceda desde el enlace enviado a su correo.');
            return;
        }
        document.getElementById('reporteId-part3').value = id;
        google.script.run
            .withSuccessHandler(response => {
                if (response.success) {
                    const data = response.data;
                    document.getElementById('info-part3').innerHTML = `
                        <h4>Resumen del Reporte #${data.ReporteID}</h4>
                        <p><strong>Colaborador:</strong> ${data.NombreCompleto || 'N/A'} (${data.Cedula || 'N/A'})</p>
                        <p><strong>Investigación del Jefe:</strong> ${data.InvestigacionJefe || 'Pendiente'}</p>
                        <p><strong>Plan de Acción:</strong> ${data.PlanAccionJefe || 'Pendiente'}</p>
                    `;
                } else {
                    showMessage('error', response.error);
                }
            })
            .getReportData(id);

        document.getElementById('form-part3').addEventListener('submit', event => {
            event.preventDefault();
            showLoader();
            const formData = Object.fromEntries(new FormData(event.target).entries());
            google.script.run
                .withSuccessHandler(response => {
                    if(response.success){
                        showMessage('success', `Proceso finalizado. El PDF ha sido generado y enviado por correo. <br><a href="${response.pdfUrl}" target="_blank" rel="noopener noreferrer">Ver PDF generado</a>`);
                    } else {
                        showMessage('error', response.error);
                    }
                })
                .withFailureHandler(error => showMessage('error', error.message))
                .processPart3AndGeneratePDF(formData);
        });
    }

});