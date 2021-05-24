import React from 'react';
import ReactDOM from 'react-dom';
import io from "socket.io-client";

import './index.css';

import Leaflet from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';

delete Leaflet.Icon.Default.prototype._getIconUrl;

Leaflet.Icon.Default.mergeOptions({
  className: 'icon',
});

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      nickname: '',
      current_nickname: '',
      current_message: '',
      messages: [],
      flights: [],
      positions: {},
      paths: {},
    }
    this.setCurrentNickname = this.setCurrentNickname.bind(this);
    this.setNickname = this.setNickname.bind(this);
    this.setCurrentMessage = this.setCurrentMessage.bind(this);
  }

  componentDidMount () {
    this.socket = io.connect('wss://tarea-3-websocket.2021-1.tallerdeintegracion.cl', {
      path: '/flights/',
      transports: ['websocket'],
    });

    this.socket.on('CHAT', message => {
      this.setState({ messages: [...this.state.messages, message]})
    });

    this.socket.on('FLIGHTS', flights => {
      this.setState({ flights: flights})
    });

    this.socket.on('POSITION', position => {
      this.setState(prevState => ({
        positions: {
            ...prevState.positions,
            [position.code]: position.position,
        },
      }));
      this.socket.emit('FLIGHTS', {})
    });
  }

  setCurrentNickname = nickname => {
    this.setState({ current_nickname: nickname})
  }

  setNickname = () => {
    this.setState({ nickname: this.state.current_nickname})
  }

  setCurrentMessage = message => {
    this.setState({ current_message: message})
  }

  sendMessage = () => {
    if (this.state.nickname) {
      const body = this.state.current_message
      const message = {
        name: this.state.nickname,
        message: body
      }
      this.socket.emit('CHAT', message)
    }
  }

  render() {
    const messages = this.state.messages.map((message, index) => {
      return <li key={index}>
        <b>{message.name}: {message.message}</b>
      </li>
    });

    const flights = this.state.flights.map((flight, index) => {
      return <li key={index}>
        <div className="flight-info">
          <p className="flight-info-line"><b>VUELO {flight['code']}</b></p>
          <p className="flight-info-line"><b>Aerolínea:</b> {flight['airline']}</p>
          <p className="flight-info-line"><b>Origen:</b> {flight['origin']}</p>
          <p className="flight-info-line"><b>Destino:</b> {flight['destination']}</p>
          <p className="flight-info-line"><b>Avión:</b> {flight['plane']}</p>
          <p className="flight-info-line"><b>Asientos:</b> {flight['seats']}</p>
          <p className="flight-info-line"><b>Pasajeros:</b></p>
          {flight['passengers'].map((passenger, key) => (
            <p key={key}>
              {passenger.name}, {passenger.age} años.
            </p>
          ))}
        </div>     
      </li>
    });

    return(
      <div>
        <div className="title-container">
          <h1>Información Vuelos</h1>
        </div>
        <div className="general-container">
          <div className="base-container">
            <div className="map-container">
              <div>
                <MapContainer className="map" zoom={5} center={[-30, -70]} >
                  <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {Object.keys(this.state.positions).map((key, index) => (
                    <Marker key={key} position={this.state.positions[key]}>
                      <Popup>{key}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>

            <div className="chat-container">
              <h2>Centro de Control</h2>

              <div className="nickname-container">
                <input
                  type="text"
                  placeholder='Ingresa tu nombre'
                  onChange={(e) => this.setCurrentNickname(e.target.value)}>
                </input>
                <button onClick={() => this.setNickname()}>
                  Ingresar
                </button>
              </div>

              <div className="messages-container">
                <div className="messages-input-container">
                  <input
                    type="text"
                    placeholder='Ingresa tu mensaje'
                    onChange={(e) => this.setCurrentMessage(e.target.value)}>
                  </input>
                  <button onClick={() => this.sendMessage()}>
                    Enviar
                  </button>
                </div>
                {messages}
              </div>
            </div>
          </div>
          <div className="info-container">
            <div className="flights-info">
              {flights}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<App/>, document.getElementById('root'));
