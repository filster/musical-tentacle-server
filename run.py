#!./dssenv/bin/python

from app import app
from gevent.wsgi import WSGIServer

#app.run(debug=True, host = app.config['HOST'], port = app.config['PORT'])


if __name__ == "__main__":
    app.debug = True
    server = WSGIServer(('', app.config['PORT']), app)
    server.serve_forever()
    


