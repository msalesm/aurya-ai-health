-- Security Fix: Enhanced RLS for emergency_alerts table
-- Allow authorized healthcare providers to access patient emergency alerts

-- Drop existing policy that only allows patient access
DROP POLICY IF EXISTS "Users can manage their own emergency alerts" ON public.emergency_alerts;

-- Create comprehensive policies for emergency alerts access

-- Policy 1: Patients can manage their own emergency alerts
CREATE POLICY "Patients can manage own emergency alerts" 
ON public.emergency_alerts 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Authorized healthcare providers can view emergency alerts of their patients
-- Based on active appointments between doctor and patient
CREATE POLICY "Healthcare providers can view patient emergency alerts" 
ON public.emergency_alerts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.appointments a
    INNER JOIN public.user_profiles up ON up.id = auth.uid()
    WHERE a.patient_id = emergency_alerts.user_id
      AND a.doctor_user_id = auth.uid()
      AND up.role IN ('doctor', 'admin')
      AND a.status IN ('confirmed', 'in_progress')
      AND a.scheduled_at >= NOW() - INTERVAL '30 days'
  )
);

-- Policy 3: Doctors can create emergency alerts for their patients during active consultations
CREATE POLICY "Healthcare providers can create emergency alerts for patients" 
ON public.emergency_alerts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.medical_consultations mc
    INNER JOIN public.user_profiles up ON up.id = auth.uid()
    WHERE mc.user_id = emergency_alerts.user_id
      AND mc.created_at >= NOW() - INTERVAL '24 hours'
      AND mc.status = 'em_andamento'
      AND up.role IN ('doctor', 'admin')
  ) OR
  auth.uid() = user_id -- Patients can still create their own alerts
);

-- Policy 4: Emergency system access for critical alerts (admin only)
CREATE POLICY "Admins can manage all emergency alerts" 
ON public.emergency_alerts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_profiles up
    WHERE up.id = auth.uid() 
      AND up.role = 'admin'
  )
);