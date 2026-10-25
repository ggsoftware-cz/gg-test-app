Run postgress container (no volume):
docker run --name pgsql -p 5432:5432 -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=db -d postgres

Run postgress container (with volume):
docker run --name pgsql -p 5432:5432 -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=db -v pgdata:/var/lib/postgresql/data -d postgres

Create docker volume for postgres:
docker volume create pgdata
