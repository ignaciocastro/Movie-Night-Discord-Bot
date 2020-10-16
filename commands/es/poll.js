const {MessageEmbed} = require('discord.js');
const moment = require('moment');
const emojis = require('../emojis.json');
module.exports = {
    name: 'poll',
    description: 'Comienza una encuesta.',
    aliases: [
        'begin',
        'start'
    ],
    admin: true,
    async execute(message, args, main, callback, settings) {
        var embeddedMessages = [];
        var number = 1;
        var totalCount = 0;
        var description = '';
        var searchOptions = main.searchMovieDatabaseObject(message.guild.id, '', true);
        var movieEmbed = new MessageEmbed().setTitle('¡La encuesta ha empezado!').setColor('#6441a3');
        var movieMap = {};
        message.channel.send(settings.pollTime >= main.maxPollTime * 1000 ? settings.pollMessage + '\n (Considerar que el tiempo de duración de la encuesta se encuentra limitado a dos horas debido a un error técnico. Esto será arreglado pronto)' : settings.pollMessage);
        //2048 limit
        await main.movieModel.find(searchOptions, function (error, docs) {
            if (error) {
                message.channel.send('No se pudo mostrar la lista de películas, ocurrió un error.');
                return callback();
            }
            if (docs.length == 0) {
                message.channel.send('No se puede iniciar la encuesta. Lista de péliculas sin ver está vacía.');
                return callback();
            } else if (docs && docs.length > 0) {
                //Gets random assortment of movies depending on poll size setting and number of movies in the servers list.
                var movies = main.getRandomFromArray(docs, settings.pollSize);
                totalCount = movies.length;
                for (var movie of movies) {
                    var stringConcat = `**[${ emojis[number] } ${ movie.name }](https://www.imdb.com/title/${ movie.imdbID })** solicitada por ${ movie.submittedBy } en ${ moment(movie.submitted).format('DD MMM YYYY') }\n
					**Fecha de estreno:** ${ moment(movie.releaseDate).format('DD MMM YYYY') } **Duración:** ${ movie.runtime } Minutos **Rating:** ${ movie.rating }\n\n`;
                    //If the length of message has become longer than DISCORD API max, we split the message into a seperate embedded message.
                    if (description.length + stringConcat.length > 2048) {
                        movieEmbed.setDescription(description);
                        embeddedMessages.push(movieEmbed);
                        description = '';
                        movieEmbed = new MessageEmbed().setTitle('¡La encuesta ha comenzado! (Cont...)').setColor('#6441a3');
                    }
                    description += stringConcat;
                    movieMap[number] = movie;
                    //Store position of movie in list.
                    number++;
                }
            }
            movieEmbed.setDescription(description);
            embeddedMessages.push(movieEmbed);
            for (var i = 0; i < embeddedMessages.length; i++) {
                var embeddedMessage = embeddedMessages[i];
                //If the message is NOT the last one in the embedded messages chain, just send the message. ELSE we wil be sending the message + handling reacts on it.
                if (i != embeddedMessages.length - 1) {
                    message.channel.send(embeddedMessage);
                } else {
                    var emojiMap = {};
                    message.channel.send(embeddedMessage).then(async message => {
                        //Polltime is stored in ms
                        var collector = message.createReactionCollector(m => m, { time: (settings.pollTime >= main.maxPollTime * 1000 ? main.maxPollTime * 1000 : settings.pollTime) + totalCount * 1000 });
                        //Add one second per option of react (takes 1 second for each react to be sent to Discord)
                        console.log('Encuesta iniciada. GuildID: ' + message.guild.id + ' ' + new Date());
                        collector.on('collect', (messageReact, user) => {
                            if (user.id != main.client.user.id) {
                                console.log('Collect' + ' ' + new Date());
                                var duplicateReactions = message.reactions.cache.filter(reaction => reaction.users.cache.has(user.id) && reaction.emoji.name != messageReact.emoji.name);
                                //We remove any previous reactions user has added, to ensure the latest vote remains and user can only vote for once movie.
                                //This block of code exists before the reactions are added to ensure as the bot adds reactions to the message, users are not able to duplicate votes during this time.
                                for (var reaction of duplicateReactions.values()) {
                                    try {
                                        reaction.users.remove(user.id);
                                    } catch (e) {
                                        console.error('Error removiendo reacción', e);
                                    }
                                }
                            }
                        });
                        for (var i = 1; i <= totalCount; i++) {
                            try {
                                await message.react(emojis[i]);
                                emojiMap[emojis[i]] = i;
                            } catch (e) {
                                console.log('Mensaje de encuesta borrado' + ' ' + new Date());
                                collector.stop();
                            }
                        }
                        collector.on('end', () => {
                            console.log('Encuesta terminada.  GuildID: ' + message.guild.id + ' ' + new Date());
                            //Refetch message due to discord.js caching.
                            message.fetch().then(function (updatedMessage) {
                                const reactionsCache = updatedMessage.reactions.cache;
                                const highestValidReactions = reactionsCache.filter(function (a) {
                                    return emojiMap[a.emoji.name] > 0;
                                });
                                if (highestValidReactions.size == 0) {
                                    message.channel.send('Las reacciones podrian haber sido eliminadas u ocurrió otro error.');
                                    return callback();
                                }
                                const highestReact = highestValidReactions.reduce((p, c) => p.count > c.count ? p : c, 0) || message.reactions.reduce((p, c) => p.count > c.count ? p : c, 0);
                                if (!highestReact.emoji) {
                                    console.error('No se pudieron recaudar las reacciones');
                                    console.error(emojiMap);
                                    console.error(highestReact);
                                    console.error(highestValidReactions);
                                    console.error(highestReact.emoji);
                                    message.channel.send('Bot no pudo recaudar las reacciones. Asegurate de que el bot tenga permisos en este canal para AÑADIR REACCIONES y MANEJAR MENSAJES.');
                                    return callback();
                                }
                                var winner = movieMap[emojiMap[highestReact.emoji.name]];
                                if (highestReact.count <= 1) {
                                    message.channel.send('No hubieron votos, así que ninguna película fue escogida.');
                                    return callback();
                                }
                                //If auto viewed is set, update movie to be entered into the VIEWED list. 
                                if (settings.autoViewed) {
                                    main.movieModel.updateOne({
                                        guildID: message.guild.id,
                                        movieID: winner.movieID
                                    }, {
                                        viewed: true,
                                        viewedDate: new Date()
                                    }, function (err) {
                                        if (!err) {
                                            winner.viewed = true;
                                            winner.viewedDate = new Date();
                                            message.channel.send(main.buildSingleMovieEmbed(winner, `¡La película ha sido escogida! ${ winner.name } con ${ highestReact.count - 1 } votos.`));
                                        } else {
                                            message.channel.send('Ocurrió un error, no se pudo calcular el ganador. Intenta deshabilitando el auto-view.');
                                        }
                                        return callback();
                                    });
                                } else {
                                    message.channel.send(main.buildSingleMovieEmbed(winner, `A winner has been chosen! ${ winner.name } with ${ highestReact.count - 1 } votes.`));
                                    return callback();
                                }
                            }).catch(function () {
                                console.log('Poll was deleted.');
                            });
                        });
                    });
                }
            }
        }).lean();
    }
};