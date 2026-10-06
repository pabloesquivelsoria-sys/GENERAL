-- Seed: roles, factores causales, categorías y comportamientos EHS, checklist base, reglas de escalamiento
INSERT INTO roles(code, name, description) VALUES
 ('admin','Administrador','Configuración total del sistema'),
 ('ehs_manager','Gerente EHS','Gestiona programa BBS, aprueba extensiones, recibe escalamientos'),
 ('site_manager','Gerente de sitio','Recibe escalamientos nivel 3'),
 ('supervisor','Supervisor','Revisa observaciones del área, asigna CAPA'),
 ('observer','Observador','Registra observaciones y near-miss'),
 ('capa_owner','Responsable CAPA','Ejecuta acciones asignadas'),
 ('viewer','Solo lectura','Consulta de KPIs')
ON CONFLICT (code) DO NOTHING;

INSERT INTO causal_factors(code, name, group_name) VALUES
 ('time_pressure','Presión de tiempo / producción','Organización'),
 ('lack_training','Falta de capacitación','Organización'),
 ('unclear_procedure','Procedimiento poco claro o inexistente','Organización'),
 ('supervision','Supervisión insuficiente','Organización'),
 ('peer_norm','Norma de grupo / "así se hace aquí"','Organización'),
 ('inadequate_equipment','Equipo/herramienta inadecuada o dañada','Equipo'),
 ('ppe_unavailable','EPP no disponible o incómodo','Equipo'),
 ('missing_guarding','Protecciones o barreras ausentes','Equipo'),
 ('poor_housekeeping','Orden y limpieza deficiente','Entorno'),
 ('lighting_noise_temp','Iluminación, ruido o temperatura','Entorno'),
 ('layout','Diseño del puesto / layout','Entorno'),
 ('fatigue','Fatiga','Persona'),
 ('distraction','Distracción','Persona'),
 ('complacency','Exceso de confianza / rutina','Persona'),
 ('risk_unawareness','Desconocimiento del riesgo','Persona')
ON CONFLICT (code) DO NOTHING;

INSERT INTO behavior_categories(code, name, description, sort_order) VALUES
 ('PPE','Equipo de protección personal','Uso correcto de EPP requerido por la tarea',10),
 ('BODY','Posición del cuerpo y ergonomía','Posturas, levantamiento manual, movimientos repetitivos',20),
 ('TOOLS','Herramientas y equipos','Uso adecuado, inspección y estado de herramientas',30),
 ('LOTO','Bloqueo y etiquetado (LOTO)','Control de energías peligrosas',40),
 ('HEIGHT','Trabajo en alturas','Arnés, líneas de vida, andamios y escaleras',50),
 ('HOUSE','Orden y limpieza','Áreas de paso libres, residuos, derrames',60),
 ('TRAFFIC','Tránsito y equipos móviles','Montacargas, peatones, vehículos',70),
 ('CHEM','Químicos y materiales peligrosos','Etiquetado, almacenamiento, manejo de HAZMAT',80),
 ('PROC','Cumplimiento de procedimientos','Permisos de trabajo, análisis de riesgo (JSA/ART), instrucciones de trabajo',90),
 ('CONFINED','Espacios confinados','Permiso, monitoreo atmosférico, vigía',100),
 ('HOT','Trabajos en caliente','Permiso, extintor, control de chispas',110),
 ('ERGO_OFFICE','Ergonomía de oficina','Postura, pausas activas, disposición de estación',120),
 ('COMM','Comunicación y reporte','Reporte de condiciones inseguras, charlas de seguridad',130),
 ('FATIGUE','Atención y estado del trabajador','Distracciones, uso de celular, fatiga',140)
ON CONFLICT (code) DO NOTHING;

INSERT INTO behaviors(category_id, code, name, safe_description, at_risk_description, default_severity)
SELECT c.id, v.code, v.name, v.safe, v.risk, v.sev::severity_level
FROM (VALUES
 ('PPE','PPE-01','Casco / protección de cabeza','Usa casco ajustado en zonas requeridas','Sin casco o sin barboquejo en zona obligatoria','high'),
 ('PPE','PPE-02','Protección ocular y facial','Usa gafas/careta adecuadas a la tarea','Sin protección ocular o dañada','high'),
 ('PPE','PPE-03','Protección auditiva','Usa tapones/orejeras en áreas > 85 dB','Sin protección auditiva en área ruidosa','medium'),
 ('PPE','PPE-04','Guantes adecuados','Guantes apropiados al riesgo (corte, químico, térmico)','Sin guantes o guantes inadecuados','medium'),
 ('PPE','PPE-05','Calzado de seguridad','Calzado de seguridad en buen estado','Calzado inadecuado o deteriorado','medium'),
 ('PPE','PPE-06','Protección respiratoria','Respirador correcto y con prueba de ajuste','Sin respirador o mal colocado','high'),
 ('BODY','BODY-01','Levantamiento manual','Flexiona rodillas, carga cerca del cuerpo','Levanta con espalda curvada o carga excesiva','medium'),
 ('BODY','BODY-02','Línea de fuego / puntos de atrapamiento','Mantiene manos y cuerpo fuera de puntos de pellizco','Manos en zona de atrapamiento','high'),
 ('BODY','BODY-03','Resbalones y tropiezos','Camina atento, usa pasamanos','Corre, salta o camina sin mirar','medium'),
 ('TOOLS','TOOL-01','Herramienta correcta para la tarea','Usa la herramienta diseñada para el trabajo','Improvisa herramientas','medium'),
 ('TOOLS','TOOL-02','Inspección previa','Inspecciona herramienta antes de usar','Usa herramienta dañada','medium'),
 ('TOOLS','TOOL-03','Guardas de máquina','Guardas en su lugar y funcionales','Guardas removidas o anuladas','critical'),
 ('LOTO','LOTO-01','Aplicación de bloqueo','Aplica candado y etiqueta personal; verifica energía cero','Intervine equipo sin bloqueo','critical'),
 ('LOTO','LOTO-02','Verificación de energía cero','Prueba de arranque y verificación documentada','Omite verificación','critical'),
 ('HEIGHT','HGT-01','Arnés y anclaje 100%','Anclado en todo momento sobre 1.8 m','Sin anclaje o anclaje inadecuado','critical'),
 ('HEIGHT','HGT-02','Escaleras y andamios','Tres puntos de contacto; andamio certificado','Escalera mal apoyada o andamio sin certificar','high'),
 ('HOUSE','HK-01','Pasillos y salidas despejadas','Vías de paso y salidas libres','Materiales obstruyendo vías','medium'),
 ('HOUSE','HK-02','Derrames y residuos','Limpia derrames de inmediato y segrega residuos','Deja derrames o residuos mezclados','medium'),
 ('TRAFFIC','TRF-01','Peatones y montacargas','Respeta rutas peatonales y contacto visual con operador','Cruza sin precaución zonas de tránsito','high'),
 ('TRAFFIC','TRF-02','Operación de montacargas','Velocidad adecuada, cinturón, carga baja','Excede velocidad / sin cinturón / carga elevada','high'),
 ('CHEM','CHEM-01','Etiquetado y hojas de seguridad','Envases etiquetados; conoce la SDS','Envases sin etiqueta','medium'),
 ('CHEM','CHEM-02','Almacenamiento y compatibilidad','Almacena según compatibilidad y contención','Mezcla incompatibles o sin contención','high'),
 ('PROC','PROC-01','Permiso de trabajo vigente','Permiso vigente y firmado antes de iniciar','Trabaja sin permiso o vencido','critical'),
 ('PROC','PROC-02','Análisis de riesgo de la tarea (JSA/ART)','Realiza y comprende el análisis previo','No realiza o no conoce el análisis','high'),
 ('PROC','PROC-03','Seguir el procedimiento','Sigue la instrucción de trabajo paso a paso','Se salta pasos','high'),
 ('CONFINED','CSP-01','Permiso y monitoreo de atmósfera','Monitoreo continuo y vigía presente','Ingresa sin medición o vigía','critical'),
 ('HOT','HOT-01','Control de chispas y extintor','Extintor a mano, área protegida','Corte/soldadura sin controles','critical'),
 ('ERGO_OFFICE','ERG-01','Postura en estación de trabajo','Pantalla a altura de ojos, pausas activas','Postura forzada prolongada','low'),
 ('COMM','COM-01','Reporte de condiciones inseguras','Reporta condiciones/near-miss oportunamente','Observa y no reporta','medium'),
 ('COMM','COM-02','Charla de seguridad previa','Participa en charla previa a la tarea','Omite la charla','low'),
 ('FATIGUE','ATT-01','Uso de celular / distracción','Atención completa en la tarea','Usa celular en zona operativa','medium'),
 ('FATIGUE','ATT-02','Señales de fatiga','Pausas adecuadas, aptitud para trabajar','Muestra fatiga y continúa tarea crítica','high')
) AS v(cat, code, name, safe, risk, sev)
JOIN behavior_categories c ON c.code = v.cat
ON CONFLICT (code) DO NOTHING;

-- Checklist base: todos los comportamientos activos; los de severidad crítica marcados como críticos
INSERT INTO checklists(code, name, description) VALUES
 ('GENERAL-V1','Checklist BBS general','Observación general de comportamientos, aplicable a todos los sitios')
ON CONFLICT (code) DO NOTHING;
INSERT INTO checklist_items(checklist_id, behavior_id, sort_order, is_critical)
SELECT (SELECT id FROM checklists WHERE code='GENERAL-V1'), b.id,
       row_number() OVER (ORDER BY c.sort_order, b.code), b.default_severity = 'critical'
FROM behaviors b JOIN behavior_categories c ON c.id = b.category_id
ON CONFLICT DO NOTHING;

-- Reglas globales de escalamiento por prioridad (días vencidos -> a quién)
INSERT INTO escalation_rules(site_id, priority, level, days_overdue, notify_role) VALUES
 (NULL,'critical',1,0,'owner_supervisor'),(NULL,'critical',2,2,'ehs_manager'),(NULL,'critical',3,5,'site_manager'),
 (NULL,'high',1,1,'owner_supervisor'),(NULL,'high',2,5,'ehs_manager'),(NULL,'high',3,10,'site_manager'),
 (NULL,'medium',1,3,'owner_supervisor'),(NULL,'medium',2,10,'ehs_manager'),(NULL,'medium',3,20,'site_manager'),
 (NULL,'low',1,7,'owner_supervisor'),(NULL,'low',2,21,'ehs_manager'),(NULL,'low',3,45,'site_manager')
ON CONFLICT DO NOTHING;
