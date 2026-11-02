# Database Migration Strategy (Flyway)

## Strategy Overview
PawConnect is transitioning from Hibernate `ddl-auto: update` to deterministic Flyway versioned migrations.

### Principles:
1. **Preserve Existing Cloud Database:** Never run `DROP TABLE`, `TRUNCATE`, or destructive DDL on existing Neon cloud tables.
2. **Idempotent DDL:** Use `IF NOT EXISTS` for all tables, indexes, and constraints.
3. **Controlled Activation:** `spring.flyway.enabled: false` is configured initially to avoid conflicting with existing running database schemas.
4. **Baseline Migration:** Before enabling Flyway in production, execute baseline:
   ```bash
   flyway:baseline -Dflyway.baselineVersion=1 -Dflyway.baselineDescription="Initial Schema Baseline"
   ```
5. **Eventual Target:** Once all environments are baselined and verified, transition `spring.jpa.hibernate.ddl-auto` from `update` to `validate`.
