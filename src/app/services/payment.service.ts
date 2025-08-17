import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  customerId: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:5000/api/payment';
  
  constructor(private http: HttpClient) { }
  
  createOrder(paymentRequest: PaymentRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-order`, paymentRequest);
  }
  
  verifyPayment(paymentDetails: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-payment`, paymentDetails);
  }
}
