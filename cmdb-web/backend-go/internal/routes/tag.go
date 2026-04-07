package routes

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/schemas"
)

func ListTags(c *gin.Context) {
	db := database.GetDB()

	var tags []models.Tag
	db.Order("created_at DESC").Find(&tags)

	tagList := make([]gin.H, len(tags))
	for i, t := range tags {
		tagList[i] = gin.H{
			"id":          t.ID,
			"name":        t.Name,
			"color":       t.Color,
			"description": t.Description,
			"created_by":  t.CreatedBy,
			"created_at":  t.CreatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data:    tagList,
	})
}

func CreateTag(c *gin.Context) {
	var req struct {
		Name        string  `json:"name" binding:"required"`
		Color       string  `json:"color"`
		Description *string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "请求参数错误",
		})
		return
	}

	if req.Color == "" {
		req.Color = "blue"
	}

	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	db := database.GetDB()

	var existing models.Tag
	if err := db.Where("name = ?", req.Name).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "标签名称已存在",
		})
		return
	}

	tag := models.Tag{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Color:       req.Color,
		Description: req.Description,
		CreatedBy:   username.(string),
	}

	tx := db.Begin()
	if err := tx.Create(&tag).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "创建标签失败",
		})
		return
	}

	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID.(string),
		Username:     username.(string),
		Action:       "create",
		ResourceType: "tag",
		ResourceID:   tag.ID,
		ResourceName: tag.Name,
		NewValue:     toJSON(tag),
	}
	tx.Create(&audit)
	tx.Commit()

	c.JSON(http.StatusCreated, schemas.BaseResponse{
		Success: true,
		Message: "标签创建成功",
		Data:    gin.H{"id": tag.ID},
	})
}

func GetTag(c *gin.Context) {
	tagID := c.Param("id")

	db := database.GetDB()
	var tag models.Tag
	if err := db.First(&tag, "id = ?", tagID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "标签不存在",
		})
		return
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"id":          tag.ID,
			"name":        tag.Name,
			"color":       tag.Color,
			"description": tag.Description,
			"created_by":  tag.CreatedBy,
		},
	})
}

func UpdateTag(c *gin.Context) {
	tagID := c.Param("id")

	var req struct {
		Name        *string `json:"name"`
		Color       *string `json:"color"`
		Description *string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "请求参数错误",
		})
		return
	}

	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	db := database.GetDB()
	var tag models.Tag
	if err := db.First(&tag, "id = ?", tagID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "标签不存在",
		})
		return
	}

	oldValue := toJSON(tag)

	if req.Name != nil {
		tag.Name = *req.Name
	}
	if req.Color != nil {
		tag.Color = *req.Color
	}
	if req.Description != nil {
		tag.Description = req.Description
	}

	tx := db.Begin()
	if err := tx.Save(&tag).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "更新标签失败",
		})
		return
	}

	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID.(string),
		Username:     username.(string),
		Action:       "update",
		ResourceType: "tag",
		ResourceID:   tag.ID,
		ResourceName: tag.Name,
		OldValue:     oldValue,
		NewValue:     toJSON(tag),
	}
	tx.Create(&audit)
	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "标签更新成功",
	})
}

func DeleteTag(c *gin.Context) {
	tagID := c.Param("id")

	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	db := database.GetDB()
	var tag models.Tag
	if err := db.First(&tag, "id = ?", tagID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "标签不存在",
		})
		return
	}

	tx := db.Begin()

	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID.(string),
		Username:     username.(string),
		Action:       "delete",
		ResourceType: "tag",
		ResourceID:   tag.ID,
		ResourceName: tag.Name,
	}
	tx.Create(&audit)

	if err := tx.Delete(&tag).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "删除标签失败",
		})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "标签删除成功",
	})
}

func GetCIsByTag(c *gin.Context) {
	tagID := c.Param("id")
	tagName := c.Query("name")

	db := database.GetDB()

	var tag models.Tag
	if tagID != "" {
		if err := db.First(&tag, "id = ?", tagID).Error; err != nil {
			c.JSON(http.StatusNotFound, schemas.BaseResponse{
				Success: false,
				Message: "标签不存在",
			})
			return
		}
		tagName = tag.Name
	} else if tagName != "" {
		if err := db.First(&tag, "name = ?", tagName).Error; err != nil {
			c.JSON(http.StatusNotFound, schemas.BaseResponse{
				Success: false,
				Message: "标签不存在",
			})
			return
		}
	} else {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "需要提供标签ID或名称",
		})
		return
	}

	var cis []models.CI
	db.Where("tags LIKE ?", "%"+tagName+"%").Find(&cis)

	ciList := make([]gin.H, len(cis))
	for i, ci := range cis {
		ciList[i] = gin.H{
			"id":   ci.ID,
			"name": ci.Name,
			"type": ci.Type,
		}
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data:    ciList,
	})
}

func SearchCIsByTags(c *gin.Context) {
	tagsParam := c.Query("tags")

	if tagsParam == "" {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "需要提供标签列表",
		})
		return
	}

	tags := strings.Split(tagsParam, ",")
	db := database.GetDB()

	var cis []models.CI
	query := db

	for _, tag := range tags {
		tag = strings.TrimSpace(tag)
		if tag != "" {
			query = query.Or("tags LIKE ?", "%"+tag+"%")
		}
	}

	query.Find(&cis)

	ciList := make([]gin.H, len(cis))
	for i, ci := range cis {
		ciList[i] = gin.H{
			"id":   ci.ID,
			"name": ci.Name,
			"type": ci.Type,
			"tags": ci.Tags,
		}
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data:    ciList,
	})
}
