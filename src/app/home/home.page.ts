import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  IMqttMessage,
  IMqttServiceOptions,
  IPublishOptions,
  MqttService,
} from 'ngx-mqtt';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  client: MqttService | undefined;
  connection = {
    hostname: 'broker.hivemq.com',
    port: 8000,
    path: '/mqtt',
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 4000,
    username: 'xpavlovic',
    password: 'xpavlovic',
  };
  isConnection = false;
  subscribeSuccess = false;
  unsubscribe$ = new Subject<void>();
  publishStartProcess = {
    topic: 'startProcess/value',
    qos: 1,
    payload: 'true',
  };
  publishStopProcess = {
    topic: 'stopProcess/value',
    qos: 1,
    payload: 'false',
  };
  publishTargetPositionFromUser = {
    topic: 'targetPositionFromUser/value',
    qos: 1,
    payload: '',
  };
  targetPositionSubscription = {
    topic: 'targetPosition/#',
    qos: 1,
  };
  productsInStackSubscription = {
    topic: 'productsInStack/#',
    qos: 1,
  };

  data: ViewModel | null = null;
  
  constructor(private _mqttService: MqttService) {
    this.client = this._mqttService;
    this.initViewModel();
  }

  private initViewModel() {
    this.data = {
      warehouse: this.initWarehouse(),
      numberOfProductsInStack: 0,
      numberOfAvailableSpots: 54,
      process: 'notStarted'
    }
  }
  private initWarehouse(): WarehouseModel[] {
    const warehouse: WarehouseModel[] = [];
    for (let i = 0; i < 54; i++) {
      warehouse.push({
        isOccupied: false,
        value: 54-i
      });      
    }
    return warehouse;
  }

  ngOnInit(): void {
    try {
      this.client?.connect(this.connection as IMqttServiceOptions);
    } catch (error) {
      console.log('mqtt.connect error', error);
    }
    this.client?.onConnect.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(() => {
      this.isConnection = true;
      console.log('Connection succeeded!');
      this.doSubscribe();
      
    });

    this.client?.onError.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((error: any) => {
      this.isConnection = false;
      console.log('Connection failed', error);
    });
    
  }
  

  
  private doSubscribe() {
    this.client?.observe(this.productsInStackSubscription.topic, {qos: 1}).pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((message: IMqttMessage) => {
      this.subscribeSuccess = true;
      const arrayOfValues = message.payload.toString();
      const intArray = JSON.parse(arrayOfValues).map(Number);
      this.getValues(intArray);
    });
    
  }
  private getValues(productsInStack: number[]){   
    productsInStack.forEach(value => {
      if(value > 0){
        const stack = this.data!.warehouse.find(item => item.value === value);
        if(stack) {
          stack.isOccupied = true;
        }          
      }
    });
    this.getWarehouseInfo();
  }

  startProcess() {
    if (this.isConnection) {
      const { topic, qos, payload } = this.publishStartProcess;
      console.log(this.publishStartProcess);
      this.client?.unsafePublish(topic, payload, { qos } as IPublishOptions);
      this.data!.process = 'running';
    }
  }
  stopProcess() {
    if (this.isConnection) {
      const { topic, qos, payload } = this.publishStopProcess;
      console.log(this.publishStopProcess);
      this.client?.unsafePublish(topic, payload, { qos } as IPublishOptions);
      this.data!.process = 'stopped';
    }
  }

  sendValue(positionFromUser: number) {
    if(this.isConnection) {
      this.publishTargetPositionFromUser.payload = positionFromUser.toString();
      const { topic, qos, payload } = this.publishTargetPositionFromUser;
      console.log(this.publishTargetPositionFromUser);
      this.client?.unsafePublish(topic, payload, {qos} as IPublishOptions );
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  getStateColor(processState: Process): string | undefined {
    switch (processState) {
      case 'notStarted':
        return;
      case 'running':
        return 'success';
      case 'stopped':
        return 'danger';   
      default:
        return;
    }
  }

  getStateText(processState: Process): string {
    switch (processState) {
      case 'notStarted':
        return "Process Not Started";
      case 'running':
        return "Process is running";
      case 'stopped':
        return "Process is stopped";
      default:
        return "";
    }
  }

  getWarehouseInfo() {
    this.data!.numberOfProductsInStack = this.data!.warehouse.filter(value => value.isOccupied).length;
    this.data!.numberOfAvailableSpots = this.data!.warehouse.filter(value => !value.isOccupied).length;
  }
}

interface ViewModel {
  warehouse: WarehouseModel[];
  numberOfProductsInStack: number;
  numberOfAvailableSpots: number;
  process: Process;
}

interface WarehouseModel {
  isOccupied: boolean;
  value: number;
}
type Process = 'running' | 'stopped' | 'notStarted';
