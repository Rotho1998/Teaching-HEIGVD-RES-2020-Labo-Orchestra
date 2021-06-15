/*
* Application récupérant les datagrammes UDP envoyés sur le port 9907 par des musiciens et envoyant par TCP sur le port
* 2205 la liste des musiciens actifs
* Pour exécuter cette application, il faut utiliser la commande suivante:
* node auditor.js
*
* Auteurs: Robin Gaudin & Noémie Plancherel
*/

/*
 * Importation des éléments requis pour faire fonctionner cette application
 */
var protocol = require('./sensor-protocol');
var dgram = require('dgram');
var moment = require('moment');
var net = require('net');

/*
 * Initialisation des constantes nécessaires
 */
var socket = dgram.createSocket('udp4');
var server = net.createServer();
var soundOfInstrument = new Map([
	["ti-ta-ti", "piano"],
	["pouet", "trumpet"],
	["trulu", "flute"],
	["gzi-gzi", "violin"],
	["boum-boum", "drum"]]);
var musicians = new Map();

/*
 * Ecoute des datagrammes UDP sur le port 9907
 */
socket.bind(protocol.PROTOCOL_PORT, function() {
	console.log("Joining multicast group");
	socket.addMembership(protocol.PROTOCOL_MULTICAST_ADDRESS);
});

/*
 * Exécution de cette fonction lorsqu'un datagramme UDP arrive
 */
socket.on('message', function(msg) {
	/*
	 * Parsing de l'objet JSON reçu
	 */
	var instrument = JSON.parse(msg);

	/*
	 * Test si le datagramme reçu est valide
	 */
	if(!soundOfInstrument.has(instrument.sound) || instrument.uuid == null){
		console.log("Invalid payload !");
	/*
	 * Modification du moment du dernier son émis si le musicien est déjà connu
	 */
	} else if(musicians.has(instrument.uuid)) {
		var musician = musicians.get(instrument.uuid);
		musician.lastSoundEmitted = moment();
		musicians.set(instrument.uuid, musician)
	/*
	 * Ajout d'un nouveau musicien
	 */
	} else {
		var newMusician = {
			instrument: soundOfInstrument.get(instrument.sound),
			activeSince: moment(),
			lastSoundEmitted: moment()};
		musicians.set(instrument.uuid, newMusician)
	}
});

/*
 * Ecoute des connections TCP sur le port 2205
 */
server.listen(protocol.PROTOCOL_PORT_TCP, function() {
	console.log("Listen TCP connections on port " + protocol.PROTOCOL_PORT_TCP);
});

/*
 * Exécution de cette fonction lors d'une nouvelle connexion TCP
 */
server.on('connection', function(client) {
	console.log("New TCP connection detected");

	var result = [];

	/*
	 * Parcours des musiciens, suppression si le dernier son émis date d'il y a plus de 5 secondes, sinon on le renvoie
	 * à l'utilisateur s'étant connecté
	 */
	musicians.forEach((value, key) => {
		if(moment().diff(value.lastSoundEmitted, 'seconds') > 5) {
			musicians.delete(key);
		} else {
			result.push({
				uuid: key,
				instrument: value.instrument,
				activeSince: value.activeSince.utcOffset(+120).format()
			});
		}
	});

	client.write(JSON.stringify(result));
	client.destroy();
});