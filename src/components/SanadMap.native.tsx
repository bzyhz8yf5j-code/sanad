import { StyleSheet, View } from 'react-native';
import { Map } from '@maplibre/maplibre-react-native';
import { config } from '../lib/config';

const DEV_STYLE='https://demotiles.maplibre.org/style.json';
export function SanadMap(){
  return <View style={s.wrap}><Map style={s.map} mapStyle={config.mapStyleUrl || DEV_STYLE} /></View>;
}
const s=StyleSheet.create({wrap:{height:320,borderRadius:18,overflow:'hidden'},map:{flex:1}});
