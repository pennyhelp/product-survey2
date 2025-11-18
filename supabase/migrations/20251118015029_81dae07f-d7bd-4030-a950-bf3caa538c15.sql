-- Assign admin role to elife@gmail.com
-- This will find the user by email and assign them the admin role

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'elife@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;