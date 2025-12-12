import sqlite3
import os

DB_PATH = "hello.db"

def init_db():
    """Create table and insert example data if not present."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Create table if it doesn't exist
    cur.execute("""
        CREATE TABLE IF NOT EXISTS greetings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message TEXT NOT NULL
        )
    """)

    # Check if table is empty
    cur.execute("SELECT COUNT(*) FROM greetings")
    count = cur.fetchone()[0]

    # Insert sample data on first run
    if count == 0:
        cur.execute("INSERT INTO greetings (message) VALUES (?)",
                    ("Hello from SQLite!",))
        cur.execute("INSERT INTO greetings (message) VALUES (?)",
                    ("Containers are fun!",))
        conn.commit()

    conn.close()


def print_greetings():
    """Read and print data from the database."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT id, message FROM greetings")
    rows = cur.fetchall()

    print("Greetings:")
    for row in rows:
        print(f"{row[0]}: {row[1]}")

    conn.close()


if __name__ == "__main__":
    init_db()
    print_greetings()
