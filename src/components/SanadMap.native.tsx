import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Map } from '@maplibre/maplibre-react-native';
import { effectiveMapStyleUrl } from '../lib/config';
import { colors } from '../theme/colors';

type MapState = 'loading' | 'ready' | 'error';

export function SanadMap() {
  const [state, setState] = useState<MapState>('loading');
  const [attempt, setAttempt] = useState(0);
  const styleUrl = effectiveMapStyleUrl();

  if (!styleUrl) {
    return <View style={s.unavailable}>
      <Text style={s.unavailableTitle}>الخريطة غير متاحة في وضع الإنتاج</Text>
      <Text style={s.unavailableBody}>لا يعرض سند خريطة تجريبية عند غياب مصدر Production معتمد.</Text>
    </View>;
  }

  return <View style={s.wrap}>
    <Map
      key={attempt}
      style={s.map}
      mapStyle={styleUrl}
      onWillStartLoadingMap={() => setState('loading')}
      onDidFinishLoadingMap={() => setState('ready')}
      onDidFailLoadingMap={() => setState('error')}
    />

    {state === 'loading' ? <View pointerEvents="none" style={s.overlay}>
      <Text style={s.loadingText}>جاري تحميل خريطة الأساس…</Text>
    </View> : null}

    {state === 'error' ? <View style={s.errorOverlay}>
      <Text style={s.unavailableTitle}>تعذر تحميل خريطة الأساس</Text>
      <Text style={s.unavailableBody}>تأكد من الاتصال ثم حاول مرة ثانية. ملفات العقارات والملاحظات المحلية تبقى محفوظة.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="إعادة تحميل الخريطة"
        onPress={() => { setState('loading'); setAttempt((value) => value + 1); }}
        style={({ pressed }) => [s.retry, pressed && { opacity: 0.7 }]}
      >
        <Text style={s.retryText}>إعادة المحاولة</Text>
      </Pressable>
    </View> : null}
  </View>;
}

const s = StyleSheet.create({
  wrap: { height: 320, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.navy800 },
  map: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6,20,37,0.42)',
  },
  loadingText: { color: colors.text, fontSize: 13, fontWeight: '800', writingDirection: 'rtl' },
  errorOverlay: {
    ...StyleSheet.absoluteFill,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(6,20,37,0.94)',
  },
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
  retry: {
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217,165,58,0.12)',
    borderWidth: 1,
    borderColor: colors.gold500,
  },
  retryText: { color: colors.gold300, fontSize: 13, fontWeight: '900', writingDirection: 'rtl' },
});
