DROP TABLE IF EXISTS friends;
CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        url VARCHAR(255) NOT NULL,
        avatar VARCHAR(255),
        description TEXT
);