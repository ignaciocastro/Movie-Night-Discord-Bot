const {MessageEmbed} = require('discord.js');
const moment = require('moment');
module.exports = {
    name: 'get',
    description: 'Entrega una lista de todas las películas en la watch list del server, o, si search es especificado intentará buscar la lista del servidor para la película.',
    aliases: [
        'list',
        'getmovie'
    ],
    execute(message, args, main, callback) {
        var embeddedMessages = [];
        var number = 1;
        var description = '';
        var searchOptions = main.searchMovieDatabaseObject(message.guild.id, '', true);
        var movieEmbed = new MessageEmbed().setTitle('Películas solicitadas').setColor('#6441a3');
        var movie = args ? args.join(' ') : null;
        if (!args.length) {
            //return to avoid hitting logic below.
            return main.movieModel.find(searchOptions, function (error, movies) {
                if (error) {
                    message.channel.send('No se pudo mostrar la lista de películas, ocurrió un problema.');
                    return callback();
                }
                if (movies.length == 0) {
                    message.channel.send('La lista de películas aun no vistas está vacía.');
                    return callback();
                } else if (movies && movies.length > 0) {
                    for (var movie of movies) {
                        var stringConcat = `**[${ number }. ${ movie.name }](https://www.imdb.com/title/${ movie.imdbID })** solicitada por ${ movie.submittedBy } en ${ moment(movie.submitted).format('DD MMM YYYY') }\n
						**Fecha de estreno:** ${ moment(movie.releaseDate).format('DD MMM YYYY') } **Duración:** ${ movie.runtime } Minutos **Rating:** ${ movie.rating }\n\n`;
                        //If the length of message has become longer than DISCORD API max, we split the message into a seperate embedded message.
                        if (description.length + stringConcat.length > 2048) {
                            movieEmbed.setDescription(description);
                            embeddedMessages.push(movieEmbed);
                            description = '';
                            movieEmbed = new MessageEmbed().setTitle('Películas solicitadas (Cont...)').setColor('#6441a3');
                        }
                        description += stringConcat;
                        number++;
                    }
                }
                movieEmbed.setDescription(description);
                embeddedMessages.push(movieEmbed);
                for (var embeddedMessage of embeddedMessages) {
                    message.channel.send(embeddedMessage);
                }
                return callback();
            }).lean();
        }
        searchOptions = main.searchMovieDatabaseObject(message.guild.id, movie);
        //25 embed limit for fields
        return main.movieModel.findOne(searchOptions, function (error, movie) {
            if (movie) {
                message.channel.send(main.buildSingleMovieEmbed(movie));
            } else {
                message.channel.send('No se encontró la película en tu lista. ¿Quizas intenta usando el comando de busqueda?');
            }
            return callback();
        }).lean();
    }
};