import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Client {
  _id: string;
  nom: string;
  age: number;
  email: string;
}

export interface Produit {
  _id: string;
  libelle: string;
  pu: number;
}

export interface LigneCommand {
  _id: string;
  qte: number;
  produit: Produit;
}

export interface Command {
  _id: string;
  date: Date;
  client: string;
  lignes: LigneCommand[];
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = 'http://localhost:3000';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  constructor(private http: HttpClient) {}

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}/clients`);
  }

  getClientCommands(clientId: string): Observable<Command[]> {
    return this.http.get<Command[]>(`${this.apiUrl}/commands/${clientId}`);
  }

  updateQuantity(
    commandId: string,
    ligneId: string,
    qte: number
  ): Observable<Command> {
    return this.http.patch<Command>(
      `${this.apiUrl}/commands/${commandId}/ligne/${ligneId}`,
      { qte },
      this.httpOptions
    );
  }
}
