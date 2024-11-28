
export interface ItemInventory {
    images?: string[];
    itemId?: any;
    itemName: string;
    itemDescription: string;
    dogName: string;
    pricePerUnit: number;
    quantity?: number;
    category: string;
    subCategory?: string;
    filenames: string[]; 
    filenamesCsv?: string;
    imageUrl: string;
    maxOrderQuantity?: number;
  }
  
  export interface CartItem {
    cartItemId: number;
    cartId: number;    
    quantity: number;  
    itemInventoryId: number; 
    totalAmount: number; 
  }
  
  export interface Cart {
    cartId: number;
    userId: string;
    cartItems: CartItem[];
    lastUpdatedAt: string; 
    cartTotalAmount: number;
  }
  
  export interface Order {
    

  }

  export interface OrderItem {
    orderItemId: number;
    orderId: number;
    quantity: number;
    pricePerUnit: number;
  }
  
  export interface UserAddressTable {
    userId: string;
    username: string;
    email: string;
    phoneNumber: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefaultAddress: boolean;
    createdAt: string;
  }