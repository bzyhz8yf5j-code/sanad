import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export function SanadMap() {
  return <View style={styles.box}><View style={styles.grid} /><View style={styles.parcel}><Text style={styles.parcelText}>1234</Text></View><Text style={styles.text}>الخريطة التفاعلية الكاملة تظهر في Development Build على iOS وAndroid.</Text></View>;
}

const styles = StyleSheet.create({
  box: { height: 300, overflow: 'hidden', backgroundColor: '#0B2936', alignItems: 'center', justifyContent: 'center', padding: 20 },
  grid: { position: 'absolute', width: '140%', height: 1, backgroundColor: 'rgba(255,255,255,0.10)', transform: [{ rotate: '-18deg' }] },
  parcel: { width: 150, height: 112, borderWidth: 3, borderColor: '#5CE2D2', backgroundColor: 'rgba(92,226,210,0.11)', transform: [{ rotate: '-7deg' }], alignItems: 'center', justifyContent: 'center' },
  parcelText: { color: colors.text, fontSize: 22, fontWeight: '900' },
  text: { position: 'absolute', left: 18, right: 18, bottom: 16, color: '#D5DFEB', textAlign: 'center', writingDirection: 'rtl', fontSize: 12, lineHeight: 18, backgroundColor: 'rgba(2,10,20,0.70)', borderRadius: 10, padding: 8 },
});
