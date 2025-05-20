"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import type { BorrowRequest } from "@/lib/types"
import { format } from "date-fns"

export default function RequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<BorrowRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        console.log("Fetching borrow requests for seller...")
        const response = await api.get("/api/my-items/requests")
        
        // Log the raw response data for debugging
        console.log("Raw API response:", JSON.stringify(response.data, null, 2))
        
        // Check if the response data is an array
        if (!Array.isArray(response.data)) {
          console.error("API response is not an array:", response.data)
          setDebugInfo(`API response is not an array: ${JSON.stringify(response.data)}`)
          setRequests([])
          return
        }
        
        // Map the response data to ensure all required fields are present
        const mappedRequests = response.data.map((req: any) => {
          // Log each request for debugging
          console.log("Processing request:", req)
          
          // Check if ID exists and is a number
          if (req.ID === undefined && req.id === undefined) {
            console.error("Request is missing ID:", req)
          }
          
          // Create a properly structured request object
          return {
            // Try both capitalized and lowercase field names
            id: req.id || req.ID,
            itemId: req.itemId || req.ItemID,
            buyerId: req.buyerId || req.BuyerID,
            status: req.status || req.Status,
            startDate: req.startDate || req.StartDate,
            endDate: req.endDate || req.EndDate,
            message: req.message || req.Message,
            item: req.item || req.Item,
            buyer: req.buyer || req.Buyer,
            createdAt: req.createdAt || req.CreatedAt,
            updatedAt: req.updatedAt || req.UpdatedAt
          }
        })
        
        console.log("Mapped requests:", mappedRequests)
        setDebugInfo(`Found ${mappedRequests.length} requests. First request: ${JSON.stringify(mappedRequests[0] || {})}`)
        setRequests(mappedRequests)
      } catch (error) {
        console.error("Error fetching borrow requests:", error)
        setDebugInfo(`Error fetching requests: ${error}`)
        toast({
          title: "Error",
          description: "Failed to fetch borrow requests",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchRequests()
    }
  }, [user])

  const handleApproveRequest = async (requestId: number) => {
    console.log(`Attempting to approve request with ID: ${requestId}`)
    
    // Validate the request ID
    if (!requestId || isNaN(requestId)) {
      console.error("Invalid request ID for approve:", requestId)
      toast({
        title: "Error",
        description: "Invalid request ID",
        variant: "destructive",
      })
      return
    }

    setActionLoading(requestId)
    try {
      const url = `/api/borrow-requests/${requestId}/approve`
      console.log(`Making PUT request to: ${url}`)
      
      const response = await api.put(url)
      console.log("Approve response:", response.data)

      // Update the local state
      setRequests(requests.map((request) => 
        request.id === requestId ? { ...request, status: "approved" } : request
      ))

      toast({
        title: "Success",
        description: "Request approved successfully",
      })
    } catch (error: any) {
      console.error("Error approving request:", error)
      toast({
        title: "Error",
        description: error.response?.data || "Failed to approve request",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDenyRequest = async (requestId: number) => {
    console.log(`Attempting to deny request with ID: ${requestId}`)
    
    // Validate the request ID
    if (!requestId || isNaN(requestId)) {
      console.error("Invalid request ID for deny:", requestId)
      toast({
        title: "Error",
        description: "Invalid request ID",
        variant: "destructive",
      })
      return
    }

    setActionLoading(requestId)
    try {
      const url = `/api/borrow-requests/${requestId}/deny`
      console.log(`Making PUT request to: ${url}`)
      
      const response = await api.put(url)
      console.log("Deny response:", response.data)

      // Update the local state
      setRequests(requests.map((request) => 
        request.id === requestId ? { ...request, status: "denied" } : request
      ))

      toast({
        title: "Success",
        description: "Request denied successfully",
      })
    } catch (error: any) {
      console.error("Error denying request:", error)
      toast({
        title: "Error",
        description: error.response?.data || "Failed to deny request",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Borrow Requests</h1>
      
      {/* Debug information */}
      <div className="p-4 bg-gray-100 rounded-md text-xs font-mono overflow-auto max-h-40">
        <p>Debug Info: {debugInfo}</p>
        <p>Number of requests: {requests.length}</p>
        {requests.length > 0 && (
          <div>
            <p>First request ID: {requests[0].id}</p>
            <p>First request data: {JSON.stringify(requests[0], null, 2)}</p>
          </div>
        )}
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10 text-muted-foreground"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 10h10" />
                <path d="M7 14h10" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold">No borrow requests</h2>
            <p className="mt-2 text-center text-muted-foreground">
              You don't have any borrow requests for your items yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="line-clamp-1">
                    Request for: {request.item?.title || "Unknown Item"}
                  </CardTitle>
                  <Badge
                    variant={
                      request.status === "pending"
                        ? "outline"
                        : request.status === "approved"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {request.status?.charAt(0).toUpperCase() + request.status?.slice(1) || "Unknown"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold">Borrower Details</h3>
                    <p className="text-sm">{request.buyer?.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{request.buyer?.email || "No email"}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Borrowing Period</h3>
                    <p className="text-sm">
                      From: {request.startDate ? format(new Date(request.startDate), "PPP") : "Unknown"}
                    </p>
                    <p className="text-sm">
                      To: {request.endDate ? format(new Date(request.endDate), "PPP") : "Unknown"}
                    </p>
                  </div>
                </div>
                {request.message && (
                  <div className="mt-4">
                    <h3 className="font-semibold">Message</h3>
                    <p className="text-sm">{request.message}</p>
                  </div>
                )}
                
                {/* Request details for debugging */}
                <div className="mt-4 p-2 bg-gray-50 rounded text-xs">
                  <p>Request ID: {request.id || "Missing"}</p>
                  <p>Item ID: {request.itemId || "Missing"}</p>
                  <p>Buyer ID: {request.buyerId || "Missing"}</p>
                  <p>Status: {request.status || "Missing"}</p>
                </div>
              </CardContent>
              {request.status === "pending" && (
                <CardFooter className="flex justify-end gap-2">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => {
                      if (request.id && !isNaN(Number(request.id))) {
                        handleDenyRequest(Number(request.id));
                      } else {
                        console.error("Invalid request ID for deny:", request.id);
                        toast({
                          title: "Error",
                          description: `Invalid request ID: ${request.id}`,
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={actionLoading === request.id}
                  >
                    {actionLoading === request.id ? "Processing..." : "Deny"}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      if (request.id && !isNaN(Number(request.id))) {
                        handleApproveRequest(Number(request.id));
                      } else {
                        console.error("Invalid request ID for approve:", request.id);
                        toast({
                          title: "Error",
                          description: `Invalid request ID: ${request.id}`,
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={actionLoading === request.id}
                  >
                    {actionLoading === request.id ? "Processing..." : "Approve"}
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}