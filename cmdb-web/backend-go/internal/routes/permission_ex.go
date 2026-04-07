package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/schemas"
)

func GetRolePermissions(c *gin.Context) {
	roleId := c.Param("roleId")

	db := database.GetDB()
	var role models.Role
	if err := db.First(&role, "id = ?", roleId).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "角色不存在",
		})
		return
	}

	var permissions []string
	if role.Permissions != nil {
		permissions = []string{*role.Permissions}
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data: gin.H{
			"role_id":     role.ID,
			"permissions": permissions,
		},
	})
}

func UpdateRolePermissions(c *gin.Context) {
	roleId := c.Param("roleId")

	var req struct {
		Permissions []string `json:"permissions" binding:"required"`
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
	var role models.Role
	if err := db.First(&role, "id = ?", roleId).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "角色不存在",
		})
		return
	}

	oldValue := role.Permissions
	permissionsStr := joinStrings(req.Permissions, ",")
	role.Permissions = &permissionsStr

	tx := db.Begin()
	if err := tx.Save(&role).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "更新角色权限失败",
		})
		return
	}

	audit := models.AuditLog{
		ID:           uuid.New().String(),
		UserID:       userID.(string),
		Username:     username.(string),
		Action:       "update_permissions",
		ResourceType: "role",
		ResourceID:   role.ID,
		ResourceName: role.Name,
		OldValue:     oldValue,
		NewValue:     &permissionsStr,
	}
	tx.Create(&audit)
	tx.Commit()

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "权限更新成功",
	})
}

func joinStrings(strs []string, sep string) string {
	result := ""
	for i, s := range strs {
		if i > 0 {
			result += sep
		}
		result += s
	}
	return result
}
