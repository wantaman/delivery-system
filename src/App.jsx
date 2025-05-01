import { useState } from 'react'
import './App.css'
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import { Icon, divIcon, point } from "leaflet";


const redIcon = new Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [38, 38],
});

// Blue icon for in_transit
const blueIcon = new Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [38, 38],
});

// Green icon for delivered
const greenIcon = new Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [38, 38],
});

const deliveryIcon = new Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/9018/9018802.png",
  iconSize: [50, 50],
  iconAnchor: [25, 50],
});

const createClusterCustomIcon = function (cluster) {
  return new divIcon({
    html: `<span class="cluster-icon">${cluster.getChildCount()}</span>`,
    className: "custom-marker-cluster",
    iconSize: point(33, 33, true),
  });
};

export default function App (){
  const [locations, setLocations] = useState([]);

  return (
    <>
      <MapContainer
        center={[11.576039057095235, 104.92295654456791]} 
        zoom={13}
        style={{ position: "relative" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    </>
  )
}

