package database

import (
	"fmt"
	"log"
	"strings"
	"time"

	"cmdb-go/internal/config"

	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDB 初始化数据库连接
func InitDB() error {
	cfg := config.GetConfig()

	var err error
	var dialector gorm.Dialector

	// 根据 DATABASE_TYPE 选择数据库驱动
	dbType := strings.ToLower(cfg.DatabaseType)

	switch dbType {
	case "sqlite":
		log.Println("Using SQLite database")
		dialector = sqlite.Open(cfg.DatabaseURL)
	case "postgres", "postgresql":
		log.Println("Using PostgreSQL database")
		dialector = postgres.Open(cfg.DatabaseURL)
	case "mysql":
		log.Println("Using MySQL database")
		dialector = mysql.Open(cfg.DatabaseURL)
	default:
		log.Printf("Unknown database type '%s', defaulting to SQLite", dbType)
		dialector = sqlite.Open(cfg.DatabaseURL)
	}

	DB, err = gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})

	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// 配置连接池
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get sql.DB: %w", err)
	}

	// SQLite特殊优化：启用WAL模式
	if strings.ToLower(cfg.DatabaseType) == "sqlite" {
		log.Println("Enabling SQLite WAL mode for better concurrency")

		// 启用 Write-Ahead Logging (WAL) 模式
		_, err := sqlDB.Exec("PRAGMA journal_mode=WAL")
		if err != nil {
			log.Printf("Warning: Failed to enable WAL mode: %v", err)
		} else {
			log.Println("SQLite WAL mode enabled successfully")
		}

		// 设置busy_timeout为5秒（等待锁释放的时间）
		_, err = sqlDB.Exec("PRAGMA busy_timeout=5000")
		if err != nil {
			log.Printf("Warning: Failed to set busy_timeout: %v", err)
		} else {
			log.Println("SQLite busy_timeout set to 5000ms")
		}

		// 优化WAL性能
		sqlDB.Exec("PRAGMA wal_autocheckpoint=1000") // 每1000页自动checkpoint
		sqlDB.Exec("PRAGMA synchronous=NORMAL")      // 平衡性能和安全性
	}

	sqlDB.SetMaxIdleConns(10)                  // 最大空闲连接数
	sqlDB.SetMaxOpenConns(100)                 // 最大打开连接数
	sqlDB.SetConnMaxLifetime(time.Hour)        // 连接最大生命周期
	sqlDB.SetConnMaxIdleTime(10 * time.Minute) // 连接最大空闲时间

	log.Println("Database connection established with connection pool")
	return nil
}

// GetDB 获取数据库实例
func GetDB() *gorm.DB {
	return DB
}

// CloseDB 关闭数据库连接
func CloseDB() error {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}
