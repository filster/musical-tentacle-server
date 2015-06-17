import os


# Musical Tentacle server deployment
# 0.0.0.0 listens for outside connections
PORT = 5111

TITLE = 'Musical Tentacle'


basedir = os.path.abspath(os.path.dirname(__file__))

CSRF_ENABLED = True
SECRET_KEY = 'you-will-never-guess'

# Simulator Setting
MODE = 'online'
SERIAL_PORT = 'COM7'

KDUINO_OFFLINE_FILE = "./app/playback/kduino.out"
SIMULATION_DELAY = 1.0

# TheThingsIO Config
#KDUINO_TOKEN = "UYicPhFYv_Z_mxbdOm-BCHS_9dOVxcB3CQcX-V-_mGE"
#KDUINO_TOKEN = "QowRU44x2aDpU1xeEiXy40B99gYJnL7IXmEirpQ5M90"

THINGS_URL = "https://api.thethings.io/v2/things"
KDUINO_TOKEN = "Ih4acoVcAB_Vwvk-Rudjys4Hz-Q5eO1nKWlFN-_Za5w"
