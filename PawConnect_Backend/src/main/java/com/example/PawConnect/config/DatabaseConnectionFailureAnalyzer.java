package com.example.PawConnect.config;

import org.springframework.boot.diagnostics.AbstractFailureAnalyzer;
import org.springframework.boot.diagnostics.FailureAnalysis;

import java.net.ConnectException;
import java.net.UnknownHostException;

/**
 * Custom Spring Boot FailureAnalyzer that intercepts startup database connection failures
 * (such as no internet connection when connecting to cloud-hosted databases like Neon, or
 * unreachable database hosts) and converts cryptic 100+ line stack traces into clean,
 * actionable diagnostic messages.
 */
public class DatabaseConnectionFailureAnalyzer extends AbstractFailureAnalyzer<Throwable> {

    @Override
    protected FailureAnalysis analyze(Throwable rootFailure, Throwable cause) {
        UnknownHostException unknownHostEx = findCause(rootFailure, UnknownHostException.class);
        if (unknownHostEx != null) {
            String host = unknownHostEx.getMessage();
            String description = String.format(
                    "Cannot resolve database host '%s'.\n" +
                    "Spring Boot failed to connect to the database because the domain name could not be resolved (UnknownHostException).\n" +
                    "This occurs when your computer does NOT have an active internet connection, or DNS is unable to resolve your cloud database provider (e.g. Neon PostgreSQL).",
                    host != null ? host : "cloud-database"
            );

            String action =
                    "1. Check your internet connection to ensure your machine is online.\n" +
                    "2. If you are developing offline without internet:\n" +
                    "   - Run a local PostgreSQL instance (e.g. localhost:5432) and configure it in 'application-local.yaml' or .env\n" +
                    "   - Example DB_URL: jdbc:postgresql://localhost:5432/pawconnect\n" +
                    "3. If internet is connected, verify that your Neon PostgreSQL project is active and not suspended.";

            return new FailureAnalysis(description, action, unknownHostEx);
        }

        ConnectException connectEx = findCause(rootFailure, ConnectException.class);
        if (connectEx != null) {
            String description = String.format(
                    "Database connection refused: %s.\n" +
                    "The database host was reached, but refused the connection on the configured port.",
                    connectEx.getMessage()
            );

            String action =
                    "1. Verify that your PostgreSQL database server is running.\n" +
                    "2. Verify the host, port, and firewall rules in your .env or application.yaml.\n" +
                    "3. Ensure the database service accepts incoming connections.";

            return new FailureAnalysis(description, action, connectEx);
        }

        Throwable dbEx = findDatabaseException(rootFailure);
        if (dbEx != null) {
            String description = String.format(
                    "Failed to initialize database connection: %s\n" +
                    "Hibernate and HikariCP could not establish a connection to the configured database.",
                    dbEx.getMessage()
            );

            String action =
                    "1. Verify your database credentials (DB_URL, DB_USERNAME, DB_PASSWORD) in .env.\n" +
                    "2. Ensure your internet connection is active if connecting to a cloud-hosted database.\n" +
                    "3. Check the database logs for authentication or SSL configuration errors.";

            return new FailureAnalysis(description, action, dbEx);
        }

        return null;
    }


    private Throwable findDatabaseException(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            String name = current.getClass().getName();
            if (name.contains("PSQLException")
                    || name.contains("CannotGetJdbcConnectionException")
                    || name.contains("JDBCConnectionException")
                    || name.contains("PoolInitializationException")) {
                return current;
            }
            current = current.getCause();
        }
        return null;
    }
}
