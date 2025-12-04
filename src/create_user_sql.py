import os
import uuid
import bcrypt
import psycopg2
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Database connection details
DB_USER = os.getenv("user")
DB_PASSWORD = os.getenv("password")
DB_HOST = os.getenv("host")
DB_PORT = os.getenv("port")
DB_NAME = os.getenv("dbname")

def create_user(email, password):
    try:
        # Connect to the database
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME
        )
        cursor = conn.cursor()

        # Generate User ID
        user_id = str(uuid.uuid4())
        
        # Hash the password
        # Supabase uses bcrypt
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        # Current timestamp
        now = datetime.utcnow()

        # Insert into auth.users
        # Note: instance_id is usually '00000000-0000-0000-0000-000000000000' for the default instance
        insert_query = """
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            %s,
            'authenticated',
            'authenticated',
            %s,
            %s,
            %s,
            NULL,
            NULL,
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            %s,
            %s,
            '',
            '',
            '',
            ''
        ) RETURNING id;
        """
        
        cursor.execute(insert_query, (
            user_id,
            email,
            hashed,
            now,
            now,
            now
        ))
        
        # Insert into auth.identities (Supabase usually requires this for the user to be fully recognized)
        identity_id = str(uuid.uuid4())
        insert_identity_query = """
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            %s,
            %s,
            %s,
            'email',
            %s,
            NULL,
            %s,
            %s
        );
        """
        
        identity_data = f'{{"sub": "{user_id}", "email": "{email}"}}'
        
        cursor.execute(insert_identity_query, (
            identity_id,
            user_id,
            identity_data,
            user_id, # provider_id
            now,
            now
        ))

        conn.commit()
        print(f"User created successfully!")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print(f"User ID: {user_id}")

    except Exception as e:
        print(f"Error creating user: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    create_user("usuario_teste@teste.com", "password123")
