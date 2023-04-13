import { Component, OnDestroy, OnInit } from '@angular/core';
import { IMqttMessage } from 'ngx-mqtt';
import { Subject, takeUntil } from 'rxjs';
import { MqttClientService } from '../mqtt-client.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-warehouse-control',
  templateUrl: './warehouse-control.component.html',
  styleUrls: ['./warehouse-control.component.scss'],
})
export class WarehouseControlComponent implements OnInit, OnDestroy {
  
  isConnection = false;
  unsubscribe$ = new Subject<void>();
  publishStartProcess = {
    topic: 'startProcess/value',
    qos: 2,
    payload: 'true',
  };
  publishStopProcess = {
    topic: 'stopProcess/value',
    qos: 2,
    payload: 'false',
  };
  publishTargetPositionFromUser = {
    topic: 'targetPositionFromUser/value',
    qos: 2,
    payload: '',
  };
  runningModeSubscription = {
    topic: 'runningMode/#',
    qos: 2,
  };
  productsInStackSubscription = {
    topic: 'productsInStack/#',
    qos: 2,
  };

  data: ViewModel | null = null;

  constructor(private mqttClientService: MqttClientService, private router: Router, private activatedRoute: ActivatedRoute) {
    this.initViewModel();
  }

  ngOnInit(): void {
    const activatedRoute = this.activatedRoute.snapshot.queryParams['connected'];
    this.isConnection = activatedRoute === 'true';
    if (this.isConnection) {
      this.data!.process = 'loading';
      this.doSubscribe();
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  startProcess() {
    if (this.isConnection) {
      this.mqttClientService.publishMessage(this.publishStartProcess);
    }
  }
  stopProcess() {
    if (this.isConnection) {
      this.mqttClientService.publishMessage(this.publishStopProcess);
    }
  }

  sendValue(positionFromUser: number) {
    if (this.isConnection) {
      this.publishTargetPositionFromUser.payload = positionFromUser.toString();
      this.mqttClientService.publishMessage(this.publishTargetPositionFromUser);
    }
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
        return 'Process Not Started';
      case 'running':
        return 'Process is running';
      case 'stopped':
        return 'Process is stopped';
      default:
        return '';
    }
  }

  disconnect() {
    this.mqttClientService.disconnect();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.isConnection = false;
    this.data = null;
    this.router.navigate(['/home']);
  }

  private initViewModel() {
    this.data = {
      warehouse: this.initWarehouse(),
      numberOfProductsInStack: 0,
      numberOfAvailableSpots: 54,
      process: 'notStarted',
    };
  }
  private initWarehouse(): WarehouseModel[] {
    const warehouse: WarehouseModel[] = [];
    for (let i = 0; i < 54; i++) {
      warehouse.push({
        isOccupied: false,
        value: 54 - i,
      });
    }
    return warehouse;
  }

  private doSubscribe() {
    this.mqttClientService
      .observeMultiple([
        this.productsInStackSubscription.topic,
        this.runningModeSubscription.topic,
      ])
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((result: IMqttMessage[]) => {
        this.getProductsInStack(result[0]);
        this.getRunningMode(result[1]);
      });
  }

  private getRunningMode(message: IMqttMessage) {
    const isRunning = message.payload.toString() === 'true';
    this.data!.process = isRunning ? 'running' : 'stopped';
  }

  private getProductsInStack(message: IMqttMessage) {
    const arrayOfValues = message.payload.toString();
    const intArray = JSON.parse(arrayOfValues).map(Number);
    this.getValues(intArray);
  }
  
  private getValues(productsInStack: number[]) {
    productsInStack.forEach((value) => {
      if (value > 0) {
        const stack = this.data!.warehouse.find((item) => item.value === value);
        if (stack) {
          stack.isOccupied = true;
        }
      }
    });
    this.getWarehouseInfo();
  }

  private getWarehouseInfo() {
    this.data!.numberOfProductsInStack = this.data!.warehouse.filter(
      (value) => value.isOccupied
    ).length;
    this.data!.numberOfAvailableSpots = this.data!.warehouse.filter(
      (value) => !value.isOccupied
    ).length;
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
type Process = 'running' | 'stopped' | 'notStarted' | 'loading';

