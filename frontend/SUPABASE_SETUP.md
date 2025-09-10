# Supabase Integration Setup

This project now includes Supabase database integration to fetch real-time data from your cement plant database.

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the frontend directory with your Supabase credentials:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Then edit `.env.local` with your actual Supabase project details:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Supabase Project Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. In your Supabase project dashboard:
   - Go to Settings → API
   - Copy the Project URL and Anon Key
   - Paste them into your `.env.local` file

### 3. Database Schema

The database schema includes the following tables:

- **ai_recommendations** - AI-generated optimization recommendations
- **alternative_fuels** - Alternative fuel data and properties
- **grinding_operations** - Mill operation data and performance metrics
- **kiln_operations** - Kiln process data and thermal measurements
- **optimization_results** - Results from AI optimization algorithms
- **quality_control** - Cement quality test results and measurements
- **raw_material_feed** - Raw material feed rates and composition
- **utilities_monitoring** - Equipment monitoring and maintenance data

### 4. Data Integration

The following modules now fetch data from Supabase:

#### Fuel Optimization Module
- Connects to `alternative_fuels`, `kiln_operations`, and `optimization_results` tables
- Calculates real-time KPIs from actual data
- Falls back to static data if database is empty or unreachable

#### Available Hooks

- `useKilnOperations()` - Fetches kiln operation data
- `useAlternativeFuels()` - Fetches alternative fuel data  
- `useOptimizationResults(type?)` - Fetches optimization results
- `useUtilitiesMonitoring()` - Fetches utilities monitoring data
- `useRawMaterialFeed()` - Fetches raw material data
- `useGrindingOperations()` - Fetches grinding operation data
- `useQualityControl()` - Fetches quality control data
- `useAIRecommendations()` - Fetches AI recommendations

### 5. Adding Sample Data

To test the integration, you can add sample data to your Supabase tables:

```sql
-- Example: Insert sample kiln operation data
INSERT INTO kiln_operations (
  created_at, kiln_id, burning_zone_temp_c, fuel_rate_tph, 
  coal_rate_tph, alt_fuel_rate_tph, thermal_substitution_pct,
  co2_emissions_tph, specific_heat_consumption_mjkg
) VALUES (
  NOW(), 1, 1450, 12.5, 10.2, 2.3, 18.4, 850, 3.85
);

-- Example: Insert sample alternative fuel data
INSERT INTO alternative_fuels (
  created_at, fuel_type, calorific_value_mj_kg, 
  thermal_substitution_pct, co2_reduction_tph
) VALUES 
  (NOW(), 'Coal', 25.5, 75, 2.3),
  (NOW(), 'Biomass', 18.2, 10, 0.1),
  (NOW(), 'Pet Coke', 32.1, 8, 3.1),
  (NOW(), 'RDF', 15.8, 7, 0.8);
```

### 6. Error Handling

The components include comprehensive error handling:

- **Loading states** - Shows skeleton loaders while fetching data
- **Error states** - Displays error messages if database connection fails
- **Fallback data** - Uses static data when database is empty or unreachable

### 7. Real-time Updates

To enable real-time updates, you can set up Supabase subscriptions:

```typescript
// Example: Real-time kiln operations updates
const subscription = supabase
  .channel('kiln_operations')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'kiln_operations' },
    (payload) => {
      // Handle real-time updates
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

### 8. Security

The current setup uses the anon key which provides read-only access. For production:

1. Set up Row Level Security (RLS) policies
2. Create service accounts with appropriate permissions
3. Use server-side API routes for sensitive operations

## Next Steps

1. Set up your Supabase project and database
2. Add your environment variables
3. Populate tables with sample or real data
4. Test the fuel optimization module to see real data integration
5. Extend other modules to use database integration

The system will automatically switch between real database data and fallback static data based on availability.
