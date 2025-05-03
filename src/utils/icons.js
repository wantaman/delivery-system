import { Icon } from 'leaflet';

export const icons = {
  pending: new Icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
    iconSize: [38, 38],
  }),
  inTransit: new Icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    iconSize: [38, 38],
  }),
  delivered: new Icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
    iconSize: [38, 38],
  }),
  deliveryPerson: new Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/9018/9018802.png",
    iconSize: [50, 50],
    iconAnchor: [25, 50],
  })
};