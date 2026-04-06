package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestStringToJSON(t *testing.T) {
	t.Run("有效JSON数组", func(t *testing.T) {
		result, err := StringToJSON(`["tag1","tag2","tag3"]`)
		assert.NoError(t, err)
		assert.Equal(t, []string{"tag1", "tag2", "tag3"}, result)
	})

	t.Run("空字符串", func(t *testing.T) {
		result, err := StringToJSON("")
		assert.NoError(t, err)
		assert.Nil(t, result)
	})

	t.Run("无效JSON", func(t *testing.T) {
		result, err := StringToJSON("invalid")
		assert.Error(t, err)
		assert.Nil(t, result)
	})

	t.Run("空数组", func(t *testing.T) {
		result, err := StringToJSON("[]")
		assert.NoError(t, err)
		assert.Equal(t, []string{}, result)
	})
}

func TestTagsToJSON(t *testing.T) {
	t.Run("多个标签", func(t *testing.T) {
		result, err := TagsToJSON([]string{"tag1", "tag2"})
		assert.NoError(t, err)
		assert.Equal(t, `["tag1","tag2"]`, result)
	})

	t.Run("空数组", func(t *testing.T) {
		result, err := TagsToJSON([]string{})
		assert.NoError(t, err)
		assert.Equal(t, "", result)
	})

	t.Run("nil数组", func(t *testing.T) {
		result, err := TagsToJSON(nil)
		assert.NoError(t, err)
		assert.Equal(t, "", result)
	})

	t.Run("单个标签", func(t *testing.T) {
		result, err := TagsToJSON([]string{"single"})
		assert.NoError(t, err)
		assert.Equal(t, `["single"]`, result)
	})
}

func TestInterfaceToStringSlice(t *testing.T) {
	t.Run("字符串数组", func(t *testing.T) {
		input := []string{"a", "b", "c"}
		result, err := InterfaceToStringSlice(input)
		assert.NoError(t, err)
		assert.Equal(t, input, result)
	})

	t.Run("interface数组", func(t *testing.T) {
		input := []interface{}{"a", "b", "c"}
		result, err := InterfaceToStringSlice(input)
		assert.NoError(t, err)
		assert.Equal(t, []string{"a", "b", "c"}, result)
	})

	t.Run("nil输入", func(t *testing.T) {
		result, err := InterfaceToStringSlice(nil)
		assert.NoError(t, err)
		assert.Nil(t, result)
	})

	t.Run("不支持的类型", func(t *testing.T) {
		result, err := InterfaceToStringSlice(123)
		assert.Error(t, err)
		assert.Nil(t, result)
	})

	t.Run("混合类型数组", func(t *testing.T) {
		input := []interface{}{"a", 123, "c"}
		result, err := InterfaceToStringSlice(input)
		assert.Error(t, err)
		assert.Nil(t, result)
	})
}
