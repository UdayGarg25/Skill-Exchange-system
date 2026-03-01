from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional

client: Optional[AsyncIOMotorClient] = None
db = None


async def connect_to_mongo(url: str = "mongodb://localhost:27017", db_name: str = "skill_exchange"):
    global client, db
    try:
        client = AsyncIOMotorClient(url)
        # force a connection attempt to fail fast if MongoDB is down
        await client.admin.command("ping")
        db = client[db_name]
        print(f"[DB] Connected to MongoDB at {url}, database: {db_name}")
    except Exception as e:
        print(f"[DB] FAILED to connect to MongoDB at {url}: {e}")
        raise


async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("[DB] MongoDB connection closed")
