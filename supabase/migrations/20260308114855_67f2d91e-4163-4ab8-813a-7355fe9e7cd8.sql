
-- Drop and recreate to avoid conflicts
DROP POLICY IF EXISTS "Members can view company members" ON public.company_members;
DROP POLICY IF EXISTS "Users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update company" ON public.companies;
DROP POLICY IF EXISTS "Members can read company" ON public.companies;

-- company_members SELECT
CREATE POLICY "Members can view company members"
ON public.company_members
FOR SELECT
TO authenticated
USING (company_id = public.get_user_company_id());

-- profiles
CREATE POLICY "Users can read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- companies
CREATE POLICY "Admins can update company"
ON public.companies
FOR UPDATE
TO authenticated
USING (public.is_company_admin(auth.uid(), id));

CREATE POLICY "Members can read company"
ON public.companies
FOR SELECT
TO authenticated
USING (public.is_company_member(auth.uid(), id));
