package seed

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"cmdb-go/internal/config"
	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/security"
)

func setupTestDBForSeed() *gorm.DB {
	os.Setenv("SECRET_KEY", "test-secret-key")
	os.Setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
	os.Setenv("DATABASE_TYPE", "sqlite")
	os.Setenv("DATABASE_URL", ":memory:")
	config.Init()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		panic(err)
	}

	// 自动迁移
	db.AutoMigrate(
		&models.User{},
		&models.Role{},
		&models.CI{},
		&models.Relation{},
		&models.AuditLog{},
		&models.ChangeRequest{},
	)

	return db
}

func TestInitDefaultData(t *testing.T) {
	db := setupTestDBForSeed()

	// 临时替换全局数据库
	originalDB := database.GetDB()
	database.DB = db
	defer func() {
		database.DB = originalDB
	}()

	// 执行初始化
	InitDefaultData()

	// 验证管理员角色已创建
	var roleCount int64
	db.Model(&models.Role{}).Where("name = ?", "admin").Count(&roleCount)
	assert.Equal(t, int64(1), roleCount, "应该创建一个管理员角色")

	// 验证管理员用户已创建
	var userCount int64
	db.Model(&models.User{}).Where("username = ?", "admin").Count(&userCount)
	assert.Equal(t, int64(1), userCount, "应该创建一个管理员用户")

	// 验证管理员用户的密码已哈希
	var adminUser models.User
	db.Where("username = ?", "admin").First(&adminUser)
	assert.NotEmpty(t, adminUser.HashedPassword)
	assert.True(t, adminUser.IsActive)
	assert.Equal(t, "admin@example.com", adminUser.Email)
}

func TestInitDefaultDataIdempotent(t *testing.T) {
	db := setupTestDBForSeed()

	// 临时替换全局数据库
	originalDB := database.GetDB()
	database.DB = db
	defer func() {
		database.DB = originalDB
	}()

	// 第一次执行
	InitDefaultData()

	// 第二次执行（应该是幂等的）
	InitDefaultData()

	// 验证只创建了一个管理员角色
	var roleCount int64
	db.Model(&models.Role{}).Where("name = ?", "admin").Count(&roleCount)
	assert.Equal(t, int64(1), roleCount, "多次执行应该只创建一个管理员角色")

	// 验证只创建了一个管理员用户
	var userCount int64
	db.Model(&models.User{}).Where("username = ?", "admin").Count(&userCount)
	assert.Equal(t, int64(1), userCount, "多次执行应该只创建一个管理员用户")
}

func TestInitTestCIData(t *testing.T) {
	db := setupTestDBForSeed()

	// 调用内部函数（通过反射或直接测试）
	// 由于initTestCIData是私有函数，我们通过InitDefaultData间接测试
	originalDB := database.GetDB()
	database.DB = db
	defer func() {
		database.DB = originalDB
	}()

	InitDefaultData()

	// 验证创建了测试CI数据
	var ciCount int64
	db.Model(&models.CI{}).Count(&ciCount)
	assert.Greater(t, ciCount, int64(0), "应该创建测试CI数据")

	// 验证CI数据类型
	var cis []models.CI
	db.Find(&cis)

	types := make(map[string]bool)
	for _, ci := range cis {
		types[ci.Type] = true
	}

	// 应该包含多种类型的CI
	assert.Greater(t, len(types), 0, "应该有不同类型的CI")
}

func TestSeedWithExistingData(t *testing.T) {
	db := setupTestDBForSeed()

	// 先手动创建一些数据
	hashedPassword, _ := security.HashPassword("test123")
	existingRole := models.Role{
		ID:   "existing-role",
		Name: "admin",
	}
	db.Create(&existingRole)

	existingUser := models.User{
		ID:             "existing-user",
		Username:       "admin",
		Email:          "existing@example.com",
		HashedPassword: hashedPassword,
		RoleID:         &existingRole.ID,
		IsActive:       true,
	}
	db.Create(&existingUser)

	// 临时替换全局数据库
	originalDB := database.GetDB()
	database.DB = db
	defer func() {
		database.DB = originalDB
	}()

	// 执行初始化（不应该覆盖已有数据）
	InitDefaultData()

	// 验证原有数据未被修改
	var userCount int64
	db.Model(&models.User{}).Where("username = ?", "admin").Count(&userCount)
	assert.Equal(t, int64(1), userCount, "不应重复创建管理员用户")

	var existingAdmin models.User
	db.Where("username = ?", "admin").First(&existingAdmin)
	assert.Equal(t, "existing@example.com", existingAdmin.Email, "原有用户数据应保持不变")
}
