import { Component } from '@angular/core';
import { ClientOrdersComponent } from './client-orders/client-orders.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',

  imports: [ClientOrdersComponent],
  standalone: true,
})
export class AppComponent {
  title = 'frontend';
}
