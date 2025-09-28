-- Create RLS policy for rls_comment table

-- Policy for ALL operations: Users can only access their own comments
CREATE POLICY "rls_comment_user_isolation_policy" ON "rls_comment"
FOR ALL
USING (
  "user_id" = current_setting('request.jwt.claim.sub', true)::varchar
)
WITH CHECK (
  "user_id" = current_setting('request.jwt.claim.sub', true)::varchar
);
