-- MariaDB DDL for the Digital Twin Legislation platform
-- Optimized for InnoDB, utf8mb4 encoding, and referential integrity.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    external_id VARCHAR(191) NOT NULL UNIQUE,
    display_name VARCHAR(191) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dtlibs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    law_name VARCHAR(255) NOT NULL,
    law_identifier VARCHAR(191) NOT NULL,
    jurisdiction VARCHAR(191) NOT NULL,
    version VARCHAR(64) NOT NULL,
    effective_date DATE NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Draft',
    authoritative_source_url TEXT NULL,
    repository_url TEXT NULL,
    repository_branch VARCHAR(191) NULL,
    full_text LONGTEXT NOT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_dtlib_identity (law_identifier, version),
    CONSTRAINT fk_dtlib_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_dtlib_status CHECK (status IN ('Draft','In Review','Approved','Archived'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dtlib_memberships (
    dtlib_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    role VARCHAR(32) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (dtlib_id, user_id, role),
    CONSTRAINT fk_dtlib_member_dtlib FOREIGN KEY (dtlib_id) REFERENCES dtlibs(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_dtlib_member_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_dtlib_member_role CHECK (role IN ('Viewer','Editor','Reviewer','Owner'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dtls (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    dtlib_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    owner_user_id BIGINT UNSIGNED NULL,
    version VARCHAR(64) NOT NULL,
    legal_text LONGTEXT NOT NULL,
    legal_reference TEXT NOT NULL,
    source_url TEXT NULL,
    classification JSON NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Draft',
    position INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_dtl_dtlib FOREIGN KEY (dtlib_id) REFERENCES dtlibs(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_dtl_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_dtl_status CHECK (status IN ('Draft','In Workflow','In Review','Approved','Revision Requested','Archived')),
    KEY idx_dtl_dtlib_status (dtlib_id, status),
    KEY idx_dtl_position (dtlib_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dtl_trace_links (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    dtl_id BIGINT UNSIGNED NOT NULL,
    artifact_type VARCHAR(64) NOT NULL,
    artifact_id BIGINT UNSIGNED NULL,
    law_reference TEXT NOT NULL,
    note TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trace_dtl FOREIGN KEY (dtl_id) REFERENCES dtls(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_trace_artifact CHECK (artifact_type IN ('Ontology','Interface','Configuration','Logic','Test','Comment','Segmentation'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dtl_segmentation_suggestions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    dtlib_id BIGINT UNSIGNED NOT NULL,
    suggestion_title VARCHAR(255) NOT NULL,
    suggestion_description TEXT NULL,
    legal_text LONGTEXT NOT NULL,
    legal_reference TEXT NOT NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) NOT NULL DEFAULT 'Proposed',
    CONSTRAINT fk_segmentation_dtlib FOREIGN KEY (dtlib_id) REFERENCES dtlibs(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_segmentation_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_segmentation_status CHECK (status IN ('Proposed','Accepted','Rejected','Converted')),
    KEY idx_segmentation_dtlib (dtlib_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dtl_ontology (
    dtl_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    ontology_owl LONGTEXT NOT NULL,
    generated_by VARCHAR(191) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ontology_dtl FOREIGN KEY (dtl_id) REFERENCES dtls(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dtl_interface (
    dtl_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    interface_json JSON NOT NULL,
    mcp_spec JSON NULL,
    generated_by VARCHAR(191) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_interface_dtl FOREIGN KEY (dtl_id) REFERENCES dtls(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dtl_configuration (
    dtl_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    configuration_owl LONGTEXT NOT NULL,
    generated_by VARCHAR(191) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_configuration_dtl FOREIGN KEY (dtl_id) REFERENCES dtls(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dtl_tests (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    dtl_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    input_json JSON NOT NULL,
    expected_output_json JSON NOT NULL,
    description TEXT NULL,
    last_run_at DATETIME NULL,
    last_result VARCHAR(16) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tests_dtl FOREIGN KEY (dtl_id) REFERENCES dtls(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_tests_last_result CHECK (last_result IN ('Pass','Fail','Not Run') OR last_result IS NULL),
    KEY idx_tests_dtl (dtl_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dtl_test_runs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    test_id BIGINT UNSIGNED NOT NULL,
    executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    result VARCHAR(16) NOT NULL,
    actual_output_json JSON NULL,
    notes TEXT NULL,
    CONSTRAINT fk_test_runs_test FOREIGN KEY (test_id) REFERENCES dtl_tests(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_test_runs_result CHECK (result IN ('Pass','Fail')),
    KEY idx_test_runs_test (test_id, executed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dtl_logic (
    dtl_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    language VARCHAR(64) NOT NULL DEFAULT 'Python',
    code LONGTEXT NOT NULL,
    generated_by VARCHAR(191) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_logic_dtl FOREIGN KEY (dtl_id) REFERENCES dtls(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dtl_reviews (
    dtl_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    status VARCHAR(32) NOT NULL DEFAULT 'Pending',
    approved_version VARCHAR(64) NULL,
    approved_at DATETIME NULL,
    reviewer_id BIGINT UNSIGNED NULL,
    last_comment TEXT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_dtl FOREIGN KEY (dtl_id) REFERENCES dtls(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_review_status CHECK (status IN ('Pending','Approved','Revision Requested'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dtl_comments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    dtl_id BIGINT UNSIGNED NOT NULL,
    author_id BIGINT UNSIGNED NOT NULL,
    role VARCHAR(32) NOT NULL,
    comment TEXT NOT NULL,
    comment_type VARCHAR(32) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_dtl FOREIGN KEY (dtl_id) REFERENCES dtls(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_comment_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_comment_role CHECK (role IN ('Viewer','Editor','Reviewer','Owner')),
    CONSTRAINT chk_comment_type CHECK (comment_type IN ('General','Issue','Approval','Revision') OR comment_type IS NULL),
    KEY idx_comment_dtl (dtl_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS github_sync_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    dtlib_id BIGINT UNSIGNED NOT NULL,
    repository_url TEXT NOT NULL,
    branch VARCHAR(191) NOT NULL,
    commit_id VARCHAR(191) NULL,
    message TEXT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Started',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    CONSTRAINT fk_sync_dtlib FOREIGN KEY (dtlib_id) REFERENCES dtlibs(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_sync_status CHECK (status IN ('Started','Completed','Failed')),
    KEY idx_sync_dtlib (dtlib_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
