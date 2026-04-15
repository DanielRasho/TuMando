CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS department (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);


CREATE TABLE IF NOT EXISTS municipality (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    department INT REFERENCES department(id)
);

CREATE TABLE IF NOT EXISTS shop (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    department INT REFERENCES department(id) NOT NULL,
    municipality INT REFERENCES municipality(id) NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS item_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS item (
    sku SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    cost FLOAT NOT NULL,
    category INT REFERENCES item_category(id) NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
    sku INT REFERENCES item(sku) NOT NULL,
    shop INT REFERENCES shop(id) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    UNIQUE (sku, shop)
);

CREATE TABLE IF NOT EXISTS inventory_action (
    id SERIAL PRIMARY KEY,
    name varchar(35)
);

CREATE TABLE  IF NOT EXISTS bill (
    id uuid PRIMARY KEY NOT NULL,
    nit VARCHAR(10) NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cost int not null,
    shop INT REFERENCES shop(id) NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_history (
    sku INT REFERENCES item(sku) NOT NULL,
    quantity INT NOT NULL,
    unitary_cost INT NOT NULL,
    action INT REFERENCES inventory_action(id),
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bill UUID REFERENCES bill(id)
);