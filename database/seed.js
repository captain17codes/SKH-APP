import fs from 'fs';
import path from 'path';
import pkg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../server/.env') });

const { Pool } = pkg;

const poolConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

const pool = new Pool(poolConfig);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const result = {};
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      result[key] = value;
    }
  });
  return result;
};

const validateArgs = (args) => {
  if (!args.source || !['demo', 'official', 'team_collected'].includes(args.source)) {
    console.error('❌ Missing or invalid --source. Must be demo, official, or team_collected');
    process.exit(1);
  }
  if (!args.dataset) {
    console.error('❌ Missing --dataset.');
    process.exit(1);
  }
  if (!args.file && !args.dir) {
    console.error('❌ Must provide either --file or --dir.');
    process.exit(1);
  }
};

const getInsertQuery = (dataset) => {
  switch (dataset) {
    case 'wards':
      return {
        text: `
          INSERT INTO wards (id, ward_number, name, population, area_km2, type, color, data_source, geometry)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ST_GeomFromGeoJSON($9))
          ON CONFLICT (ward_number) DO UPDATE SET
            name = EXCLUDED.name,
            population = EXCLUDED.population,
            area_km2 = EXCLUDED.area_km2,
            type = EXCLUDED.type,
            color = EXCLUDED.color,
            data_source = EXCLUDED.data_source,
            geometry = EXCLUDED.geometry,
            updated_at = now()
          WHERE wards.data_source != 'official' OR EXCLUDED.data_source = 'official'
        `,
        extract: (f, source) => {
          const id = f.properties.id || `W${Math.floor(Math.random()*1000)}`;
          // Extract number from id (e.g. 'W1' -> 1)
          const ward_number = f.properties.ward_number || parseInt(id.replace(/[^0-9]/g, '')) || 1;
          
          return [
            id,
            ward_number,
            f.properties.name,
            f.properties.population || 0,
            f.properties.areaKm2 || 0,
            f.properties.type || 'Residential',
            f.properties.color || '#3b82f6',
            source,
            JSON.stringify(f.geometry)
          ];
        }
      };
    case 'projects':
      return {
        text: `
          INSERT INTO projects (id, project_code, name, category, description, status, progress, budget, spent, department, ward_id, data_source, geometry)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, ST_GeomFromGeoJSON($13))
          ON CONFLICT (project_code) DO UPDATE SET
            name = EXCLUDED.name,
            category = EXCLUDED.category,
            description = EXCLUDED.description,
            status = EXCLUDED.status,
            progress = EXCLUDED.progress,
            budget = EXCLUDED.budget,
            spent = EXCLUDED.spent,
            department = EXCLUDED.department,
            ward_id = EXCLUDED.ward_id,
            data_source = EXCLUDED.data_source,
            geometry = EXCLUDED.geometry,
            updated_at = now()
          WHERE projects.data_source != 'official' OR EXCLUDED.data_source = 'official'
        `,
        extract: (f, source) => {
          const id = f.properties.id || `PRJ-${Date.now()}-${Math.floor(Math.random()*1000)}`;
          return [
            id,
            f.properties.project_code || id,
            f.properties.name || 'Unknown Project',
            f.properties.category || 'Other',
            f.properties.description || '',
            f.properties.status || 'Planning',
            f.properties.progress || 0,
            f.properties.budget || 0,
            f.properties.spent || 0,
            f.properties.department || '',
            f.properties.ward_id || null,
            source,
            JSON.stringify(f.geometry)
          ];
        }
      };
    case 'land_use':
      return {
        text: `
          INSERT INTO land_use (id, parcel_id, land_use_type, area_sqm, ward_id, data_source, geometry)
          VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromGeoJSON($7))
          ON CONFLICT (parcel_id) DO UPDATE SET
            land_use_type = EXCLUDED.land_use_type,
            area_sqm = EXCLUDED.area_sqm,
            ward_id = EXCLUDED.ward_id,
            data_source = EXCLUDED.data_source,
            geometry = EXCLUDED.geometry,
            updated_at = now()
          WHERE land_use.data_source != 'official' OR EXCLUDED.data_source = 'official'
        `,
        extract: (f, source) => {
          const id = f.properties.id || `LU-${Date.now()}-${Math.floor(Math.random()*1000)}`;
          return [
            id,
            f.properties.parcel_id || id,
            f.properties.type || 'Mixed Use',
            f.properties.area_sqm || 0,
            f.properties.ward_id || null,
            source,
            JSON.stringify(f.geometry)
          ];
        }
      };
    case 'roads':
      return {
        text: `
          INSERT INTO roads (id, road_id, name, road_type, data_source, geometry)
          VALUES ($1, $2, $3, $4, $5, ST_GeomFromGeoJSON($6))
          ON CONFLICT (road_id) DO UPDATE SET
            name = EXCLUDED.name,
            road_type = EXCLUDED.road_type,
            data_source = EXCLUDED.data_source,
            geometry = EXCLUDED.geometry,
            updated_at = now()
          WHERE roads.data_source != 'official' OR EXCLUDED.data_source = 'official'
        `,
        extract: (f, source) => {
          const id = f.properties.id || `RD-${Date.now()}-${Math.floor(Math.random()*1000)}`;
          return [
            id,
            f.properties.road_id || id,
            f.properties.name || 'Unknown Road',
            f.properties.type || f.properties.road_type || 'residential',
            source,
            JSON.stringify(f.geometry)
          ];
        }
      };
    case 'infrastructure':
      return {
        text: `
          INSERT INTO infrastructure (id, asset_id, name, type, ward_id, data_source, geometry)
          VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromGeoJSON($7))
          ON CONFLICT (asset_id) DO UPDATE SET
            name = EXCLUDED.name,
            type = EXCLUDED.type,
            ward_id = EXCLUDED.ward_id,
            data_source = EXCLUDED.data_source,
            geometry = EXCLUDED.geometry,
            updated_at = now()
          WHERE infrastructure.data_source != 'official' OR EXCLUDED.data_source = 'official'
        `,
        extract: (f, source) => {
          const id = f.properties.id || `INF-${Date.now()}-${Math.floor(Math.random()*1000)}`;
          return [
            id,
            f.properties.asset_id || id,
            f.properties.name || 'Unknown Facility',
            f.properties.type || 'Public',
            f.properties.ward_id || null,
            source,
            JSON.stringify(f.geometry)
          ];
        }
      };
    // Implement water_network, drainage_network similarly if needed.
    default:
      return null;
  }
};

const seedFile = async (filePath, dataset, source) => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File not found: ${filePath}`);
    return;
  }
  
  const queryData = getInsertQuery(dataset);
  if (!queryData) {
    console.log(`⚠️ No import logic defined for dataset: ${dataset}`);
    return;
  }

  console.log(`⏳ Seeding ${dataset} from ${filePath} [source: ${source}]`);
  
  let data;
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(fileContent);
  } catch (err) {
    console.error(`❌ Error parsing ${filePath}:`, err.message);
    return;
  }

  const features = data.features || (Array.isArray(data) ? data : []);
  let successfulRows = 0;

  for (const feature of features) {
    try {
      const values = queryData.extract(feature, source);
      await pool.query(queryData.text, values);
      successfulRows++;
    } catch (err) {
      console.error(`❌ Error inserting row in ${dataset}:`, err.message);
    }
  }

  console.log(`✅ Successfully seeded ${successfulRows} rows for ${dataset}.`);

  // Log to seed_log
  try {
    await pool.query(
      `INSERT INTO seed_log (dataset, source, file, rows_affected) VALUES ($1, $2, $3, $4)`,
      [dataset, source, filePath, successfulRows]
    );
  } catch (err) {
    console.error(`❌ Error logging to seed_log:`, err.message);
  }
};

const run = async () => {
  const args = parseArgs();
  validateArgs(args);

  try {
    const client = await pool.connect();
    client.release();
  } catch (e) {
    console.error('❌ Could not connect to database. Ensure DATABASE_URL is set correctly in server/.env', e.message);
    process.exit(1);
  }

  if (args.dataset === 'all' && args.dir) {
    const datasets = ['wards', 'projects', 'land_use', 'roads', 'infrastructure'];
    for (const ds of datasets) {
      const filePath = path.join(args.dir, `${ds}.geojson`);
      if (fs.existsSync(filePath)) {
        await seedFile(filePath, ds, args.source);
      }
    }
  } else if (args.file) {
    await seedFile(args.file, args.dataset, args.source);
  }

  pool.end();
  console.log('🎉 Seeding complete.');
};

run();
