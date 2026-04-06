package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/schemas"
)

// ListAuditLogs 获取审计日志列表
func ListAuditLogs(c *gin.Context) {
	page := 1
	pageSize := 20

	db := database.GetDB()
	var total int64

	query := db.Model(&models.AuditLog{})
	query.Count(&total)

	var logs []models.AuditLog
	query.Offset((page - 1) * pageSize).Limit(pageSize).Order("created_at DESC").Find(&logs)

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"items": logs,
			"total": total,
		},
	})
}
