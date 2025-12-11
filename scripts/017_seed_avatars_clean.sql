-- Insert default system avatars (no creator_id required)
INSERT INTO avatars (name, logo_url, description, is_public, creator_id) VALUES
('Default Avatar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=default', 'Default system avatar', true, NULL),
('Robot', 'https://api.dicebear.com/7.x/bottts/svg?seed=robot', 'Robot avatar', true, NULL),
('Pixel', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=pixel', 'Pixel art avatar', true, NULL),
('Adventurer', 'https://api.dicebear.com/7.x/adventurer/svg?seed=adventurer', 'Adventurer avatar', true, NULL),
('Lorelei', 'https://api.dicebear.com/7.x/lorelei/svg?seed=lorelei', 'Lorelei avatar', true, NULL),
('Notionists', 'https://api.dicebear.com/7.x/notionists/svg?seed=notionists', 'Notionists avatar', true, NULL);
