import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Cart, ItemInventory, Order, UserAddressTable } from '../../model';
import { forkJoin, Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EcomService {

  constructor(private http: HttpClient) {
   }
   private apiUrl = 'http://localhost:5000';

   addNewItemWithImages(item: ItemInventory, files: File[]): void {
   
    // Send item data to `addNewItem` endpoint
    this.http.post<string[]>(`${this.apiUrl}/addNewItem`, item)
      .pipe(
        switchMap((presignedUrls: string[]) => {
          // Upload each image to S3 using the presigned URLs returned from the backend
          const uploadObservables = files.map((file, index) => {
            const url = presignedUrls[index];
            return this.http.put(url, file);
          });
          return forkJoin(uploadObservables);
        })
      )
      .subscribe(
        () => {
          console.log("Product and images uploaded successfully!");
        },
        (error) => {
          console.error("Error uploading product or images to S3:", error);
        }
      );
  }

  deleteItem(itemId: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/deleteItem/${itemId}`);
  }

  updateItem(itemId: number, item: ItemInventory): Observable<ItemInventory> {
    return this.http.post<ItemInventory>(`${this.apiUrl}/updateItem/${itemId}`, item);
  }

  checkOrderStatus(orderId: number): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/getOrderStatus/${orderId}`);
  }

  getAllItems(): Observable<ItemInventory[]> {
    return this.http.get<ItemInventory[]>(`${this.apiUrl}/getAllItems`);
  }

  getItemById(itemId: number): Observable<ItemInventory> {
    return this.http.get<ItemInventory>(`${this.apiUrl}/getItemById/${itemId}`);
  }

  createCart(userId: string): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/createCart/${userId}`);
  }

  addItemToCart(userId: string, itemId: number, quantity: number): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/addItemToCart/${itemId}/quantity/${quantity}`, {}, {
      params: { userId: userId }
    });
  }

  setUserAddress(userAddress?: UserAddressTable): Observable<UserAddressTable> {
    return this.http.post<UserAddressTable>(`${this.apiUrl}/userAddress`, userAddress);
  }

  getUserAddress(userId: string): Observable<UserAddressTable> {
    return this.http.get<UserAddressTable>(`${this.apiUrl}/getUserAddress/${userId}`);
  }

  removeItemFromCart(userId: string, itemCartId: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/removeItemFromCart/itemCartId/${itemCartId}`, {
      params: { userId: userId }
    });
  }

  placeOrder(userId: string): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/createOrder/${userId}`, {});
  }

  viewCart(userId: string): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/getCart/${userId}`);
  }

  viewOrders(userId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/getOrders/${userId}`);
  }


}
