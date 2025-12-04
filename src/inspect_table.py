from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Database connection
USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

DATABASE_URL = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}?sslmode=require"
engine = create_engine(DATABASE_URL)

# Check existing table structure
with engine.connect() as connection:
    # Get table columns
    result = connection.execute(text("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'portfolio_cards'
        ORDER BY ordinal_position;
    """))
    
    print("\n[INFO] Current 'portfolio_cards' table structure:")
    print("-" * 60)
    for row in result:
        print(f"  {row[0]:<20} {row[1]:<20} NULL: {row[2]}")
    print("-" * 60)
    
    # Get all data
    result = connection.execute(text("SELECT * FROM portfolio_cards;"))
    rows = result.fetchall()
    
    print(f"\n[INFO] Total records: {len(rows)}")
    if rows:
        print("\n[INFO] Sample data:")
        for row in rows[:5]:
            print(f"  {row}")
    
    connection.commit()
