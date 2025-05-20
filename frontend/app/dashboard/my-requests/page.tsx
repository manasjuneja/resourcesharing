"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import type { BorrowRequest } from "@/lib/types"
import { format } from "date-fns"

export default function MyRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<BorrowRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.get("/api/my-requests")
        setRequests(response.data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch your borrow requests",
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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Borrow Requests</h1>

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
            <p className="mt-2 text-center text-muted-foreground">You haven't requested to borrow any items yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="line-clamp-1">{request.item.title}</CardTitle>
                  <Badge
                    variant={
                      request.status === "pending"
                        ? "outline"
                        : request.status === "approved"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold">Item Details</h3>
                    <p className="text-sm">Category: {request.item.category}</p>
                    <p className="text-sm">Owner: {request.item.seller.name}</p>
                    <p className="text-sm">Location: {request.item.location}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Borrowing Period</h3>
                    <p className="text-sm">From: {format(new Date(request.startDate), "PPP")}</p>
                    <p className="text-sm">To: {format(new Date(request.endDate), "PPP")}</p>
                  </div>
                </div>
                {request.message && (
                  <div className="mt-4">
                    <h3 className="font-semibold">Your Message</h3>
                    <p className="text-sm">{request.message}</p>
                  </div>
                )}
                <div className="mt-4">
                  <h3 className="font-semibold">Status</h3>
                  <p className="text-sm">
                    {request.status === "pending" && "Your request is pending approval from the owner."}
                    {request.status === "approved" && "Your request has been approved! You can now borrow this item."}
                    {request.status === "denied" && "Your request has been denied by the owner."}
                    {request.status === "returned" && "You have returned this item."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
