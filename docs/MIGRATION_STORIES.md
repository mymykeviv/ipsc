# Migration Stories: PostgreSQL to SQLite + is_active Column

## Overview
This document outlines the migration stories for transitioning from PostgreSQL to SQLite and implementing the `is_active` column functionality across the application.

## Story 1: Database Configuration Migration
**Priority:** High  
**Effort:** 3 story points  
**Dependencies:** None

### Description
Update database configuration to use SQLite as the primary database instead of PostgreSQL.

### Acceptance Criteria
- [ ] Update `config.py` to use SQLite connection strings for all environments
- [ ] Modify `db.py` to handle SQLite-specific configurations
- [ ] Ensure connection pooling works with SQLite
- [ ] Update environment variables and settings
- [ ] Verify database URL generation functions work with SQLite

### Technical Details
- Change database URLs from PostgreSQL format to SQLite format
- Update `DevelopmentSettings`, `ProductionSettings`, and `TestingSettings` classes
- Modify `get_db_url()` and `get_tenant_db_url()` functions
- Handle SQLite file path configurations

### Files to Modify
- `/backend/app/config.py`
- `/backend/app/db.py`

---

## Story 2: SQLAlchemy Model Compatibility
**Priority:** High  
**Effort:** 5 story points  
**Dependencies:** Story 1

### Description
Ensure all SQLAlchemy models are compatible with SQLite, addressing PostgreSQL-specific features.

### Acceptance Criteria
- [ ] Review all models for PostgreSQL-specific data types
- [ ] Replace `Numeric` with SQLite-compatible alternatives where needed
- [ ] Ensure foreign key constraints work properly
- [ ] Verify datetime handling compatibility
- [ ] Test all model relationships and constraints

### Technical Details
- SQLite doesn't have native `Numeric` type - uses `REAL` or `TEXT`
- Foreign key support needs to be enabled explicitly
- Boolean values stored as integers (0/1)
- No native UUID type support

### Files to Modify
- `/backend/app/models.py`
- `/backend/app/tenant_models.py`
- `/backend/app/dental_models.py` (if exists)

---

## Story 3: Alembic Migration Scripts Compatibility
**Priority:** High  
**Effort:** 8 story points  
**Dependencies:** Story 2

### Description
Update all Alembic migration scripts to ensure SQLite compatibility, particularly handling ALTER TABLE limitations.

### Acceptance Criteria
- [ ] Review all existing migration scripts
- [ ] Replace PostgreSQL-specific SQL with SQLite-compatible alternatives
- [ ] Handle SQLite's limited ALTER TABLE support
- [ ] Ensure migration scripts can run both forward and backward
- [ ] Test all migrations on a clean SQLite database

### Technical Details
- SQLite doesn't support `ALTER COLUMN` operations
- Limited support for dropping columns (requires table recreation)
- No support for adding constraints to existing tables
- Need to use batch operations for complex schema changes

### Files to Modify
- All files in `/backend/migrations/versions/`
- `/backend/migrations/env.py`
- `/backend/alembic.ini`

---

## Story 4: is_active Column Implementation
**Priority:** High  
**Effort:** 3 story points  
**Dependencies:** Story 3

### Description
Implement the `is_active` column functionality for the parties table with proper SQLite support.

### Acceptance Criteria
- [ ] Ensure `is_active` column exists in parties table
- [ ] Set default value to `True` for new records
- [ ] Update existing records to have `is_active = True`
- [ ] Add database constraints and indexes if needed
- [ ] Verify migration script works with SQLite

### Technical Details
- Column already defined in `Party` model
- Migration script exists but needs SQLite compatibility verification
- Default value handling in SQLite
- Boolean storage as integer (0/1)

### Files to Modify
- `/backend/migrations/versions_archive_2025-08-25/add_is_active_to_parties.py`
- Potentially move to active versions directory

---

## Story 5: API Layer Updates
**Priority:** Medium  
**Effort:** 5 story points  
**Dependencies:** Story 4

### Description
Update API endpoints and business logic to utilize the `is_active` column for filtering and data management.

### Acceptance Criteria
- [ ] Add `is_active` filtering to party list endpoints
- [ ] Implement soft delete functionality using `is_active`
- [ ] Update party creation/update endpoints
- [ ] Add bulk activation/deactivation endpoints
- [ ] Ensure backward compatibility with existing API consumers

### Technical Details
- Filter queries to exclude inactive parties by default
- Add query parameters for including inactive records
- Implement soft delete instead of hard delete
- Update serializers and validators

### Files to Modify
- Party-related API endpoints
- Query optimization files
- Business logic modules

---

## Story 6: Database Connection Optimization
**Priority:** Medium  
**Effort:** 4 story points  
**Dependencies:** Story 1

### Description
Optimize database connections and session management for SQLite-specific performance characteristics.

### Acceptance Criteria
- [ ] Configure SQLite-specific connection parameters
- [ ] Enable foreign key constraints
- [ ] Set appropriate journal mode and synchronization
- [ ] Configure connection pooling for SQLite
- [ ] Implement proper transaction handling

### Technical Details
- Enable `PRAGMA foreign_keys=ON`
- Set journal mode to WAL for better concurrency
- Configure synchronous mode for performance vs. durability trade-off
- Handle SQLite's database locking behavior

### Files to Modify
- `/backend/app/db.py`
- `/backend/app/database_optimizer.py`

---

## Story 7: Testing Suite Implementation
**Priority:** High  
**Effort:** 6 story points  
**Dependencies:** Stories 1-4

### Description
Create comprehensive tests for SQLite migration and `is_active` functionality.

### Acceptance Criteria
- [ ] Unit tests for database configuration changes
- [ ] Integration tests for migration scripts
- [ ] API tests for `is_active` functionality
- [ ] Performance tests comparing SQLite vs PostgreSQL
- [ ] Data integrity tests

### Technical Details
- Test database setup and teardown
- Migration testing framework
- API endpoint testing
- Data consistency validation
- Performance benchmarking

### Files to Create
- Test files for migration functionality
- API test updates
- Database test utilities

---

## Story 8: Data Migration and Backup Strategy
**Priority:** High  
**Effort:** 4 story points  
**Dependencies:** Story 3

### Description
Implement data migration from PostgreSQL to SQLite with proper backup and rollback procedures.

### Acceptance Criteria
- [ ] Create data export script from PostgreSQL
- [ ] Implement data import script for SQLite
- [ ] Verify data integrity after migration
- [ ] Create backup and restore procedures
- [ ] Document rollback strategy

### Technical Details
- Handle data type conversions
- Preserve foreign key relationships
- Maintain data consistency
- Create migration validation scripts

### Files to Modify
- `/backend/migrate_to_postgresql.py` (reverse direction)
- Create new migration utilities

---

## Story 9: Documentation Updates
**Priority:** Medium  
**Effort:** 2 story points  
**Dependencies:** All previous stories

### Description
Update all documentation to reflect SQLite usage and new `is_active` functionality.

### Acceptance Criteria
- [ ] Update development setup instructions
- [ ] Document SQLite configuration options
- [ ] Update API documentation for `is_active` endpoints
- [ ] Create migration guide
- [ ] Update troubleshooting documentation

### Technical Details
- Local development setup changes
- Database configuration documentation
- API endpoint documentation
- Migration procedures

### Files to Modify
- `/docs/LOCAL_DEVELOPMENT.md`
- `/backend/MIGRATION_GUIDE.md`
- API documentation files
- README files

---

## Implementation Priority

### Phase 1 (Critical Path)
1. Story 1: Database Configuration Migration
2. Story 2: SQLAlchemy Model Compatibility
3. Story 3: Alembic Migration Scripts Compatibility
4. Story 4: is_active Column Implementation

### Phase 2 (Enhancement)
5. Story 6: Database Connection Optimization
6. Story 7: Testing Suite Implementation
7. Story 8: Data Migration and Backup Strategy

### Phase 3 (Polish)
8. Story 5: API Layer Updates
9. Story 9: Documentation Updates

## Risk Assessment

### High Risk
- **Data Loss**: Improper migration could result in data loss
- **Downtime**: Migration process may require application downtime
- **Performance**: SQLite performance characteristics differ from PostgreSQL

### Mitigation Strategies
- Comprehensive backup before migration
- Thorough testing in staging environment
- Rollback procedures documented and tested
- Performance benchmarking and optimization

## Success Criteria

1. **Functional**: All existing functionality works with SQLite
2. **Performance**: Application performance meets or exceeds current levels
3. **Data Integrity**: No data loss during migration
4. **Compatibility**: All APIs remain backward compatible
5. **Testing**: 100% test coverage for migration functionality
6. **Documentation**: Complete and accurate documentation

## Estimated Timeline
- **Phase 1**: 2-3 weeks
- **Phase 2**: 1-2 weeks
- **Phase 3**: 1 week
- **Total**: 4-6 weeks

## Resource Requirements
- 1 Senior Backend Developer (full-time)
- 1 QA Engineer (part-time for testing)
- 1 DevOps Engineer (for deployment and infrastructure)