



module.exports = class dynaio {
	io = null; 
	dyna_sdk_api = null; 
	dynatrace_sdk_mod = null;
	
	const systemInfo = {
		  destinationName: "aDestination",
		  destinationType: this.dynatrace_sdk_mod.MessageDestinationType.TOPIC,
		  vendorName: "MessageSystemVendorName",
		  host: "message.system.host",
		  port: 56012
		};
	
	constructor(func_instance_io, func_instance_dyna_sdk){
		this.io = func_instance_io
		this.dyna_sdk_api = func_instance_dyna_sdk.createInstance(); 
		this.dynatrace_sdk_mod = func_instance_dyna_sdk;
		
		if (this.dyna_sdk_api.getCurrentState() !== this.dynatrace_sdk_mod.SDKState.ACTIVE) {
		  console.error("MessagingSample: SDK is not active!");
		}
		
		this.dyna_sdk_api.setLoggingCallbacks({
		  warning: (msg) => console.error("Dynaio SDK warning: " + msg),
		  error: (msg) => console.error("Dynaio SDK error: " + msg)
		});
		

	}
	
	
	traceIncomingMessage(dtTag, func_functionToDoCallBack) {
	  // create a tracer instance and start the trace, ensure dynatraceTag is set
	  const startData = Object.assign({ dynatraceTag: dtTag}, this.systemInfo);
	  const tracer = this.dyna_sdk_api.traceIncomingMessage(startData);
	  tracer.start(function processMessage(done) {
			func_functionToDoCallBack(); 
		process.nextTick(done);
	  }, function onDone(err) {
		if (err) {
		  tracer.error();
		}
		tracer.end();
	  });
	}
	
	
	on(func_event, func_callback){
		//Receive dynatrace_connection_socket event and process event message
		io.on('x-dynatrace_connection_socket', function(client){
			client.on('x-dynatrace_connection_socket_message', function(data) {
				return io.on(func_event, traceIncomingMessage(data['dtTag'], func_callback)); 
			}			
		}); 
		
	}		
	sendDynatraceRequest(func_event, func_data_message_to_send){
		var dt_tag; 
		const tracer_instance = this.dyna_sdk_api.traceOutgoingMessage(systemInfo);
			tracer_instance.start(function sendTaggedMessage(){
				// getting a tag from tracer needs to be done after start()
				const dtTag = tracer_instance.getDynatraceStringTag();
				try {
				  // now trigger the actual sending of the message
				  dt_tag = dtTag; 

				} catch (e) {
				  tracer_instance.error(e);
				  throw e;
				} finally {
				  tracer_instance.end();
				}
			  });
			
		var dataDict = []; 
		dataDict.push({
			key:"x-dynatrace-socketio",
			value:dt_tag
		})
		dataDict.push({
			key:"x-dynatrace-socketio-message",
			value:func_data_message_to_send
		})
		dataDict.push({
			key:"x-dynatrace-socketio-event", 
			value:func_event
		})
		
		//Send dynatrace_connection_socket event with dt tag event message
		socket.on('x-dynatrace_connection_socket', msg => {
			io.emit('x-dynatrace_connection_socket_message', dataDict);
		});
	}
	
	emit(func_event, func_data_message_to_send){
		sendDynatraceRequest(func_event, func_data_message_to_send);
		return this.io.emit(func_event, func_data_message_to_send);
	}
	
	
};