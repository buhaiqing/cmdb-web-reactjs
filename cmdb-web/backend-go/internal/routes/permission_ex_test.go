package routes

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"

	"cmdb-go/internal/middleware"
)

func TestListPermissions(t *testing.T) {
	router := setupTestRouter()
	router.GET("/api/permissions", middleware.AuthMiddleware(), ListPermissions)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/permissions", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "ci:read")
	assert.Contains(t, w.Body.String(), "ci:write")
	assert.Contains(t, w.Body.String(), "change:approve")
}

func TestGetRolePermissions(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/permissions/roles/:roleId", middleware.AuthMiddleware(), GetRolePermissions)

	token := getTestToken()

	t.Run("获取角色权限_角色存在", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/permissions/roles/role-1", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("获取角色权限_角色不存在", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/permissions/roles/non-existent", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestUpdateRolePermissions(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.PUT("/api/permissions/roles/:roleId", middleware.AuthMiddleware(), UpdateRolePermissions)

	token := getTestToken()

	t.Run("更新角色权限_成功", func(t *testing.T) {
		permissionsData := `{"permissions":["ci:read","ci:write","change:approve"]}`
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("PUT", "/api/permissions/roles/role-1",
			bytes.NewBufferString(permissionsData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "权限更新成功")
	})

	t.Run("更新角色权限_缺少permissions字段", func(t *testing.T) {
		invalidData := `{"name":"test"}`
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("PUT", "/api/permissions/roles/role-1",
			bytes.NewBufferString(invalidData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("更新角色权限_角色不存在", func(t *testing.T) {
		permissionsData := `{"permissions":["ci:read"]}`
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("PUT", "/api/permissions/roles/non-existent",
			bytes.NewBufferString(permissionsData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}
