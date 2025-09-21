-- Create RLS policies for rls_org_example table using FOR ALL

-- Policy for ALL operations (SELECT, INSERT, UPDATE, DELETE)
-- Organizations can only access their own rows, except for public token access
CREATE POLICY "rls_org_example_tenant_isolation_policy" ON "rls_org_example"
FOR ALL
USING (
  "organization_id" = current_setting('request.jwt.claim.org_id', true)::text
  OR 
  "public_token" = current_setting('request.jwt.claim.public_token', true)::text
)
WITH CHECK (
  "organization_id" = current_setting('request.jwt.claim.org_id', true)::text
); 