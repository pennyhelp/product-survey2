-- Grant admin role to the logged-in account
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'elifeemployment@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;