import json
from datetime import datetime
import requests
import random
from flask import Response
import gevent
from gevent import Greenlet
from gevent.queue import Queue
from serial import Serial, SerialException


from flask import request
from app import app

subscriptions = []

def parseSensorString(line):
  parts = line.strip().split(' ')
  sensor1 = int(parts[3])
  sensor2 = int(parts[5])
  sensor3 = int(parts[7])
  sensor4 = int(parts[9])
  sensor5 = int(parts[11])
  sensor6 = int(parts[13])
  
  return (sensor1, sensor2, sensor3, sensor4, sensor5, sensor6)

# SSE "protocol" is described here: http://mzl.la/UPFyxY
class ServerSentEvent(object):

    def __init__(self, data):
        self.data = data
        self.event = None
        self.id = None
        self.desc_map = {
            self.data : "data",
            self.event : "event",
            self.id : "id"
        }

    def encode(self):
        if not self.data:
            return ""
        lines = ["%s: %s" % (v, k) 
                 for k, v in self.desc_map.iteritems() if k]
        
        return "%s\n\n" % "\n".join(lines)

class SensorSimulator(Greenlet):
    def __init__(self):
        # initialise the SensorSimulator
        Greenlet.__init__(self)
        print 'initializing sensor simulator / reader'
        self.active = False
        self.mode = app.config['MODE']
        self.KDUINO_FILE = app.config['KDUINO_OFFLINE_FILE']
        self.postThings = False
        self.random = random.Random()
        self.random.seed(42)
        self.max_random_number = 10000
        self.delay = app.config['SIMULATION_DELAY']
        self.start()
        
        self.thingsio_error_counter = 0
        self.read_error_counter = 0
        
    def play(self):
        self.active = True
        
    def stop(self):
        self.active = False
        
    # this is a generator function    
    def __get_sensor_data(self):
        (sensor1, sensor2, sensor3, sensor4, sensor5, sensor6) = (0,0,0,0,0,0)
        
        if self.mode == 'offline':
        ## offline mode is for reading from kduino sensor log file
            # keep cycling over the file while we are active
            while self.active:
                for line in open(self.KDUINO_FILE, 'r'):
                    parts = line.split(' ')
                    sensor1 = int(parts[3])
                    sensor2 = int(parts[5])
                    sensor3 = int(parts[7])
                    sensor4 = int(parts[9])
                    sensor5 = int(parts[11])
                    sensor6 = int(parts[13])
                    yield [sensor1, sensor2, sensor3, sensor4, sensor5, sensor6]
                    # go to sleep for a delay amount
                    gevent.sleep(self.delay)
                    if not  self.active:
                        break
        elif self.mode == 'online':
        ## Read values from the sensor
          try:
            ser = Serial(app.config['SERIAL_PORT'])  # open first serial port
            
            while self.active:
                line = ser.readline()
                app.logger.debug('Recieved <' + line + '> from KdUINO')
                
                try:
                  (sensor1, sensor2, sensor3, sensor4, sensor5, sensor6) = parseSensorString(line)
                except:
                  app.logger.error('Could parse <' + line + '> from KdUINO, using previous values')
                  pass
                
                yield [sensor1, sensor2, sensor3, sensor4, sensor5, sensor6]
                gevent.sleep(0.1)
                  
          except SerialException:
            app.logger.error('There was an error receiving data from the KdUINO')
            self.active = False
            pass
          finally:
            # close the connection
            try:
              ser.close()
            except:
              pass
        elif self.mode == 'test':
        ## test mode is for genorating random numbers
            while self.active:
                yield [self.random.randint(0,self.max_random_number) for i in range(6)]
                # go to sleep for a delay amount
                gevent.sleep(self.delay)

    
    def __send_sensor_data(self, sensor_array):
        app.logger.debug('sending sensor data...')
        
        currentDateTime = datetime.utcnow().isoformat()
                          
        sensor_payload = { "measurments" : {
                              "sensor1": sensor_array[0],
                              "sensor2": sensor_array[1],
                              "sensor3": sensor_array[2],
                              "sensor4": sensor_array[3],
                              "sensor5": sensor_array[4],
                              "sensor6": sensor_array[5],                              
                              } }
        
        
        payload = {'values': [{'key':'light', 'value':sensor_payload, 'datetime': currentDateTime}]}
        if (self.postThings):
          try:
            r = requests.post(app.config['THINGS_URL'] + '/' + app.config['KDUINO_TOKEN'], data=json.dumps(payload))
            things_reply = r.json()
        
            if things_reply['status'] == 'success':
              app.logger.debug('sent %s' % (str(payload)) )
            else:
              app.logger.debug('unable to send %s' % (str(payload)) )
              self.thingsio_error_counter += 1
          except:
            app.logger.debug('unable to send %s' % (str(payload)) )
            self.thingsio_error_counter += 1
            pass
          
          app.logger.debug('currently there are %d TheThingsIO post errors' % (self.thingsio_error_counter) )
        

            
        
       
        self.notify(payload)

        # notfy event stream connections        
        #gevent.spawn(notify, payload)
        # also tell anyone else listening on the live stream

    def notify(self, message):
      app.logger.debug('notifying %d subscribers with %s' % (len(subscriptions), message) )
      
      # notify subscribers
      for sub in subscriptions:
          sub.put(message)
        
    def _run(self):
        while (True):
          if not self.active:
              # while we are not getting sensor data keep sleeping in short breaks
              print 'zzz....'
              gevent.sleep(self.delay)
          else:
            for sensor_array in self.__get_sensor_data():
              self.__send_sensor_data(sensor_array)
    

sensorSimulator = SensorSimulator()

@app.route('/v1/simulator/start')
def start_simulator():
    app.logger.debug("starting kduino sensor simulator...")
        
    postThings = (request.args.get('postThings', "false") == "true")
    sensorSimulator.postThings = postThings
    
    sensorSimulator.play()
    return json.dumps({'status':'started'})

@app.route('/v1/simulator/stop')
def stop_simulator():
    app.logger.debug("stopping kduino sensor simulator...")
    sensorSimulator.stop()
    return json.dumps({'status':'stopped'})
    
@app.route('/v1/simulator/status')
def status_simulator():
    app.logger.debug("sending status of simulator...")
    
    if sensorSimulator.active:
      return json.dumps({'status':'started'})
    else:
      return json.dumps({'status':'stopped'})
      

@app.route("/v1/simulator/stream")
def event_streaming():
    def event_stream():
        q = Queue()
        subscriptions.append(q)
        try:
            for reading in q:
                ev = ServerSentEvent(json.dumps(reading))
                yield ev.encode()
        except GeneratorExit: # Or maybe use flask signals
            subscriptions.remove(q)

    return Response(event_stream(), mimetype="text/event-stream")



   