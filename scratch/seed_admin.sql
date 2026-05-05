-- Insert Super Admin
INSERT INTO ptj.admins (
    full_name, 
    email, 
    password_hash, 
    role, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    'محمد ناصر محمد محمد امام',
    'mohamednasseremam3@gmil.com',
    '$2b$12$b5.72uSg7EM4MqNt9sQda.ZarVRe48JQ7OOWSvS5/RjwTJ.h8r1TO',
    'super_admin',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role;
