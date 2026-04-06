package middleware

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"cmdb-go/internal/config"
	"cmdb-go/internal/security"
)

func setupTestConfig() {
	os.Setenv("SECRET_KEY", "test-secret-key")
	os.Setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
	os.Setenv("DATABASE_TYPE", "sqlite")
	os.Setenv("DATABASE_URL", ":memory:")
	config.Init()
}

func TestAuthMiddleware(t *testing.T) {
	setupTestConfig()
	gin.SetMode(gin.TestMode)

	t.Run("有效Token通过认证", func(t *testing.T) {
		router := gin.New()
		router.GET("/test", AuthMiddleware(), func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		// 生成有效token
		claims := map[string]interface{}{
			"sub":      "user-1",
			"username": "admin",
			"role":     "admin",
		}
		token, _ := security.CreateAccessToken(claims)

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/test", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("缺少Token返回401", func(t *testing.T) {
		router := gin.New()
		router.GET("/test", AuthMiddleware(), func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/test", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("无效Token返回401", func(t *testing.T) {
		router := gin.New()
		router.GET("/test", AuthMiddleware(), func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/test", nil)
		req.Header.Set("Authorization", "Bearer invalid-token")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("错误的Bearer格式返回401", func(t *testing.T) {
		router := gin.New()
		router.GET("/test", AuthMiddleware(), func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/test", nil)
		req.Header.Set("Authorization", "InvalidFormat token")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestCORSMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("允许所有来源", func(t *testing.T) {
		router := gin.New()
		router.Use(CORSMiddleware())
		router.GET("/test", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/test", nil)
		req.Header.Set("Origin", "http://example.com")
		router.ServeHTTP(w, req)

		// 对于不在白名单中的origin，应该返回*
		assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
		assert.Equal(t, "GET, POST, PUT, DELETE, OPTIONS", w.Header().Get("Access-Control-Allow-Methods"))
		assert.Equal(t, "Origin, Content-Type, Authorization", w.Header().Get("Access-Control-Allow-Headers"))
	})

	t.Run("允许的localhost来源", func(t *testing.T) {
		router := gin.New()
		router.Use(CORSMiddleware())
		router.GET("/test", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/test", nil)
		req.Header.Set("Origin", "http://localhost:3000")
		router.ServeHTTP(w, req)

		// localhost应该在白名单中，返回具体origin
		assert.Equal(t, "http://localhost:3000", w.Header().Get("Access-Control-Allow-Origin"))
	})

	t.Run("OPTIONS请求返回204", func(t *testing.T) {
		router := gin.New()
		router.Use(CORSMiddleware())
		router.OPTIONS("/test", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("OPTIONS", "/test", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNoContent, w.Code)
	})
}

func TestGetAllowedOrigins(t *testing.T) {
	t.Run("返回包含localhost的白名单", func(t *testing.T) {
		origins := getAllowedOrigins()
		assert.True(t, len(origins) > 0, "应该返回至少一个允许的origin")
		assert.True(t, origins["http://localhost:3000"], "应该包含localhost:3000")
		assert.True(t, origins["http://localhost:3001"], "应该包含localhost:3001")
	})

	t.Run("从环境变量读取额外origins", func(t *testing.T) {
		os.Setenv("CORS_ALLOWED_ORIGINS", "http://custom.com,http://test.com")
		origins := getAllowedOrigins()
		assert.True(t, origins["http://custom.com"], "应该包含自定义origin")
		assert.True(t, origins["http://test.com"], "应该包含自定义origin")
		// 清理
		os.Unsetenv("CORS_ALLOWED_ORIGINS")
	})
}

func TestAuthMiddlewareWithExpiredToken(t *testing.T) {
	setupTestConfig()
	gin.SetMode(gin.TestMode)

	t.Run("过期Token返回401", func(t *testing.T) {
		router := gin.New()
		router.GET("/test", AuthMiddleware(), func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		// 生成已过期的token（手动构造）
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/test", nil)
		// 使用一个明显过期的JWT token
		req.Header.Set("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")
		router.ServeHTTP(w, req)

		// 应该返回401（认证失败）
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}
