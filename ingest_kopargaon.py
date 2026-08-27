import osmnx as ox
import geopandas as gpd
from sqlalchemy import create_engine
import warnings
import os

# Suppress harmless warnings for clean console output during the hackathon
warnings.filterwarnings('ignore')

# 1. DEFINE KOPARGAON BOUNDING BOX
# North, South, East, West coordinates based on Kopargaon's geographical center
north, south, east, west = 19.900, 19.860, 74.495, 74.460

print("Querying Overpass API for Kopargaon road networks...")
# Pull roads (highway tag in OSM)
roads = ox.features_from_bbox(bbox=(west, south, east, north), tags={'highway': True})

print("Querying Overpass API for Kopargaon building footprints...")
# Pull buildings (building tag in OSM)
buildings = ox.features_from_bbox(bbox=(west, south, east, north), tags={'building': True})

# 2. DATA CLEANING (Hackathon Pro-Tip)
# OSM data returns dozens of columns with lists/dicts that will crash SQLAlchemy. 
# We only keep the geometry, the name, and the main classification.
print("Cleaning spatial dataframes...")

# Filter roads
roads = roads[['geometry', 'name', 'highway']].copy()
roads = roads.dropna(subset=['geometry']) # Ensure no null geometries
# Convert any polygon roads (like pedestrian squares) into lines for consistency
roads['geometry'] = roads['geometry'].map(lambda x: x.boundary if x.geom_type == 'Polygon' else x)
# Filter buildings
buildings = buildings[['geometry', 'name', 'building']].copy()
buildings = buildings.dropna(subset=['geometry'])

# 3. PUSH TO SUPABASE POSTGIS
print("Connecting to Supabase PostGIS...")

# Use environment variable for the URI, fallback to a placeholder if not set
# Ensure to replace YOUR_PASSWORD and yourprojectid with your actual Supabase credentials
SUPABASE_URI = "postgresql://postgres.tcxbxbyexhhwbppqhtui:GodLike%402026SKH@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
engine = create_engine(SUPABASE_URI)

print("Writing Roads to database...")
# to_postgis automatically creates the table and geometry columns
roads.to_postgis('kopargaon_roads', engine, if_exists='replace', index=False)

print("Writing Buildings to database...")
buildings.to_postgis('kopargaon_buildings', engine, if_exists='replace', index=False)

print("✅ Success! Kopargaon Digital Twin foundation is live in Supabase.")
