-- Add is_selected flag to user_selected_avatar table to track avatar selection state
ALTER TABLE user_selected_avatar ADD COLUMN IF NOT EXISTS is_selected boolean DEFAULT true;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_selected_avatar_selected ON user_selected_avatar(user_id, is_selected);
