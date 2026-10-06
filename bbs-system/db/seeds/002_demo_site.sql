-- Seed DEMO (no usar en producción): un sitio, áreas. Los usuarios se crean vía /auth/register o script.
INSERT INTO sites(code, name, country, timezone) VALUES ('PLANTA-01','Planta Demo','MX','America/Mexico_City')
ON CONFLICT (code) DO NOTHING;
INSERT INTO areas(site_id, code, name, risk_level)
SELECT s.id, a.code, a.name, a.risk::severity_level FROM sites s,
 (VALUES ('PROD','Producción','high'),('ALM','Almacén y logística','medium'),('MANT','Mantenimiento','high'),('OFI','Oficinas','low')) AS a(code,name,risk)
WHERE s.code='PLANTA-01'
ON CONFLICT (site_id, code) DO NOTHING;
