-- 005_seed_data.sql
-- Sample seed data for development

INSERT INTO apps (app_id, type, title, description, image, "downloadUrl", category)
VALUES
    ('sample-app-001',  'apps',     'Sample App',     'A sample application.',  '', '#', 'tools'),
    ('sample-book-001', 'books',    'Sample Book',    'A sample book.',         '', '#', 'fiction'),
    ('sample-mod-001',  'mods',     'Sample Mod',     'A sample game mod.',     '', '#', 'minecraft'),
    ('sample-art-001',  'articles', 'Sample Article', 'A sample article.',      '', '#', 'tech'),
    ('sample-aud-001',  'audio',    'Sample Audio',   'A sample audio track.',  '', '#', 'music'),
    ('sample-svc-001',  'services', 'Sample Service', 'A sample service.',      '', '#', 'design')
ON CONFLICT DO NOTHING;
