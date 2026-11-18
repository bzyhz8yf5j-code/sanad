import { StyleSheet, Text, View } from 'react-native';
import { Map } from '@maplibre/maplibre-react-native';
import { canUseDevelopmentMapFallback, config, hasConfiguredMapStyle } from '../lib/config';
import { colors } from '../theme/colors';

const DEV_STYLE = 'https://demotiles.maplibre.org/style.json';

export function SanadMap() {
  if (!hasConfiguredMapStyle && !canUseDevelopmentMapFallback) {
    return <View style={s.unavailable}>
      <Text style={s.unavailableTitle}>الخريطة غير متاحة في وضع الإنتاج</Text>
      <Text style={s.unavailableBody}>يجب ضبط مصدر خرائط مرخّص قبل عرض الخريطة للمستخدمين. لن يستخدم سند خرائط العرض التجريبية في الإنتاج.</Text>
    </View>;
  }

  return <View style={s.wrap}>
    <Map style={s.map} mapStyle={config.mapStyleUrl || DEV_STYLE} />
  </View>;
}

const s = StyleSheet.create({
  wrap: { height: 320, borderRadius: 18, overflow: 'hidden' },
  map: { flex: 1 },
  unavailable: {
    height: 320,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.navy800,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  unavailableTitle: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center', writingDirection: 'rtl' },
  unavailableBody: { color: colors.muted, fontSize: 13, lineHeight: 21, textAlign: 'center', writingDirection: 'rtl' },
});
