package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/schemas"
)

func BatchDeleteCI(c *gin.Context) {
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

	var deletedCount int64
	for _, id := range req.IDs {
		var ci models.CI
		if err := tx.First(&ci, "id = ?", id).Error; err != nil {
			continue
		}

		audit := models.AuditLog{
			ID:           uuid.New().String(),
			UserID:       userID.(string),
			Username:     username.(string),
			Action:       "batch_delete",
			ResourceType: "ci",
			ResourceID:   ci.ID,
			ResourceName: ci.Name,
			OldValue:     toJSON(ci),
		}
		tx.Create(&audit)

		tx.Delete(&ci)
		deletedCount++
	}

	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "批量删除成功",
		Data: gin.H{
			"deleted_count": deletedCount,
		},
	})
}

func BatchUpdateCI(c *gin.Context) {
	var req struct {
		IDs    []string         `json:"ids" binding:"required"`
		Update schemas.CIUpdate `json:"update" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "请求参数错误",
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

	var updatedCount int64
	for _, id := range req.IDs {
		var ci models.CI
		if err := tx.First(&ci, "id = ?", id).Error; err != nil {
			continue
		}

		oldValue := toJSON(ci)

		if req.Update.Name != nil {
			ci.Name = *req.Update.Name
		}
		if req.Update.Type != nil {
			ci.Type = *req.Update.Type
		}
		if req.Update.Status != nil {
			ci.Status = *req.Update.Status
		}
		if req.Update.IP != nil {
			ci.IP = req.Update.IP
		}
		if req.Update.CPU != nil {
			ci.CPU = req.Update.CPU
		}
		if req.Update.Memory != nil {
			ci.Memory = req.Update.Memory
		}
		if req.Update.Disk != nil {
			ci.Disk = req.Update.Disk
		}
		if req.Update.OS != nil {
			ci.OS = req.Update.OS
		}
		if req.Update.Project != nil {
			ci.Project = req.Update.Project
		}
		if req.Update.Environment != nil {
			ci.Environment = req.Update.Environment
		}
		if req.Update.Tags != nil {
			tagsStr := joinStrings(req.Update.Tags, ",")
			ci.Tags = &tagsStr
		}
		if req.Update.Description != nil {
			ci.Description = req.Update.Description
		}

		tx.Save(&ci)

		audit := models.AuditLog{
			ID:           uuid.New().String(),
			UserID:       userID.(string),
			Username:     username.(string),
			Action:       "batch_update",
			ResourceType: "ci",
			ResourceID:   ci.ID,
			ResourceName: ci.Name,
			OldValue:     oldValue,
			NewValue:     toJSON(ci),
		}
		tx.Create(&audit)

		updatedCount++
	}

	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "批量更新成功",
		Data: gin.H{
			"updated_count": updatedCount,
		},
	})
}
