package routes

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/schemas"
)

// ListCI 获取配置项列表
func ListCI(c *gin.Context) {
	page := 1
	pageSize := 20
	if p := c.Query("page"); p != "" {
		page, _ = strconv.Atoi(p)
	}
	if ps := c.Query("pageSize"); ps != "" {
		pageSize, _ = strconv.Atoi(ps)
	}

	typeFilter := c.Query("type")
	status := c.Query("status")
	keyword := c.Query("keyword")
	project := c.Query("project")
	environment := c.Query("environment")

	db := database.GetDB()
	var total int64

	query := db.Model(&models.CI{})

	// 应用筛选条件
	if typeFilter != "" {
		query = query.Where("type = ?", typeFilter)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if keyword != "" {
		query = query.Where("name LIKE ?", "%"+keyword+"%")
	}
	if project != "" {
		query = query.Where("project = ?", project)
	}
	if environment != "" {
		query = query.Where("environment = ?", environment)
	}

	query.Count(&total)

	// 分页和排序
	var cis []models.CI
	query.Offset((page - 1) * pageSize).Limit(pageSize).Order("created_at DESC").Find(&cis)

	// 转换为响应格式
	ciList := make([]gin.H, len(cis))
	for i, ci := range cis {
		tags := []string{}
		if ci.Tags != nil && *ci.Tags != "" {
			json.Unmarshal([]byte(*ci.Tags), &tags)
		}

		ciList[i] = gin.H{
			"id":          ci.ID,
			"name":        ci.Name,
			"type":        ci.Type,
			"status":      ci.Status,
			"ip":          ci.IP,
			"cpu":         ci.CPU,
			"memory":      ci.Memory,
			"disk":        ci.Disk,
			"os":          ci.OS,
			"project":     ci.Project,
			"environment": ci.Environment,
			"tags":        tags,
			"createdAt":   ci.CreatedAt.Format("2006-01-02 15:04:05"),
			"updatedAt":   ci.UpdatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"items": ciList,
			"total": total,
		},
	})
}

// CreateCI 创建配置项
func CreateCI(c *gin.Context) {
	var req schemas.CICreate
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[WARN] CreateCI invalid request: %v", err)
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: fmt.Sprintf("请求参数错误: %v", err),
		})
		return
	}

	// 获取当前用户 - 安全的类型断言
	userID, exists := c.Get("user_id")
	if !exists || userID == nil {
		log.Printf("[ERROR] CreateCI missing user_id in context")
		c.JSON(http.StatusUnauthorized, schemas.BaseResponse{
			Success: false,
			Message: "未认证",
		})
		return
	}
	userIDStr, ok := userID.(string)
	if !ok {
		log.Printf("[ERROR] CreateCI invalid user_id type")
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "内部错误",
		})
		return
	}

	username, exists := c.Get("username")
	if !exists || username == nil {
		log.Printf("[ERROR] CreateCI missing username in context")
		c.JSON(http.StatusUnauthorized, schemas.BaseResponse{
			Success: false,
			Message: "未认证",
		})
		return
	}
	usernameStr, ok := username.(string)
	if !ok {
		log.Printf("[ERROR] CreateCI invalid username type")
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "内部错误",
		})
		return
	}

	db := database.GetDB()

	// 处理 Tags
	var tagsStr *string
	if len(req.Tags) > 0 {
		tagsJSON, _ := json.Marshal(req.Tags)
		s := string(tagsJSON)
		tagsStr = &s
	}

	ci := models.CI{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Type:        req.Type,
		Status:      "active",
		IP:          req.IP,
		CPU:         req.CPU,
		Memory:      req.Memory,
		Disk:        req.Disk,
		OS:          req.OS,
		Project:     req.Project,
		Environment: req.Environment,
		Tags:        tagsStr,
		Description: req.Description,
	}

	// 创建事务
	tx := db.Begin()
	if err := tx.Create(&ci).Error; err != nil {
		tx.Rollback()
		log.Printf("[ERROR] CreateCI database error: %v, data: %+v", err, req)
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: fmt.Sprintf("创建配置项失败: %v", err),
		})
		return
	}

	// 记录审计日志
	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userIDStr,
		Username:     usernameStr,
		Action:       "create",
		ResourceType: "ci",
		ResourceID:   ci.ID,
		ResourceName: ci.Name,
		NewValue:     toJSON(req),
	}
	if err := tx.Create(&audit).Error; err != nil {
		tx.Rollback()
		log.Printf("[ERROR] CreateCI audit log error: %v", err)
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: fmt.Sprintf("创建审计日志失败: %v", err),
		})
		return
	}
	tx.Commit()

	log.Printf("[INFO] CreateCI success: id=%s, name=%s, user=%s", ci.ID, ci.Name, usernameStr)

	c.JSON(http.StatusCreated, schemas.BaseResponse{
		Success: true,
		Message: "配置项创建成功",
		Data:    gin.H{"id": ci.ID},
	})
}

// GetCI 获取配置项详情
func GetCI(c *gin.Context) {
	ciID := c.Param("id")

	db := database.GetDB()
	var ci models.CI
	if err := db.First(&ci, "id = ?", ciID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "配置项不存在",
		})
		return
	}

	tags := []string{}
	if ci.Tags != nil && *ci.Tags != "" {
		json.Unmarshal([]byte(*ci.Tags), &tags)
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"id":          ci.ID,
			"name":        ci.Name,
			"type":        ci.Type,
			"status":      ci.Status,
			"ip":          ci.IP,
			"cpu":         ci.CPU,
			"memory":      ci.Memory,
			"disk":        ci.Disk,
			"os":          ci.OS,
			"project":     ci.Project,
			"environment": ci.Environment,
			"tags":        tags,
			"description": ci.Description,
			"createdAt":   ci.CreatedAt.Format("2006-01-02 15:04:05"),
			"updatedAt":   ci.UpdatedAt.Format("2006-01-02 15:04:05"),
		},
	})
}

// UpdateCI 更新配置项
func UpdateCI(c *gin.Context) {
	ciID := c.Param("id")

	var req schemas.CIUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[WARN] UpdateCI invalid request: %v", err)
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: fmt.Sprintf("请求参数错误: %v", err),
		})
		return
	}

	// 获取当前用户 - 安全断言
	userID, username, ok := getUserFromContext(c)
	if !ok {
		return
	}

	db := database.GetDB()
	var ci models.CI
	if err := db.First(&ci, "id = ?", ciID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "配置项不存在",
		})
		return
	}

	// 保存旧值用于审计
	oldValue := gin.H{
		"name":        ci.Name,
		"type":        ci.Type,
		"status":      ci.Status,
		"ip":          ci.IP,
		"cpu":         ci.CPU,
		"memory":      ci.Memory,
		"disk":        ci.Disk,
		"os":          ci.OS,
		"project":     ci.Project,
		"environment": ci.Environment,
	}

	// 更新字段
	if req.Name != nil {
		ci.Name = *req.Name
	}
	if req.Type != nil {
		ci.Type = *req.Type
	}
	if req.Status != nil {
		ci.Status = *req.Status
	}
	if req.IP != nil {
		ci.IP = req.IP
	}
	if req.CPU != nil {
		ci.CPU = req.CPU
	}
	if req.Memory != nil {
		ci.Memory = req.Memory
	}
	if req.Disk != nil {
		ci.Disk = req.Disk
	}
	if req.OS != nil {
		ci.OS = req.OS
	}
	if req.Project != nil {
		ci.Project = req.Project
	}
	if req.Environment != nil {
		ci.Environment = req.Environment
	}
	if req.Tags != nil {
		tagsJSON, _ := json.Marshal(req.Tags)
		s := string(tagsJSON)
		ci.Tags = &s
	}
	if req.Description != nil {
		ci.Description = req.Description
	}

	// 事务处理
	tx := db.Begin()
	if err := tx.Save(&ci).Error; err != nil {
		tx.Rollback()
		log.Printf("[ERROR] UpdateCI database error: %v, ci_id=%s", err, ciID)
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: fmt.Sprintf("更新配置项失败: %v", err),
		})
		return
	}

	// 记录审计日志
	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID,
		Username:     username,
		Action:       "update",
		ResourceType: "ci",
		ResourceID:   ci.ID,
		ResourceName: ci.Name,
		OldValue:     toJSON(oldValue),
		NewValue:     toJSON(req),
	}
	if err := tx.Create(&audit).Error; err != nil {
		tx.Rollback()
		log.Printf("[ERROR] UpdateCI audit log error: %v", err)
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: fmt.Sprintf("创建审计日志失败: %v", err),
		})
		return
	}
	tx.Commit()

	log.Printf("[INFO] UpdateCI success: id=%s, user=%s", ci.ID, username)

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "配置项更新成功",
	})
}

// DeleteCI 删除配置项
func DeleteCI(c *gin.Context) {
	ciID := c.Param("id")

	// 获取当前用户 - 安全断言
	userID, username, ok := getUserFromContext(c)
	if !ok {
		return
	}

	db := database.GetDB()
	var ci models.CI
	if err := db.First(&ci, "id = ?", ciID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "配置项不存在",
		})
		return
	}

	// 事务处理
	tx := db.Begin()

	// 记录审计日志
	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID,
		Username:     username,
		Action:       "delete",
		ResourceType: "ci",
		ResourceID:   ci.ID,
		ResourceName: ci.Name,
	}
	if err := tx.Create(&audit).Error; err != nil {
		tx.Rollback()
		log.Printf("[ERROR] DeleteCI audit log error: %v", err)
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: fmt.Sprintf("创建审计日志失败: %v", err),
		})
		return
	}

	// 删除配置项
	if err := tx.Delete(&ci).Error; err != nil {
		tx.Rollback()
		log.Printf("[ERROR] DeleteCI database error: %v, ci_id=%s", err, ciID)
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: fmt.Sprintf("删除配置项失败: %v", err),
		})
		return
	}

	tx.Commit()

	log.Printf("[INFO] DeleteCI success: id=%s, name=%s, user=%s", ci.ID, ci.Name, username)

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "配置项删除成功",
	})
}

// toJSON 辅助函数：将对象转换为 JSON 字符串
func toJSON(v interface{}) *string {
	data, _ := json.Marshal(v)
	s := string(data)
	return &s
}
