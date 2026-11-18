import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { canUseDevelopmentMapFallback, config, hasConfiguredMapStyle, hasSupabaseConfig, isProductionRuntime, mapProviderLabel } from '../lib/config';
import { pendingFieldObservationCount, pendingFieldSessionCount } from './fieldMode';
import { loadOfflineQueue } from './offlineSync';
import { loadLastSyncSummary } from './syncCoordinator';

export type DiagnosticStatus = 'pass' | 'warn' | 'fail' | 'info';

export interface DeviceDiagnosticItem {
  id: string;
  label: string;
  status: DiagnosticStatus;
  detail: string;
}

export interface DeviceDiagnostics {
  generatedAt: string;
  items: DeviceDiagnosticItem[];
}

async function checkSupabaseHealth() {
  if (!hasSupabaseConfig) return { ok: false, detail: 'إعدادات Supabase غير موجودة' };
  try {
    const response = await fetch(config.supabaseUrl + '/auth/v1/health', {
      headers: { apikey: config.supabaseKey },
    });
    return response.ok
      ? { ok: true, detail: 'الاتصال بخدمة المصادقة متاح' }
      : { ok: false, detail: 'الخدمة أعادت HTTP ' + response.status };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : 'تعذر الاتصال بـ Supabase' };
  }
}

export async function runDeviceDiagnostics(): Promise<DeviceDiagnostics> {
  const items: DeviceDiagnosticItem[] = [];
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  const appVersion = Constants.expoConfig?.version ?? 'غير معروف';

  items.push({
    id: 'runtime',
    label: 'بيئة التشغيل',
    status: Platform.OS === 'web' ? 'warn' : 'pass',
    detail: Platform.OS + ' · الإصدار ' + appVersion + ' · ' + config.appEnv,
  });

  items.push({
    id: 'eas',
    label: 'ربط EAS',
    status: projectId ? 'pass' : 'fail',
    detail: projectId ? 'Project ID: ' + projectId : 'لا يوجد EAS Project ID في إعدادات التطبيق',
  });

  const supabase = await checkSupabaseHealth();
  items.push({
    id: 'supabase',
    label: 'الاتصال بالخادم',
    status: supabase.ok ? 'pass' : 'fail',
    detail: supabase.detail,
  });

  items.push({
    id: 'map',
    label: 'مصدر الخرائط',
    status: hasConfiguredMapStyle ? 'pass' : isProductionRuntime ? 'fail' : 'warn',
    detail: hasConfiguredMapStyle
      ? 'تم ضبط Map Style · ' + mapProviderLabel()
      : canUseDevelopmentMapFallback
        ? 'لا يوجد Map Style مخصص؛ مسموح fallback تجريبي خارج الإنتاج فقط'
        : 'وضع الإنتاج يمنع fallback التجريبي حتى يتم ضبط مصدر مرخّص',
  });

  if (Platform.OS === 'web') {
    items.push({ id: 'push', label: 'إشعارات الجهاز', status: 'info', detail: 'فحص Push متاح داخل Development Build على iOS/Android' });
  } else {
    try {
      const permission = await Notifications.getPermissionsAsync();
      items.push({
        id: 'push',
        label: 'إذن الإشعارات',
        status: permission.status === 'granted' ? 'pass' : permission.status === 'denied' ? 'warn' : 'info',
        detail: 'الحالة: ' + permission.status,
      });
    } catch (error) {
      items.push({
        id: 'push',
        label: 'إذن الإشعارات',
        status: 'warn',
        detail: error instanceof Error ? error.message : 'تعذر قراءة إذن الإشعارات',
      });
    }
  }

  const [offlineQueue, fieldObservations, fieldSessions, lastSync] = await Promise.all([
    loadOfflineQueue(),
    pendingFieldObservationCount(),
    pendingFieldSessionCount(),
    loadLastSyncSummary(),
  ]);
  const pending = offlineQueue.filter((item) => item.status === 'pending').length;
  const failed = offlineQueue.filter((item) => item.status === 'failed').length;

  items.push({
    id: 'offline',
    label: 'طابور المزامنة',
    status: failed > 0 ? 'warn' : 'pass',
    detail: 'عقارات: ' + pending + ' بانتظار المزامنة · ' + failed + ' تحتاج مراجعة · ميدان: ' + fieldObservations + ' ملاحظة و' + fieldSessions + ' جلسة',
  });

  items.push({
    id: 'last-sync',
    label: 'آخر مزامنة',
    status: lastSync ? 'pass' : 'info',
    detail: lastSync
      ? new Date(lastSync.completedAt).toLocaleString('ar-IQ') + ' · ' + lastSync.source
      : 'لا توجد مزامنة مسجلة على هذا الجهاز بعد',
  });

  return { generatedAt: new Date().toISOString(), items };
}
