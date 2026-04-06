package routes

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"cmdb-go/internal/database"
	"cmdb-go/internal/models"
	"cmdb-go/internal/schemas"
	"cmdb-go/internal/security"
)

// Login 用户登录
func Login(c *gin.Context) {
	var req schemas.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, schemas.BaseResponse{
			Success: false,
			Message: "请求参数错误",
		})
		return
	}

	db := database.GetDB()
	var user models.User
	if err := db.Where("username = ?", req.Username).Preload("Role").First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, schemas.BaseResponse{
			Success: false,
			Message: "用户名或密码错误",
		})
		return
	}

	if !security.VerifyPassword(req.Password, user.HashedPassword) {
		c.JSON(http.StatusUnauthorized, schemas.BaseResponse{
			Success: false,
			Message: "用户名或密码错误",
		})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusForbidden, schemas.BaseResponse{
			Success: false,
			Message: "用户已被禁用",
		})
		return
	}

	// 更新最后登录时间
	now := time.Now()
	user.LastLoginAt = &now
	db.Save(&user)

	// 生成 JWT Token
	roleName := "user"
	var permissions []string
	if user.Role != nil {
		roleName = user.Role.Name
		if user.Role.Permissions != nil {
			permissions = []string{*user.Role.Permissions}
		}
	}

	claims := jwt.MapClaims{
		"sub":      user.ID,
		"username": user.Username,
		"role":     roleName,
	}

	token, err := security.CreateAccessToken(claims)
	if err != nil {
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "生成 Token 失败",
		})
		return
	}

	c.JSON(http.StatusOK, schemas.LoginResponse{
		Success: true,
		Message: "登录成功",
		Data: schemas.LoginData{
			Token: token,
			User: schemas.User{
				ID:          user.ID,
				Username:    user.Username,
				Email:       user.Email,
				Role:        roleName,
				Permissions: permissions,
			},
		},
	})
}

// GetMe 获取当前用户信息
func GetMe(c *gin.Context) {
	userID, _ := c.Get("user_id")

	db := database.GetDB()
	var user models.User
	if err := db.Where("id = ?", userID).Preload("Role").First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, schemas.BaseResponse{
			Success: false,
			Message: "用户不存在",
		})
		return
	}

	roleName := "user"
	var permissions []string
	if user.Role != nil {
		roleName = user.Role.Name
		if user.Role.Permissions != nil {
			permissions = []string{*user.Role.Permissions}
		}
	}

	c.JSON(http.StatusOK, schemas.UserInfoResponse{
		Success: true,
		Message: "ok",
		Data: schemas.User{
			ID:          user.ID,
			Username:    user.Username,
			Email:       user.Email,
			Role:        roleName,
			Permissions: permissions,
		},
	})
}

// Logout 用户登出
func Logout(c *gin.Context) {
	c.JSON(http.StatusOK, schemas.BaseResponse{
		Success: true,
		Message: "登出成功",
	})
}
