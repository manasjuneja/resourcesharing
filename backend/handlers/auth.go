package handlers

import (
	"encoding/json"
	
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"resource-sharing/middleware"
	"resource-sharing/models"
)

type RegisterRequest struct {
	Email    string       `json:"email"`
	Password string       `json:"password"`
	Name     string       `json:"name"`
	Role     models.Role `json:"role"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

func Register(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Validate input
		if req.Email == "" || req.Password == "" || req.Name == "" {
			http.Error(w, "Email, password, and name are required", http.StatusBadRequest)
			return
		}

		// Check if role is valid
		if req.Role != models.RoleSeller && req.Role != models.RoleBuyer {
			http.Error(w, "Role must be either 'seller' or 'buyer'", http.StatusBadRequest)
			return
		}

		// Check if user already exists
		var existingUser models.User
		if result := db.Where("email = ?", req.Email).First(&existingUser); result.Error == nil {
			http.Error(w, "User with this email already exists", http.StatusConflict)
			return
		}

		// Hash the password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "Failed to hash password", http.StatusInternalServerError)
			return
		}

		// Create the user
		user := models.User{
			Email:    req.Email,
			Password: string(hashedPassword),
			Name:     req.Name,
			Role:     req.Role,
		}

		if result := db.Create(&user); result.Error != nil {
			http.Error(w, "Failed to create user: "+result.Error.Error(), http.StatusInternalServerError)
			return
		}

		// Generate JWT token
		token, err := generateToken(user.ID)
		if err != nil {
			http.Error(w, "Failed to generate token", http.StatusInternalServerError)
			return
		}

		// Return the token and user
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(AuthResponse{
			Token: token,
			User:  user,
		})
	}
}

func Login(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Find the user
		var user models.User
		if result := db.Where("email = ?", req.Email).First(&user); result.Error != nil {
			http.Error(w, "Invalid email or password", http.StatusUnauthorized)
			return
		}

		// Check the password
		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
			http.Error(w, "Invalid email or password", http.StatusUnauthorized)
			return
		}

		// Generate JWT token
		token, err := generateToken(user.ID)
		if err != nil {
			http.Error(w, "Failed to generate token", http.StatusInternalServerError)
			return
		}

		// Return the token and user
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(AuthResponse{
			Token: token,
			User:  user,
		})
	}
}

func GetCurrentUser(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := middleware.GetUserIDFromContext(r)
		if !ok {
			http.Error(w, "User ID not found in context", http.StatusUnauthorized)
			return
		}

		var user models.User
		if result := db.First(&user, userID); result.Error != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
	}
}

func generateToken(userID uint) (string, error) {
	// Create the claims
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 72).Unix(), // Token expires in 72 hours
	}

	// Create the token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token with the secret key
	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}