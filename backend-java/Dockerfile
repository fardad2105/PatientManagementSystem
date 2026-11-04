FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
RUN useradd --system --uid 1001 thyrocare
COPY --from=build /src/target/thyrocare-backend-*.jar app.jar
USER thyrocare
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
