CREATE USER testdb WITH PASSWORD 'testdb';
CREATE DATABASE shopping_list_test OWNER testdb;
GRANT ALL PRIVILEGES ON DATABASE shopping_list_test TO testdb;
