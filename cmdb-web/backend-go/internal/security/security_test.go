package security

import (
	"os"
	"testing"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"

	"cmdb-go/internal/config"
)

func TestMain(m *testing.M) {
	// 设置测试环境变量
	os.Setenv("SECRET_KEY", "test-secret-key-for-testing-purposes-only")
	os.Setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
	os.Setenv("DATABASE_TYPE", "sqlite")
	os.Setenv("DATABASE_URL", ":memory:")

	// 初始化配置
	config.Init()

	// 运行测试
	code := m.Run()

	// 退出
	os.Exit(code)
}

func TestHashPassword(t *testing.T) {
	t.Run("密码哈希成功", func(t *testing.T) {
		password := "testpassword123"
		hashed, err := HashPassword(password)

		assert.NoError(t, err)
		assert.NotEmpty(t, hashed)
		assert.NotEqual(t, password, hashed)
	})

	t.Run("不同密码生成不同哈希", func(t *testing.T) {
		hash1, _ := HashPassword("password1")
		hash2, _ := HashPassword("password2")

		assert.NotEqual(t, hash1, hash2)
	})

	t.Run("相同密码生成不同哈希", func(t *testing.T) {
		hash1, _ := HashPassword("samepassword")
		hash2, _ := HashPassword("samepassword")

		// bcrypt每次生成的哈希都不同（因为salt不同）
		assert.NotEqual(t, hash1, hash2)
	})
}

func TestVerifyPassword(t *testing.T) {
	t.Run("正确密码验证通过", func(t *testing.T) {
		password := "testpassword123"
		hashed, _ := HashPassword(password)

		valid := VerifyPassword(password, hashed)
		assert.True(t, valid)
	})

	t.Run("错误密码验证失败", func(t *testing.T) {
		password := "correctpassword"
		wrongPassword := "wrongpassword"
		hashed, _ := HashPassword(password)

		valid := VerifyPassword(wrongPassword, hashed)
		assert.False(t, valid)
	})

	t.Run("空密码验证失败", func(t *testing.T) {
		hashed, _ := HashPassword("somepassword")

		valid := VerifyPassword("", hashed)
		assert.False(t, valid)
	})
}

func TestCreateAccessToken(t *testing.T) {
	t.Run("创建Token成功", func(t *testing.T) {
		claims := jwt.MapClaims{
			"sub":      "user-123",
			"username": "testuser",
			"role":     "admin",
		}

		token, err := CreateAccessToken(claims)

		assert.NoError(t, err)
		assert.NotEmpty(t, token)
	})

	t.Run("Token包含正确的声明", func(t *testing.T) {
		claims := jwt.MapClaims{
			"sub":      "user-456",
			"username": "admin",
			"role":     "admin",
		}

		token, _ := CreateAccessToken(claims)

		// 解码验证
		decodedClaims, err := DecodeAccessToken(token)
		assert.NoError(t, err)
		assert.Equal(t, "user-456", decodedClaims["sub"])
		assert.Equal(t, "admin", decodedClaims["username"])
	})
}

func TestDecodeAccessToken(t *testing.T) {
	t.Run("有效Token解码成功", func(t *testing.T) {
		claims := jwt.MapClaims{
			"sub":      "user-789",
			"username": "testuser",
		}

		token, _ := CreateAccessToken(claims)
		decoded, err := DecodeAccessToken(token)

		assert.NoError(t, err)
		assert.Equal(t, "user-789", decoded["sub"])
		assert.Equal(t, "testuser", decoded["username"])
	})

	t.Run("无效Token解码失败", func(t *testing.T) {
		_, err := DecodeAccessToken("invalid.token.here")
		assert.Error(t, err)
	})

	t.Run("空Token解码失败", func(t *testing.T) {
		_, err := DecodeAccessToken("")
		assert.Error(t, err)
	})

	t.Run("篡改Token解码失败", func(t *testing.T) {
		claims := jwt.MapClaims{
			"sub": "user-999",
		}
		token, _ := CreateAccessToken(claims)

		// 篡改token
		tampered := token[:len(token)-5] + "XXXXX"
		_, err := DecodeAccessToken(tampered)
		assert.Error(t, err)
	})
}

func TestPasswordVerificationRoundTrip(t *testing.T) {
	// 完整的密码验证流程测试
	passwords := []string{
		"simple",
		"Complex123!@#",
		"very-long-password-with-many-characters-1234567890",
		"中文密码测试",
	}

	for _, password := range passwords {
		t.Run("密码: "+password[:min(10, len(password))], func(t *testing.T) {
			// 哈希
			hashed, err := HashPassword(password)
			assert.NoError(t, err)

			// 验证正确密码
			assert.True(t, VerifyPassword(password, hashed))

			// 验证错误密码
			assert.False(t, VerifyPassword("wrong"+password, hashed))
		})
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
