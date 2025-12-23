-- Fix RLS Policy for box_scores table to allow UPDATE operations
-- Run this in Supabase Dashboard → SQL Editor

-- First, check if RLS is enabled on the table
ALTER TABLE box_scores ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies (if any)
DROP POLICY IF EXISTS "Users can view box_scores" ON box_scores;
DROP POLICY IF EXISTS "Users can insert box_scores" ON box_scores;
DROP POLICY IF EXISTS "Users can update box_scores" ON box_scores;

-- Create comprehensive policies for authenticated users

-- Policy for SELECT (reading data)
CREATE POLICY "Users can view box_scores" ON box_scores
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for UPDATE (updating minutes) - This is the key fix!
CREATE POLICY "Users can update box_scores" ON box_scores
FOR UPDATE USING (auth.role() = 'authenticated');

-- Optional: Policy for INSERT if needed
CREATE POLICY "Users can insert box_scores" ON box_scores
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Verify the policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'box_scores';
