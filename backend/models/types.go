package models

// Status represents the status of an item or borrow request
type Status string

const (
	StatusPending   Status = "pending"
	StatusApproved  Status = "approved"
	StatusDenied    Status = "denied"
	StatusReturned  Status = "returned"
	StatusAvailable Status = "available"
	StatusBorrowed  Status = "borrowed"
)

// Role represents the role of a user
type Role string

const (
	RoleBuyer  Role = "buyer"
	RoleSeller Role = "seller"
)