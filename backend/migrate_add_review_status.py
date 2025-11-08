#!/usr/bin/env python3
"""
Migration script to add ReviewStatus column to article table
Run this script if you get "Unknown column 'ReviewStatus'" error
"""

from db_config import get_connection

def migrate():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("SHOW COLUMNS FROM article LIKE 'ReviewStatus'")
        if cursor.fetchone() is None:
            print("Adding ReviewStatus column to article table...")
            cursor.execute("""
                ALTER TABLE article 
                ADD COLUMN ReviewStatus ENUM('Normal','Under Review') DEFAULT 'Normal'
            """)
            conn.commit()
            print("✅ ReviewStatus column added successfully!")
            
            # Update existing rows to have 'Normal' status
            cursor.execute("UPDATE article SET ReviewStatus = 'Normal' WHERE ReviewStatus IS NULL")
            conn.commit()
            print("✅ Existing articles updated with 'Normal' status")
        else:
            print("✅ ReviewStatus column already exists")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if conn:
            conn.rollback()
        raise

if __name__ == "__main__":
    migrate()

