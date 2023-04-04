import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { IMqttServiceOptions, MqttModule } from 'ngx-mqtt';

export const connection: IMqttServiceOptions = {
  hostname: 'broker.hivemq.com',
  port: 8000,
  path: '/mqtt',
  clean: true, 
  connectTimeout: 4000, 
  reconnectPeriod: 4000, 
  username: 'xpavlovic',
  password: 'xpavlovic',
  protocol: 'ws',
  connectOnCreate: false,
}
/*const mqttServiceConfig: IMqttServiceOptions = {
  username: 'xpavlovic',
  password: 'xpavlovic',
  keepalive: 60,
  reconnectPeriod: 4000,
  url: 'mqtt://broker.hivemq.com:1883',
};*/
@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, MqttModule.forRoot(connection)],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
