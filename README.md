
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">
<img src="https://github.com/ppapot/tostcorp/blob/master/logo_tost_corp_mai_2020_v2_0_3.png" width="150">
</p>
</p>


# Homebridge TOSTCORP Platform Plugin

This is a first TOSTCORP Homebridge platform plugin and can be used to control somfy blinds thru the TOSTCORP box delivered [here](https://www.tostcorp.com/boxsomfyrts).

This plugin is developped with the help of the platform plugin template should as defined in the  [developer documentation](https://developers.homebridge.io/). 

the platfrom plugin connect a MQTT server and will send the proper order to the specific topic of the blind : u for Up, d for Down 

The TostCorp box will subscribe to the blind topic and generate the adequate Radio Frequency message to somfy RTS blinds for up and down movement.
the following modification in the TostCorp can be done to benefit of the config.h definition of the blinds to publish the DB on MQTT. Then the DB is used by the plugin in the Topic /somfy/somfy-remote/db to instanciate accesory.

## modification of TostCorp SW :
in  PubSubClient.h change packet size to 1024
```javascript
// MQTT_MAX_PACKET_SIZE : Maximum packet size
#ifndef MQTT_MAX_PACKET_SIZE
#define MQTT_MAX_PACKET_SIZE 1024
#endif
```
in config.h add db_topic
```c
const char*     status_topic = "somfy/somfy-remote/status"; // Online / offline
const char*        ack_topic = "somfy/somfy-remote/ack"; // Commands ack "id: 0x184623, cmd: u"
const char*         db_topic = "somfy/somfy-remote/db";  // topic listing the remotes
#define PORT_TX D1 // Output data on pin 23 (can range from 0 to 31). Check pin numbering on ESP8266.
#define PORT_DIO_TX D1 // Output data on pin 23 (can range from 0 to 31). Check pin numbering on ESP8266.
```
and in tost_corp_box_somfy_rts_release_2.0.0.ino 
in line 33 to initialise the DB string :
```c
String mqtt_db = "";
```
in line 110 if you want to remove the additional wifi network generated by the box ( Optional)
```c
    WiFi.mode(WIFI_STA);
```
add in line 167 to populate the DB string from the config.h:
```c
 mqtt_db = mqtt_db + remote.mqtt_topic + ":" + remote.id + ":" + remote.description + ":" + remote.device_group + "::"; 
``` 
add in line 245 the publish of the string on the mqtt server
```c
             // update DB , message is retained 
             //mqtt.publish(db_topic, "", true); // clear previously retain message
             mqtt.publish(db_topic, mqtt_db.c_str() , true);
             Serial.print("\nLOG - Published the DB to topic : ");
             Serial.println(db_topic);
```

## TosTCorp plugin configuration
at this momemnt the config.json needs to be udapte with 3 element to ensure proper communicaation from the plugin to the MQTT server
```jason
       {
            "mqttIP": "mqtt://xxx.xxx.xxx.xxx",
            "mqttUserName": "username",
            "mqttUserPassword": "password",
            "platform": "TostCorp"
        }
```

In the future, I hope also to offer:
 - the MQTT server hosting in the homebridge as a plugin 
 - possibility to configure the blind manually in the config.json (ongoing)

## TostCorp plugin usage

once the plugin creates dynamiquely the blinds, within the IOS Home application, you can push once to genrate a up command the next psuh will be a down command.
There is no feedback from the blind to tell the position (somfy RTS limitation), I alternate status between the completely close or open with each push.

in the future i will try to generate a stop action if we push on the blind within the 10s and consider the blind to be at value of the inital movement the following push will generate a opposite movement. the following sequence should be fine:
- up => stop (within 10s) => down 
- down => stop (within 10s) => up
- up => down (after 10s)
- down => up (after 10s) 

