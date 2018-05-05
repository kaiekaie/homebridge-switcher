#include <NewRemoteReceiver.h>
#include <NewRemoteTransmitter.h>

String inData = "";
const byte numChars = 255; // max number of received chars
char receivedChars[numChars]; 
boolean newData = false; // was a full new string received?


void setup() {
  // put your setup code here, to run once:
Serial.begin(9600);
  Serial.setTimeout(100);
Serial.println("open");



}

void loop() {


receiveSerialData();
sendCodes();
}

String getValue(String data, char separator, int index) {
  int found = 0;
  int strIndex[] = {0, -1};
  int maxIndex = data.length()-1;
  for(int i=0; i<=maxIndex && found<=index; i++){
    if(data.charAt(i) == separator || i==maxIndex){
      found++;
      strIndex[0] = strIndex[1]+1;
      strIndex[1] = (i == maxIndex) ? i+1 : i;
    }
  }
  return found>index ? data.substring(strIndex[0], strIndex[1]) : "";
}


void receiveSerialData() {
    static byte ndx = 0;
    char endMarker = '\n';
    char rc;   
    if (Serial.available() > 0) {
        rc = Serial.read();
       
      
   
        if (rc != endMarker) {
            receivedChars[ndx] = rc;
            ndx++;
            if (ndx >= numChars) {
                ndx = numChars - 1;
            }
        }
        else {
            receivedChars[ndx] = '\0'; // terminate the string
            ndx = 0;
            newData = true;
        }
    }
}

void sendCodes (){


   if (newData == true) {
        long remoteid = getValue(receivedChars, '/', 0).toInt();
        byte id = getValue(receivedChars, '/', 1).toInt();
        boolean ison = getValue(receivedChars, '/', 2).toInt();
        NewRemoteTransmitter transmitter(remoteid, 3, 256);
        transmitter.sendUnit(id, ison);
       Serial.println(remoteid);
       Serial.println(id);
       Serial.println(ison);
       Serial.println("OK");
        
        newData = false;
    }

   

      //transmitter.sendGroup(isOn);


    

  
   
}

