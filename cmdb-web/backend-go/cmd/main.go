package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"cmdb-go/internal/config"
	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/routes"
	"cmdb-go/internal/seed"
)

func main() {
	// 初始化配置
	if err := config.Init(); err != nil {
		log.Fatalf("Failed to initialize config: %v", err)
	}

	// 初始化数据库
	if err := database.InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.CloseDB()

	// 自动迁移数据库表
	if err := database.GetDB().AutoMigrate(
		&models.Role{},
		&models.User{},
		&models.CI{},
		&models.Relation{},
		&models.AuditLog{},
		&models.ChangeRequest{},
	); err != nil {
		log.Fatalf("Failed to auto migrate: %v", err)
	}

	log.Println("Database migration completed")

	// 初始化默认数据（管理员用户和角色）
	seed.InitDefaultData()

	// 设置 Gin 模式
	gin.SetMode(gin.DebugMode)

	// 创建 Gin 引擎
	r := gin.Default()

	// 配置 CORS 中间件
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		// 处理 OPTIONS 预检请求
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 设置路由
	routes.SetupRoutes(r)

	// 启动服务器
	port := config.GetConfig().Port
	log.Printf("Starting server on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
