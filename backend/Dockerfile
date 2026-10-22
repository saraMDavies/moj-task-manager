FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /workspace

COPY backend/pom.xml ./backend/pom.xml
COPY backend/src ./backend/src
COPY openapi ./openapi

WORKDIR /workspace/backend

RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /workspace/backend/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]