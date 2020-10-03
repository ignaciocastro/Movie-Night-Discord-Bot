const emojis = require("../emojis.json");

module.exports = {
	name: "add",
	description: "Añade una película a la lista del servidor para votar y ver.",
	aliases: ["addmovie", "insert"],
	usage: "[nombre de pelicula o busqueda]",
	args: true,
	async execute(message, args, main, callback, settings) {
		const search = args.join(" ");

		//Check if user has set a role for "Add" permissions, as only admins and this role will be able to add movies if set. 
		if (settings.addMoviesRole && !message.member.roles.cache.has(settings.addMoviesRole) && !message.member.hasPermission("ADMINISTRATOR")) {
			message.channel.send(`Las películas son solo añadibles por administradores o usuarios con el rol <@&${settings.addMoviesRole}>`);

			return callback();
		}

		//Continue with normal search if the above doesnt return.
		try {
			return main.searchNewMovie(search, message, function(newMovie, data) {
				//No need for else, searchNewMovie alerts user if no movie found.
				if (newMovie) {
					newMovie.save(function(err) {
						if (err && err.name == "MongoError") {
							message.channel.send("La película ya está en la lista. Podría estar marcada como 'Vista'.");

							return callback();
						}
		
						if (!err) {
							//If the search results from the API returned more than one result, we ask the user to confirm using REACTIONS on the message. 
							if (data && (data.total_results > 1 || (data.movie_results && data.movie_results.length > 1))) {
								const movieEmbed = main.buildSingleMovieEmbed(newMovie, "¿Esta es la película que quieres añadir?");
			
								message.channel.send(movieEmbed).then(async (embedMessage) => {
									const filter = (reaction, user) => { return (reaction.emoji.name == emojis.yes || reaction.emoji.name == emojis.no) && user.id == message.author.id; };

									try {
										await embedMessage.react(emojis.yes);
										await embedMessage.react(emojis.no);
									} catch (e) {
										console.log("Mensaje borrado");

										return removeMovie(newMovie, callback);
									}
									
									//Wait for user to confirm if movie presented to them is what they wish to be added to the list or not.								
									embedMessage.awaitReactions(filter, { max: 1, time: 15000, errors: ["time"] }).then(function(collected) {
										const reaction = collected.first();

										if (reaction.emoji.name == emojis.yes) {
											message.channel.send("¡La película será añadida a la lista!");

											return callback();
										} else {
											message.channel.send("La película no pudo ser añadida a la lista. ¿Quizas intenta añadir un link de IMDB?");
											
											return removeMovie(newMovie, callback);
										}
									}).catch(() => {
										message.channel.send("La película no pudo ser añadida a la lista, no respondiste a tiempo. ¿Quizas intenta añadir un link de IMDB?");

										return removeMovie(newMovie, callback);
									});
								});
							} else {
								message.channel.send(main.buildSingleMovieEmbed(newMovie, "¡Película añadida!"));

								return callback();
							}
						} else {
							message.channel.send("Ocurrió un error, no se pudo ejecutar el comando.");

							return callback();
						}
					});
				}
			});
		} catch (e) {
			console.error("Add.js", e);
			
			return message.channel.send("Ocurrió un error.");
		}
	}	
};

function removeMovie(newMovie, callback) {
	newMovie.remove(callback);
}
