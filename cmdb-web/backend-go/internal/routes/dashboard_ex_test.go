package routes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"

	"cmdb-go/internal/middleware"
)

func TestGetResourceTrend(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/dashboard/trend", middleware.AuthMiddleware(), GetResourceTrend)

	token := getTestToken()

	t.Run("获取资源趋势_默认7天", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/dashboard/trend", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "trend")
	})

	t.Run("获取资源趋势_30天", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/dashboard/trend?period=30", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("获取资源趋势_90天", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/dashboard/trend?period=90", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}

func TestGetDashboardSummary(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/dashboard/summary", middleware.AuthMiddleware(), GetDashboardSummary)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/dashboard/summary", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "ci")
	assert.Contains(t, w.Body.String(), "change")
}
