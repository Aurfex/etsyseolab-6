import { Story } from '../types';

// --- In-memory Database Simulation ---
let storiesDb: Story[] = [
    {
        id: 'story_1',
        title: 'The Journey of Our Summer Solstice Collection',
        slug: 'summer-solstice-collection',
        content: 'It all started with a walk on a sun-drenched beach...',
        featuredImageUrl: 'https://picsum.photos/seed/story001/800/400',
        status: 'published',
        productIds: ['prod_001', 'prod_003'],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
        id: 'story_2',
        title: 'Behind the Scenes: Crafting the Silver Necklace',
        slug: 'crafting-silver-necklace',
        content: 'A detailed look at how our most popular necklace is made, from raw silver to the final polish.',
        featuredImageUrl: 'https://picsum.photos/seed/story002/800/400',
        status: 'draft',
        productIds: ['prod_002'],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    }
];

// --- Security Middleware (Simulated) ---
const verifyAuth = (req: Request): { authorized: boolean; error?: Response } => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { authorized: false, error: new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token.' }), { status: 401, headers: { 'Content-Type': 'application/json' } }) };
    }
    return { authorized: true };
};

const slugify = (text: string) =>
  text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');


// --- Main Endpoint Logic ---
export default async function endpoint(req: Request): Promise<Response> {
    const headers = { 'Content-Type': 'application/json' };

    const authCheck = verifyAuth(req);
    if (!authCheck.authorized) return authCheck.error!;

    if (req.method === 'GET') {
        // Return stories sorted by most recently updated
        const sortedStories = [...storiesDb].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        return new Response(JSON.stringify({ stories: sortedStories }), { headers, status: 200 });
    }

    if (req.method === 'POST') {
        try {
            const { story } = await req.json() as { story: Omit<Story, 'createdAt' | 'updatedAt' | 'slug'> };
            
            if (story.id) { // Update existing story
                const index = storiesDb.findIndex(s => s.id === story.id);
                if (index > -1) {
                    storiesDb[index] = { 
                        ...storiesDb[index], 
                        ...story, 
                        slug: slugify(story.title),
                        updatedAt: new Date() 
                    };
                    return new Response(JSON.stringify(storiesDb[index]), { status: 200, headers });
                }
                return new Response(JSON.stringify({ error: 'Story not found.' }), { status: 404, headers });
            } else { // Create new story
                const newStory: Story = {
                    ...story,
                    id: `story_${Date.now()}`,
                    slug: slugify(story.title),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                storiesDb.push(newStory);
                return new Response(JSON.stringify(newStory), { status: 201, headers });
            }

        } catch (error: any) {
            console.error("Error in POST /api/story:", error);
            return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), { status: 500, headers });
        }
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });
}