INSERT INTO ptj.jobs (title, description, company_id, classification, job_type, salary, address, slots_available, field_of_work, is_active, created_at, updated_at)
VALUES 
(
  'فني صيانة تكييفات',
  'مطلوب فني صيانة تكييفات محترف للعمل في صيانة أجهزة التكييف المركزية والسبليت. خبرة لا تقل عن سنتين.',
  1, 'خدمات', '["one-time"]', 4000, 'Cairo, Egypt', 3, '["خدمات"]', true, NOW(), NOW()
),
(
  'سباك محترف',
  'مطلوب سباك محترف للعمل في مشاريع سباكة سكنية وتجارية. تركيب وصيانة شبكات المياه والصرف الصحي.',
  1, 'خدمات', '["one-time"]', 3500, 'Giza, Egypt', 5, '["خدمات"]', true, NOW(), NOW()
),
(
  'كهربائي منازل',
  'مطلوب كهربائي منازل لتركيب وصيانة التمديدات الكهربائية. خبرة في اللوحات الكهربائية والإنارة الحديثة.',
  1, 'خدمات', '["part-time"]', 3000, 'Alexandria, Egypt', 2, '["خدمات"]', true, NOW(), NOW()
);
