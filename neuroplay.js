//Device connections
const CMD_StartSearch = "startsearch";
const CMD_StopSearch = "stopsearch";
const CMD_StartDevice = "startdevice";
const CMD_StopDevice = "stopdevice";
const CMD_ListDevices = "listdevices";
const CMD_DeviceCount = "devicecount";
const CMD_CurrentDeviceInfo = "currentdeviceinfo";
const CMD_DeviceInfo = "deviceinfo";
const CMD_MakeFavorite = "makefavorite";
const CMD_GetFavoriteDeviceName = "getfavoritedevicename";

//BCI
const CMD_BCI = "bci";	
const CMD_Meditation = "meditation";
const CMD_MeditationHistory = "meditationhistory";
const CMD_Concentration = "concentration";
const CMD_ConcentrationHistory = "concentrationhistory";	
const CMD_MentalState = "mentalstate";
const CMD_MentalStateHistory = "mentalstatehistory";
const CMD_RecordMentalState = "recordmentalstate";
const CMD_RemoveMentalStateRecord = "removementalstaterecord";
const CMD_StartMentalStates = "startmentalstates";
const CMD_StopMentalStates = "stopmentalstates";

//Filters and other data
const CMD_SetLPF = "setlpf";
const CMD_SetHPF = "sethpf"
const CMD_SetBSF = "setbsf";
const CMD_SetDefaultFilters = "setdefaultfilters";
const CMD_GetFilters = "getfilters";
const CMD_EnableDataGrabMode = "enabledatagrabmode";
const CMD_DisableDataGrabMode = "disabledatagrabmode";	
const CMD_Rhythms = "rhythms";
const CMD_RhythmsHistory = "rhythmshistory";		
const CMD_StartRecord = "startrecord";
const CMD_StopRecord = "stoprecord";
const CMD_RawData = "rawdata";

//Miscellaneous
const CMD_Help = "help";
const CMD_Version = "version";	

//EVENTS
const EVENT_CONNECTED = "connected";
const EVENT_DISCONNECTED = "disconnected";
const EVENT_CONNECTED_CHANGED = "connectedChanged";

class Neuroplay 
{	
	constructor() 
	{
		this.listeners = Object();
		this.socket = null;
		this.timeout = null;
		this.watcher = null;
		this.lastmessagetime = 0;
		this.canconnect = true;
		this.debugoutput = true;
		this.ip = "127.0.0.1";
		this.port = 1336;
	}
	
	consolelog(msg)
	{
		if (this.debugoutput == false) return;
		
		console.log(msg);
	}
	
	connect() 
	{
		this.disconnect();

		if (!this.canconnect) return;

		this.consolelog("Connecting");

		this.socket = new WebSocket("ws://"+this.ip+":"+this.port);
		var that = this;
		this.socket.onopen = function (event) 
		{
			that.consolelog('NeuroplayPro connected');
			that.messageConnect(false);		
		}

		this.socket.onclose = function (event) 
		{
			if (event.wasClean) 
			{
				this.consolelog('Соединение закрыто чисто');
			}
			else 
			{
				this.consolelog('Обрыв соединения', "#C39"); // например, "убит" процесс сервера
			}
			this.consolelog('Код: ' + event.code + ' причина: ' + event.reason);
		};

		this.socket.onmessage = function (event) 
		{
			var s = JSON.parse(event.data);
			that.lastmessagetime = new Date().getTime();
			that.parseResponse(s);
		};

		this.socket.onerror = function (error) 
		{
			this.consolelog("Ошибка", error);
		};

		this.watcher = setInterval(function () 
		{
			if (new Date().getTime() - that.lastmessagetime > 3000) 
			{
				that.messageConnect(false);
				that.connect();
			}
		}, 5000);

		this.timeout = setInterval(function () 
			{
				that.send(CMD_BCI);
			}, 100);
	}

	standalone() 
	{
		this.canconnect = false;
	}

	messageConnect(connected) 
	{
		this.trigger(connected ? EVENT_CONNECTED : EVENT_DISCONNECTED);
		this.trigger(EVENT_CONNECTED_CHANGED, {connected: connected});
		this.consolelog("CONNECTED: " + connected);
	}

	send(text) 
	{
		
		if (this.socket && this.socket.readyState == 1) 
		{
			this.consolelog("> " + text);
			this.socket.send(text);
		}
	}

	startRecord() 
	{
		this.send(StartRecord);
	}

	stopRecord() 
	{
		this.send(StopRecord);
	}

	disconnect() 
	{
		clearInterval(this.watcher);
		clearInterval(this.timeout);

		if (this.socket) 
		{
			this.socket.close();
			this.socket = null;
		}
	}
	
	on(evt, callback) 
	{
		this.consolelog("Listener added: " + evt);
		if (!this.listeners.hasOwnProperty(evt)) 
		{
		   this.listeners[evt] = Array();
		}
		this.listeners[evt].push(callback);
	}

	trigger(evt, params) 
	{
		//console.log("trigger called " + evt);
		//console.dir(listeners);
		if (evt in this.listeners) 
		{
			var callbacks = this.listeners[evt];
			//Call all callbacks with the params
			for (var x in callbacks) 
			{
				callbacks[x](params);
			}
		} 
		else 
		{
			//console.log("No listeners found for " + evt);
		}
	}
	
	parseResponse(response)
	{		
		this.trigger(response.command, response);		
		this.trigger("command", response);
	}
}