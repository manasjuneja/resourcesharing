package models

import (
	"time"

	"gorm.io/gorm"
)

type RequestStatus string

const (
    StatusPending  RequestStatus = "pending"
    StatusApproved RequestStatus = "approved"
    StatusDenied   RequestStatus = "denied"
    StatusReturned RequestStatus = "returned"
)

type BorrowRequest struct {
    gorm.Model
    ItemID      uint          `gorm:"not null" json:"itemId"`
    Item        Item          `json:"item,omitempty"`
    BuyerID     uint          `gorm:"not null" json:"buyerId"`
    Buyer       User          `json:"buyer,omitempty"`
    Status      RequestStatus `gorm:"not null;default:'pending'" json:"status"`
    StartDate   time.Time     `json:"startDate"`
    EndDate     time.Time     `json:"endDate"`
    Message     string        `json:"message"`
}