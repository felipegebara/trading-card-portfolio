import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("user")
DB_PASSWORD = os.getenv("password")
DB_HOST = os.getenv("host")
DB_PORT = os.getenv("port")
DB_NAME = os.getenv("dbname")

def check_portfolio_schema():
    try:
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME
        )
        cursor = conn.cursor()

        # Get column names for portfolio_cards
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'portfolio_cards'
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        
        print("Columns in 'portfolio_cards':")
        if not columns:
            print("Table not found or empty columns.")
        for col in columns:
            print(f"  - {col[0]}: {col[1]}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    check_portfolio_schema()
