-- 1. Criar a tabela de notificações (caso não exista)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('purchase', 'sale', 'comment', 'publication', 'activity')) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- 4. Política para permitir que qualquer usuário autenticado INSIRA notificações
-- (Necessário para que um aluno possa notificar um instrutor e vice-versa)
CREATE POLICY "Users can insert notifications" 
ON notifications FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 5. Política para permitir que o usuário veja apenas as SUAS PRÓPRIAS notificações
CREATE POLICY "Users can view own notifications" 
ON notifications FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 6. Política para permitir que o usuário atualize apenas as SUAS PRÓPRIAS notificações
CREATE POLICY "Users can update own notifications" 
ON notifications FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);
