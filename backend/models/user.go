package models

import (

	"gorm.io/gorm"
)

type UserRole string

const (
	RoleSeller UserRole = "seller"
	RoleBuyer  UserRole = "buyer"
)

type User struct {
    gorm.Model
    Email     string   `gorm:"uniqueIndex;not null" json:"email"`
    Password  string   `gorm:"not null" json:"-"`
    Name      string   `gorm:"not null" json:"name"`
    Role      UserRole `gorm:"not null" json:"role"`
    Items     []Item   `gorm:"foreignKey:SellerID" json:"items,omitempty"`
    Requests  []BorrowRequest `gorm:"foreignKey:BuyerID" json:"requests,omitempty"`
}