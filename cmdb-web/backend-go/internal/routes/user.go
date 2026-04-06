package routes

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/schemas"
)

// ListUsers 获取用户列表
func ListUsers(c *gin.Context) {
	page := 1
	pageSize := 20
	if p := c.Query("page"); p != "" {
		page, _ = strconv.Atoi(p)
	}
	if ps := c.Query("pageSize"); ps != "" {
		pageSize, _ = strconv.Atoi(ps)
	}

	db := database.GetDB()
	var users []models.User
	var total int64

	db.Model(&models.User{}).Count(&total)
	db.Preload("Role").Offset((page - 1) * pageSize).Limit(pageSize).Find(&users)

	c.JSON(http.StatusOK, schemas.PaginatedResponse{
		Success:  true,
		Message:  "ok",
		Data:     users,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

// CreateUser 创建用户
func CreateUser(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
		RoleID   string `json:"role_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "请求参数错误",
		})
		return
	}

	db := database.GetDB()

	// 检查用户名是否已存在
	var existingUser models.User
	if db.Where("username = ?", req.Username).First(&existingUser).Error == nil {
		c.JSON(http.StatusConflict, schemas.BaseResponse{
			Success: false,
			Message: "用户名已存在",
		})
		return
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "密码加密失败",
		})
		return
	}

	user := models.User{
		ID:             uuid.New().String(),
		Username:       req.Username,
		Email:          req.Email,
		HashedPassword: string(hashedPassword),
		IsActive:       true,
	}

	if req.RoleID != "" {
		user.RoleID = &req.RoleID
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "创建用户失败",
		})
		return
	}

	c.JSON(http.StatusCreated, schemas.BaseResponse{
		Success: true,
		Message: "用户创建成功",
		Data:    gin.H{"id": user.ID},
	})
}

// GetUser 获取用户详情
func GetUser(c *gin.Context) {
	userID := c.Param("id")

	db := database.GetDB()
	var user models.User
	if err := db.Preload("Role").First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "用户不存在",
		})
		return
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "ok",
		Data:    user,
	})
}

// UpdateUser 更新用户
func UpdateUser(c *gin.Context) {
	userID := c.Param("id")

	db := database.GetDB()
	var user models.User
	if err := db.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "用户不存在",
		})
		return
	}

	var req struct {
		Username *string `json:"username"`
		Email    *string `json:"email"`
		Password *string `json:"password"`
		RoleID   *string `json:"role_id"`
		IsActive *bool   `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "请求参数错误",
		})
		return
	}

	if req.Username != nil {
		user.Username = *req.Username
	}
	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.Password != nil {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		user.HashedPassword = string(hashedPassword)
	}
	if req.RoleID != nil {
		user.RoleID = req.RoleID
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	if err := db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "更新用户失败",
		})
		return
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "用户更新成功",
	})
}

// DeleteUser 删除用户
func DeleteUser(c *gin.Context) {
	userID := c.Param("id")

	db := database.GetDB()
	if err := db.Delete(&models.User{}, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "删除用户失败",
		})
		return
	}

	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "用户删除成功",
	})
}
