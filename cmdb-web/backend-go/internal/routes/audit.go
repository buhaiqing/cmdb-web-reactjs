package routes

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/schemas"
)

// ListAuditLogs 获取审计日志列表
func ListAuditLogs(c *gin.Context) {
	page := 1
	pageSize := 20
	if p := c.Query("page"); p != "" {
		page, _ = strconv.Atoi(p)
	}
	if ps := c.Query("pageSize"); ps != "" {
		pageSize, _ = strconv.Atoi(ps)
	}
	if ps := c.Query("page_size"); ps != "" {
		pageSize, _ = strconv.Atoi(ps)
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	keyword := c.Query("keyword")
	action := c.Query("action")
	status := c.Query("status")
	startTime := c.Query("start_time")
	endTime := c.Query("end_time")

	db := database.GetDB()
	var total int64

	query := db.Model(&models.AuditLog{})
	if keyword != "" {
		query = query.Where("username LIKE ? OR resource_name LIKE ? OR resource_id LIKE ?", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}
	if action != "" {
		query = query.Where("action = ?", action)
	}
	if status == "failed" {
		// 当前表结构没有独立状态字段，约定通过 action=failed 兼容筛选能力
		query = query.Where("action = ?", "failed")
	}
	if status == "success" {
		query = query.Where("action <> ?", "failed")
	}
	if startTime != "" {
		if t, err := time.Parse("2006-01-02 15:04:05", startTime); err == nil {
			query = query.Where("created_at >= ?", t)
		}
	}
	if endTime != "" {
		if t, err := time.Parse("2006-01-02 15:04:05", endTime); err == nil {
			query = query.Where("created_at <= ?", t)
		}
	}
	query.Count(&total)

	var logs []models.AuditLog
	query.Offset((page-1)*pageSize).Limit(pageSize).Order("created_at DESC").Find(&logs)

	auditList := make([]gin.H, len(logs))
	for i, l := range logs {
		auditList[i] = gin.H{
			"id":            l.ID,
			"user_id":       l.UserID,
			"username":      l.Username,
			"action":        l.Action,
			"resource_type": l.ResourceType,
			"resource_id":   l.ResourceID,
			"resource_name": l.ResourceName,
			"old_value":     l.OldValue,
			"new_value":     l.NewValue,
			"ip":            nil,
			"user_agent":    nil,
			"status":        "success",
			"details":       nil,
			"created_at":    l.CreatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"items":     auditList,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}
