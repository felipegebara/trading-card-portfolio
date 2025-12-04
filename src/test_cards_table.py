import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("user")
DB_PASSWORD = os.getenv("password")
DB_HOST = os.getenv("host")
DB_PORT = os.getenv("port")
DB_NAME = os.getenv("dbname")

def test_cards_table():
    try:
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME
        )
        cursor = conn.cursor()

        # Check if table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'myp_cards_meg'
            );
        """)
        exists = cursor.fetchone()[0]
        print(f"Table 'myp_cards_meg' exists: {exists}")

        if exists:
            # Count records
            cursor.execute("SELECT COUNT(*) FROM myp_cards_meg;")
            count = cursor.fetchone()[0]
            print(f"Total records: {count}")

            # Get column names
            cursor.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'myp_cards_meg'
                ORDER BY ordinal_position;
            """)
            columns = cursor.fetchall()
            print("\nColumns:")
            for col in columns:
                print(f"  - {col[0]}: {col[1]}")

            # Get sample data
            cursor.execute("SELECT * FROM myp_cards_meg LIMIT 5;")
            rows = cursor.fetchall()
            print(f"\nSample data ({len(rows)} rows):")
            for row in rows:
                print(f"  {row}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    test_cards_table()
