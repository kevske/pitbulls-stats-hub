-- Check constraints on box_scores table
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'box_scores' 
    AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name;
