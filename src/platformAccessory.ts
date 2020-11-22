import { Service, PlatformAccessory, CharacteristicValue, CharacteristicSetCallback, CharacteristicGetCallback } from 'homebridge';
import { ExampleHomebridgePlatform } from './platform';

export class ExamplePlatformAccessory {
  private service: Service;
  private lastPosition = 100;
  private moving = false;
  private duration = 10;

  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Somfy')
      .setCharacteristic(this.platform.Characteristic.Model, 'RTS')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.voletUniqueId)
      .setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.voletName);

    // get the WindowCovering service if it exists, otherwise create a new WindowCovering service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.WindowCovering) ||
                   this.accessory.addService(this.platform.Service.WindowCovering);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.voletName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/WindowCovering

    // register handlers for the Target Position Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.TargetPosition)
      .on('set', this.handleTargetPositionSet.bind(this))                // SET - bind to the `setOn` method below
      .on('get', this.handleTargetPositionGet.bind(this));               // GET - bind to the `getOn` method below

    // register handlers for the CurrentPosition Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .on('get', this.handleCurrentPositionGet.bind(this));       // GET - bind to the 'setBrightness` method below

    // register handlers for the PositionState Characteristic
    this.service.getCharacteristic(
      this.platform.Characteristic.PositionState).updateValue(this.platform.Characteristic.PositionState.STOPPED);
  }

  handleTargetPositionSet(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    if (this.moving) {
      this.platform.log.debug('stop' + this.accessory.displayName);
      this.platform._myClient.publish(this.accessory.context.device.voletTopic, 's');
    } else if ((value > this.lastPosition) || (this.lastPosition === 0)){
      this.platform.log.debug('moveup' + this.accessory.displayName);
      this.platform._myClient.publish(this.accessory.context.device.voletTopic, 'u');
      this.lastPosition = 100;
      this.moving = true;
      setTimeout(()=> this.moving = false, this.duration);
    } else {
      this.platform.log.debug('movedown'+ this.accessory.displayName);
      this.platform._myClient.publish(this.accessory.context.device.voletTopic, 'd');
      this.lastPosition = 0;
      this.moving = true;
      setTimeout(()=> this.moving = false, this.duration);
    }
    callback(null);
  }

  handleTargetPositionGet(callback: CharacteristicGetCallback) {
    callback(null, this.lastPosition);
  }

  handleCurrentPositionGet(callback: CharacteristicSetCallback) {
    callback(null, this.lastPosition);
  }

}
