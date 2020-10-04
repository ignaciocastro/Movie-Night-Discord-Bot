const { prefix } = require('../config.json');

module.exports = {
	name: "help",
	description: "Muestra todos los comandos o información sobre un comando específico",
	aliases: ["commands"],
	usage: "[nombre de comando]",
	execute(message, args) {
		const data = [];
		const { commands } = message.client;

		if (!args.length) {
			data.push("Aquí hay una lista de todos mis comandos:");
			data.push(commands.map(command => command.name).join(", "));
			data.push(`\n¡Puedes usar \`${prefix}help [nombre comando]\` para obtener información de un comando en específico!`);

			return message.author.send(data, { split: true }).then(() => {
				if (message.channel.type === "dm") return;
				return message.reply("Te he enviado un MD con todos mis comandos.");
			}).catch(error => {
				console.error(`No se pudo enviar MD a ${message.author.tag}.\n`, error);
				
				return message.reply("¡Pareciera que no te puedo mandar MD! Revisa tus ajustes de privacidad de Discord para permitir mensajes de miembros del servidor.");
			});
		}

		const name = args[0].toLowerCase();
		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

		if (!command) {
			return message.reply("¡Ese no es un comando válido!");
		}

		data.push(`**Nombre:** ${command.name}`);

		if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(", ")}`);
		if (command.description) data.push(`**Descripción:** ${command.description}`);
		if (command.usage) data.push(`**Uso:** ${prefix}${command.name} ${command.usage}`);

		return message.channel.send(data, { split: true });
	},
};
