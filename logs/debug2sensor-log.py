'''
' Read debug log file, and converrt it to a sensor log file
' wherever there is a sensor reading of more than a threshold
' value
'''


AMBIENT_INTENSITY = 10
count = 0
filter_count = 0

RECEIVED_MISSPELT = 'Recieved'

with open('kduino.out', 'w') as fsensorlog:
  for line in open('musical-tentacle.log'):
    line = line.strip()
    parts = line.split(';')
    if (len(parts) >= 3) and (parts[1] == 'DEBUG') and parts[2].startswith(RECEIVED_MISSPELT):
      parts = parts[2].split('<')
      sensor_log_line = parts[1].strip()
      
      parts = sensor_log_line.split(' 00 ')
  
      if len(parts) >= 2:
        sensor_key_values = parts[1].strip()
        parts = sensor_key_values.split(' ')
        values = [float(parts[2*i + 1]) for i in range( len(parts) / 2 )]    
        max_value = max(values)
        
        count += 1
        
        if (max_value >= AMBIENT_INTENSITY):
          fsensorlog.write(sensor_log_line + '\n');
          filter_count += 1
    
  
print '%d from %d sensor readings extracted' %  (filter_count, count)


  
  
