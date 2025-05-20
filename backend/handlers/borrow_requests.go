package handlers

import (
	"log"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"gorm.io/gorm"

	"resource-sharing/middleware"
	"resource-sharing/models"
)

type BorrowRequestRequest struct {
    ItemID    uint      `json:"itemId"`
    StartDate time.Time `json:"startDate"`
    EndDate   time.Time `json:"endDate"`
    Message   string    `json:"message"`
}

func CreateBorrowRequest(db *gorm.DB) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Get the user ID from the context
        userID, ok := middleware.GetUserIDFromContext(r)
        if !ok {
            log.Println("User ID not found in context")
            http.Error(w, "User ID not found in context", http.StatusUnauthorized)
            return
        }

        // Check if the user is a buyer
        var user models.User
        if result := db.First(&user, userID); result.Error != nil {
            log.Printf("User not found: %v", result.Error)
            http.Error(w, "User not found", http.StatusNotFound)
            return
        }

        if user.Role != models.RoleBuyer {
            log.Printf("User role is %s, not buyer", user.Role)
            http.Error(w, "Only buyers can create borrow requests", http.StatusForbidden)
            return
        }

        // Parse the request body
        var req BorrowRequestRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            log.Printf("Failed to decode request body: %v", err)
            http.Error(w, "Failed to decode request: "+err.Error(), http.StatusBadRequest)
            return
        }

        log.Printf("Received borrow request: %+v", req)

        // Validate input with more specific error messages
        if req.ItemID == 0 {
            log.Println("Invalid request: missing item ID")
            http.Error(w, "Item ID is required", http.StatusBadRequest)
            return
        }

        if req.StartDate.IsZero() {
            log.Println("Invalid request: missing start date")
            http.Error(w, "Start date is required", http.StatusBadRequest)
            return
        }

        if req.EndDate.IsZero() {
            log.Println("Invalid request: missing end date")
            http.Error(w, "End date is required", http.StatusBadRequest)
            return
        }

        if req.StartDate.After(req.EndDate) {
            log.Println("Invalid request: start date after end date")
            http.Error(w, "Start date must be before end date", http.StatusBadRequest)
            return
        }

        // Find the item
        var item models.Item
        if result := db.First(&item, req.ItemID); result.Error != nil {
            log.Printf("Item not found: %v", result.Error)
            http.Error(w, "Item not found", http.StatusNotFound)
            return
        }

        // Check if the item is available
        if item.Status != models.StatusAvailable {
            log.Printf("Item status is %s, not available", item.Status)
            http.Error(w, "Item is not available for borrowing", http.StatusBadRequest)
            return
        }

        // Create the borrow request
        borrowRequest := models.BorrowRequest{
            ItemID:    req.ItemID,
            BuyerID:   userID,
            Status:    models.StatusPending,
            StartDate: req.StartDate,
            EndDate:   req.EndDate,
            Message:   req.Message,
        }

        if result := db.Create(&borrowRequest); result.Error != nil {
            log.Printf("Failed to create borrow request: %v", result.Error)
            http.Error(w, "Failed to create borrow request: "+result.Error.Error(), http.StatusInternalServerError)
            return
        }

        log.Printf("Borrow request created successfully: ID=%d", borrowRequest.ID)

        // Return the created borrow request
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(borrowRequest)
    }
}

func ApproveBorrowRequest(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get the user ID from the context
		userID, ok := middleware.GetUserIDFromContext(r)
		if !ok {
			log.Println("User ID not found in context")
			http.Error(w, "User ID not found in context", http.StatusUnauthorized)
			return
		}

		// Get the borrow request ID from the URL
		vars := mux.Vars(r)
		id, err := strconv.Atoi(vars["id"])
		if err != nil {
			log.Printf("Invalid borrow request ID: %v", err)
			http.Error(w, "Invalid borrow request ID: "+err.Error(), http.StatusBadRequest)
			return
		}
		
		log.Printf("Approving borrow request ID: %d for user ID: %d", id, userID)

		// Find the borrow request
		var borrowRequest models.BorrowRequest
		if result := db.Preload("Item").First(&borrowRequest, id); result.Error != nil {
			log.Printf("Borrow request not found: %v", result.Error)
			http.Error(w, "Borrow request not found", http.StatusNotFound)
			return
		}

		// Check if the user is the seller of the item
		if borrowRequest.Item.SellerID != userID {
			log.Printf("User %d is not the seller of item %d", userID, borrowRequest.Item.ID)
			http.Error(w, "You can only approve borrow requests for your own items", http.StatusForbidden)
			return
		}

		// Check if the request is pending
		if borrowRequest.Status != models.StatusPending {
			log.Printf("Request %d is not pending (status: %s)", id, borrowRequest.Status)
			http.Error(w, "Only pending requests can be approved", http.StatusBadRequest)
			return
		}

		// Update the borrow request status
		borrowRequest.Status = models.StatusApproved

		// Update the item status
		borrowRequest.Item.Status = models.StatusBorrowed

		// Save the changes in a transaction
		err = db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Save(&borrowRequest).Error; err != nil {
				return err
			}
			if err := tx.Save(&borrowRequest.Item).Error; err != nil {
				return err
			}
			return nil
		})

		if err != nil {
			log.Printf("Failed to approve borrow request: %v", err)
			http.Error(w, "Failed to approve borrow request: "+err.Error(), http.StatusInternalServerError)
			return
		}
		
		log.Printf("Successfully approved borrow request %d", id)

		// Return the updated borrow request
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(borrowRequest)
	}
}

func DenyBorrowRequest(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get the user ID from the context
		userID, ok := middleware.GetUserIDFromContext(r)
		if !ok {
			log.Println("User ID not found in context")
			http.Error(w, "User ID not found in context", http.StatusUnauthorized)
			return
		}

		// Get the borrow request ID from the URL
		vars := mux.Vars(r)
		id, err := strconv.Atoi(vars["id"])
		if err != nil {
			log.Printf("Invalid borrow request ID: %v", err)
			http.Error(w, "Invalid borrow request ID: "+err.Error(), http.StatusBadRequest)
			return
		}
		
		log.Printf("Denying borrow request ID: %d for user ID: %d", id, userID)

		// Find the borrow request
		var borrowRequest models.BorrowRequest
		if result := db.Preload("Item").First(&borrowRequest, id); result.Error != nil {
			log.Printf("Borrow request not found: %v", result.Error)
			http.Error(w, "Borrow request not found", http.StatusNotFound)
			return
		}

		// Check if the user is the seller of the item
		if borrowRequest.Item.SellerID != userID {
			log.Printf("User %d is not the seller of item %d", userID, borrowRequest.Item.ID)
			http.Error(w, "You can only deny borrow requests for your own items", http.StatusForbidden)
			return
		}

		// Check if the request is pending
		if borrowRequest.Status != models.StatusPending {
			log.Printf("Request %d is not pending (status: %s)", id, borrowRequest.Status)
			http.Error(w, "Only pending requests can be denied", http.StatusBadRequest)
			return
		}

		// Update the borrow request status
		borrowRequest.Status = models.StatusDenied

		// Save the changes
		if result := db.Save(&borrowRequest); result.Error != nil {
			log.Printf("Failed to deny borrow request: %v", result.Error)
			http.Error(w, "Failed to deny borrow request: "+result.Error.Error(), http.StatusInternalServerError)
			return
		}
		
		log.Printf("Successfully denied borrow request %d", id)

		// Return the updated borrow request
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(borrowRequest)
	}
}

func GetMyBorrowRequests(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get the user ID from the context
		userID, ok := middleware.GetUserIDFromContext(r)
		if !ok {
			http.Error(w, "User ID not found in context", http.StatusUnauthorized)
			return
		}

		// Find all borrow requests for the user
		var borrowRequests []models.BorrowRequest
		if result := db.Where("buyer_id = ?", userID).Preload("Item").Preload("Item.Seller").Find(&borrowRequests); result.Error != nil {
			http.Error(w, "Failed to fetch borrow requests: "+result.Error.Error(), http.StatusInternalServerError)
			return
		}

		// Return the borrow requests
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(borrowRequests)
	}
}

func GetRequestsForMyItems(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get the user ID from the context
		userID, ok := middleware.GetUserIDFromContext(r)
		if !ok {
			log.Println("User ID not found in context")
			http.Error(w, "User ID not found in context", http.StatusUnauthorized)
			return
		}
		
		log.Printf("Fetching borrow requests for user ID: %d", userID)

		// Find all borrow requests for the user's items
		var borrowRequests []models.BorrowRequest
		if result := db.Joins("JOIN items ON borrow_requests.item_id = items.id").
			Where("items.seller_id = ?", userID).
			Preload("Item").
			Preload("Buyer").
			Find(&borrowRequests); result.Error != nil {
			log.Printf("Failed to fetch borrow requests: %v", result.Error)
			http.Error(w, "Failed to fetch borrow requests: "+result.Error.Error(), http.StatusInternalServerError)
			return
		}
		
		log.Printf("Found %d borrow requests for user ID %d", len(borrowRequests), userID)
		
		// Log the first few requests for debugging
		if len(borrowRequests) > 0 {
			for i, req := range borrowRequests {
				if i < 3 { // Log only the first 3 requests to avoid flooding the logs
					log.Printf("Request %d: ID=%d, ItemID=%d, BuyerID=%d, Status=%s", 
						i, req.ID, req.ItemID, req.BuyerID, req.Status)
				}
			}
		}

		// Set the content type header
		w.Header().Set("Content-Type", "application/json")
		
		// Encode the response
		if err := json.NewEncoder(w).Encode(borrowRequests); err != nil {
			log.Printf("Error encoding response: %v", err)
			http.Error(w, "Error encoding response: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}
}