import json
from datetime import datetime
import requests
import random
from flask import Response
import gevent
from gevent import Greenlet
from gevent.queue import Queue


from flask import request
from app import app

subscriptions = []



class SensorSimulator(Greenlet):
    def __init__(self):
        # initialise the SensorSimulator
        Greenlet.__init__(self)
        self.active = False
        self.mode = "offline"
        self.KDUINO_FILE = app.config['KDUINO_OFFLINE_FILE']
        self.postThings = False
        self.random = random.Random()
        self.random.seed(42)
        self.max_random_number = 10000
        self.delay = app.config['SIMULATION_DELAY']
        self.start()
        
    def play(self):
        self.active = True
        
    def stop(self):
        self.active = False
        
        
    def __get_sensor_data(self):
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
        
        
        payload = {'values': [{'key':'sensors', 'value':sensor_payload, 'datetime': currentDateTime}]}
        if (self.postThings):
          
          r = requests.post(app.config['THINGS_URL'] + '/' + app.config['KDUINO_TOKEN'], data=json.dumps(payload))
          things_reply = r.json()
        
          if things_reply['status'] == 'success':
            app.logger.debug('sent %s' % (str(payload)) )
          else:
            app.logger.debug('unable to send %s' % (str(payload)) )
        
        # also tell anyone else listening on the live stream
        def notify(message):
            app.logger.debug('notifying %d subscribers with %s' % (len(subscriptions), message) )
            
            # notify subscribers
            for sub in subscriptions:
                sub.put(message)
       

        # notfy event stream connections        
        gevent.spawn(notify, payload)
        
    def _run(self):
        while (True):
          if not self.active:
              # while we are not getting sensor data keep sleeping in short breaks
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
                yield json.dumps(reading) + '\n\n'
        except GeneratorExit: # Or maybe use flask signals
            subscriptions.remove(q)

    return Response(event_stream(), mimetype="text/event-stream")

# flag an observation as not suitable (e.g. not water)
# TODO the method below needs to be realigned with MARIS PHP flagging
# so temporarily commented out
# @app.route('/observation/flag', methods=['POST'])
# def incrermentFlagCount():
  # payload=request.get_json(force=True)
  
  # app.logger.debug('request data:%s' % payload)
  
  # hash_id = payload['hash_id']
  
  # # retrieve from citclops DB
  # try:
    # conn = psycopg2.connect(DB_CONNECTION)

    # # Open a cursor to perform database operations
    # cur = conn.cursor()
    
    # sqlSelect = "SELECT record_id, flagged_count from %s WHERE hash_id ='%s'" % (OBSERVATION_TABLE, hash_id)
    # cur.execute(sqlSelect)
    
    # if (cur.rowcount == 0):
      # raise Exception("There is no sample with given hash ID")
    # elif (cur.rowcount > 1):
      # raise Exception("Multiple samples with the same hash ID")      
    
    # (record_id, flagged_count) = cur.fetchone()
    
    # app.logger.debug('selected record %d with flag count %d' % (record_id, flagged_count))

    # # make sure a valid integer is retrieved otherwise set to 0
    # try:
      # flagged_count = int(flagged_count)
    # except ValueError:
      # flagged_count = 0
      
    # # increment the flagcount
    # flagged_count += 1
    
    # # Execute the query to insert the observation into the metadata
    # # table of the citclops database
    # sqlUpdate = "UPDATE %s SET (flagged_count) = (%d) WHERE record_id = %d" %  (OBSERVATION_TABLE, flagged_count, record_id)
    # app.logger.debug('executing sql:\n%s', sqlUpdate)

    # cur.execute(sqlUpdate)
    
    # app.logger.debug('updated record %d with flag count %d' % (record_id, flagged_count))


    # # Make the changes to the database persistent
    # conn.commit()
  # except Exception as exc:
    # app.logger.error("Did not update observation flagcount in database correctly: %s" % (exc))
    # raise
  # finally:
        # # Close communication with the database
        # cur.close()
        # conn.close()

  # # update citclops DB
  # return 'flag count for (record id %d, hash id %r) is %d' % (hash_id, record_id, flagged_count)
  
  

   