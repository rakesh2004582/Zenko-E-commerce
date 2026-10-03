FROM maven:3.9.9-eclipse-temurin-17 AS builder

WORKDIR /app

COPY pom.xml .

RUN mvn dependency:go-offline -B

COPY src ./src

RUN mvn clean package -DskipTests


FROM eclipse-temurin:17-jre

WORKDIR /app

RUN useradd -r -u 1001 springboot

COPY --from=builder /app/target/*.jar app.jar

RUN mkdir -p /app/uploads/products \
    && chown -R springboot:springboot /app

USER springboot

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]