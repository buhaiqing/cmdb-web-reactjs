package routes

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/schemas"
)

// ListChanges 获取变更列表
func ListChanges(c *gin.Context) {
	page := 1
	pageSize := 20
	if p := c.Query("page"); p != "" {
		page, _ = strconv.Atoi(p)
	}
	if ps := c.Query("pageSize"); ps != "" {
		pageSize, _ = strconv.Atoi(ps)
	}

	status := c.Query("status")
	changeType := c.Query("type")
	priority := c.Query("priority")

	db := database.GetDB()
	var total int64

	query := db.Model(&models.ChangeRequest{})

	// 应用筛选条件
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if changeType != "" {
		query = query.Where("type = ?", changeType)
	}
	if priority != "" {
		query = query.Where("priority = ?", priority)
	}

	query.Count(&total)

	// 分页和排序
	var changes []models.ChangeRequest
	query.Offset((page - 1) * pageSize).Limit(pageSize).Order("created_at DESC").Find(&changes)

	// 转换为响应格式
	changeList := make([]gin.H, len(changes))
	for i, ch := range changes {
		changeList[i] = gin.H{
			"id":           ch.ID,
			"title":        ch.Title,
			"description":  ch.Description,
			"ci_id":        ch.CIID,
			"reason":       ch.Reason,
			"plan":         ch.Plan,
			"status":       ch.Status,
			"priority":     ch.Priority,
			"requester_id": ch.RequesterID,
			"approver_id":  ch.ApproverID,
			"createdAt":    ch.CreatedAt.Format("2006-01-02 15:04:05"),
			"updatedAt":    ch.UpdatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"items": changeList,
			"total": total,
		},
	})
}

// CreateChange 创建变更
func CreateChange(c *gin.Context) {
	var req struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		CIID        string `json:"ci_id" binding:"required"`
		Reason      string `json:"reason" binding:"required"`
		Plan        string `json:"plan" binding:"required"`
		Priority    string `json:"priority"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "请求参数错误",
		})
		return
	}

	// 获取当前用户
	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	db := database.GetDB()

	change := models.ChangeRequest{
		ID:          uuid.New().String(),
		Title:       req.Title,
		Description: req.Description,
		CIID:        req.CIID,
		Reason:      req.Reason,
		Plan:        req.Plan,
		Status:      "pending",
		Priority:    req.Priority,
		RequesterID: userID.(string),
	}

	tx := db.Begin()
	if err := tx.Create(&change).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "创建变更失败",
		})
		return
	}

	// 记录审计日志
	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID.(string),
		Username:     username.(string),
		Action:       "create",
		ResourceType: "change",
		ResourceID:   change.ID,
		ResourceName: change.Title,
		NewValue:     toJSON(req),
	}
	tx.Create(&audit)
	tx.Commit()

	c.JSON(http.StatusCreated, schemas.BaseResponse{
		Success: true,
		Message: "变更创建成功",
		Data:    gin.H{"id": change.ID},
	})
}

// GetChange 获取变更详情
func GetChange(c *gin.Context) {
	changeID := c.Param("id")

	db := database.GetDB()
	var change models.ChangeRequest
	if err := db.Preload("CI").First(&change, "id = ?", changeID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "变更不存在",
		})
		return
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"id":           change.ID,
			"title":        change.Title,
			"description":  change.Description,
			"ci_id":        change.CIID,
			"reason":       change.Reason,
			"plan":         change.Plan,
			"status":       change.Status,
			"priority":     change.Priority,
			"requester_id": change.RequesterID,
			"approver_id":  change.ApproverID,
			"createdAt":    change.CreatedAt.Format("2006-01-02 15:04:05"),
			"updatedAt":    change.UpdatedAt.Format("2006-01-02 15:04:05"),
		},
	})
}

// UpdateChange 更新变更
func UpdateChange(c *gin.Context) {
	changeID := c.Param("id")

	var req struct {
		Title    *string `json:"title"`
		Desc     *string `json:"description"`
		Reason   *string `json:"reason"`
		Plan     *string `json:"plan"`
		Status   *string `json:"status"`
		Priority *string `json:"priority"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "请求参数错误",
		})
		return
	}

	// 获取当前用户
	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	db := database.GetDB()
	var change models.ChangeRequest
	if err := db.First(&change, "id = ?", changeID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "变更不存在",
		})
		return
	}

	// 保存旧值
	oldValue := gin.H{
		"title":  change.Title,
		"reason": change.Reason,
		"plan":   change.Plan,
		"status": change.Status,
	}

	// 更新字段
	if req.Title != nil {
		change.Title = *req.Title
	}
	if req.Desc != nil {
		change.Description = *req.Desc
	}
	if req.Reason != nil {
		change.Reason = *req.Reason
	}
	if req.Plan != nil {
		change.Plan = *req.Plan
	}
	if req.Status != nil {
		change.Status = *req.Status
	}
	if req.Priority != nil {
		change.Priority = *req.Priority
	}

	tx := db.Begin()
	if err := tx.Save(&change).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "更新变更失败",
		})
		return
	}

	// 记录审计日志
	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID.(string),
		Username:     username.(string),
		Action:       "update",
		ResourceType: "change",
		ResourceID:   change.ID,
		ResourceName: change.Title,
		OldValue:     toJSON(oldValue),
		NewValue:     toJSON(req),
	}
	tx.Create(&audit)
	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "变更更新成功",
	})
}

// DeleteChange 删除变更
func DeleteChange(c *gin.Context) {
	changeID := c.Param("id")

	// 获取当前用户
	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	db := database.GetDB()
	var change models.ChangeRequest
	if err := db.First(&change, "id = ?", changeID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "变更不存在",
		})
		return
	}

	tx := db.Begin()

	// 记录审计日志
	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID.(string),
		Username:     username.(string),
		Action:       "delete",
		ResourceType: "change",
		ResourceID:   change.ID,
		ResourceName: change.Title,
	}
	tx.Create(&audit)

	if err := tx.Delete(&change).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "删除变更失败",
		})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "变更删除成功",
	})
}

// GetRecentChanges 获取最近的变更列表（前端期望的端点）
func GetRecentChanges(c *gin.Context) {
	db := database.GetDB()

	// 获取最近的5条变更记录
	var changes []models.ChangeRequest
	db.Preload("CI").Order("created_at DESC").Limit(5).Find(&changes)

	// 转换为响应格式
	changeList := make([]gin.H, len(changes))
	for i, ch := range changes {
		ciName := ""
		if ch.CI.ID != "" {
			ciName = ch.CI.Name
		}

		changeList[i] = gin.H{
			"id":         ch.ID,
			"ciName":     ciName,
			"changeType": ch.Reason,
			"operator":   ch.RequesterID,
			"createdAt":  ch.CreatedAt.Format("2006-01-02 15:04:05"),
			"status":     ch.Status,
		}
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data:    changeList,
	})
}

// ApproveChange 批准变更（前端期望的端点）
func ApproveChange(c *gin.Context) {
	changeID := c.Param("id")

	// 获取当前用户
	userID, username, ok := getUserFromContext(c)
	if !ok {
		return
	}

	db := database.GetDB()
	var change models.ChangeRequest
	if err := db.First(&change, "id = ?", changeID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "变更不存在",
		})
		return
	}

	// 更新状态为已批准
	change.Status = "approved"
	change.ApproverID = &userID

	tx := db.Begin()
	if err := tx.Save(&change).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "批准变更失败",
		})
		return
	}

	// 记录审计日志
	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID,
		Username:     username,
		Action:       "approve",
		ResourceType: "change",
		ResourceID:   change.ID,
		ResourceName: change.Title,
	}
	tx.Create(&audit)
	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "变更已批准",
	})
}

// RejectChange 拒绝变更（前端期望的端点）
func RejectChange(c *gin.Context) {
	changeID := c.Param("id")

	// 获取当前用户
	userID, username, ok := getUserFromContext(c)
	if !ok {
		return
	}

	db := database.GetDB()
	var change models.ChangeRequest
	if err := db.First(&change, "id = ?", changeID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "变更不存在",
		})
		return
	}

	// 更新状态为已拒绝
	change.Status = "rejected"
	change.ApproverID = &userID

	tx := db.Begin()
	if err := tx.Save(&change).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "拒绝变更失败",
		})
		return
	}

	// 记录审计日志
	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID,
		Username:     username,
		Action:       "reject",
		ResourceType: "change",
		ResourceID:   change.ID,
		ResourceName: change.Title,
	}
	tx.Create(&audit)
	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "变更已拒绝",
	})
}
