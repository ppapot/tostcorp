import { Service, PlatformAccessory, CharacteristicValue, CharacteristicSetCallback, CharacteristicGetCallback } from 'homebridge';

import { ExampleHomebridgePlatform } from './platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ExamplePlatformAccessory {
  private service: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private state = {
    lastPosition : 100,
  };

 

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

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  handleTargetPositionSet(value: CharacteristicValue, callback: CharacteristicSetCallback) {

    if ((value > this.state.lastPosition) || (this.state.lastPosition === 0)){
      this.platform.log.debug('moveup');
      this.state.lastPosition = 100;
    } else {
      this.platform.log.debug('movedown');
      this.state.lastPosition = 0;
    }

    callback(null);
  }


  handleTargetPositionGet(callback: CharacteristicGetCallback) {
    callback(null, this.state.lastPosition);
  }

 
  handleCurrentPositionGet(callback: CharacteristicSetCallback) {
    callback(null, this.state.lastPosition);
  }

}
