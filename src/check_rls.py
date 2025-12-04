import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("user")
DB_PASSWORD = os.getenv("password")
DB_HOST = os.getenv("host")
DB_PORT = os.getenv("port")
DB_NAME = os.getenv("dbname")

def check_rls_policies():
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
            WHERE relname = 'portfolio_cards';
        """)
        rls_enabled = cursor.fetchone()
        print(f"Table: {rls_enabled[0]}, RLS Enabled: {rls_enabled[1]}")

        # List policies with definitions
        cursor.execute("""
            SELECT polname, polcmd, 
                   pg_get_expr(polqual, polrelid) as using_expr,
                   pg_get_expr(polwithcheck, polrelid) as with_check_expr
            FROM pg_policy
            WHERE polrelid = 'portfolio_cards'::regclass;
        """)
        policies = cursor.fetchall()
        
        print("\nExisting Policies Details:")
        for pol in policies:
            print(f"\nName: {pol[0]}")
            print(f"Command: {pol[1]}")
            print(f"USING: {pol[2]}")
            print(f"WITH CHECK: {pol[3]}")

        # Check column types and defaults
        cursor.execute("""
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'portfolio_cards';
        """)
        columns = cursor.fetchall()
        print("\nColumns:")
        for col in columns:
            print(f"- {col[0]}: {col[1]} (Default: {col[2]})")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    check_rls_policies()
