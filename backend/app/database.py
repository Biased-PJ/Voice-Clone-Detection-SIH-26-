import os

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "my_database")

client = AsyncIOMotorClient(MONGO_URI)

db = client[DB_NAME]

async def ping_db():
    await client.admin.command("ping")