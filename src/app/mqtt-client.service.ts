import { Injectable } from '@angular/core';
import {
  IMqttMessage,
  IPublishOptions,
  MqttService,
} from 'ngx-mqtt';
import { Observable, combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MqttClientService {
  private connection = {
    hostname: 'broker.hivemq.com',
    port: 8000,
    path: '/mqtt',
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 4000,
    username: 'xpavlovic',
    password: 'xpavlovic',
  };
  constructor(private mqttService: MqttService) {}

  connect(): boolean {
    try {
      this.mqttService?.connect(this.connection);
    } catch (error) {
      console.log('mqtt.connect error', error);
      return false;
    }
    return true;
  }

  disconnect(): void {
    this.mqttService.disconnect();
  }

  observeMultiple(topics: string[]): Observable<IMqttMessage[]> {
    const observables = topics.map((topic) => this.mqttService.observe(topic));
    return combineLatest(observables);
  }

  publishMessage(publishPayload: {
    topic: string;
    payload: string;
    qos: number;
  }): void {
    const { topic, qos, payload } = publishPayload;
    console.log(publishPayload);
    this.mqttService.unsafePublish(topic, payload, { qos } as IPublishOptions);
  }
}
