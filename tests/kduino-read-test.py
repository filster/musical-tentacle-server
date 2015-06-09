# -*- coding: utf-8 -*-
"""
Created on Mon Jun 08 19:33:18 2015

@author: fvelickovski
"""

import serial
import requests
import json

ser = serial.Serial('COM5')  # open first serial port
print ser.name          # check which port was really used


# Data management service - file upload service
KDUINO_TOKEN = "UYicPhFYv_Z_mxbdOm-BCHS_9dOVxcB3CQcX-V-_mGE"
THINGS_URL = "https://api.thethings.io/v2/things"



for i in range(1000):
  line = ser.readline()
  print line
  payload = {'values': [{'key':'sensors', 'value':line}]}
  r = requests.post(THINGS_URL+ '/' + KDUINO_TOKEN, data=json.dumps(payload))
  things_reply = r.json()
        
  if things_reply['status'] == 'success':
    print 'sent ' + line




ser.close()             # close port

