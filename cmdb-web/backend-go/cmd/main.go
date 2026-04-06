package main

import (
	"log"
	"net/http"

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

	// 配置 CORS 中间件 - 必须在使用 withCredentials 时指定具体 Origin
	r.Use(func(c *gin.Context) {
		origin := c.GetHeader("Origin")

		// 允许的 Origins（必须明确指定，不能使用通配符 *）
		allowedOrigins := map[string]bool{
			"http://localhost:3000":  true,
			"http://localhost:3001":  true,
			"http://localhost:3002":  true,
			"http://127.0.0.1:3000":  true,
			"http://127.0.0.1:3001":  true,
			"http://127.0.0.1:3002":  true,
		}

		// 只允许特定的 Origin（不能使用 *，因为前端设置了 withCredentials: true）
		if allowedOrigins[origin] {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		// 处理 OPTIONS 预检请求
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusOK)
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
