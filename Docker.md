# Docker Setup for PolyCOOP MongoDB

Database name used by the app: `coop`

---

## Quick Start (Recommended)

Run this command in your terminal (Docker Desktop CLI or any terminal with Docker):

```bash
docker run -d --name polycoop-mongo -p 27017:27017 -v mongo-coop-data:/data/db mongo:6.0
```
This will:

 - Start MongoDB 6.0 in the background

 - Name the container polycoop-mongo

 - Expose MongoDB on localhost:27017


## App Configuration
The database connection URI is set to `const uri = 'mongodb://localhost:27017';` by default - if needed, modify it in `src\data\connection.js`.

Continue setting up the project as written in the README.

## Additional Commands

Stop the container:

```bash
docker stop polycoop-mongo
```

Start it again:

```bash
docker start polycoop-mongo
```

Remove the container (data stays):

```bash
docker rm polycoop-mongo
```

Remove data permanently:

```bash
docker volume rm mongo-coop-data
```