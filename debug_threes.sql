-- Check if three_pointers has any data
SELECT 
    COUNT(*) as total_rows,
    SUM(three_pointers) as total_three_pointers,
    MAX(three_pointers) as max_three_pointers,
    COUNT(*) FILTER (WHERE three_pointers > 0) as rows_with_threes
FROM box_scores;

-- Check a few rows to see what columns look like
SELECT * FROM box_scores LIMIT 5;
