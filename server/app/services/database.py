import logging
from typing import Dict, List, Optional, Any
from supabase import AsyncClient, acreate_client
from app.core.config import settings

logger = logging.getLogger(__name__)


class SupabaseManager:
    def __init__(self):
        self.client: Optional[AsyncClient] = None
        self.admin_client: Optional[AsyncClient] = None

    async def initialize(self):
        try:
            self.client = await acreate_client(settings.supabase_url, settings.supabase_key)
            self.admin_client = await acreate_client(settings.supabase_url, settings.supabase_service_role_key)
            logger.info("Supabase clients initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase clients: {e}")
            raise

    async def close(self):
        try:
            if self.client:
                await self.client.auth.sign_out()
            if self.admin_client:
                await self.admin_client.auth.sign_out()
            logger.info("Supabase clients closed successfully")
        except Exception as e:
            logger.error(f"Error closing Supabase clients: {e}")

    async def get_latest(self, table_name: str, client_type: str = "admin") -> Optional[Dict]:
        try:
            client = self.admin_client if client_type == "admin" else self.client
            response = await client.table(table_name).select("*").order("id", desc=True).limit(1).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error getting latest from {table_name}: {e}")
            return None

    async def get_recent(self, table_name: str, limit: int = 10, where: Optional[Dict] = None, order_by: str = "created_at", client_type: str = "admin") -> List[Dict]:
        try:
            client = self.admin_client if client_type == "admin" else self.client
            query = client.table(table_name).select("*")
            if where:
                for key, value in where.items():
                    query = query.eq(key, value)
            response = await query.order(order_by, desc=True).limit(limit).execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error getting recent from {table_name}: {e}")
            return []

    async def insert(self, table_name: str, data: Dict, client_type: str = "admin") -> Optional[Dict]:
        try:
            client = self.admin_client if client_type == "admin" else self.client
            response = await client.table(table_name).insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error inserting into {table_name}: {e}")
            return None

    async def update(self, table_name: str, match: Dict, data: Dict, client_type: str = "admin") -> Optional[List[Dict]]:
        try:
            client = self.admin_client if client_type == "admin" else self.client
            query = client.table(table_name).update(data)
            for key, value in match.items():
                query = query.eq(key, value)
            response = await query.execute()
            return response.data
        except Exception as e:
            logger.error(f"Error updating {table_name}: {e}")
            return None

    async def delete(self, table_name: str, match: Dict, client_type: str = "admin") -> bool:
        try:
            client = self.admin_client if client_type == "admin" else self.client
            query = client.table(table_name).delete()
            for key, value in match.items():
                query = query.eq(key, value)
            await query.execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting from {table_name}: {e}")
            return False

    async def execute_rpc(self, function_name: str, params: Optional[Dict] = None, client_type: str = "admin") -> Optional[Any]:
        try:
            client = self.admin_client if client_type == "admin" else self.client
            response = await client.rpc(function_name, params or {}).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error executing RPC {function_name}: {e}")
            return None
