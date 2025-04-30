import { Component, OnInit } from '@angular/core';
import { OrderService, Client, Command } from '../order.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-client-orders',
  templateUrl: './client-orders.component.html',

  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ClientOrdersComponent implements OnInit {
  clients: Client[] = [];
  selectedClient: string = '';
  commands: Command[] = [];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.orderService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        if (clients.length > 0) {
          this.selectedClient = clients[0]._id;
          this.loadClientCommands();
        }
      },
      error: (error) => console.error('Error loading clients:', error),
    });
  }

  today: Date = new Date();

  loadClientCommands(): void {
    if (!this.selectedClient) return;

    this.orderService.getClientCommands(this.selectedClient).subscribe({
      next: (commands) => {
        this.commands = commands;
      },
      error: (error) => console.error('Error loading commands:', error),
    });
  }

  onClientChange(): void {
    this.loadClientCommands();
  }

  updateQuantity(command: Command, ligneId: string, change: number): void {
    const ligneIndex = command.lignes.findIndex((l) => l._id === ligneId);
    if (ligneIndex === -1) return;

    const ligne = command.lignes[ligneIndex];
    const newQty = Math.max(0, ligne.qte + change);

    // If no change in quantity, do nothing
    if (newQty === ligne.qte) return;

    // Optimistic UI update (immediately show the change)
    const updatedLigne = { ...ligne, qte: newQty };
    command.lignes[ligneIndex] = updatedLigne;

    this.orderService.updateQuantity(command._id, ligneId, newQty).subscribe({
      next: (updatedCommand) => {
        // Ensure we have the latest data from server
        console.log('Quantity updated successfully on server:', updatedCommand);

        // Reload the commands to ensure we have the latest data
        this.loadClientCommands();
      },
      error: (error) => {
        console.error('Error updating quantity:', error);
        // Revert the optimistic update on error
        this.loadClientCommands();
      },
    });
  }

  calculateLineTotal(pu: number, qte: number): number {
    return pu * qte;
  }

  calculateOrderTotal(command: Command): number {
    return command.lignes.reduce((total, ligne) => {
      return total + ligne.produit.pu * ligne.qte;
    }, 0);
  }

  calculateAllOrdersTotal(): number {
    return this.commands.reduce((total, command) => {
      return total + this.calculateOrderTotal(command);
    }, 0);
  }

  calculateTotalTTC(): number {
    return this.calculateAllOrdersTotal() * 1.2; // 20% VAT
  }
}
