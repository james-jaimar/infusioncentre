-- Assign admin role to james@jaimar.dev
INSERT INTO public.user_roles (user_id, role)
VALUES ('f4e79f6c-b466-461d-ab25-770c8805d604', 'admin');

-- Create profile for james@jaimar.dev
INSERT INTO public.profiles (user_id, first_name, last_name)
VALUES ('f4e79f6c-b466-461d-ab25-770c8805d604', 'James', NULL);