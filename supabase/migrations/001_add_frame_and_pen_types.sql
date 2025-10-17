-- Add frame and line types to objects table
-- Frame: Container/artboard (rectangle with border)
-- Line: Path/pen tool (connected points)

-- Update the type constraint to include new types
ALTER TABLE public.objects
DROP CONSTRAINT IF EXISTS objects_type_check;

ALTER TABLE public.objects
ADD CONSTRAINT objects_type_check
CHECK (type IN ('rect', 'circle', 'text', 'frame', 'line'));

-- Add points column for line/path objects (stored as JSON array of {x, y} coordinates)
ALTER TABLE public.objects
ADD COLUMN IF NOT EXISTS points jsonb;

-- Add stroke_width for lines and frames
ALTER TABLE public.objects
ADD COLUMN IF NOT EXISTS stroke_width numeric DEFAULT 2;

-- Comment for documentation
COMMENT ON COLUMN public.objects.points IS 'Array of {x, y} coordinates for line/path objects';
COMMENT ON COLUMN public.objects.stroke_width IS 'Stroke width for lines, frames, and outlined shapes';
