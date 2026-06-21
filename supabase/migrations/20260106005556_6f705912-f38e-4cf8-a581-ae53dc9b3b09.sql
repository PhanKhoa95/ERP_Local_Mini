-- Create trigger function for auto-setup on new user signup
CREATE OR REPLACE FUNCTION public.auto_setup_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_company_id uuid;
  email_domain text;
  company_name text;
BEGIN
  -- Extract domain from email to use as company name hint
  email_domain := split_part(NEW.email, '@', 2);
  company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    'Công ty ' || split_part(NEW.email, '@', 1)
  );
  
  -- Create new company
  INSERT INTO public.companies (name, code, is_active)
  VALUES (company_name, 'COMP-' || substr(NEW.id::text, 1, 8), true)
  RETURNING id INTO new_company_id;
  
  -- Add user as admin of the company
  INSERT INTO public.company_members (user_id, company_id, role)
  VALUES (NEW.id, new_company_id, 'admin');
  
  -- Create default warehouse for the company
  INSERT INTO public.warehouses (name, code, is_active, is_default, address)
  VALUES ('Kho chính', 'KHO-' || substr(new_company_id::text, 1, 8), true, true, 'Địa chỉ mặc định');
  
  -- Create default sales channel
  INSERT INTO public.sales_channels (name, code, is_active, color, description)
  VALUES ('Cửa hàng', 'STORE-' || substr(new_company_id::text, 1, 8), true, '#3B82F6', 'Kênh bán hàng mặc định');
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Auto-setup failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users (if it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created_auto_setup ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_setup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_setup_new_user();