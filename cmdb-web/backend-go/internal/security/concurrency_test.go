package security

import (
	"fmt"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestConcurrentPasswordHashing 测试并发密码哈希
func TestConcurrentPasswordHashing(t *testing.T) {
	concurrency := 50
	var wg sync.WaitGroup
	results := make([]string, concurrency)
	var mu sync.Mutex

	for i := 0; i < concurrency; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()

			password := fmt.Sprintf("password%d", idx)
			hashed, err := HashPassword(password)

			mu.Lock()
			if err == nil {
				results[idx] = hashed
			}
			mu.Unlock()
		}(i)
	}

	wg.Wait()

	// 验证所有密码都成功哈希
	successCount := 0
	hashSet := make(map[string]bool)

	for _, hash := range results {
		if hash != "" {
			successCount++
			hashSet[hash] = true
		}
	}

	t.Logf("并发密码哈希: %d/%d 成功, %d 个唯一哈希", successCount, concurrency, len(hashSet))
	assert.Equal(t, concurrency, successCount, "所有密码都应该成功哈希")
	assert.Equal(t, concurrency, len(hashSet), "所有哈希值都应该唯一（因为salt不同）")
}

// TestConcurrentPasswordVerification 测试并发密码验证
func TestConcurrentPasswordVerification(t *testing.T) {
	// 先生成一个密码哈希
	password := "testpassword"
	hashed, _ := HashPassword(password)

	concurrency := 100
	var wg sync.WaitGroup
	successCount := 0
	var mu sync.Mutex

	for i := 0; i < concurrency; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			valid := VerifyPassword(password, hashed)
			if valid {
				mu.Lock()
				successCount++
				mu.Unlock()
			}
		}()
	}

	wg.Wait()

	t.Logf("并发密码验证: %d/%d 成功", successCount, concurrency)
	assert.Equal(t, concurrency, successCount, "所有验证都应该成功")
}

// TestConcurrentTokenGeneration 测试并发Token生成
func TestConcurrentTokenGeneration(t *testing.T) {
	concurrency := 1000
	var wg sync.WaitGroup
	tokens := make([]string, concurrency)
	var mu sync.Mutex
	successCount := 0

	for i := 0; i < concurrency; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()

			claims := map[string]interface{}{
				"sub":      fmt.Sprintf("user-%d", idx),
				"username": fmt.Sprintf("user%d", idx),
				"role":     "user",
			}

			token, err := CreateAccessToken(claims)
			if err == nil {
				mu.Lock()
				tokens[idx] = token
				successCount++
				mu.Unlock()
			}
		}(i)
	}

	wg.Wait()

	// 验证所有token都成功生成且唯一
	tokenSet := make(map[string]bool)
	uniqueCount := 0

	for _, token := range tokens {
		if token != "" && !tokenSet[token] {
			tokenSet[token] = true
			uniqueCount++
		}
	}

	t.Logf("并发Token生成: %d/%d 成功, %d 个唯一Token", successCount, concurrency, uniqueCount)
	assert.Equal(t, concurrency, successCount, "所有Token都应该成功生成")
	assert.Equal(t, concurrency, uniqueCount, "所有Token都应该唯一")
}

// TestConcurrentTokenDecoding 测试并发Token解码
func TestConcurrentTokenDecoding(t *testing.T) {
	// 先生成一些tokens
	tokenCount := 100
	tokens := make([]string, tokenCount)

	for i := 0; i < tokenCount; i++ {
		claims := map[string]interface{}{
			"sub":      fmt.Sprintf("user-%d", i),
			"username": fmt.Sprintf("user%d", i),
		}
		tokens[i], _ = CreateAccessToken(claims)
	}

	// 并发解码
	concurrency := 500
	var wg sync.WaitGroup
	successCount := 0
	var mu sync.Mutex

	for i := 0; i < concurrency; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()

			// 循环使用预生成的tokens
			token := tokens[idx%tokenCount]
			_, err := DecodeAccessToken(token)

			if err == nil {
				mu.Lock()
				successCount++
				mu.Unlock()
			}
		}(i)
	}

	wg.Wait()

	t.Logf("并发Token解码: %d/%d 成功", successCount, concurrency)
	assert.Equal(t, concurrency, successCount, "所有Token都应该成功解码")
}

// BenchmarkConcurrentPasswordHashing 基准测试：并发密码哈希性能
func BenchmarkConcurrentPasswordHashing(b *testing.B) {
	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			password := fmt.Sprintf("password%d", i)
			_, _ = HashPassword(password)
			i++
		}
	})
}

// BenchmarkConcurrentTokenGeneration 基准测试：并发Token生成性能
func BenchmarkConcurrentTokenGeneration(b *testing.B) {
	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			claims := map[string]interface{}{
				"sub":      fmt.Sprintf("user-%d", i),
				"username": fmt.Sprintf("user%d", i),
				"role":     "user",
			}
			_, _ = CreateAccessToken(claims)
			i++
		}
	})
}
