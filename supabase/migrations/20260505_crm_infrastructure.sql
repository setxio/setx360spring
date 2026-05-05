-- SETX CRM Infrastructure Migration
-- This migration establishes the tables for managing customer relationships, leads, and business interactions.

-- 1. Create Lead Stages Enum
DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiating', 'closed_won', 'closed_lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create CRM Customers/Leads table
CREATE TABLE IF NOT EXISTS crm_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Link to platform user if they exist
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    company_name TEXT,
    status lead_status DEFAULT 'new',
    source TEXT DEFAULT 'direct', -- e.g., 'market', 'social', 'website', 'referral'
    estimated_value DECIMAL(12,2) DEFAULT 0,
    tags TEXT[],
    notes TEXT,
    last_contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Interaction Log (Communication history)
CREATE TABLE IF NOT EXISTS crm_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES profiles(id), -- Who performed the interaction
    type TEXT NOT NULL, -- 'email', 'call', 'meeting', 'note', 'system_sync'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create CRM Tasks (Follow-ups)
CREATE TABLE IF NOT EXISTS crm_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable Row Level Security
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Owners can see leads for their stores
CREATE POLICY "Owners can view their leads" ON crm_leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = crm_leads.store_id 
            AND (stores.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM store_team 
                WHERE store_id = stores.id AND user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Owners can manage their leads" ON crm_leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = crm_leads.store_id 
            AND (stores.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM store_team 
                WHERE store_id = stores.id AND user_id = auth.uid() AND role = 'manager'
            ))
        )
    );

-- Interaction and Task policies follow the same pattern...
CREATE POLICY "Owners can manage their interactions" ON crm_interactions FOR ALL USING (EXISTS (SELECT 1 FROM crm_leads WHERE crm_leads.id = crm_interactions.lead_id));
CREATE POLICY "Owners can manage their tasks" ON crm_tasks FOR ALL USING (EXISTS (SELECT 1 FROM crm_leads WHERE crm_leads.id = crm_tasks.lead_id));

-- 7. Global Admin Policies
CREATE POLICY "Admins can view all CRM data" ON crm_leads FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can view all interactions" ON crm_interactions FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can view all tasks" ON crm_tasks FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 8. Triggers for updated_at
CREATE TRIGGER update_crm_leads_modtime
    BEFORE UPDATE ON crm_leads
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
