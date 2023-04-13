import { Component } from '@angular/core';
import { MqttClientService } from '../mqtt-client.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  isOpen = false;
  popupMessage = '';
  constructor(
    private mqttClientService: MqttClientService,
    private router: Router
  ) {}
  establishConnection() {
    const isConnected = this.mqttClientService.connect();
    if (isConnected) {
      this.router.navigate(['/warehouse'], {
        queryParams: { connected: true },
      });
      this.isOpen = false;
    } else {
      this.popupMessage = 'Connection failed, please try again';
      this.isOpen = true;
    }
  }
}
