export interface User {
  id: number;
  email: string;
  name: string;
  role: "seller" | "buyer";
  createdAt?: string;
  updatedAt?: string;
}

export interface Item {
  id: number;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  status: "available" | "borrowed";
  location: string;
  duration: number;
  sellerId: number; 
  seller: User;
  createdAt?: string;
  updatedAt?: string;
}

export interface BorrowRequest {
  id: number;
  itemId: number;
  item: Item;
  buyerId: number;
  buyer: User;
  status: "pending" | "approved" | "denied" | "returned";
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  message: string;
  createdAt?: string;
  updatedAt?: string;
}
