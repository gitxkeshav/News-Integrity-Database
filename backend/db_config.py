import mysql.connector

# Database connection configuration
def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="mysql1729",  # change this
        database="fakenewsdb"
    )
