import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("user")
DB_PASSWORD = os.getenv("password")
DB_HOST = os.getenv("host")
DB_PORT = os.getenv("port")
DB_NAME = os.getenv("dbname")

def check_cards_rls():
    try:
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME
        )
        cursor = conn.cursor()

        # Check if RLS is enabled
        cursor.execute("""
            SELECT relname, relrowsecurity 
            FROM pg_class 
            WHERE relname = 'myp_cards_meg';
        """)
        result = cursor.fetchone()
        if result:
            print(f"Table: {result[0]}, RLS Enabled: {result[1]}")
        else:
            print("Table 'myp_cards_meg' not found in pg_class")
            return

        # List policies
        cursor.execute("""
            SELECT polname, polcmd, polroles, 
                   pg_get_expr(polqual, polrelid) as using_expr
            FROM pg_policy
            WHERE polrelid = 'myp_cards_meg'::regclass;
        """)
        policies = cursor.fetchall()
        
        print("\nExisting Policies:")
        if not policies:
            print("No policies found.")
        for pol in policies:
            print(f"- Name: {pol[0]}")
            print(f"  Command: {pol[1]}")
            print(f"  Roles: {pol[2]}")
            print(f"  Using: {pol[3]}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    check_cards_rls()
