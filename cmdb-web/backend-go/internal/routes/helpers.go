package routes

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"cmdb-go/internal/schemas"
)

// getUserFromContext 从Gin Context中安全地获取用户信息
func getUserFromContext(c *gin.Context) (userID string, username string, ok bool) {
	// 获取 user_id
	userIDVal, exists := c.Get("user_id")
	if !exists || userIDVal == nil {
		log.Printf("[ERROR] Missing user_id in context for request: %s %s", c.Request.Method, c.Request.URL.Path)
		c.JSON(http.StatusUnauthorized, schemas.BaseResponse{
			Success: false,
			Message: "未认证",
		})
		return "", "", false
	}

	userID, ok = userIDVal.(string)
	if !ok {
		log.Printf("[ERROR] Invalid user_id type in context")
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "内部错误",
		})
		return "", "", false
	}

	// 获取 username
	usernameVal, exists := c.Get("username")
	if !exists || usernameVal == nil {
		log.Printf("[ERROR] Missing username in context for user: %s", userID)
		c.JSON(http.StatusUnauthorized, schemas.BaseResponse{
			Success: false,
			Message: "未认证",
		})
		return "", "", false
	}

	username, ok = usernameVal.(string)
	if !ok {
		log.Printf("[ERROR] Invalid username type in context for user: %s", userID)
		c.JSON(http.StatusInternalServerError, schemas.BaseResponse{
			Success: false,
			Message: "内部错误",
		})
		return "", "", false
	}

	return userID, username, true
}
