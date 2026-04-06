import { Anthropic } from '@anthropic-ai/sdk';
import { DAVID_SYSTEM_PROMPT } from '@/lib/constants';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface RequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  sessionId: string;
  listingContext?: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
  };
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { messages, listingContext } = body;

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    // Build system prompt with context
    let systemPrompt = DAVID_SYSTEM_PROMPT;

    if (listingContext) {
      systemPrompt += `\n\n## CURRENT LISTING CONTEXT
The user is viewing or interested in this equipment:
- **Listing ID**: ${listingContext.id}
- **Title**: ${listingContext.title}
- **Make**: ${listingContext.make}
- **Model**: ${listingContext.model}
- **Year**: ${listingContext.year}

If they ask about this equipment, be ready with details and recommendations. Consider using get_listing_details to pull full specs if needed.`;
    }

    // Add tool definitions
    systemPrompt += `\n\n## AVAILABLE TOOLS
You have access to tools to help serve customers:
1. search_inventory - Search our inventory by make, fuel type, capacity, price, condition
2. get_listing_details - Get full details about a specific listing
3. capture_lead - Log a serious prospect with their contact info and needs
4. schedule_callback - Schedule a callback with a customer

Use these tools when appropriate to help customers find what they need or to move the conversation toward a sale.`;

    const tools = [
      {
        name: 'search_inventory',
        description:
          'Search Material Solutions NJ inventory for specific equipment',
        input_schema: {
          type: 'object',
          properties: {
            make: {
              type: 'string',
              description: 'Equipment make (e.g., Raymond, Toyota, Crown)',
            },
            equipment_type: {
              type: 'string',
              description:
                'Type of equipment (reach truck, order picker, swing reach, pallet jack, stand-up counterbalance)',
            },
            min_capacity: {
              type: 'number',
              description: 'Minimum load capacity in lbs',
            },
            max_capacity: {
              type: 'number',
              description: 'Maximum load capacity in lbs',
            },
            min_price: {
              type: 'number',
              description: 'Minimum price in dollars',
            },
            max_price: {
              type: 'number',
              description: 'Maximum price in dollars',
            },
            condition: {
              type: 'string',
              enum: ['used', 'certified', 'reconditioned'],
              description: 'Equipment condition',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_listing_details',
        description: 'Get detailed information about a specific listing',
        input_schema: {
          type: 'object',
          properties: {
            listing_id: {
              type: 'string',
              description: 'The listing ID to get details for',
            },
          },
          required: ['listing_id'],
        },
      },
      {
        name: 'capture_lead',
        description:
          'Capture lead information from a serious prospect interested in equipment',
        input_schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: "Customer's full name",
            },
            email: {
              type: 'string',
              description: "Customer's email address",
            },
            phone: {
              type: 'string',
              description: "Customer's phone number",
            },
            company: {
              type: 'string',
              description: 'Company name',
            },
            needs: {
              type: 'string',
              description: 'Summary of their equipment needs',
            },
            urgency: {
              type: 'string',
              enum: ['immediate', '1-3_months', 'exploring'],
              description: 'How urgent is their need',
            },
            interested_listings: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of listing IDs they are interested in',
            },
          },
          required: ['name', 'needs'],
        },
      },
      {
        name: 'schedule_callback',
        description:
          'Schedule a callback for the customer to speak with Bill or the sales team',
        input_schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: "Customer's name",
            },
            phone: {
              type: 'string',
              description: "Customer's phone number",
            },
            preferred_time: {
              type: 'string',
              description: 'Preferred time for callback (e.g., "Tuesday 2pm", "Thursday morning")',
            },
            notes: {
              type: 'string',
              description: 'Any additional notes about the call',
            },
          },
          required: ['name', 'phone'],
        },
      },
    ];

    // Convert to Anthropic format
    const anthropicTools = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    }));

    // Stream response
    const response = new ReadableStream({
      async start(controller) {
        try {
          const stream = await client.messages.stream({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: systemPrompt,
            tools: anthropicTools as any,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })) as any,
          });

          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const text = chunk.delta.text;
              controller.enqueue(new TextEncoder().encode(text));
            }
          }

          controller.close();
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Unknown error occurred';
          controller.error(
            new Error(`Stream error: ${errorMessage}`)
          );
        }
      },
    });

    return new Response(response, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('David chat error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to process message',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
