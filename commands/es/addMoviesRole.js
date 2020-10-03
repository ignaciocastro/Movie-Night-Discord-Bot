module.exports = {
    name: 'moviesrole',
    description: 'Establece un rol que puede agregar películas a la lista del servidor. Tambien puedes borrar este rol usando moviesrole remove',
    usage: '[@roleName]',
    args: true,
    admin: true,
    async execute(message, args, main, callback) {
        if (args.length > 1) {
            message.channel.send('Por favor especifica solo un rol.');
            return callback();
        } else if (!message.mentions.roles.first() && args[0] != 'clear') {
            message.channel.send('Por favor menciona el rol que quieres seleccionar en el formato moviesrole [@nombreRol], o para limpiar los ajustes usa moviesrole clear');
            return callback();
        } else {
            const addMoviesRole = args[0] == 'clear' ? null : message.mentions.roles.first().id;
            //Update the settings with the role user provided, or clear it and set to NULL.
            return main.setting.updateOne({ guildID: message.guild.id }, { 'addMoviesRole': addMoviesRole }, function (err) {
                if (!err) {
                    message.channel.send(addMoviesRole ? `Usuarios administradores o con el rol ${ args[0] } ahora podrán añadir películas.` : 'Ajustes para el rol limpios. Ahora todos podrán añadir películas.');
                } else {
                    message.channel.send('No se pudo establecer el rol para añadir permisos, ocurrió un error.');
                }
                return callback();
            });
        }
    }
};