function listen_to_sensors()
{
  if(LISTEN_THINGSIO)
  {
	  console.log('subscribing to the ThingsIO socket...');
			var email = 'sonar@bdigital.org'
			var password = 'sonar2015';
			var app = 'pkdMN02PIAO9gg';
			
			// get the thethings.IO session token
			$.post( "https://api.thethings.io/v2/login", {"email": email, "password": password, "app": app}, function(data) {
					console.log("LOGIN success; token: " + data.token);
					st = data.token;
					// autenticate to the thething.IO's socket.io service 
					//autenticate();
					subscribe();
				  }, "json")
				  .fail(function(data) 
				  {
					console.log("LOGIN ERROR:");
					console.log(data);
				  });	  
	  
  }
  else
  {
	console.log('subscribing to the local data stream...');
	var evtSrc = new EventSource("/v1/simulator/stream");
    evtSrc.onmessage = new_data_from_sensor;
  }
}


function subscribe(){
			//First, you have to connect to thethings.iO’s websocket server ws.thethings.io , and v2 namespace
			socket = io.connect('https://ws.thethings.io/v2', { forceNew: true });

			// *** WEBSOCKET EVENTS HANDLERS: ***
			// connect event: Authenticate with the session token
			socket.on('connect', function() {
				autenticate();
				console.log("connected");
			});
			
			// autenticate event: Once we are authenticated we can start subscribing to the things and user’s topics:
			socket.on('authenticate', function(data) {
				if (data.status === 'success') {
					console.log('autenticated');
					// Send the subscribe event: Subscription to the resource
					socket.emit('subscribe', {
						resource : '/me/resources/light' // ex:  /me/resources/temperature
					});
				} else {
					console.log('not autenticated ' + data.status);
					$('.event').hide();
					$('#unsubscribed').show();
					$('#errorCode').html("Autentication error with the session token").show();
					$('#sessionToken').html('');
					unsubscribe();
				}
			});
			
			// subscribe event
			socket.on('subscribe', function(data) {
				console.log('subscribed');
			});
			
			// Error handlers:
			socket.on('error', function(data) {			//error event
				console.log("socket.io ERROR: "+data);
			});
			socket.on('reconnect', function() {			//reconnect event
				console.log("reconnected");
				reconnect = true;
			});
			socket.on('disconnect', function(data) {	//disconnect event
				console.log('disconnected: '+data);
				if(data === 'transport error') {	//in case of transport error (e.g. internet disconnection)
					console.log('transport error');
				}
			});
			
			// stream event: Wait for the server's stream (/me/resources/light event)
			socket.on('/me/resources/light', function(msg) {
			    // Output area updating
			    var measurement = msg[0].value;
				
			    var e = {data: JSON.stringify( {values : [{value : measurement}]}) };
				new_data_from_sensor(e);
				
			});

		// Send the autentication event
		function autenticate() {
			socket.emit('authenticate', {
				sessionToken : st
			});
		}
		
		// Manual disconnection from websockets
		function unsubscribe() {
			socket.emit('unsubscribe', {
				resource : '/me/resources/light' // ex:  /me/resources/temperature
			});
			socket.disconnect();
		}
		
		// Print the received value in the output area (USE THIS VALUE FOR MUSICAL TENTACLE)
		function printOutput(value) {
			console.log(value)
		}
}
		
