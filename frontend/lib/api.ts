import axios from "axios"

// Create an axios instance with default config
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
})

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      console.log(`Adding token to ${config.method?.toUpperCase()} request: ${config.url}`)
      config.headers["Authorization"] = `Bearer ${token}`
    } else {
      console.warn(`No token found for ${config.method?.toUpperCase()} request: ${config.url}`)
    }
    return config
  },
  (error) => {
    console.error("Request interceptor error:", error)
    return Promise.reject(error)
  },
)

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.method?.toUpperCase()} ${response.config.url}: Status ${response.status}`)
    return response
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status ${error.response.status}`)
      console.error("Response data:", error.response.data)
      
      if (error.response.status === 401) {
        // Unauthorized - clear token and redirect to login
        console.warn("Unauthorized access - redirecting to login")
        localStorage.removeItem("token")
        window.location.href = "/login"
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("API Error: No response received", error.request)
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("API Error:", error.message)
    }
    return Promise.reject(error)
  },
)

export default api