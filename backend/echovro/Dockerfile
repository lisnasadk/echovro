FROM eclipse-temurin:21-jre

WORKDIR /app
COPY . .

RUN chmod +x mvnw && ./mvnw -DskipTests package

EXPOSE 8080

CMD ["java", "-jar", "target/echovro-0.0.1-SNAPSHOT.jar"]
