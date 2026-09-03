import { supabase } from '../lib/supabase';
import type { ProfessionalType } from '../domain/professionalApproval';

export async function submitProfessionalApplication(input: {
  type: ProfessionalType;
  licenseNumber: string;
  issuingAuthority: string;
  governorates: string[];
}) {
  if (!supabase) return { demo: true, id: 'demo-professional-application' };
  const { data: session } = await supabase.auth.getUser();
  const userId = session.user?.id;
  if (!userId) throw new Error('not_authenticated');
  const { data, error } = await supabase
    .from('professional_applications')
    .insert({ applicant_id: userId, professional_type: input.type, license_number: input.licenseNumber, issuing_authority: input.issuingAuthority, governorates: input.governorates, status: 'submitted' })
    .select('id,status')
    .single();
  if (error) throw error;
  return data;
}
