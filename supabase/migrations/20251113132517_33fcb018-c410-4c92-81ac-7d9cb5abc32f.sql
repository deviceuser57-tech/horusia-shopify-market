-- Add DELETE policy for profiles table to allow users to delete their own profiles
-- This addresses GDPR "right to be forgotten" and proper data privacy practices

CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);