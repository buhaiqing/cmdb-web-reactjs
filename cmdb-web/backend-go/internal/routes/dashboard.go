package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/schemas"
)

// GetDashboard 获取仪表板数据
func GetDashboard(c *gin.Context) {
	db := database.GetDB()

	// 统计 CI 数量
	var ciTotal int64
	db.Model(&models.CI{}).Count(&ciTotal)

	// 统计关系数量
	var relationTotal int64
	db.Model(&models.Relation{}).Count(&relationTotal)

	// 统计变更数量
	var changeTotal int64
	db.Model(&models.ChangeRequest{}).Count(&changeTotal)

	// 统计用户数量
	var userTotal int64
	db.Model(&models.User{}).Count(&userTotal)

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"ciCount":       ciTotal,
			"relationCount": relationTotal,
			"changeCount":   changeTotal,
			"userCount":     userTotal,
		},
	})
}

// GetDashboardStats 获取仪表板统计数据（前端期望的端点）
func GetDashboardStats(c *gin.Context) {
	db := database.GetDB()

	// 按类型统计 CI
	var serverCount, databaseCount, middlewareCount, containerCount int64
	db.Model(&models.CI{}).Where("type = ?", "server").Count(&serverCount)
	db.Model(&models.CI{}).Where("type = ?", "database").Count(&databaseCount)
	db.Model(&models.CI{}).Where("type = ?", "middleware").Count(&middlewareCount)
	db.Model(&models.CI{}).Where("type = ?", "container").Count(&containerCount)

	// 待审批的变更数量
	var changePending int64
	db.Model(&models.ChangeRequest{}).Where("status = ?", "pending").Count(&changePending)

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"server":        serverCount,
			"database":      databaseCount,
			"middleware":    middlewareCount,
			"container":     containerCount,
			"changePending": changePending,
		},
	})
}
