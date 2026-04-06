package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestInit(t *testing.T) {
	// 设置测试环境变量
	os.Setenv("SECRET_KEY", "test-secret-key")
	os.Setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
	os.Setenv("DATABASE_TYPE", "sqlite")
	os.Setenv("DATABASE_URL", ":memory:")

	// 初始化配置
	Init()

	// 验证配置已加载
	cfg := GetConfig()
	assert.NotNil(t, cfg)
	assert.Equal(t, "test-secret-key", cfg.SecretKey)
	assert.Equal(t, 60, cfg.AccessTokenExpireMinutes)
	assert.Equal(t, "sqlite", cfg.DatabaseType)
	assert.Equal(t, ":memory:", cfg.DatabaseURL)
}

func TestGetConfig(t *testing.T) {
	// 确保配置已初始化
	os.Setenv("SECRET_KEY", "another-test-key")
	os.Setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
	Init()

	// 获取配置
	cfg := GetConfig()
	assert.NotNil(t, cfg)
	assert.Equal(t, "another-test-key", cfg.SecretKey)
	assert.Equal(t, 30, cfg.AccessTokenExpireMinutes)
}

func TestGetAccessTokenExpireDuration(t *testing.T) {
	// 设置不同的过期时间
	testCases := []struct {
		name     string
		minutes  int
		expected string
	}{
		{"60分钟", 60, "1h0m0s"},
		{"30分钟", 30, "30m0s"},
		{"120分钟", 120, "2h0m0s"},
		{"0分钟", 0, "0s"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			os.Setenv("ACCESS_TOKEN_EXPIRE_MINUTES", string(rune(tc.minutes+'0')))
			Init()

			duration := GetAccessTokenExpireDuration()
			assert.NotNil(t, duration)
			// 验证duration不为零
			assert.NotEqual(t, 0, duration.Minutes())
		})
	}
}

func TestGetEnv(t *testing.T) {
	// 测试获取存在的环境变量
	os.Setenv("TEST_VAR", "test_value")
	value := getEnv("TEST_VAR", "default")
	assert.Equal(t, "test_value", value)

	// 测试获取不存在的环境变量（使用默认值）
	value = getEnv("NON_EXISTENT_VAR", "default_value")
	assert.Equal(t, "default_value", value)

	// 测试空字符串（会返回默认值）
	os.Setenv("EMPTY_VAR", "")
	value = getEnv("EMPTY_VAR", "default")
	assert.Equal(t, "default", value) // 空字符串会返回默认值
}

func TestInitWithDefaults(t *testing.T) {
	// 清除所有相关环境变量
	os.Unsetenv("SECRET_KEY")
	os.Unsetenv("ACCESS_TOKEN_EXPIRE_MINUTES")
	os.Unsetenv("DATABASE_TYPE")
	os.Unsetenv("DATABASE_URL")

	// 初始化配置（应该使用默认值）
	Init()

	cfg := GetConfig()
	assert.NotNil(t, cfg)
	// 验证使用了默认值
	assert.NotEmpty(t, cfg.SecretKey)
	assert.NotEqual(t, 0, cfg.AccessTokenExpireMinutes)
}

func TestConcurrentGetConfig(t *testing.T) {
	// 测试并发访问配置的安全性
	os.Setenv("SECRET_KEY", "concurrent-test")
	Init()

	done := make(chan bool, 10)

	// 启动10个goroutine并发读取配置
	for i := 0; i < 10; i++ {
		go func() {
			defer func() { done <- true }()
			cfg := GetConfig()
			assert.NotNil(t, cfg)
			assert.Equal(t, "concurrent-test", cfg.SecretKey)
		}()
	}

	// 等待所有goroutine完成
	for i := 0; i < 10; i++ {
		<-done
	}
}
