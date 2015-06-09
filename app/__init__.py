from flask import Flask

app = Flask(__name__)

app.config.from_object('config')


if not app.debug:
    # Initialise logging
    import logging
    formatter = logging.Formatter("%(asctime)s;%(levelname)s;%(message)s")
    from logging.handlers import RotatingFileHandler
    file_handler = RotatingFileHandler('logs/musical-tentacle.log', maxBytes=100000000, backupCount=1)
    app.logger.setLevel(logging.DEBUG)
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    app.logger.addHandler(file_handler)
    app.logger.info('Starting Musical Tentacle server...') 



from app import views, models, services







