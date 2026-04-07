package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/schemas"
)

func ListCITypes(c *gin.Context) {
	db := database.GetDB()

	var ciTypes []models.CIType
	db.Order("sort_order ASC, created_at DESC").Find(&ciTypes)

	typeList := make([]gin.H, len(ciTypes))
	for i, t := range ciTypes {
		typeList[i] = gin.H{
			"id":          t.ID,
			"name":        t.Name,
			"code":        t.Code,
			"icon":        t.Icon,
			"description": t.Description,
			"attributes":  t.Attributes,
			"is_active":   t.IsActive,
			"sort_order":  t.SortOrder,
			"created_at":   t.CreatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data:    typeList,
	})
}

func CreateCIType(c *gin.Context) {
	var req struct {
		Name        string  `json:"name" binding:"required"`
		Code        string  `json:"code" binding:"required"`
		Icon        *string `json:"icon"`
		Description *string `json:"description"`
		Attributes  *string `json:"attributes"`
		SortOrder   int     `json:"sort_order"`
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

	var existing models.CIType
	if err := db.Where("code = ?", req.Code).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "类型代码已存在",
		})
		return
	}

	ciType := models.CIType{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Code:        req.Code,
		Icon:        req.Icon,
		Description: req.Description,
		Attributes:  req.Attributes,
		IsActive:    true,
		SortOrder:   req.SortOrder,
	}

	tx := db.Begin()
	if err := tx.Create(&ciType).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "创建类型失败",
		})
		return
	}

	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID.(string),
		Username:     username.(string),
		Action:       "create",
		ResourceType: "ci_type",
		ResourceID:   ciType.ID,
		ResourceName: ciType.Name,
		NewValue:     toJSON(ciType),
	}
	tx.Create(&audit)
	tx.Commit()

	c.JSON(http.StatusCreated, schemas.BaseResponse{
		Success: true,
		Message: "类型创建成功",
		Data:    gin.H{"id": ciType.ID},
	})
}

func GetCIType(c *gin.Context) {
	typeID := c.Param("id")

	db := database.GetDB()
	var ciType models.CIType
	if err := db.First(&ciType, "id = ?", typeID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "类型不存在",
		})
		return
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"id":          ciType.ID,
			"name":        ciType.Name,
			"code":        ciType.Code,
			"icon":        ciType.Icon,
			"description": ciType.Description,
			"attributes":  ciType.Attributes,
			"is_active":   ciType.IsActive,
			"sort_order":  ciType.SortOrder,
		},
	})
}

func UpdateCIType(c *gin.Context) {
	typeID := c.Param("id")

	var req struct {
		Name        *string `json:"name"`
		Code        *string `json:"code"`
		Icon        *string `json:"icon"`
		Description *string `json:"description"`
		Attributes  *string `json:"attributes"`
		IsActive    *bool   `json:"is_active"`
		SortOrder   *int    `json:"sort_order"`
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
	var ciType models.CIType
	if err := db.First(&ciType, "id = ?", typeID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "类型不存在",
		})
		return
	}

	oldValue := toJSON(ciType)

	if req.Name != nil {
		ciType.Name = *req.Name
	}
	if req.Code != nil {
		ciType.Code = *req.Code
	}
	if req.Icon != nil {
		ciType.Icon = req.Icon
	}
	if req.Description != nil {
		ciType.Description = req.Description
	}
	if req.Attributes != nil {
		ciType.Attributes = req.Attributes
	}
	if req.IsActive != nil {
		ciType.IsActive = *req.IsActive
	}
	if req.SortOrder != nil {
		ciType.SortOrder = *req.SortOrder
	}

	tx := db.Begin()
	if err := tx.Save(&ciType).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "更新类型失败",
		})
		return
	}

	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID.(string),
		Username:     username.(string),
		Action:       "update",
		ResourceType: "ci_type",
		ResourceID:   ciType.ID,
		ResourceName: ciType.Name,
		OldValue:     oldValue,
		NewValue:     toJSON(ciType),
	}
	tx.Create(&audit)
	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "类型更新成功",
	})
}

func DeleteCIType(c *gin.Context) {
	typeID := c.Param("id")

	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	db := database.GetDB()
	var ciType models.CIType
	if err := db.First(&ciType, "id = ?", typeID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "类型不存在",
		})
		return
	}

	tx := db.Begin()

	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID.(string),
		Username:     username.(string),
		Action:       "delete",
		ResourceType: "ci_type",
		ResourceID:   ciType.ID,
		ResourceName: ciType.Name,
	}
	tx.Create(&audit)

	if err := tx.Delete(&ciType).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "删除类型失败",
		})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "类型删除成功",
	})
}
