module.exports = {
    name: 'autoview',
    description: 'Enciende o apaga auto ver después de que termine la encuesta (Esconde la película de encuestas futuras).',
    usage: '[on u off]',
    admin: true,
    async execute(message, args, main, callback, settings) {
        if (args.length > 1 || !args.length || args[0].toLowerCase() != 'on' && args[0].toLowerCase() != 'off') {
            message.channel.send(`Por favor solo especifica on u off. El ajuste actual es: ${ settings.autoViewed ? 'on' : 'off' }`);
            return callback();
        } else {
            const autoView = args[0].toLowerCase() == 'on';
            return main.setting.updateOne({ guildID: message.guild.id }, { 'autoViewed': autoView }, function (err) {
                if (!err) {
                    message.channel.send(`Auto view ahora está: ${ autoView ? 'On' : 'Off' }`);
                } else {
                    message.channel.send('No se pudo activar auto view, ocurrió un problema');
                }
                return callback();
            });
        }
    }
};