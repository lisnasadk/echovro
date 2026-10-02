# syntax=docker/dockerfile:1

FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

COPY backend/echovro/pom.xml backend/echovro/pom.xml
COPY backend/echovro/mvnw backend/echovro/mvnw
COPY backend/echovro/.mvn backend/echovro/.mvn

RUN chmod +x backend/echovro/mvnw && cd backend/echovro && ./mvnw -q -DskipTests dependency:go-offline

COPY backend/echovro/src backend/echovro/src

RUN cd backend/echovro && ./mvnw -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /workspace/backend/echovro/target/*.jar /app/app.jar

EXPOSE 8080
ENV PORT=8080

CMD ["sh", "-c", "java -jar /app/app.jar --server.port=${PORT}"]
