import streamlit as st
import folium
from streamlit_folium import st_folium
from sqlalchemy import create_engine, text
import os
from folium.plugins import Draw
from shapely.geometry import shape
from openai import OpenAI

# Database Engine Setup
SUPABASE_URI = os.getenv("SUPABASE_URI", "postgresql://postgres.tcxbxbyexhhwbppqhtui:GodLike%402026SKH@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres")
engine = create_engine(SUPABASE_URI)

# Dummy cache function so load_spatial_data.clear() doesn't throw an error
# (In case you skipped the earlier AS-IS City Model phase of the hackathon)
@st.cache_data
def load_spatial_data():
    pass

# 1. UI SETUP
st.set_page_config(page_title="Kopargaon Digital Twin", layout="wide")
st.title("🏙️ Kopargaon Citizen Transparency Portal")
st.markdown("Click anywhere on the map to drop a pin and report an infrastructure issue.")

# Define the 3 tabs
tab1, tab2, tab3 = st.tabs(["📊 AS-IS City Model", "📍 Citizen Portal", "🛠️ WHAT-IF Simulation Engine"])

with tab1:
    st.info("AS-IS City Model data loaded. Proceed to Citizen Portal or Simulation Engine.")

with tab2:
    # 2. RENDER THE MAP
    # Centered on Kopargaon based on its geographical coordinates
    m = folium.Map(location=[19.882, 74.476], zoom_start=14)
    # Adds a visual popup when a user clicks the map
    m.add_child(folium.LatLngPopup()) 

    # st_folium renders the map and captures user interactions
    map_data = st_folium(m, height=450, width=800)

    # 3. INTERCEPT CLICK EVENT & SHOW FORM
    # The library returns a dict containing 'last_clicked' when the user clicks the map
    if map_data and map_data.get('last_clicked'):
        lat = map_data['last_clicked']['lat']
        lng = map_data['last_clicked']['lng']
        
        st.success(f"📍 Location Captured: {lat:.5f}, {lng:.5f}")
        
        # 4. DATA ENTRY FORM
        with st.form("issue_form"):
            st.subheader("Report an Issue at this Location")
            issue_type = st.selectbox("Issue Category", ["Pothole", "Broken Streetlight", "Water Leakage", "Illegal Dumping"])
            description = st.text_area("Additional Details (Optional)")
            submitted = st.form_submit_button("Submit Report")
            
            # 5. DATABASE INJECTION
            if submitted:
                # We use ST_SetSRID and ST_MakePoint to convert raw lat/lng floats into a PostGIS binary geometry
                insert_query = text("""
                    INSERT INTO citizen_feedback (issue_type, description, location)
                    VALUES (:issue_type, :description, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
                """)
                
                with engine.begin() as conn:
                    conn.execute(insert_query, {
                        "issue_type": issue_type,
                        "description": description,
                        "lng": lng, # Note: PostGIS expects Longitude first (X), then Latitude (Y)
                        "lat": lat
                    })
                
                # Hackathon flair: visual feedback
                st.balloons()
                st.toast("✅ Infrastructure issue successfully logged in the Digital Twin!")

# ==========================================
# TAB 3: THE WHAT-IF SIMULATION ENGINE (HOURS 7-10)
# ==========================================
with tab3:
    st.subheader("Draw Proposed Infrastructure & Run Impact Simulation")
    
    # 1. RENDER THE DRAWING MAP
    sim_map = folium.Map(location=[19.882, 74.476], zoom_start=15)
    
    # Add the Folium Draw plugin (This is the hackathon cheat code for spatial input)
    Draw(
        export=False,
        draw_options={"polyline": False, "circlemarker": False, "marker": False, "circle": False, "polygon": True, "rectangle": True}
    ).add_to(sim_map)
    
    # Render map and capture output
    draw_data = st_folium(sim_map, width=800, height=450, key="sim_map")
    
    # 2. INTERCEPT THE DRAWN SHAPE
    if draw_data and draw_data.get("last_active_drawing"):
        # Convert the GeoJSON drawing from the browser into a Shapely geometry, then to Well-Known Text (WKT)
        drawn_geom = shape(draw_data["last_active_drawing"]["geometry"])
        wkt_string = drawn_geom.wkt
        
        st.info("✅ Proposed infrastructure footprint captured. Running spatial analysis...")
        
        # 3. SPATIAL CONFLICT ANALYSIS (POSTGIS)
        # Check if the drawn polygon intersects with ANY existing building in Kopargaon
        conflict_query = text("""
            SELECT name, building 
            FROM kopargaon_buildings 
            WHERE ST_Intersects(geometry, ST_GeomFromText(:wkt, 4326))
        """)
        
        with engine.connect() as conn:
            conflicts = conn.execute(conflict_query, {"wkt": wkt_string}).fetchall()
        
        conflict_names = [c[0] if c[0] else "Unknown Structure" for c in conflicts]
        conflict_count = len(conflicts)
        
        if conflict_count > 0:
            st.error(f"⚠️ HIGH RISK: The proposed development intersects with {conflict_count} existing structures: {', '.join(conflict_names)}.")
        else:
            st.success("✅ LOW RISK: The proposed development does not conflict with existing buildings.")
            
        # 4. AI PLANNING ASSISTANT (HOUR 9)
        st.subheader("🤖 AI Planning Assistant Review")
        
        if st.button("Generate AI Trade-off Report"):
            with st.spinner("AI is analyzing spatial data..."):
                # Initialize OpenAI (Drop your API key in the environment or directly here for the hackathon)
                client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "YOUR_OPENAI_API_KEY")) 
                
                prompt = f"""
                You are the Chief Urban Planner for the Kopargaon Digital Twin project. 
                An engineer has proposed a new infrastructure development. 
                Spatial Analysis Engine Output: The polygon intersects with {conflict_count} existing structures. 
                Affected structures: {', '.join(conflict_names)}.
                
                Provide a highly concise, 3-bullet-point assessment of the environmental, social, and economic trade-offs of approving this project.
                """
                
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}]
                )
                
                st.write(response.choices[0].message.content)
                
        # 5. THE DECISION NODE & AS-BUILT UPDATE (HOUR 10)
        st.subheader("⚖️ Executive Decision")
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("🔴 Reject Proposal", use_container_width=True):
                st.error("Proposal Rejected. Return to planning workspace.")
                
        with col2:
            if st.button("🟢 Approve & Update AS-IS Model", use_container_width=True):
                # Push the new polygon permanently into the database
                insert_query = text("""
                    INSERT INTO kopargaon_buildings (name, building, geometry)
                    VALUES ('New Approved Facility', 'planned', ST_GeomFromText(:wkt, 4326))
                """)
                with engine.begin() as conn:
                    conn.execute(insert_query, {"wkt": wkt_string})
                
                st.balloons()
                st.success("Project Approved! The 'AS-BUILT' update has been pushed to the central PostGIS database.")
                
                # CRITICAL: Clear the cache so Tab 1 updates immediately for the live demo
                load_spatial_data.clear()
