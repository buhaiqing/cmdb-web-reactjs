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

		// 权限路由
		p := api.Group("/permissions", middleware.AuthMiddleware())
		{
			p.GET("", ListPermissions)
			p.GET("/roles/:roleId", GetRolePermissions)
			p.PUT("/roles/:roleId", UpdateRolePermissions)
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
			ci.POST("/batch/delete", BatchDeleteCI)
			ci.POST("/batch/update", BatchUpdateCI)
		}

		// CI类型管理路由
		ciTypes := api.Group("/ci-types", middleware.AuthMiddleware())
		{
			ciTypes.GET("", ListCITypes)
			ciTypes.POST("", CreateCIType)
			ciTypes.GET("/:id", GetCIType)
			ciTypes.PUT("/:id", UpdateCIType)
			ciTypes.DELETE("/:id", DeleteCIType)
		}

		// 标签管理路由
		tags := api.Group("/tags", middleware.AuthMiddleware())
		{
			tags.GET("", ListTags)
			tags.POST("", CreateTag)
			tags.GET("/:id", GetTag)
			tags.PUT("/:id", UpdateTag)
			tags.DELETE("/:id", DeleteTag)
			tags.GET("/:id/ci", GetCIsByTag)
		}

		// 版本历史路由
		versions := api.Group("/versions", middleware.AuthMiddleware())
		{
			versions.GET("/ci/:ciId", GetCIVersions)
			versions.GET("/ci/:ciId/:version", GetCIVersionDetail)
			versions.POST("/ci/:ciId/rollback/:version", RollbackCIVersion)
		}

		// 关系路由
		relations := api.Group("/relations", middleware.AuthMiddleware())
		{
			relations.GET("", ListRelations)
			relations.POST("", CreateRelation)
			relations.GET("/graph", GetRelationGraph)       // 必须在 :id 之前
			relations.GET("/impact/:ciId", AnalyzeImpact)   // 必须在 :id 之前
			relations.GET("/:id", GetRelation)
			relations.PUT("/:id", UpdateRelation)
			relations.DELETE("/:id", DeleteRelation)
		}

		// 仪表板路由
		dashboard := api.Group("/dashboard", middleware.AuthMiddleware())
		{
			dashboard.GET("", GetDashboard)
			dashboard.GET("/stats", GetDashboardStats)
			dashboard.GET("/trend", GetResourceTrend)
			dashboard.GET("/summary", GetDashboardSummary)
		}

		// 变更路由
		changes := api.Group("/changes", middleware.AuthMiddleware())
		{
			changes.GET("", ListChanges)
			changes.POST("", CreateChange)
			changes.GET("/recent", GetRecentChanges)    // 必须在 :id 之前
			changes.POST("/:id/approve", ApproveChange) // 必须在 :id 之前
			changes.POST("/:id/reject", RejectChange)   // 必须在 :id 之前
			changes.GET("/:id", GetChange)
			changes.PUT("/:id", UpdateChange)
			changes.DELETE("/:id", DeleteChange)
			changes.POST("/batch/approve", BatchApproveChanges)
			changes.POST("/batch/reject", BatchRejectChanges)
		}

		// 审计路由
		audit := api.Group("/audit", middleware.AuthMiddleware())
		{
			audit.GET("", ListAuditLogs)
		}

		// 通知路由
		notifications := api.Group("/notifications", middleware.AuthMiddleware())
		{
			notifications.GET("", ListNotifications)
			notifications.GET("/unread-count", GetUnreadCount)
			notifications.POST("/:id/read", MarkAsRead)
			notifications.POST("/read-all", MarkAllAsRead)
			notifications.DELETE("/:id", DeleteNotification)
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
