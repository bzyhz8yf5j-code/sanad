import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Screen } from '../../../../src/components/Screen';
import { Badge, Body, Button, Caption, Card, Divider, EmptyState, Icon, SectionTitle, Title } from '../../../../src/components/Ui';
import { supabase } from '../../../../src/lib/supabase';
import { listPropertyMedia, removePropertyMedia, saveMediaOrder, setPropertyCover, uploadPropertyMedia } from '../../../../src/services/propertyMedia';
import { colors } from '../../../../src/theme/colors';

interface MediaItem {
  id: string;
  kind: 'image' | 'video' | 'document';
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  sort_order: number;
  is_cover: boolean;
  created_at?: string;
}

export default function PropertyMediaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [message, setMessage] = useState('أضف صور العقار، ثم اختر صورة غلاف واحدة.');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id || !supabase) return;
    const data = await listPropertyMedia(id);
    setItems(data as MediaItem[]);
  }, [id]);

  useEffect(() => {
    void load().catch(() => setMessage('تعذر تحميل الوسائط المرتبطة بالإعلان.'));
  }, [load]);

  async function pick() {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'video/*', 'application/pdf'], multiple: false, copyToCacheDirectory: true });
    if (result.canceled || !id) return;
    const file = result.assets[0];
    if (!file) return;
    const mime = file.mimeType ?? 'application/octet-stream';
    const kind: MediaItem['kind'] = mime.startsWith('image/') ? 'image' : mime.startsWith('video/') ? 'video' : 'document';
    try {
      setBusy(true);
      const uploaded = await uploadPropertyMedia({ propertyId: id, uri: file.uri, fileName: file.name, mimeType: mime, sizeBytes: file.size ?? 1, kind });
      if (supabase) {
        await load();
      } else {
        setItems((current) => [...current, {
          id: uploaded.id,
          kind,
          storage_path: uploaded.storage_path,
          mime_type: mime,
          size_bytes: file.size ?? 1,
          sort_order: current.length,
          is_cover: false,
        }]);
      }
      setMessage(supabase ? 'تم رفع الملف وربطه بالإعلان.' : 'أُضيف الملف إلى المعاينة المحلية فقط.');
    } catch (error) {
      setMessage(mediaError(error));
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    if (!id) return;
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const currentItem = next[index];
    const targetItem = next[target];
    if (!currentItem || !targetItem) return;
    next[index] = targetItem;
    next[target] = currentItem;
    setItems(next);
    try {
      await saveMediaOrder(id, next.map((item) => item.id));
      setMessage('تم حفظ ترتيب الوسائط.');
    } catch (error) {
      setItems(items);
      setMessage(mediaError(error));
    }
  }

  async function makeCover(mediaId: string) {
    if (!id) return;
    try {
      await setPropertyCover(id, mediaId);
      if (supabase) await load();
      else setItems((current) => current.map((item) => ({ ...item, is_cover: item.id === mediaId })));
      setMessage('تم تعيين صورة الغلاف.');
    } catch (error) {
      setMessage(mediaError(error));
    }
  }

  async function remove(mediaId: string) {
    try {
      await removePropertyMedia(mediaId);
      if (supabase) await load();
      else setItems((current) => current.filter((item) => item.id !== mediaId));
      setMessage('تم حذف الملف من الإعلان.');
    } catch (error) {
      setMessage(mediaError(error));
    }
  }

  const imageCount = items.filter((item) => item.kind === 'image').length;
  const hasCover = items.some((item) => item.kind === 'image' && item.is_cover);

  return <Screen>
    <View style={styles.header}><View><Title>وسائط الإعلان</Title><Caption>الخطوة 2 من 3 · الصور والملفات</Caption></View><Badge tone={hasCover ? 'success' : 'warning'}>{hasCover ? 'الغلاف جاهز' : 'الغلاف مطلوب'}</Badge></View>
    {!supabase ? <Card tone="accent"><View style={styles.previewNote}><Badge tone="warning">معاينة</Badge><Caption style={styles.previewCopy}>اختيار الملفات هنا لا يرفعها إلى الخادم في البيئة غير المتصلة.</Caption></View></Card> : null}

    <Card tone="elevated" style={styles.uploadCard}>
      <View style={styles.uploadIcon}><Icon name="add" color={colors.gold300} size={30} /></View>
      <Text style={styles.uploadTitle}>أضف صوراً أو فيديو أو PDF</Text>
      <Caption style={styles.center}>الصور حتى 15MB، الفيديو حتى 200MB، والمستندات بصيغة PDF حتى 25MB.</Caption>
      <Button label={busy ? 'جاري الرفع…' : 'اختيار ملف'} icon="document" disabled={busy} onPress={pick} />
    </Card>

    <View style={styles.summary}><Badge tone={items.length ? 'gold' : 'muted'}>{items.length.toLocaleString('ar-IQ')} ملفات</Badge><Badge tone={imageCount ? 'success' : 'warning'}>{imageCount.toLocaleString('ar-IQ')} صور</Badge></View>
    <Card><Body>{message}</Body></Card>

    {items.length ? <><SectionTitle>الملفات المضافة</SectionTitle>{items.map((item, index) => <Card key={item.id}>
      <View style={styles.itemTop}>
        <View style={styles.fileIcon}><Icon name={item.kind === 'image' ? 'building' : item.kind === 'video' ? 'projects' : 'document'} color={colors.gold300} size={24} /></View>
        <View style={styles.itemCopy}><Text numberOfLines={1} style={styles.fileName}>{fileName(item.storage_path)}</Text><Caption>{kindLabel(item.kind)} · {formatSize(item.size_bytes)}</Caption></View>
        {item.is_cover ? <Badge tone="success">الغلاف</Badge> : null}
      </View>
      <Divider />
      <View style={styles.rowActions}>
        {item.kind === 'image' && !item.is_cover ? <View style={styles.grow}><Button compact label="تعيين غلاف" variant="secondary" onPress={() => makeCover(item.id)} /></View> : null}
        <Button compact label="↑" variant="ghost" disabled={index === 0} onPress={() => move(index, -1)} />
        <Button compact label="↓" variant="ghost" disabled={index === items.length - 1} onPress={() => move(index, 1)} />
        <Button compact label="حذف" variant="danger" onPress={() => remove(item.id)} />
      </View>
    </Card>)}</> : <EmptyState icon="document" title="لم تُضف ملفات بعد" description="ابدأ بصورة واضحة للعقار، ثم عيّن واحدة منها كصورة الغلاف." />}

    <Button label="متابعة مراجعة الإعلان" icon="arrow" disabled={!items.length || !hasCover} onPress={() => router.push(`/office/property/${id}/edit` as never)} />
    <Caption style={styles.center}>تعطّل المتابعة حتى توجد صورة واحدة على الأقل وغلاف محدد.</Caption>
  </Screen>;
}

function kindLabel(kind: MediaItem['kind']) { return kind === 'image' ? 'صورة' : kind === 'video' ? 'فيديو' : 'مستند'; }
function fileName(path: string) { return path.split('/').at(-1) || 'ملف'; }
function formatSize(bytes: number) { return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`; }
function mediaError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('invalid_media')) return 'نوع الملف أو حجمه لا يطابق ضوابط الوسائط.';
  if (message === 'not_authenticated') return 'سجّل الدخول بحساب المكتب لرفع الملفات.';
  return message || 'تعذر تنفيذ العملية على الملف.';
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  previewNote: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  previewCopy: { flex: 1 },
  uploadCard: { alignItems: 'center', paddingVertical: 22 },
  uploadIcon: { width: 64, height: 64, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(217,165,58,0.10)', borderWidth: 1, borderColor: 'rgba(217,165,58,0.25)' },
  uploadTitle: { color: colors.text, fontSize: 17, fontWeight: '900', textAlign: 'center', writingDirection: 'rtl' },
  center: { textAlign: 'center' },
  summary: { flexDirection: 'row-reverse', gap: 8 },
  itemTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  fileIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy700 },
  itemCopy: { flex: 1, alignItems: 'flex-end', gap: 2 },
  fileName: { color: colors.text, fontSize: 14, fontWeight: '900', textAlign: 'right' },
  rowActions: { flexDirection: 'row-reverse', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  grow: { flexGrow: 1 },
});
