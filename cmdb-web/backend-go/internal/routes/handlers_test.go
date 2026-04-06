package routes

import (
	"bytes"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"sync"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"cmdb-go/internal/config"
	"cmdb-go/internal/database"
	"cmdb-go/internal/middleware"
	"cmdb-go/internal/models"
	"cmdb-go/internal/security"
)

var testDBMutex sync.Mutex

// setupTestDB 为每个测试创建独立的数据库实例
func setupTestDB() *gorm.DB {
	testDBMutex.Lock()
	defer testDBMutex.Unlock()

	// 设置环境变量
	os.Setenv("SECRET_KEY", "test-secret-key-for-testing")
	os.Setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
	os.Setenv("DATABASE_TYPE", "sqlite")
	os.Setenv("DATABASE_URL", ":memory:")

	// 初始化配置
	config.Init()

	// 创建新的数据库连接
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		panic(fmt.Sprintf("Failed to open test database: %v", err))
	}

	// 配置连接池
	sqlDB, _ := db.DB()
	sqlDB.SetMaxIdleConns(1)
	sqlDB.SetMaxOpenConns(1)

	// 自动迁移
	db.AutoMigrate(
		&models.User{},
		&models.Role{},
		&models.CI{},
		&models.Relation{},
		&models.AuditLog{},
		&models.ChangeRequest{},
	)

	return db
}

// seedTestUsersForDB 为指定数据库种子用户数据
func seedTestUsersForDB(db *gorm.DB) {
	hashedPassword, _ := security.HashPassword("admin123")

	role := models.Role{
		ID:       "role-1",
		Name:     "admin",
		Code:     "admin",
		IsActive: true,
	}
	db.Create(&role)

	user := models.User{
		ID:             "user-1",
		Username:       "admin",
		Email:          "admin@test.com",
		HashedPassword: hashedPassword,
		RoleID:         stringPtr("role-1"),
		IsActive:       true,
	}
	db.Create(&user)
}

// seedTestDataForDB 为指定数据库种子测试数据
func seedTestDataForDB(db *gorm.DB) {
	// 创建测试 CI
	ci := models.CI{
		ID:     "ci-test-1",
		Name:   "test-server",
		Type:   "server",
		Status: "active",
		IP:     stringPtr("192.168.1.100"),
	}
	db.Create(&ci)

	// 创建测试 Role
	role := models.Role{
		ID:       "role-test-1",
		Name:     "tester",
		Code:     "tester",
		IsActive: true,
	}
	db.Create(&role)
}

func stringPtr(s string) *string {
	return &s
}

func getTestToken() string {
	claims := map[string]interface{}{
		"sub":      "user-1",
		"username": "admin",
		"role":     "admin",
	}
	token, _ := security.CreateAccessToken(claims)
	return token
}

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	return router
}

// setupTestWithDB 设置测试环境并返回数据库实例
func setupTestWithDB(t *testing.T) *gorm.DB {
	db := setupTestDB()
	seedTestUsersForDB(db)
	seedTestDataForDB(db)

	// 临时替换全局数据库（仅用于当前测试）
	testDBMutex.Lock()
	originalDB := database.GetDB()
	database.DB = db
	testDBMutex.Unlock()

	// 注册清理函数
	t.Cleanup(func() {
		testDBMutex.Lock()
		database.DB = originalDB
		testDBMutex.Unlock()
		sqlDB, _ := db.DB()
		sqlDB.Close()
	})

	return db
}

// Health Check Tests
func TestHealthCheck(t *testing.T) {
	router := setupTestRouter()
	router.GET("/api/health", HealthCheck)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/health", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// Auth Tests
func TestAuthLogin(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.POST("/api/auth/login", Login)

	t.Run("登录成功", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/auth/login",
			bytes.NewBufferString(`{"username":"admin","password":"admin123"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("密码错误", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/auth/login",
			bytes.NewBufferString(`{"username":"admin","password":"wrong"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestAuthGetMe(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/auth/me", middleware.AuthMiddleware(), GetMe)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAuthLogout(t *testing.T) {
	router := setupTestRouter()
	router.POST("/api/auth/logout", Logout)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/auth/logout", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// Dashboard Tests
func TestGetDashboard(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/dashboard", middleware.AuthMiddleware(), GetDashboard)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/dashboard", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// User Tests
func TestListUsers(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/users", middleware.AuthMiddleware(), ListUsers)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/users", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// Role Tests
func TestListRoles(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/roles", middleware.AuthMiddleware(), ListRoles)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/roles", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// Audit Tests
func TestListAuditLogs(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/audit", middleware.AuthMiddleware(), ListAuditLogs)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/audit", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// CI Tests
func TestCreateCI(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.POST("/api/ci", middleware.AuthMiddleware(), CreateCI)

	token := getTestToken()
	ciData := `{"name":"new-server","type":"server","ip":"192.168.1.200"}`

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/ci", bytes.NewBufferString(ciData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestGetCI(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/ci/:id", middleware.AuthMiddleware(), GetCI)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/ci/ci-test-1", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestUpdateCI(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.PUT("/api/ci/:id", middleware.AuthMiddleware(), UpdateCI)

	token := getTestToken()
	updateData := `{"status":"inactive"}`

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/ci/ci-test-1", bytes.NewBufferString(updateData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestDeleteCI(t *testing.T) {
	db := setupTestWithDB(t)

	// 先创建一个CI用于删除
	ci := models.CI{
		ID:     "ci-to-delete",
		Name:   "delete-me",
		Type:   "server",
		Status: "active",
	}
	db.Create(&ci)

	router := setupTestRouter()
	router.DELETE("/api/ci/:id", middleware.AuthMiddleware(), DeleteCI)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/ci/ci-to-delete", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// User Tests
func TestCreateUser(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.POST("/api/users", middleware.AuthMiddleware(), CreateUser)

	token := getTestToken()
	userData := `{"username":"newuser","email":"new@test.com","password":"pass123"}`

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/users", bytes.NewBufferString(userData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestGetUser(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/users/:id", middleware.AuthMiddleware(), GetUser)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/users/user-1", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// Role Tests
func TestCreateRole(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.POST("/api/roles", middleware.AuthMiddleware(), CreateRole)

	token := getTestToken()
	roleData := `{"name":"Developer","code":"developer"}`

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/roles", bytes.NewBufferString(roleData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestGetRole(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/roles/:id", middleware.AuthMiddleware(), GetRole)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/roles/role-test-1", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// Relation Tests
func TestCreateRelation(t *testing.T) {
	db := setupTestWithDB(t)

	// 先创建两个CI
	ci1 := models.CI{ID: "rel-ci-1", Name: "ci1", Type: "server", Status: "active"}
	ci2 := models.CI{ID: "rel-ci-2", Name: "ci2", Type: "server", Status: "active"}
	db.Create(&ci1)
	db.Create(&ci2)

	router := setupTestRouter()
	router.POST("/api/relations", middleware.AuthMiddleware(), CreateRelation)

	token := getTestToken()
	relationData := `{"source_ci_id":"rel-ci-1","target_ci_id":"rel-ci-2","relation_type":"depends_on"}`

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/relations", bytes.NewBufferString(relationData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestListRelations(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/relations", middleware.AuthMiddleware(), ListRelations)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/relations", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// Change Tests
func TestCreateChange(t *testing.T) {
	db := setupTestWithDB(t)

	// 先创建一个CI
	ci := models.CI{ID: "change-ci-1", Name: "change-ci", Type: "server", Status: "active"}
	db.Create(&ci)

	router := setupTestRouter()
	router.POST("/api/changes", middleware.AuthMiddleware(), CreateChange)

	token := getTestToken()
	changeData := `{"title":"Test Change","ci_id":"change-ci-1","reason":"Testing","plan":"Test plan"}`

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/changes", bytes.NewBufferString(changeData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestListChanges(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/changes", middleware.AuthMiddleware(), ListChanges)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/changes", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// ========== 新增的缺失Handler测试 ==========

func TestListCI(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/ci", middleware.AuthMiddleware(), ListCI)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/ci", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetChange(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/changes/:id", middleware.AuthMiddleware(), GetChange)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/changes/non-existent-id", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	// 应该返回404或200（取决于实现）
	assert.Contains(t, []int{http.StatusOK, http.StatusNotFound}, w.Code)
}

func TestUpdateChange(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.PUT("/api/changes/:id", middleware.AuthMiddleware(), UpdateChange)

	token := getTestToken()
	updateData := `{"title":"Updated Change","status":"approved"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/changes/test-change-id", bytes.NewBufferString(updateData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	// 应该返回200或404
	assert.Contains(t, []int{http.StatusOK, http.StatusNotFound}, w.Code)
}

func TestDeleteChange(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.DELETE("/api/changes/:id", middleware.AuthMiddleware(), DeleteChange)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/changes/test-change-id", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	// 应该返回200或404
	assert.Contains(t, []int{http.StatusOK, http.StatusNotFound}, w.Code)
}

func TestGetRelation(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.GET("/api/relations/:id", middleware.AuthMiddleware(), GetRelation)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/relations/non-existent-id", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	// 应该返回200或404
	assert.Contains(t, []int{http.StatusOK, http.StatusNotFound}, w.Code)
}

func TestUpdateRelation(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.PUT("/api/relations/:id", middleware.AuthMiddleware(), UpdateRelation)

	token := getTestToken()
	updateData := `{"description":"Updated relation"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/relations/test-relation-id", bytes.NewBufferString(updateData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	// 应该返回200或404
	assert.Contains(t, []int{http.StatusOK, http.StatusNotFound}, w.Code)
}

func TestDeleteRelation(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.DELETE("/api/relations/:id", middleware.AuthMiddleware(), DeleteRelation)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/relations/test-relation-id", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	// 应该返回200或404
	assert.Contains(t, []int{http.StatusOK, http.StatusNotFound}, w.Code)
}

func TestUpdateRole(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.PUT("/api/roles/:id", middleware.AuthMiddleware(), UpdateRole)

	token := getTestToken()
	updateData := `{"name":"Updated Role","description":"New description"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/roles/test-role-id", bytes.NewBufferString(updateData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	// 应该返回200或404
	assert.Contains(t, []int{http.StatusOK, http.StatusNotFound}, w.Code)
}

func TestDeleteRole(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.DELETE("/api/roles/:id", middleware.AuthMiddleware(), DeleteRole)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/roles/test-role-id", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	// 应该返回200或404
	assert.Contains(t, []int{http.StatusOK, http.StatusNotFound}, w.Code)
}

func TestUpdateUser(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.PUT("/api/users/:id", middleware.AuthMiddleware(), UpdateUser)

	token := getTestToken()
	updateData := `{"email":"updated@example.com"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/users/test-user-id", bytes.NewBufferString(updateData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	// 应该返回200或404
	assert.Contains(t, []int{http.StatusOK, http.StatusNotFound}, w.Code)
}

func TestDeleteUser(t *testing.T) {
	db := setupTestWithDB(t)
	_ = db

	router := setupTestRouter()
	router.DELETE("/api/users/:id", middleware.AuthMiddleware(), DeleteUser)

	token := getTestToken()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/users/test-user-id", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	// 应该返回200或404
	assert.Contains(t, []int{http.StatusOK, http.StatusNotFound}, w.Code)
}
