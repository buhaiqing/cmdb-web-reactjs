package schemas

// BaseResponse 基础响应
type BaseResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// PaginatedResponse 分页响应
type PaginatedResponse struct {
	Success  bool        `json:"success"`
	Message  string      `json:"message"`
	Data     interface{} `json:"data"`
	Total    int64       `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Success bool      `json:"success"`
	Message string    `json:"message"`
	Data    LoginData `json:"data"`
}

type LoginData struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// UserInfoResponse 用户信息响应
type UserInfoResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    User   `json:"data"`
}

// User 用户信息
type User struct {
	ID          string   `json:"id"`
	Username    string   `json:"username"`
	Email       string   `json:"email"`
	Role        string   `json:"role"`
	Permissions []string `json:"permissions"`
}

// CICreate 创建配置项请求
type CICreate struct {
	Name        string   `json:"name" binding:"required"`
	Type        string   `json:"type" binding:"required"`
	IP          *string  `json:"ip"`
	CPU         *string  `json:"cpu"`
	Memory      *string  `json:"memory"`
	Disk        *string  `json:"disk"`
	OS          *string  `json:"os"`
	Project     *string  `json:"project"`
	Environment *string  `json:"environment"`
	Tags        []string `json:"tags"`
	Description *string  `json:"description"`
}

// CIUpdate 更新配置项请求
type CIUpdate struct {
	Name        *string  `json:"name"`
	Type        *string  `json:"type"`
	Status      *string  `json:"status"`
	IP          *string  `json:"ip"`
	CPU         *string  `json:"cpu"`
	Memory      *string  `json:"memory"`
	Disk        *string  `json:"disk"`
	OS          *string  `json:"os"`
	Project     *string  `json:"project"`
	Environment *string  `json:"environment"`
	Tags        []string `json:"tags"`
	Description *string  `json:"description"`
}

// RelationCreate 创建关系请求
type RelationCreate struct {
	SourceCIID   string  `json:"source_ci_id" binding:"required"`
	TargetCIID   string  `json:"target_ci_id" binding:"required"`
	RelationType string  `json:"relation_type" binding:"required"`
	Description  *string `json:"description"`
}

// RelationUpdate 更新关系请求
type RelationUpdate struct {
	RelationType *string `json:"relation_type"`
	Description  *string `json:"description"`
}

// ChangeCreate 创建变更请求
type ChangeCreate struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	CIID        string `json:"ci_id" binding:"required"`
	Reason      string `json:"reason" binding:"required"`
	Plan        string `json:"plan" binding:"required"`
	Priority    string `json:"priority"`
}

// ChangeUpdate 更新变更请求
type ChangeUpdate struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Reason      *string `json:"reason"`
	Plan        *string `json:"plan"`
	Status      *string `json:"status"`
	Priority    *string `json:"priority"`
}

// NOTE: CIResponse, RelationResponse, ChangeResponse were removed (dead contract —
// zero handlers used them; all output is hand-built gin.H). If a shared response
// struct is needed, define it here and wire it into the handler in the same commit.