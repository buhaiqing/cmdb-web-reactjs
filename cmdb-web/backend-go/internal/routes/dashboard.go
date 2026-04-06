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
