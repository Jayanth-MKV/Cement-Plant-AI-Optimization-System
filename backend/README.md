# Cement Plant AI Optimization System

Modern FastAPI application with Supabase integration, background scheduling, and WebSocket real-time updates.

🔄 Data Flow & Trigger Strategy

Real-time Data Tables (Every 30-60 seconds)
raw_material_feed - Limestone, clay, iron ore sensor data
grinding_operations - Mill power, differential pressure, fineness
kiln_operations - Temperature, fuel rates, emissions
utilities_monitoring - Equipment power, efficiency, maintenance status

Periodic Data Tables (Every 2-6 hours)
quality_control - Lab test results, strength measurements
alternative_fuels - Fuel properties, consumption rates

AI-Generated Tables (Triggered by events)
ai_recommendations - Generated when thresholds exceeded
optimization_results - Created after optimization runs
