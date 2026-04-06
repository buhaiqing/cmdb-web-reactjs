package database

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"

	"cmdb-go/internal/config"
)

func setupTestConfig() {
	os.Setenv("SECRET_KEY", "test-secret-key")
	os.Setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
	os.Setenv("DATABASE_TYPE", "sqlite")
	os.Setenv("DATABASE_URL", ":memory:")
	config.Init()
}

func TestInitDB(t *testing.T) {
	// 设置测试配置
	setupTestConfig()

	// 初始化数据库
	err := InitDB()
	assert.NoError(t, err)
	assert.NotNil(t, DB)

	// 清理
	CloseDB()
}

func TestInitDBWithPostgres(t *testing.T) {
	// 测试PostgreSQL连接（应该失败，因为没有真实的PG服务器）
	os.Setenv("DATABASE_TYPE", "postgres")
	os.Setenv("DATABASE_URL", "postgresql://test:test@localhost:5432/test?sslmode=disable")
	config.Init()

	err := InitDB()
	// 预期会失败，因为没有真实的PostgreSQL服务器
	assert.Error(t, err)

	// 恢复SQLite配置
	setupTestConfig()
}

func TestInitDBWithMySQL(t *testing.T) {
	// 测试MySQL连接（应该失败，因为没有真实的MySQL服务器）
	os.Setenv("DATABASE_TYPE", "mysql")
	os.Setenv("DATABASE_URL", "root:password@tcp(localhost:3306)/test")
	config.Init()

	err := InitDB()
	// 预期会失败，因为没有真实的MySQL服务器
	assert.Error(t, err)

	// 恢复SQLite配置
	setupTestConfig()
}

func TestInitDBWithUnknownType(t *testing.T) {
	// 测试未知数据库类型（应该回退到SQLite）
	os.Setenv("DATABASE_TYPE", "unknown")
	os.Setenv("DATABASE_URL", ":memory:")
	config.Init()

	err := InitDB()
	// 应该成功，回退到SQLite
	assert.NoError(t, err)
	assert.NotNil(t, DB)

	// 清理
	CloseDB()

	// 恢复配置
	setupTestConfig()
}

func TestGetDB(t *testing.T) {
	// 设置测试配置并初始化
	setupTestConfig()
	err := InitDB()
	assert.NoError(t, err)

	// 获取数据库实例
	db := GetDB()
	assert.NotNil(t, db)

	// 清理
	CloseDB()
}

func TestCloseDB(t *testing.T) {
	// 设置测试配置并初始化
	setupTestConfig()
	err := InitDB()
	assert.NoError(t, err)

	// 关闭数据库
	err = CloseDB()
	assert.NoError(t, err)

	// 验证DB已被清理（实际上CloseDB不会将DB设为nil，只是关闭连接）
	// DB变量仍然指向gorm.DB实例，但底层连接已关闭
	assert.NotNil(t, DB) // DB实例仍然存在
}

func TestCloseDBWithoutInit(t *testing.T) {
	// 确保DB为nil
	DB = nil

	// 关闭未初始化的数据库（应该不报错）
	err := CloseDB()
	assert.NoError(t, err)
}

func TestMultipleInitAndClose(t *testing.T) {
	// 测试多次初始化和关闭
	for i := 0; i < 3; i++ {
		setupTestConfig()
		err := InitDB()
		assert.NoError(t, err)
		assert.NotNil(t, DB)

		err = CloseDB()
		assert.NoError(t, err)
	}
}

func TestConcurrentGetDB(t *testing.T) {
	// 设置测试配置并初始化
	setupTestConfig()
	err := InitDB()
	assert.NoError(t, err)

	done := make(chan bool, 10)

	// 启动10个goroutine并发获取DB
	for i := 0; i < 10; i++ {
		go func() {
			defer func() { done <- true }()
			db := GetDB()
			assert.NotNil(t, db)
		}()
	}

	// 等待所有goroutine完成
	for i := 0; i < 10; i++ {
		<-done
	}

	// 清理
	CloseDB()
}
