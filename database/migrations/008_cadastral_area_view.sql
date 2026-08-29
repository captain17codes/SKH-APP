-- =====================================================================
-- KOPARGAON SMART CITY — CADASTRAL PLOTS ENHANCED VIEW
-- Phase 1 Integration
-- =====================================================================

CREATE OR REPLACE VIEW v_land_plots_enhanced AS
SELECT 
    id,
    survey_number,
    plot_number,
    category,
    area_sqm AS stated_area_sqm,
    -- Cast geometry to EPSG:32643 (UTM Zone 43N) and calculate exact area in Sq Meters
    ROUND(ST_Area(ST_Transform(geometry, 32643))::NUMERIC, 2) AS calculated_area_sqm,
    ward,
    data_source,
    geometry
FROM 
    land_plots;
