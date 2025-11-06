-- Supabase SQL Schema Setup
-- Ejecuta este SQL en: Supabase Dashboard > SQL Editor

-- Crear tabla de assets (compatible con esquema local)
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  category TEXT,
  resolution TEXT,
  width INTEGER,
  height INTEGER,
  tags TEXT,
  description TEXT,
  file_size BIGINT,
  mime_type TEXT,
  storage_path TEXT, -- Path in Supabase Storage
  preview_url TEXT,  -- Public URL for previews
  user_id UUID REFERENCES auth.users(id), -- Owner (from Supabase Auth)
  
  -- Migration metadata
  migrated_from_local BOOLEAN DEFAULT false,
  local_asset_id INTEGER, -- Reference to original local ID
  migrated_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_assets_platform_category ON assets(platform, category);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_local_id ON assets(local_asset_id);
CREATE INDEX IF NOT EXISTS idx_assets_storage_path ON assets(storage_path);

-- Habilitar Row Level Security
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver todos los assets (por ahora)
CREATE POLICY "Anyone can read assets" ON assets
  FOR SELECT USING (true);

-- Política: Solo usuarios autenticados pueden insertar
CREATE POLICY "Authenticated users can insert assets" ON assets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política: Los usuarios pueden actualizar sus propios assets
CREATE POLICY "Users can update own assets" ON assets
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propios assets
CREATE POLICY "Users can delete own assets" ON assets
  FOR DELETE USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_assets_updated_at 
  BEFORE UPDATE ON assets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();