import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { ExamplePlatformAccessory } from './platformAccessory';

import MqttClient from 'mqtt';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class ExampleHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];
  _myOptions = {};
  _myVolets : {
    voletUniqueId: string;
    voletName: string;
    voletTopic: string;
    voletGroup: string;
    }[] = [];


  _myClient : MqttClient.Client; 

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);
    
  

    this._myOptions = {
      keepalive: 10,
      clientId: this.config.mqttUserName,
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      will: {
        topic: 'status',
        payload: 'homebridge connexion has stopped',
        qos: 0,
        retain: false,
      },
      username: this.config.mqttUserName,
      password: this.config.mqttUserPassword,
      rejectUnauthorized: false,
    };
    
    
    this._myClient = MqttClient.connect(this.config.mqttIP, this._myOptions);
    
    this._myClient.on('connect', () => {
      this._myClient.subscribe('somfy/somfy-remote/db', (err) => {
        if (!err) {
          this._myClient.publish('somfy/somfy-remote/status', 'Homebridge connected');
          this.log.info('toscorp connected to mqtt server');
        }
      });

    });
    




    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      
      this._myClient.on('message', (topic, message) => {
        const tempDbVolets = message.toString().split('::');
        tempDbVolets.pop();
        const voletFactory = (str) => {
          const param = str.split(':');
          this.log.info('Loading accessory from MQTT:', param[2]);
          return {       
            voletUniqueId: param[1],
            voletName: param[2],
            voletTopic: param[0],
            voletGroup: param[3],         
          };
        };
        this._myVolets = tempDbVolets.map(x => voletFactory(x));
        this.discoverDevices();
        for (const volet of <{voletUniqueId: string; voletName: string; voletTopic: string; voletGroup: string}[] > this.config.volets) {
          if (this._myVolets.indexOf(volet) === -1) {
            this._myVolets.push(volet);
            this.log.info('loading and adding from config.json: ', volet.voletName);
          } else {
            this.log.info('loading but duplicate from config.json: ', volet.voletName);
          }
        }
      });
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {

    // EXAMPLE ONLY
    // A real plugin you would discover accessories from the local network, cloud services
    // or a user-defined array in the platform config.

    // loop over the discovered devices and register each one if it has not already been registered
    for (const volet of this._myVolets) {

      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(volet.voletUniqueId);

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        if (volet) {
          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

          // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
          // existingAccessory.context.device = device;
          // this.api.updatePlatformAccessories([existingAccessory]);

          // create the accessory handler for the restored accessory
          // this is imported from `platformAccessory.ts`
          new ExamplePlatformAccessory(this, existingAccessory);
          
          // update accessory cache with any changes to the accessory details and information
          this.api.updatePlatformAccessories([existingAccessory]);
        } else if (!volet) {
          // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
          // remove platform accessories when no longer present
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
          this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        }
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', volet.voletName);

        // create a new accessory
        const accessory = new this.api.platformAccessory(volet.voletName, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = volet;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new ExamplePlatformAccessory(this, accessory);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }
}