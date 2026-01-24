-- Add model_3d_url column to items table for 3D Sketchfab models
ALTER TABLE items ADD COLUMN IF NOT EXISTS model_3d_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN items.model_3d_url IS 'Sketchfab 3D model URL for product visualization';
