import json
from datetime import datetime
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from .optimization_tools import CementChemistryCalculator, EnergyEfficiencyCalculator, PlantKPIDashboard, MaintenanceCalculator
from app.core.tables import RAW_MATERIAL_FEED, GRINDING_OPERATIONS, KILN_OPERATIONS, UTILITIES_MONITORING, QUALITY_CONTROL, AI_RECOMMENDATIONS, OPTIMIZATION_RESULTS

logger = logging.getLogger()


class CementPlantScheduler:
    def __init__(self, supabase_manager, websocket_manager):
        self.db = supabase_manager
        self.websocket_manager = websocket_manager
        self.chemistry_calc = CementChemistryCalculator()
        self.energy_calc = EnergyEfficiencyCalculator()
        self.kpi_dashboard = PlantKPIDashboard()
        self.maintenance_calc = MaintenanceCalculator()

    async def process_realtime_data(self):
        """Collect latest data points, run quick analyses, persist any realtime alerts and broadcast plant snapshot."""
        start_ts = datetime.now()
        try:
            logger.info(f"[realtime] Run started at {start_ts.isoformat()}")
            latest_raw_material = await self.db.get_latest(RAW_MATERIAL_FEED)
            latest_grinding = await self.db.get_latest(GRINDING_OPERATIONS)
            latest_kiln = await self.db.get_latest(KILN_OPERATIONS)

            logger.debug(f"[realtime] raw_material: {bool(latest_raw_material)} grinding: {bool(latest_grinding)} kiln: {bool(latest_kiln)}")

            alerts = []
            if latest_grinding:
                grinding_result = self.energy_calc.analyze_grinding_efficiency(latest_grinding)
                logger.info(
                    "[realtime] Grinding SEC=%.2f status=%s potential_savings_kwh=%.2f",
                    grinding_result["specific_energy_consumption"]["value"],
                    grinding_result["specific_energy_consumption"]["status"],
                    grinding_result["specific_energy_consumption"]["potential_savings_kwh"],
                )
                # Explain why an alert may or may not be generated
                if grinding_result["specific_energy_consumption"]["status"] == "critical":
                    alerts.append(
                        {
                            "created_at": datetime.now().isoformat(),
                            "process_area": "grinding",
                            "recommendation_type": "energy_optimization",
                            "priority_level": 1,
                            "description": "Critical grinding energy consumption detected.",
                            "estimated_savings_kwh": grinding_result["specific_energy_consumption"]["potential_savings_kwh"],
                            "estimated_savings_cost": grinding_result["specific_energy_consumption"]["potential_savings_kwh"] * 0.15,
                            "action_taken": False,
                        }
                    )
                else:
                    logger.debug("[realtime] No alert generated because status != critical")

            if alerts:
                logger.info(f"[realtime] Inserting {len(alerts)} alert(s)")
            for alert in alerts:
                inserted = await self.db.insert(AI_RECOMMENDATIONS, alert)
                logger.debug(f"[realtime] Inserted alert id={inserted.get('id') if inserted else None}")

            await self._broadcast_plant_update()
            logger.info(f"[realtime] Run completed in {(datetime.now() - start_ts).total_seconds():.2f}s")
        except Exception:
            logger.exception("[realtime] Error in realtime processing")

    async def run_optimization_analysis(self):
        try:
            logger.info(f"Optimization analysis at {datetime.now()}")
            plant_data = await self._get_plant_data_summary()
            kpi_result = self.kpi_dashboard.generate_comprehensive_report(plant_data)

            for rec in kpi_result.get("recommendations", []):
                recommendation = {
                    **rec,
                    "created_at": datetime.now().isoformat(),
                    "action_taken": False,
                }
                await self.db.insert(AI_RECOMMENDATIONS, recommendation)

            optimization_record = {
                "created_at": datetime.now().isoformat(),
                "energy_saved_kwh": kpi_result["energy_savings"].get("energy_saved_kwh", 0),
                "cost_saved_usd": kpi_result["energy_savings"].get("cost_saved_usd", 0),
                "co2_reduced_kg": kpi_result["energy_savings"].get("co2_reduced_kg", 0),
                "model_confidence": 0.92,
            }
            await self.db.insert(OPTIMIZATION_RESULTS, optimization_record)

            await self.websocket_manager.broadcast(json.dumps({"type": "optimization", "data": kpi_result}))
        except Exception:
            logger.exception("Error in optimization analysis")

    async def check_equipment_health(self):
        try:
            logger.info(f"Equipment health check at {datetime.now()}")
            equipment_data = await self.db.get_recent(UTILITIES_MONITORING, where={}, limit=20)
            for equipment in equipment_data:
                pass  # Extend with health logic
        except Exception:
            logger.exception("Error in equipment health check")

    async def populate_sample_data(self):
        try:
            logger.info("Populating sample data (placeholder)")
        except Exception:
            logger.exception("Error populating sample data")

    async def _get_plant_data_summary(self):
        try:
            raw_material = await self.db.get_latest(RAW_MATERIAL_FEED)
            grinding = await self.db.get_latest(GRINDING_OPERATIONS)
            kiln = await self.db.get_latest(KILN_OPERATIONS)
            quality = await self.db.get_latest(QUALITY_CONTROL)
            overview = {}
            if grinding:
                power = grinding.get("power_consumption_kw", 2000)
                feed_rate = grinding.get("total_feed_rate_tph", 80)
                overview["specific_energy_consumption"] = power / feed_rate if feed_rate else 25
            if quality:
                overview["ai_quality_score"] = quality.get("ai_quality_score", 90)
            overview["plant_availability_pct"] = 87
            return {
                "raw_material": raw_material or {},
                "grinding": grinding or {},
                "kiln": kiln or {},
                "overview": overview,
            }
        except Exception:
            logger.exception("Error getting plant data summary")
            return {"raw_material": {}, "grinding": {}, "kiln": {}, "overview": {}}

    async def _broadcast_plant_update(self):
        try:
            plant_data = await self._get_plant_data_summary()
            logger.info(f"Broadcasting plant update: {plant_data}")
            await self.websocket_manager.broadcast(json.dumps({"type": "plant_update", "created_at": datetime.now().isoformat(), "data": plant_data}))
        except Exception:
            logger.exception("Error broadcasting plant update")


def setup_scheduler(scheduler: AsyncIOScheduler, supabase_manager, websocket_manager):
    """Register periodic jobs and return the bound scheduler helper instance."""
    plant_scheduler = CementPlantScheduler(supabase_manager, websocket_manager)
    scheduler.add_job(plant_scheduler.process_realtime_data, IntervalTrigger(seconds=15), id="realtime_processing", replace_existing=True, max_instances=1, coalesce=True)
    scheduler.add_job(plant_scheduler.run_optimization_analysis, IntervalTrigger(minutes=15), id="optimization_analysis", replace_existing=True, max_instances=1, coalesce=True)
    scheduler.add_job(plant_scheduler.check_equipment_health, IntervalTrigger(hours=4), id="equipment_health", replace_existing=True, max_instances=1, coalesce=True)
    scheduler.add_job(plant_scheduler.populate_sample_data, IntervalTrigger(seconds=30), id="sample_data", replace_existing=True, max_instances=1, coalesce=True)
    jobs = scheduler.get_jobs()

    logger.info("Scheduled tasks configured (%d jobs)", len(jobs))
    return plant_scheduler
