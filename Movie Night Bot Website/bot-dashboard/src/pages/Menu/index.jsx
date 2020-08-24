import React from 'react';
import axios from 'axios';
import { Loader } from '../../components/loader';
import { Link } from 'react-router-dom';
import { Card, Button, Row, Container, Col } from 'react-bootstrap';

export function Menu(props) {
	const [user] = React.useState(props.user || []);
	const [guilds, setGuild] = React.useState(props.guilds || []);
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		getGuilds().then(function(response) {
			console.log(response.data)
			setGuild(response.data);
			setLoading(false);
		}).catch(function(err) {
			setLoading(false);
			// props.history.push('/');
		});
	}, []);

	return (
		<div>
			<Loader loading={loading} />
			{!loading && (
			<Container>
				<Row>
				{
				guilds.filter(guild => {
					return guild.isBotInServer;
				}).map(guild => (
					<Col xl={3} lg={4} md={4} sm={6} xs={6} className="clearfix py-3" key={guild.id} >
						<Link to={{pathname: `/dashboard/${guild.id}`, state: {user: user}}} key={guild.id} >
							<Card className="text-center">
								{ guild.icon 
									? <Card.Img variant="top" src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}?size=256`} />
									: <Card.Img variant="top" src="/images/default.png" />
								}
								<Card.Body>
									<Button variant="primary" size="lg">{guild.isBotInServer ? guild.name : `Invite to ${guild.name}`}</Button>
								</Card.Body>
							</Card>
						</Link>
					</Col>
				))
				}
				</Row>
				<Row>
				{
				guilds.filter(guild => {
					return !guild.isBotInServer;
				}).map(guild => (
					<Col xl={3} lg={4} md={4} sm={6} xs={6} className="clearfix py-3" key={guild.id}>
						<a href={`https://discord.com/oauth2/authorize?client_id=709271563110973451&permissions=1073835072&scope=bot&redirect_uri=${encodeURIComponent("http://localhost:3000/menu")}&guild_id=${guild.id}`}>
							<Card className="text-center">
								{ guild.icon 
									? <Card.Img variant="top" src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}?size=256`} />
									: <Card.Img variant="top" src="/images/default.png" />
								}
								<Card.Body>
									<Button variant="primary" size="lg">{guild.isBotInServer ? guild.name : `Invite to ${guild.name}`}</Button>
								</Card.Body>
							</Card>
						</a>
					</Col>
				))
				}
				</Row>
			</Container>
			)}
		</div>
	);
}

function getGuilds() {
	return axios.get('http://localhost:3001/api/discord/guilds', {
		withCredentials: true
	});
}