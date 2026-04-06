package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"cmdb-go/internal/middleware"
)

// SetupRoutes 设置所有路由
func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		// 认证路由
		auth := api.Group("/auth")
		{
			auth.POST("/login", Login)
			auth.GET("/me", middleware.AuthMiddleware(), GetMe)
			auth.POST("/logout", middleware.AuthMiddleware(), Logout)
		}

		// 用户路由
		users := api.Group("/users", middleware.AuthMiddleware())
		{
			users.GET("", ListUsers)
			users.POST("", CreateUser)
			users.GET("/:id", GetUser)
			users.PUT("/:id", UpdateUser)
			users.DELETE("/:id", DeleteUser)
		}

		// 角色路由
		roles := api.Group("/roles", middleware.AuthMiddleware())
		{
			roles.GET("", ListRoles)
			roles.POST("", CreateRole)
			roles.GET("/:id", GetRole)
			roles.PUT("/:id", UpdateRole)
			roles.DELETE("/:id", DeleteRole)
		}

		// CI 路由
		ci := api.Group("/ci", middleware.AuthMiddleware())
		{
			ci.GET("", ListCI)
			ci.POST("", CreateCI)
			ci.GET("/:id", GetCI)
			ci.PUT("/:id", UpdateCI)
			ci.DELETE("/:id", DeleteCI)
		}

		// 关系路由
		relations := api.Group("/relations", middleware.AuthMiddleware())
		{
			relations.GET("", ListRelations)
			relations.POST("", CreateRelation)
			relations.GET("/:id", GetRelation)
			relations.PUT("/:id", UpdateRelation)
			relations.DELETE("/:id", DeleteRelation)
		}

		// 变更路由
		changes := api.Group("/changes", middleware.AuthMiddleware())
		{
			changes.GET("", ListChanges)
			changes.POST("", CreateChange)
			changes.GET("/:id", GetChange)
			changes.PUT("/:id", UpdateChange)
			changes.DELETE("/:id", DeleteChange)
		}

		// 审计路由
		audit := api.Group("/audit", middleware.AuthMiddleware())
		{
			audit.GET("", ListAuditLogs)
		}

		// 仪表板路由
		dashboard := api.Group("/dashboard", middleware.AuthMiddleware())
		{
			dashboard.GET("", GetDashboard)
		}
	}

	// Health check
	r.GET("/api/health", HealthCheck)
}

// HealthCheck 健康检查
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "cmdb-backend-go",
	})
}
