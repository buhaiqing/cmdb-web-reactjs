package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/schemas"
)

// ListRelations 获取关系列表
func ListRelations(c *gin.Context) {
	ciID := c.Query("ci_id")
	relationType := c.Query("relation_type")

	db := database.GetDB()
	query := db.Model(&models.Relation{})

	if ciID != "" {
		query = query.Where("source_ci_id = ? OR target_ci_id = ?", ciID, ciID)
	}
	if relationType != "" {
		query = query.Where("relation_type = ?", relationType)
	}

	var relations []models.Relation
	query.Order("created_at DESC").Find(&relations)

	relationList := make([]gin.H, len(relations))
	for i, r := range relations {
		relationList[i] = gin.H{
			"id":           r.ID,
			"sourceCI":     r.SourceCIID,
			"targetCI":     r.TargetCIID,
			"relationType": r.RelationType,
			"description":  r.Description,
			"createdAt":    r.CreatedAt.Format("2006-01-02 15:04:05"),
			"updatedAt":    r.UpdatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data:    relationList,
	})
}

// CreateRelation 创建关系
func CreateRelation(c *gin.Context) {
	var req schemas.RelationCreate
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

	// 检查源 CI 是否存在
	var sourceCI models.CI
	if err := db.First(&sourceCI, "id = ?", req.SourceCIID).Error; err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "源配置项不存在",
		})
		return
	}

	// 检查目标 CI 是否存在
	var targetCI models.CI
	if err := db.First(&targetCI, "id = ?", req.TargetCIID).Error; err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "目标配置项不存在",
		})
		return
	}

	relation := models.Relation{
		ID:           uuid.New().String(),
		SourceCIID:   req.SourceCIID,
		TargetCIID:   req.TargetCIID,
		RelationType: req.RelationType,
		Description:  req.Description,
	}

	tx := db.Begin()
	if err := tx.Create(&relation).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "创建关系失败",
		})
		return
	}

	// 记录审计日志
	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID.(string),
		Username:     username.(string),
		Action:       "create",
		ResourceType: "relation",
		ResourceID:   relation.ID,
		ResourceName: relation.RelationType,
		NewValue:     toJSON(req),
	}
	tx.Create(&audit)
	tx.Commit()

	c.JSON(http.StatusCreated, schemas.BaseResponse{
		Success: true,
		Message: "关系创建成功",
		Data:    gin.H{"id": relation.ID},
	})
}

// GetRelation 获取关系详情
func GetRelation(c *gin.Context) {
	relationID := c.Param("id")

	db := database.GetDB()
	var relation models.Relation
	if err := db.First(&relation, "id = ?", relationID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "关系不存在",
		})
		return
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"id":           relation.ID,
			"sourceCI":     relation.SourceCIID,
			"targetCI":     relation.TargetCIID,
			"relationType": relation.RelationType,
			"description":  relation.Description,
			"createdAt":    relation.CreatedAt.Format("2006-01-02 15:04:05"),
			"updatedAt":    relation.UpdatedAt.Format("2006-01-02 15:04:05"),
		},
	})
}

// UpdateRelation 更新关系
func UpdateRelation(c *gin.Context) {
	relationID := c.Param("id")

	var req schemas.RelationUpdate
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
	var relation models.Relation
	if err := db.First(&relation, "id = ?", relationID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "关系不存在",
		})
		return
	}

	// 保存旧值
	oldValue := gin.H{
		"sourceCI":     relation.SourceCIID,
		"targetCI":     relation.TargetCIID,
		"relationType": relation.RelationType,
		"description":  relation.Description,
	}

	// 更新字段
	if req.RelationType != nil {
		relation.RelationType = *req.RelationType
	}
	if req.Description != nil {
		relation.Description = req.Description
	}

	tx := db.Begin()
	if err := tx.Save(&relation).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "更新关系失败",
		})
		return
	}

	// 记录审计日志
	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID.(string),
		Username:     username.(string),
		Action:       "update",
		ResourceType: "relation",
		ResourceID:   relation.ID,
		ResourceName: relation.RelationType,
		OldValue:     toJSON(oldValue),
		NewValue:     toJSON(req),
	}
	tx.Create(&audit)
	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "关系更新成功",
	})
}

// DeleteRelation 删除关系
func DeleteRelation(c *gin.Context) {
	relationID := c.Param("id")

	// 获取当前用户
	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	db := database.GetDB()
	var relation models.Relation
	if err := db.First(&relation, "id = ?", relationID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "关系不存在",
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
		ResourceType: "relation",
		ResourceID:   relation.ID,
		ResourceName: relation.RelationType,
	}
	tx.Create(&audit)

	if err := tx.Delete(&relation).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "删除关系失败",
		})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "关系删除成功",
	})
}
