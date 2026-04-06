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

// ListRoles 获取角色列表
func ListRoles(c *gin.Context) {
	page := 1
	pageSize := 20
	if p := c.Query("page"); p != "" {
		page, _ = strconv.Atoi(p)
	}
	if ps := c.Query("pageSize"); ps != "" {
		pageSize, _ = strconv.Atoi(ps)
	}

	db := database.GetDB()
	var roles []models.Role
	var total int64

	db.Model(&models.Role{}).Count(&total)
	db.Offset((page - 1) * pageSize).Limit(pageSize).Find(&roles)

	c.JSON(http.StatusOK, schemas.PaginatedResponse{
		Success:  true,
		Message:  "ok",
		Data:     roles,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

// CreateRole 创建角色
func CreateRole(c *gin.Context) {
	var req struct {
		Name        string  `json:"name" binding:"required"`
		Code        string  `json:"code" binding:"required"`
		Description *string `json:"description"`
		Permissions *string `json:"permissions"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "请求参数错误",
		})
		return
	}

	db := database.GetDB()

	// 检查角色名是否已存在
	var existingRole models.Role
	if db.Where("name = ?", req.Name).First(&existingRole).Error == nil {
		c.JSON(http.StatusConflict, schemas.BaseResponse{
			Success: false,
			Message: "角色名已存在",
		})
		return
	}

	role := models.Role{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Permissions: req.Permissions,
		IsActive:    true,
	}

	if err := db.Create(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "创建角色失败",
		})
		return
	}

	c.JSON(http.StatusCreated, schemas.BaseResponse{
		Success: true,
		Message: "角色创建成功",
		Data:    gin.H{"id": role.ID},
	})
}

// GetRole 获取角色详情
func GetRole(c *gin.Context) {
	roleID := c.Param("id")

	db := database.GetDB()
	var role models.Role
	if err := db.First(&role, "id = ?", roleID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "角色不存在",
		})
		return
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data:    role,
	})
}

// UpdateRole 更新角色
func UpdateRole(c *gin.Context) {
	roleID := c.Param("id")

	db := database.GetDB()
	var role models.Role
	if err := db.First(&role, "id = ?", roleID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "角色不存在",
		})
		return
	}

	var req struct {
		Name        *string `json:"name"`
		Code        *string `json:"code"`
		Description *string `json:"description"`
		Permissions *string `json:"permissions"`
		IsActive    *bool   `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "请求参数错误",
		})
		return
	}

	if req.Name != nil {
		role.Name = *req.Name
	}
	if req.Code != nil {
		role.Code = *req.Code
	}
	if req.Description != nil {
		role.Description = req.Description
	}
	if req.Permissions != nil {
		role.Permissions = req.Permissions
	}
	if req.IsActive != nil {
		role.IsActive = *req.IsActive
	}

	if err := db.Save(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "更新角色失败",
		})
		return
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "角色更新成功",
	})
}

// DeleteRole 删除角色
func DeleteRole(c *gin.Context) {
	roleID := c.Param("id")

	db := database.GetDB()
	if err := db.Delete(&models.Role{}, "id = ?", roleID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "删除角色失败",
		})
		return
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "角色删除成功",
	})
}
