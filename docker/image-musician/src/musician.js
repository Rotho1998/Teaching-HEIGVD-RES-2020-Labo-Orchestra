/*
* Application générant toute les secondes un payload contenant un uuid et le son de l'instrument indiqué en paramètre
* par l'utilisateur lors de l'exécution de l'application.
* Pour exécuter cette application, il faut utiliser la commande suivante:
* node musician.js piano|trumpet|flute|violin|drum
*
* Auteurs: Robin Gaudin & Noémie Plancherel
*/

/*
 * Importation des éléments requis pour faire fonctionner cette application
 */
var protocol = require('./sensor-protocol');
var dgram = require('dgram');
var { v4: uuidv4 } = require('uuid');

/*
 * Initialisation des constantes nécessaires
 */
var socket = dgram.createSocket('udp4');
var soundOfInstrument = new Map([
	["piano", "ti-ta-ti"],
	["trumpet", "pouet"],
	["flute", "trulu"],
	["violin", "gzi-gzi"],
	["drum", "boum-boum"]]);

/**
 * Fonction permettant la création d'un musicien et l'envoi du payload toute les secondes
 * @param sound - son de l'instrument
 */
function Musician(sound) {

	Musician.prototype.update = function() {

		/*
		 * Création de l'objet JSON et du payload correspondant
		 */
		var instrument = {
			uuid: uuidv4(),
			sound: sound
		};
		var payload = JSON.stringify(instrument);

		/*
		 * Création du message à envoyer et envoi de celui-ci
		 */
		message = new Buffer(payload);
		socket.send(message, 0, message.length, protocol.PROTOCOL_PORT, protocol.PROTOCOL_MULTICAST_ADDRESS, function(err, bytes) {
			console.log("Sending payload: " + payload + " via port " + socket.address().port);
		});
	}

	/*
	 * Envoi d'un nouveau payload toutes les 5 secondes
	 */
	setInterval(this.update.bind(this), 1000);

}

/*
 * Test s'il y a le bon nombre d'argument
 */
if(process.argv.length !== 3){
	console.log("Invalid number of arguments !");
	process.exit(1);
}

/*
 * Récupération de l'instrument fourni en paramètre et du son correspondant
 */
var instrument = process.argv[2];
var sound = soundOfInstrument.get(instrument);

/*
 * Test si l'instrument fourni en paramètre est existant
 */
if(sound == null){
	console.log("Invalid instrument !");
	process.exit(1);
}

/*
 * Création d'un nouveau musicien
 */
var v = new Musician(sound);
