package seed

import (
	"log"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/security"
)

// InitDefaultData 初始化默认数据
func InitDefaultData() {
	db := database.GetDB()

	// 检查是否已有管理员角色
	var roleCount int64
	db.Model(&models.Role{}).Where("name = ?", "admin").Count(&roleCount)
	if roleCount == 0 {
		// 创建管理员角色
		desc := "系统管理员"
		perms := `["*"]`
		adminRole := models.Role{
			ID:          uuid.New().String(),
			Name:        "admin",
			Description: &desc,
			Permissions: &perms,
		}
		if err := db.Create(&adminRole).Error; err != nil {
			log.Printf("[WARN] Failed to create admin role: %v", err)
		} else {
			log.Println("[INFO] Admin role created")
		}
	}

	// 检查是否已有管理员用户
	var userCount int64
	db.Model(&models.User{}).Where("username = ?", "admin").Count(&userCount)
	if userCount == 0 {
		// 获取管理员角色ID
		var adminRole models.Role
		if err := db.Where("name = ?", "admin").First(&adminRole).Error; err != nil {
			log.Printf("[WARN] Failed to get admin role: %v", err)
			return
		}

		// 创建管理员用户
		hashedPassword, err := security.HashPassword("admin123")
		if err != nil {
			log.Printf("[ERROR] Failed to hash password: %v", err)
			return
		}

		adminUser := models.User{
			ID:             uuid.New().String(),
			Username:       "admin",
			Email:          "admin@example.com",
			HashedPassword: hashedPassword,
			RoleID:         &adminRole.ID,
			IsActive:       true,
		}
		if err := db.Create(&adminUser).Error; err != nil {
			log.Printf("[WARN] Failed to create admin user: %v", err)
		} else {
			log.Println("[INFO] Admin user created (username: admin, password: admin123)")
		}
	}

	// 初始化测试用的 CI 数据
	initTestCIData(db)
}

// initTestCIData 初始化测试用的配置项数据
func initTestCIData(db *gorm.DB) {
	// 检查是否已有 CI 数据
	var ciCount int64
	db.Model(&models.CI{}).Count(&ciCount)
	if ciCount > 0 {
		return // 已有数据，跳过
	}

	// 辅助函数：创建字符串指针
	strPtr := func(s string) *string { return &s }

	// 创建测试 CI 数据
	testCIs := []models.CI{
		{
			ID:          "1",
			Name:        "DB-主库-01",
			Type:        "database",
			Status:      "running",
			IP:          strPtr("10.0.1.101"),
			CPU:         strPtr("16核"),
			Memory:      strPtr("64GB"),
			Disk:        strPtr("500GB SSD"),
			OS:          strPtr("CentOS 7.9"),
			Project:     strPtr("订单系统"),
			Environment: strPtr("production"),
		},
		{
			ID:          "2",
			Name:        "APP-订单服务",
			Type:        "application",
			Status:      "running",
			IP:          strPtr("10.0.1.102"),
			CPU:         strPtr("8核"),
			Memory:      strPtr("32GB"),
			Disk:        strPtr("200GB SSD"),
			OS:          strPtr("CentOS 7.9"),
			Project:     strPtr("订单系统"),
			Environment: strPtr("production"),
		},
		{
			ID:          "3",
			Name:        "K8S-Node-01",
			Type:        "container",
			Status:      "running",
			IP:          strPtr("10.0.2.1"),
			CPU:         strPtr("32核"),
			Memory:      strPtr("128GB"),
			Disk:        strPtr("1TB SSD"),
			OS:          strPtr("Ubuntu 20.04"),
			Project:     strPtr("基础设施"),
			Environment: strPtr("production"),
		},
	}

	for _, ci := range testCIs {
		if err := db.Create(&ci).Error; err != nil {
			log.Printf("[WARN] Failed to create test CI %s: %v", ci.Name, err)
		} else {
			log.Printf("[INFO] Test CI created: %s", ci.Name)
		}
	}
}
