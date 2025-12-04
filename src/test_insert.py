import os
import psycopg2
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

DB_USER = os.getenv("user")
DB_PASSWORD = os.getenv("password")
DB_HOST = os.getenv("host")
DB_PORT = os.getenv("port")
DB_NAME = os.getenv("dbname")

# The ID of the user we created: 18d11a9c-90cb-46d8-af9e-7c2ee0899c02
USER_ID = "18d11a9c-90cb-46d8-af9e-7c2ee0899c02"

def test_insert():
    try:
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME
        )
        cursor = conn.cursor()

        print(f"Attempting to insert card for user {USER_ID}...")

        insert_query = """
        INSERT INTO portfolio_cards (
            carta,
            data_compra,
            preco_compra,
            idioma,
            qtd,
            estado,
            user_id
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s
        ) RETURNING id;
        """
        
        cursor.execute(insert_query, (
            "Test Card Python",
            datetime.now().date(),
            100.00,
            "PT-BR",
            1,
            "NM",
            USER_ID
        ))
        
        new_id = cursor.fetchone()[0]
        conn.commit()
        print(f"Successfully inserted card with ID: {new_id}")

    except Exception as e:
        print(f"Error inserting card: {e}")
        if conn: conn.rollback()
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    test_insert()
