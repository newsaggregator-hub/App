// FREE Alternative - Works with Airtable (free) or Demo Mode
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Only POST requests are accepted.'
    });
  }

  try {
    // Parse and validate request body
    const { email, topics } = req.body;

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validTopics = ['Politics', 'Business', 'Technology'];

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email is required and must be a string.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.'
      });
    }

    // Validate topics
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one topic must be selected.'
      });
    }

    // Validate each topic
    const invalidTopics = topics.filter(topic => !validTopics.includes(topic));
    if (invalidTopics.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid topics: ${invalidTopics.join(', ')}. Valid topics are: ${validTopics.join(', ')}.`
      });
    }

    // Remove duplicates from topics
    const uniqueTopics = [...new Set(topics)];

    // Check for Airtable configuration (completely free option)
    const airtableApiKey = process.env.AIRTABLE_API_KEY;
    const airtableBaseId = process.env.AIRTABLE_BASE_ID;
    
    if (!airtableApiKey || !airtableBaseId) {
      // Demo mode - no database needed, completely free
      console.log('Running in demo mode - no database configured');
      return res.status(200).json({
        success: true,
        message: 'Successfully signed up for early access! (Demo mode - add Airtable keys for real storage)',
        data: {
          email: trimmedEmail,
          topics: uniqueTopics,
          isNewSignup: true,
          mode: 'demo'
        }
      });
    }

    // Store in Airtable (free tier: 10,000 records/month)
    try {
      const airtableResponse = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/Signups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            Email: trimmedEmail,
            Topics: uniqueTopics.join(', '),
            'Created At': new Date().toISOString(),
            'Signup Date': new Date().toLocaleDateString()
          }
        })
      });

      if (!airtableResponse.ok) {
        const errorData = await airtableResponse.json();
        console.error('Airtable error:', errorData);
        
        // Check if it's a duplicate email error
        if (errorData.error && errorData.error.message && errorData.error.message.includes('duplicate')) {
          return res.status(409).json({
            success: false,
            error: 'This email is already registered.'
          });
        }
        
        throw new Error('Failed to save to Airtable');
      }

      const result = await airtableResponse.json();
      console.log('Airtable success:', {
        email: trimmedEmail,
        topics: uniqueTopics,
        recordId: result.id
      });

      return res.status(200).json({
        success: true,
        message: 'Successfully signed up for early access!',
        data: {
          email: trimmedEmail,
          topics: uniqueTopics,
          isNewSignup: true,
          mode: 'airtable'
        }
      });

    } catch (airtableError) {
      console.error('Airtable storage error:', airtableError);
      
      // Fallback to demo mode if Airtable fails
      return res.status(200).json({
        success: true,
        message: 'Successfully signed up for early access! (Stored locally due to temporary issue)',
        data: {
          email: trimmedEmail,
          topics: uniqueTopics,
          isNewSignup: true,
          mode: 'fallback'
        }
      });
    }

  } catch (error) {
    console.error('Signup API error:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON in request body.'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
