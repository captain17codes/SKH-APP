# Kopargaon Smart City Portal - Implementation Plan

## Project Overview
Building the full **Kopargaon Smart City Design System** website from the Stitch project (ID: 16903160227893335471). This is a multi-page civic portal with admin dashboard, citizen services, GIS maps, and analytics.

## Screens Identified from Stitch Project

| Screen | Title | Priority |
|--------|-------|----------|
| Sign In Portal | Login page with role switcher | ✅ High |
| Admin Dashboard | Main admin overview with stats | ✅ High |
| Citizen Dashboard | Citizen-facing dashboard | ✅ High |
| Admin Projects List | Project management table | ✅ High |
| Admin Project Details | Individual project view | ✅ High |
| Admin Complaints | Complaints management | ✅ High |
| Admin Analytics | Analytics dashboard with charts | ✅ High |
| Admin AI Urban Planner | AI planning interface | ✅ High |
| Resident Registration | Registration form | ✅ High |
| Location Picker Modal | Map-based location selection | Medium |
| Property Marketplace | Property listings | Medium |
| Citizen GIS Map View | GIS map for citizens | Medium |

## File Structure
```
uiuxskh/
├── index.html              (Sign In Portal - Entry Point)
├── dashboard.html          (Admin Dashboard Overview)
├── citizen-dashboard.html  (Citizen Dashboard)
├── projects.html           (Admin Projects List)
├── project-details.html    (Project Details View)
├── complaints.html         (Complaints Management)
├── analytics.html          (Analytics Dashboard)
├── ai-planner.html         (AI Urban Planner)
├── gis-map.html            (GIS Map View)
├── registration.html       (Resident Registration)
├── css/
│   └── styles.css          (Shared custom styles)
└── js/
    └── app.js              (Shared navigation & interactions)
```

## Design System
- **Font**: Public Sans (Google Fonts)
- **Icons**: Material Symbols Outlined
- **Primary Color**: #1E3A8A (Deep Blue)
- **Secondary Color**: #00687A (Cyan)  
- **Tertiary Color**: #00311F (Green)
- **CSS Framework**: Tailwind CSS (CDN)
- **Layout**: 260px fixed sidebar + fluid main content

## Approach
Each page will be a self-contained HTML file with:
1. Shared Tailwind config (design tokens from Stitch)
2. Shared sidebar navigation component
3. Shared top navbar component
4. Page-specific content from Stitch screens
5. Working navigation links between all pages
