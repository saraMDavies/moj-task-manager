

https://github.com/user-attachments/assets/64c61fe6-945c-4151-812b-ca8aacb82036





# Task Manager

Full-stack CRUD task manager using Next.js, TypeScript, MUI, Spring Boot, Java, PostgreSQL, Liquibase XML, and contract-first OpenAPI.

## Run

```bash
docker compose up --build
```

Frontend: http://localhost:3000  
API: http://localhost:8080  
Swagger UI: http://localhost:8080/swagger-ui/index.html  
PostgreSQL: localhost:5433 (mapped to 5433 so it does not clash with my local PostgreSQL on 5432)

## Local development

Backend requires Java 21 and Maven. Frontend requires Node.js 20+.

The OpenAPI contract lives in `openapi/openapi.yaml` and is the source of truth for API models.

Lint the contract with Spectral before changing it:

```bash
npx --yes @stoplight/spectral-cli lint openapi/openapi.yaml
```
