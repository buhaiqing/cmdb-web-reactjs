package routes

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"

	"cmdb-go/internal/middleware"
	"cmdb-go/internal/models"
)

func TestBatchDeleteCI(t *testing.T) {
	db := setupTestWithDB(t)

	ci1 := models.CI{ID: "batch-ci-1", Name: "ci1", Type: "server", Status: "active"}
	ci2 := models.CI{ID: "batch-ci-2", Name: "ci2", Type: "server", Status: "active"}
	db.Create(&ci1)
	db.Create(&ci2)

	router := setupTestRouter()
	router.POST("/api/ci/batch/delete", middleware.AuthMiddleware(), BatchDeleteCI)

	token := getTestToken()

	t.Run("批量删除CI_成功", func(t *testing.T) {
		deleteData := `{"ids":["batch-ci-1","batch-ci-2"]}`
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/ci/batch/delete", bytes.NewBufferString(deleteData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "批量删除成功")
	})

	t.Run("批量删除CI_空数组", func(t *testing.T) {
		deleteData := `{"ids":[]}`
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/ci/batch/delete", bytes.NewBufferString(deleteData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("批量删除CI_缺少ids字段", func(t *testing.T) {
		deleteData := `{"name":"test"}`
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/ci/batch/delete", bytes.NewBufferString(deleteData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestBatchUpdateCI(t *testing.T) {
	db := setupTestWithDB(t)

	ci1 := models.CI{ID: "batch-update-ci-1", Name: "ci1", Type: "server", Status: "active"}
	ci2 := models.CI{ID: "batch-update-ci-2", Name: "ci2", Type: "server", Status: "active"}
	db.Create(&ci1)
	db.Create(&ci2)

	router := setupTestRouter()
	router.POST("/api/ci/batch/update", middleware.AuthMiddleware(), BatchUpdateCI)

	token := getTestToken()

	t.Run("批量更新CI_成功", func(t *testing.T) {
		updateData := `{"ids":["batch-update-ci-1","batch-update-ci-2"],"update":{"status":"inactive"}}`
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/ci/batch/update", bytes.NewBufferString(updateData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "批量更新成功")
	})

	t.Run("批量更新CI_空数组", func(t *testing.T) {
		updateData := `{"ids":[],"update":{"status":"inactive"}}`
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/ci/batch/update", bytes.NewBufferString(updateData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("批量更新CI_缺少update字段", func(t *testing.T) {
		updateData := `{"ids":["batch-update-ci-1"]}`
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/ci/batch/update", bytes.NewBufferString(updateData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Contains(t, []int{http.StatusBadRequest, http.StatusOK}, w.Code)
	})
}
