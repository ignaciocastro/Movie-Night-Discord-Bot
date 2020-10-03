module.exports = {
    name: 'autoview',
    description: 'Enciende o apaga auto ver después de que termine la encuesta (Esconde la película de encuestas futuras).',
    usage: '[on u off]',
    admin: true,
    async execute(message, args, main, callback, settings) {
        if (args.length > 1 || !args.length || args[0].toLowerCase() != 'on' && args[0].toLowerCase() != 'off') {
            message.channel.send(`Please only specify on or off. Currently setting is: ${ settings.autoViewed ? 'on' : 'off' }`);
            return callback();
        } else {
            const autoView = args[0].toLowerCase() == 'on';
            return main.setting.updateOne({ guildID: message.guild.id }, { 'autoViewed': autoView }, function (err) {
                if (!err) {
                    message.channel.send(`Auto view has now been set to: ${ autoView ? 'On' : 'Off' }`);
                } else {
                    message.channel.send('Couldn\'t set auto view, something went wrong');
                }
                return callback();
            });
        }
    }
};