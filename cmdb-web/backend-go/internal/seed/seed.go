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

	// 1. 初始化分配权限和角色
	initRolesAndUsers(db)

	// 2. 初始化测试业务数据 (CI, Changes, Relations, Tags, types)
	initBusinessData(db)
}

func initRolesAndUsers(db *gorm.DB) {
	// 检查是否已有管理员角色
	var roleCount int64
	db.Model(&models.Role{}).Where("name = ?", "admin").Count(&roleCount)
	var adminRoleID string
	if roleCount == 0 {
		adminRoleID = uuid.New().String()
		desc := "系统管理员"
		perms := `["*"]`
		adminRole := models.Role{
			ID:          adminRoleID,
			Name:        "admin",
			Code:        "admin",
			Description: &desc,
			Permissions: &perms,
		}
		db.Create(&adminRole)
		log.Println("[INFO] Admin role created")
	} else {
		var r models.Role
		db.Where("name = ?", "admin").First(&r)
		adminRoleID = r.ID
	}

	// 检查是否已有管理员用户
	var userCount int64
	db.Model(&models.User{}).Where("username = ?", "admin").Count(&userCount)
	if userCount == 0 {
		hashedPassword, _ := security.HashPassword("admin123")
		adminUser := models.User{
			ID:             "admin-id", // 使用固定 ID 方便关联
			Username:       "admin",
			Email:          "admin@example.com",
			HashedPassword: hashedPassword,
			RoleID:         &adminRoleID,
			IsActive:       true,
		}
		db.Create(&adminUser)
		log.Println("[INFO] Admin user created: admin/admin123")
	}
}

func initBusinessData(db *gorm.DB) {
	// 只有当 CI 表为空时才初始化
	var ciCount int64
	db.Model(&models.CI{}).Count(&ciCount)
	if ciCount > 0 {
		return
	}

	// 辅助函数
	sPtr := func(s string) *string { return &s }

	// 1. 初始化 CI Types
	ciTypes := []models.CIType{
		{ID: "type-001", Name: "服务器", Code: "server", Icon: sPtr("desktop"), Description: sPtr("物理/虚拟服务器"), IsActive: true, SortOrder: 1},
		{ID: "type-002", Name: "数据库", Code: "database", Icon: sPtr("database"), Description: sPtr("数据库实例"), IsActive: true, SortOrder: 2},
		{ID: "type-003", Name: "中间件", Code: "middleware", Icon: sPtr("cloud"), Description: sPtr("中间件服务"), IsActive: true, SortOrder: 3},
		{ID: "type-004", Name: "容器", Code: "container", Icon: sPtr("container"), Description: sPtr("容器实例"), IsActive: true, SortOrder: 4},
		{ID: "type-005", Name: "应用", Code: "application", Icon: sPtr("app"), Description: sPtr("业务应用"), IsActive: true, SortOrder: 5},
	}
	db.Create(&ciTypes)

	// 2. 初始化 Tags
	tags := []models.Tag{
		{ID: "tag-001", Name: "生产环境", Color: "red", Description: sPtr("生产环境资源")},
		{ID: "tag-002", Name: "测试环境", Color: "blue", Description: sPtr("测试环境资源")},
		{ID: "tag-003", Name: "重要", Color: "gold", Description: sPtr("重要标记")},
		{ID: "tag-004", Name: "测试", Color: "green", Description: sPtr("用于搜索测试")},
	}
	db.Create(&tags)

	// 3. 初始化 CIs
	cis := []models.CI{
		{
			ID: "ci-001", Name: "DB-主库-01", Type: "database", Status: "running",
			IP: sPtr("10.0.1.101"), CPU: sPtr("16核"), Memory: sPtr("64GB"),
			Disk: sPtr("500GB SSD"), OS: sPtr("CentOS 7.9"),
			Project: sPtr("订单系统"), Environment: sPtr("production"),
		},
		{
			ID: "ci-002", Name: "APP-订单服务", Type: "application", Status: "running",
			IP: sPtr("10.0.1.102"), Project: sPtr("订单系统"), Environment: sPtr("production"),
		},
		{
			ID: "ci-003", Name: "K8S-Node-01", Type: "container", Status: "running",
			IP: sPtr("10.0.2.1"), Project: sPtr("基础设施"), Environment: sPtr("production"),
		},
		{
			ID: "ci-004", Name: "测试服务器-01", Type: "server", Status: "running",
			IP: sPtr("192.168.1.100"), Project: sPtr("测试项目"), Environment: sPtr("production"),
		},
	}
	db.Create(&cis)

	// 4. 初始化 Change Requests
	changes := []models.ChangeRequest{
		{
			ID: "change-001", Title: "数据库配置优化", Description: "修改最大连接数",
			CIID: "ci-001", Status: "pending", Reason: "优化性能", Plan: "修改 my.cnf",
			RequesterID: "admin-id", Priority: "medium",
		},
		{
			ID: "change-approved", Title: "应用服务重启", Description: "重启应用服务",
			CIID: "ci-002", Status: "approved", Reason: "更新代码", Plan: "systemctl restart",
			RequesterID: "admin-id", Priority: "high",
		},
		{
			ID: "change-rejected", Title: "测试拒绝请求", Description: "拒绝理由测试",
			CIID: "ci-003", Status: "rejected", Reason: "测试", Plan: "测试",
			RequesterID: "admin-id", Priority: "low",
		},
	}
	db.Create(&changes)

	// 5. 初始化 Relations
	relations := []models.Relation{
		{
			ID: "rel-001", SourceCIID: "ci-001", TargetCIID: "ci-002",
			RelationType: "depends_on", Description: sPtr("App depends on DB"),
		},
	}
	db.Create(&relations)
}

// Seed function if needed to be called from main for forced seeding
func Seed(db *gorm.DB) error {
	initRolesAndUsers(db)
	initBusinessData(db)
	return nil
}
