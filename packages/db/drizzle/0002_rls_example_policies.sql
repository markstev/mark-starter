-- Create RLS policies for rls_example table

-- Policy for INSERT: Users can only insert rows where they are the owner
CREATE POLICY "rls_example_insert_policy" ON "rls_example"
FOR INSERT WITH CHECK (
  "user_id" = current_setting('request.jwt.claim.sub', true)::varchar
);

-- Policy for SELECT: Users can see their own rows and rows with matching public_token
CREATE POLICY "rls_example_select_policy" ON "rls_example"
FOR SELECT USING (
  "user_id" = current_setting('request.jwt.claim.sub', true)::varchar
  OR 
  "public_token" = current_setting('request.jwt.claim.public_token', true)::varchar
);

-- Policy for UPDATE: Users can only update their own rows
CREATE POLICY "rls_example_update_policy" ON "rls_example"
FOR UPDATE USING (
  "user_id" = current_setting('request.jwt.claim.sub', true)::varchar
);

-- Policy for DELETE: Users can only delete their own rows
CREATE POLICY "rls_example_delete_policy" ON "rls_example"
FOR DELETE USING (
  "user_id" = current_setting('request.jwt.claim.sub', true)::varchar
);
