package database

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"gorm.io/gorm"
)

// EnsureDatabase creates the application database when it does not exist yet.
// It is best effort: when the user lacks CREATE privileges but the database is
// already present, the subsequent connection still succeeds.
func EnsureDatabase(cfg Config) error {
	adminCfg := cfg
	adminCfg.Name = ""

	db, err := New(adminCfg)
	if err != nil {
		return err
	}
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	defer sqlDB.Close()

	return db.Exec(fmt.Sprintf(
		"CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
		cfg.Name,
	)).Error
}

// Migrate applies every *.sql file in dir that has not been applied yet.
// Each file must contain a "-- +migrate Up" marker; only the Up section runs.
func Migrate(db *gorm.DB, dir string) error {
	if err := db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		version VARCHAR(255) PRIMARY KEY,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`).Error; err != nil {
		return fmt.Errorf("create schema_migrations: %w", err)
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		return fmt.Errorf("read migrations: %w", err)
	}

	files := make([]string, 0, len(entries))
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			files = append(files, entry.Name())
		}
	}
	sort.Strings(files)

	for _, file := range files {
		var count int64
		if err := db.Table("schema_migrations").Where("version = ?", file).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			continue
		}

		content, err := os.ReadFile(filepath.Join(dir, file))
		if err != nil {
			return fmt.Errorf("read %s: %w", file, err)
		}
		up := upSection(string(content))
		for _, statement := range splitStatements(up) {
			if err := db.Exec(statement).Error; err != nil {
				return fmt.Errorf("apply %s: %w", file, err)
			}
		}
		if err := db.Table("schema_migrations").Create(map[string]interface{}{"version": file}).Error; err != nil {
			return err
		}
	}
	return nil
}

func upSection(sql string) string {
	upIndex := strings.Index(sql, "-- +migrate Up")
	if upIndex < 0 {
		return sql
	}
	sql = sql[upIndex+len("-- +migrate Up"):]
	if downIndex := strings.Index(sql, "-- +migrate Down"); downIndex >= 0 {
		sql = sql[:downIndex]
	}
	return sql
}

func splitStatements(sql string) []string {
	parts := strings.Split(sql, ";")
	statements := make([]string, 0, len(parts))
	for _, part := range parts {
		cleaned := cleanStatement(part)
		if cleaned != "" {
			statements = append(statements, cleaned)
		}
	}
	return statements
}

func cleanStatement(statement string) string {
	lines := strings.Split(statement, "\n")
	out := make([]string, 0, len(lines))
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "--") {
			continue
		}
		out = append(out, line)
	}
	return strings.TrimSpace(strings.Join(out, "\n"))
}
