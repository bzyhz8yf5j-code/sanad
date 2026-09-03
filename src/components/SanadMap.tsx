import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
export function SanadMap(){return <View style={s.box}><Text style={s.text}>الخريطة الأصلية تظهر في Development Build على iOS/Android.</Text></View>}
const s=StyleSheet.create({box:{height:280,borderRadius:18,borderWidth:1,borderColor:colors.line,backgroundColor:colors.navy800,alignItems:'center',justifyContent:'center',padding:20},text:{color:colors.muted,textAlign:'center'}});
