import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("user")
DB_PASSWORD = os.getenv("password")
DB_HOST = os.getenv("host")
DB_PORT = os.getenv("port")
DB_NAME = os.getenv("dbname")

def verify_carta_column():
    try:
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME
        )
        cursor = conn.cursor()

        print("Querying 'carta' column from 'myp_cards_meg'...")
        cursor.execute("SELECT carta FROM myp_cards_meg LIMIT 10;")
        rows = cursor.fetchall()
        
        print(f"Found {len(rows)} rows.")
        for row in rows:
            print(f"Card: {row[0]}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    verify_carta_column()
