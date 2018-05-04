#include <NewRemoteTransmitter.h>

char val;
boolean isOn = false;
char units[] = { '0', '1', '2', '3'};
String inData = "";

void setup() {
  // put your setup code here, to run once:
Serial.begin(9600);
Serial.println("open");

}

void loop() {

serialEvents();

          
}

void serialEvents(){

if(Serial.available() > 0){


  val = Serial.read();
inData.concat(val);
Serial.println(val);
 
 if (val == '\n') {
          Serial.println("cool2");
  }

for(char a : units){

  if(a == val){
      sendCodes(a);
    }
 
  }
  
}
  
}

void sendCodes (char code){

  NewRemoteTransmitter transmitter(15060610, 3, 256);

   Serial.print("isbool ");
      Serial.println(code);
if(code == '1'){
   Serial.print("TRUE "); 
}
  isOn = isOn ? false : true;
  if(code == '3'){
    Serial.print("not here");
      transmitter.sendGroup(isOn);
  }else{
    byte b = code;
  transmitter.sendUnit(b, isOn);
    
  }
  
   
}


