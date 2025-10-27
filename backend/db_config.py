import mysql.connector

# Database connection configuration
def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="xyzabcK1@",  # change this
        database="FakeNewsDB"
    )
