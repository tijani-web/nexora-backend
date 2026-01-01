import pool from '../config/db.js';

export const searchAll = async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      });
    }

    console.log(' Searching for:', query);

    // ✅ SIMPLE SEARCH: Questions with ILIKE
    const questionsResult = await pool.query(`
      SELECT 
        q.id,
        q.title,
        q.body,
        q.created_at,
        q.views_count,
        q.answers_count,
        u.name as author_name,
        'question' as type
      FROM questions q
      JOIN users u ON q.author_id = u.id
      WHERE q.title ILIKE $1
         OR q.body ILIKE $1
      ORDER BY 
        CASE 
          WHEN q.title ILIKE $1 THEN 1
          WHEN q.body ILIKE $1 THEN 2
          ELSE 3
        END,
        q.created_at DESC
      LIMIT 10
    `, [`%${query}%`]);

    // ✅ SIMPLE SEARCH: Answers with ILIKE
    const answersResult = await pool.query(`
      SELECT 
        a.id,
        a.body,
        a.created_at,
        q.title as question_title,
        q.id as question_id,
        u.name as author_name,
        'answer' as type
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      JOIN users u ON a.user_id = u.id
      WHERE a.body ILIKE $1
      ORDER BY a.created_at DESC
      LIMIT 10
    `, [`%${query}%`]);

    // ✅ SIMPLE SEARCH: Users with ILIKE
    const usersResult = await pool.query(`
      SELECT 
        id,
        name as username,
        email,
        avatar_url,
        created_at,
        'user' as type
      FROM users 
      WHERE name ILIKE $1
         OR email ILIKE $1
      ORDER BY 
        CASE 
          WHEN name ILIKE $1 THEN 1
          WHEN email ILIKE $1 THEN 2
          ELSE 3
        END
      LIMIT 10
    `, [`%${query}%`]);

    // ✅ SIMPLE SEARCH: Tags with ILIKE
    const tagsResult = await pool.query(`
      SELECT 
        t.name as tag_name,
        'tag' as type,
        COUNT(qt.question_id) as question_count
      FROM tags t
      LEFT JOIN question_tags qt ON t.id = qt.tag_id
      WHERE t.name ILIKE $1
      GROUP BY t.name, t.id
      ORDER BY question_count DESC
      LIMIT 10
    `, [`%${query}%`]);

    // ✅ DEBUG: Check what we found
    console.log('🔍 DEBUG QUESTIONS FOUND:', questionsResult.rows.length);
    if (questionsResult.rows.length > 0) {
      console.log('📝 Question titles found:', questionsResult.rows.map(q => q.title));
    }

    const results = [
      ...questionsResult.rows.map(r => ({ ...r, id: r.id.toString() })),
      ...answersResult.rows.map(r => ({ ...r, id: r.id.toString() })),
      ...usersResult.rows.map(r => ({ ...r, id: r.id.toString() })),
      ...tagsResult.rows.map(r => ({ ...r, id: r.tag_name }))
    ];

    console.log(`✅ Found ${results.length} total results`);
    console.log('📊 Breakdown:', {
      questions: questionsResult.rows.length,
      answers: answersResult.rows.length, 
      users: usersResult.rows.length,
      tags: tagsResult.rows.length
    });

    res.status(200).json({
      success: true,
      data: results,
      counts: {
        questions: questionsResult.rows.length,
        answers: answersResult.rows.length,
        users: usersResult.rows.length,
        tags: tagsResult.rows.length
      }
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Search failed', 
      error: error.message 
    });
  }
};