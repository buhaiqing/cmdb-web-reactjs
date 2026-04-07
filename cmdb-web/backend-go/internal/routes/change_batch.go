package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/schemas"
)

func BatchApproveChanges(c *gin.Context) {
	var req struct {
		IDs []string `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "请求参数错误，需要提供IDs数组",
		})
		return
	}

	if len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "IDs数组不能为空",
		})
		return
	}

	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	db := database.GetDB()
	tx := db.Begin()

	var approvedCount int64
	for _, id := range req.IDs {
		var change models.ChangeRequest
		if err := tx.First(&change, "id = ?", id).Error; err != nil {
			continue
		}

		if change.Status != "pending" {
			continue
		}

		change.Status = "approved"
		uid := userID.(string)
		change.ApproverID = &uid

		tx.Save(&change)

		audit := models.AuditLog{
			ID:           uuid.New().String(),
			UserID:       userID.(string),
			Username:     username.(string),
			Action:       "batch_approve",
			ResourceType: "change",
			ResourceID:   change.ID,
			ResourceName: change.Title,
			OldValue:     toJSON(map[string]string{"status": "pending"}),
			NewValue:     toJSON(map[string]string{"status": "approved"}),
		}
		tx.Create(&audit)

		notifyUser(uid, "change_approved",
			"变更已批准",
			"您的变更请求 ["+change.Title+"] 已批准",
			change.ID, "change")

		approvedCount++
	}

	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "批量批准成功",
		Data: gin.H{
			"approved_count": approvedCount,
		},
	})
}

func BatchRejectChanges(c *gin.Context) {
	var req struct {
		IDs    []string `json:"ids" binding:"required"`
		Reason string   `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "请求参数错误，需要提供IDs数组",
		})
		return
	}

	if len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "IDs数组不能为空",
		})
		return
	}

	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	db := database.GetDB()
	tx := db.Begin()

	var rejectedCount int64
	for _, id := range req.IDs {
		var change models.ChangeRequest
		if err := tx.First(&change, "id = ?", id).Error; err != nil {
			continue
		}

		if change.Status != "pending" {
			continue
		}

		change.Status = "rejected"
		uid := userID.(string)
		change.ApproverID = &uid

		tx.Save(&change)

		audit := models.AuditLog{
			ID:           uuid.New().String(),
			UserID:       userID.(string),
			Username:     username.(string),
			Action:       "batch_reject",
			ResourceType: "change",
			ResourceID:   change.ID,
			ResourceName: change.Title,
			OldValue:     toJSON(map[string]string{"status": "pending"}),
			NewValue:     toJSON(map[string]string{"status": "rejected"}),
		}
		tx.Create(&audit)

		notifyUser(uid, "change_rejected",
			"变更已拒绝",
			"您的变更请求 ["+change.Title+"] 已拒绝"+"。原因："+req.Reason,
			change.ID, "change")

		rejectedCount++
	}

	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "批量拒绝成功",
		Data: gin.H{
			"rejected_count": rejectedCount,
		},
	})
}

func notifyUser(userId string, notifType string, title string, content string, relatedId string, relatedType string) {
	db := database.GetDB()
	notification := models.Notification{
		ID:          uuid.New().String(),
		UserID:      userId,
		Type:        notifType,
		Title:       title,
		Content:     content,
		RelatedID:   &relatedId,
		RelatedType: &relatedType,
		IsRead:      false,
	}
	db.Create(&notification)
}
