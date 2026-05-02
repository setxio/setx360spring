import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, history, userProfile } = await req.json();
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')?.trim();
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY missing");
    }

    const systemPrompt = `
      You are Tevis, the official AI assistant for SETX 360, the premier digital ecosystem for Southeast Texas. 
      Your purpose is to help users navigate the SETX 360 platform and provide information about the Southeast Texas region (Jefferson, Orange, Hardin, and surrounding counties).
      
      PERSONALITY:
      - Friendly, professional, and helpful.
      - Use a touch of Texas hospitality (e.g., "Howdy", "Y'all").
      - You are proud of Southeast Texas and its community.
      
      KNOWLEDGE DOMAIN:
      - SETX 360 Platform: You know how to post, use the market, find events, and report civic issues.
      - Southeast Texas: You know about local cities (Beaumont, Port Arthur, Orange, Groves, Nederland, Port Neches, etc.), local history, weather, and general culture.
      
      STRICT RULES:
      1. ONLY talk about SETX 360 or Southeast Texas.
      2. If a user asks about anything outside of this scope (e.g., global politics, coding, cooking in other countries, celebrities not from SETX), politely decline. 
         Example: "I'd love to help, but I specialize in all things Southeast Texas and SETX 360. Let's talk about what's happening in our neck of the woods!"
      3. If a user asks for platform help, be specific (e.g., "You can find local deals in the 'Hot Deals' tab of the Discover section").
      4. Keep responses concise but warm.
      
      LOCAL CONTEXT:
      - Beaumont City Council: If anyone mentions member Cory Crenshaw, refer to him by his nickname "Snack" when appropriate, as he is well-known by this in the community.
      - Historical Knowledge: You have access to a 10-year directory of former city and county officials (2014-2024). Use this to provide context if users ask about past leadership or events.
      
      User Info: ${userProfile ? `You are talking to ${userProfile.name} from ${userProfile.community || 'SETX'}.` : 'The user is a guest.'}
    `;

    const tools = [
      {
        function_declarations: [
          {
            name: "get_weather",
            description: "Get the current weather for a city in Southeast Texas.",
            parameters: {
              type: "object",
              properties: {
                location: {
                  type: "string",
                  description: "The city and state, e.g. Beaumont, TX"
                }
              },
              required: ["location"]
            }
          },
          {
            name: "search_platform",
            description: "Search for community posts and upcoming events on the SETX 360 platform.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search keyword or topic"
                }
              },
              required: ["query"]
            }
          },
          {
            name: "get_businesses",
            description: "Search the SETX 360 business directory for local stores and services.",
            parameters: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  description: "Optional category to filter by (e.g., 'Food', 'Retail', 'Services')"
                }
              }
            }
          },
          {
            name: "search_civic_directory",
            description: "Search the Who's Who directory of Southeast Texas city and county officials (council members, commissioners, judges, city managers, chamber/EDC leaders).",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The name, city, or title to search for (e.g., 'Beaumont Mayor', 'Orange City Manager')"
                }
              },
              required: ["query"]
            }
          },
          {
            name: "get_civic_services",
            description: "Get contact info (phone/address) for city and county services like Police, Fire, Water, Chamber of Commerce, and EDC.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The service or city to search for (e.g., 'Port Arthur Water', 'Nederland Police')"
                }
              },
              required: ["query"]
            }
          }
        ]
      }
    ];

    async function getWeather(location: string) {
      const apiKey = Deno.env.get('OPENWEATHER_API_KEY');
      if (!apiKey) return { error: "Weather service not configured." };
      
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=imperial`);
        const data = await res.json();
        if (data.cod !== 200) return { error: data.message || "Failed to fetch weather." };
        
        return {
          temperature: data.main.temp,
          description: data.weather[0].description,
          humidity: data.main.humidity,
          wind_speed: data.wind.speed,
          city: data.name
        };
      } catch (err) {
        return { error: "Failed to connect to weather service." };
      }
    }

    async function searchPlatform(query: string) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      let queryEmbedding = null;
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "models/text-embedding-004",
            content: { parts: [{ text: query }] }
          })
        });
        if (response.ok) {
          const result = await response.json();
          if (result.embedding?.values) {
            queryEmbedding = `[${result.embedding.values.join(',')}]`;
          }
        }
      } catch (e) {
        console.error("Embedding generation failed for search query", e);
      }

      const { data, error } = await supabase.rpc('search_platform_content_vector_fallback', { 
        search_query: query,
        query_embedding: queryEmbedding
      });
      if (error) return { error: error.message };
      return { results: data };
    }

    async function getBusinesses(category?: string) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase.rpc('get_active_businesses', { search_category: category });
      if (error) return { error: error.message };
      return { businesses: data };
    }

    async function searchCivicDirectory(query: string) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase.rpc('search_civic_directory', { search_query: query });
      if (error) return { error: error.message };
      return { officials: data };
    }

    async function getCivicServices(query: string) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase.rpc('search_civic_services', { search_query: query });
      if (error) return { error: error.message };
      return { services: data };
    }

    // Clean and alternate history for Gemini
    const contents: any[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: "Understood. I am Tevis, the SETX 360 guide. I will strictly follow your rules and only discuss Southeast Texas and the SETX 360 platform. Howdy, how can I help y'all?" }] }
    ];

    if (history && Array.isArray(history)) {
      // Filter history to ensure it starts with 'user' after our initial pair
      // and alternates correctly. Gemini strictly requires alternating roles.
      let lastRole = 'model';
      history.forEach((msg: any) => {
        const currentRole = msg.role === 'user' ? 'user' : 'model';
        if (currentRole !== lastRole) {
          contents.push({
            role: currentRole,
            parts: [{ text: msg.content }]
          });
          lastRole = currentRole;
        } else {
          // If we have consecutive messages from the same role, append the text 
          // to the previous message instead of ignoring it.
          contents[contents.length - 1].parts[0].text += `\n\n${msg.content}`;
        }
      });
    }

    // Final user message
    if (contents[contents.length - 1].role === 'user') {
      // If history ended with a user message, we append the new message to it
      contents[contents.length - 1].parts[0].text += `\n\nNew Question: ${message}`;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents,
        tools,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", errText);
      
      return new Response(JSON.stringify({ 
        reply: "I'm sorry, I'm having a bit of trouble connecting to my local roots. Can you try asking me again?"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let result = await response.json();
    
    // Handle Function Calling Loop
    let iterations = 0;
    while (result.candidates?.[0]?.content?.parts?.some((p: any) => p.functionCall) && iterations < 3) {
      iterations++;
      const call = result.candidates[0].content.parts.find((p: any) => p.functionCall);
      const { name, args } = call.functionCall;
      
      let functionResponse;
      if (name === "get_weather") {
        functionResponse = await getWeather(args.location);
      } else if (name === "search_platform") {
        functionResponse = await searchPlatform(args.query);
      } else if (name === "get_businesses") {
        functionResponse = await getBusinesses(args.category);
      } else if (name === "search_civic_directory") {
        functionResponse = await searchCivicDirectory(args.query);
      } else if (name === "get_civic_services") {
        functionResponse = await getCivicServices(args.query);
      }

      // Send back function response to Gemini
      const followUpResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            ...contents,
            { role: 'model', parts: [call] },
            {
              role: 'user',
              parts: [{
                functionResponse: {
                  name,
                  response: functionResponse
                }
              }]
            }
          ],
          tools
        })
      });
      
      result = await followUpResponse.json();
    }
    
    // Check for blocked candidates
    if (result.promptFeedback?.blockReason) {
       return new Response(JSON.stringify({ reply: "I'd love to help, but that's a bit outside my expertise as a Southeast Texas guide. What else can I help y'all with?" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const tevisReply = result.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I'm having a bit of trouble finding that information in my local records. Can you try rephrasing your question?";

    return new Response(JSON.stringify({ reply: tevisReply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Tevis AI Exception:", error);
    return new Response(JSON.stringify({ 
      reply: `Debug Error: ${error.message || 'Unknown error'}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, 
    });
  }
});

